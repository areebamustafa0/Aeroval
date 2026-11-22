import { and, eq, inArray, sql } from "drizzle-orm";
import { createHash } from "crypto";
import QRCode from "qrcode";
import { db } from "@/db";
import { bookings, bookingPassengers, payments, flightSeats, seats, flights } from "@/db/schema";
import { ApiError, randomRef } from "@/lib/api";
import { cabinPrice } from "@/lib/format";
import type { SessionUser } from "@/lib/auth";
import { getFlight, getFlightSeats } from "@/lib/data";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type PassengerInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  nationality: string;
  passportNumber: string;
};

const idsSql = (ids: number[]) => sql.join(ids.map((i) => sql`${i}`), sql`, `);

/** Lock seat rows FOR UPDATE and verify every one is still available in the right cabin. */
async function lockSeats(tx: Tx, flightId: number, seatIds: number[], cabin: string) {
  const res = await tx.execute(sql`
    select fs.id, fs.status, fs.booking_id, s.cabin_class, s.extra_price, s.seat_number
    from flight_seats fs join seats s on s.id = fs.seat_id
    where fs.flight_id = ${flightId} and fs.id in (${idsSql(seatIds)})
    for update of fs
  `);
  const rows = res.rows as {
    id: number; status: string; booking_id: number | null;
    cabin_class: string; extra_price: number; seat_number: string;
  }[];
  if (rows.length !== seatIds.length)
    throw new ApiError(422, "Some selected seats do not belong to this flight.");
  for (const r of rows) {
    if (r.status !== "available")
      throw new ApiError(409, `Seat ${r.seat_number} was just taken by another traveler. Please choose a different seat.`);
    if (r.cabin_class !== cabin)
      throw new ApiError(422, `Seat ${r.seat_number} is not in the ${cabin} cabin.`);
  }
  return rows;
}

async function assertBookableFlight(flightId: number) {
  const rows = await db.select().from(flights).where(eq(flights.id, flightId)).limit(1);
  const f = rows[0];
  if (!f) throw new ApiError(404, "Flight not found.");
  if (f.status === "cancelled") throw new ApiError(422, "This flight has been cancelled.");
  if (new Date(f.departureAt).getTime() < Date.now())
    throw new ApiError(422, "This flight has already departed.");
  return f;
}

function computeAmounts(bases: number[], cabin: string, pax: number, seatExtras: number) {
  const base = bases.reduce((s, b) => s + cabinPrice(b, cabin), 0) * pax;
  const taxes = Math.round(base * 0.12);
  return { base, taxes, seats: seatExtras, total: base + taxes + seatExtras };
}

/**
 * Creates a booking and reserves seats inside one transaction.
 * Seat rows are locked FOR UPDATE — concurrent attempts on the same seat
 * serialize, and only the first one succeeds.
 */
export async function createBooking(input: {
  user: SessionUser;
  flightId: number;
  returnFlightId?: number | null;
  cabin: string;
  passengers: PassengerInput[];
  seatIds: number[];
  returnSeatIds?: number[];
  contactEmail: string;
  contactPhone: string;
}) {
  const { user, flightId, cabin, passengers } = input;
  const returnFlightId = input.returnFlightId ?? null;
  const returnSeatIds = input.returnSeatIds ?? [];
  const pax = passengers.length;
  if (pax < 1 || pax > 9) throw new ApiError(422, "Between 1 and 9 passengers are allowed.");
  if (input.seatIds.length !== pax) throw new ApiError(422, "Select one seat per passenger.");
  if (returnFlightId && returnSeatIds.length !== pax)
    throw new ApiError(422, "Select one return seat per passenger.");

  const outFlight = await assertBookableFlight(flightId);
  const retFlight = returnFlightId ? await assertBookableFlight(returnFlightId) : null;
  if (retFlight && new Date(retFlight.departureAt) <= new Date(outFlight.arrivalAt))
    throw new ApiError(422, "Return flight must depart after the outbound arrives.");

  return db.transaction(async (tx) => {
    const outSeats = await lockSeats(tx, flightId, input.seatIds, cabin);
    const retSeats = retFlight ? await lockSeats(tx, returnFlightId!, returnSeatIds, cabin) : [];
    const extras = [...outSeats, ...retSeats].reduce((s, r) => s + r.extra_price, 0);
    const bases = retFlight ? [outFlight.basePrice, retFlight.basePrice] : [outFlight.basePrice];
    const amounts = computeAmounts(bases, cabin, pax, extras);

    let pnr = randomRef(6);
    for (let i = 0; i < 3; i++) {
      const dup = await tx.select({ id: bookings.id }).from(bookings).where(eq(bookings.pnr, pnr)).limit(1);
      if (dup.length === 0) break;
      pnr = randomRef(6);
    }

    const inserted = await tx
      .insert(bookings)
      .values({
        pnr,
        userId: user.id,
        flightId,
        returnFlightId,
        cabinClass: cabin,
        status: "pending",
        passengerCount: pax,
        baseAmount: amounts.base,
        taxesAmount: amounts.taxes,
        seatsAmount: amounts.seats,
        totalAmount: amounts.total,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
      })
      .returning();
    const booking = inserted[0]!;

    const seatById = new Map(outSeats.map((s) => [s.id, s]));
    const retById = new Map(retSeats.map((s) => [s.id, s]));
    await tx.insert(bookingPassengers).values(
      passengers.map((p, i) => ({
        bookingId: booking.id,
        flightSeatId: input.seatIds[i]!,
        returnFlightSeatId: returnFlightId ? returnSeatIds[i]! : null,
        seatNumber: seatById.get(input.seatIds[i]!)?.seat_number ?? "",
        returnSeatNumber: returnFlightId ? retById.get(returnSeatIds[i]!)?.seat_number ?? "" : "",
        firstName: p.firstName,
        lastName: p.lastName,
        email: p.email,
        phone: p.phone,
        dateOfBirth: p.dateOfBirth,
        nationality: p.nationality,
        passportNumber: p.passportNumber,
      }))
    );

    await tx
      .update(flightSeats)
      .set({ status: "reserved", bookingId: booking.id })
      .where(inArray(flightSeats.id, [...input.seatIds, ...returnSeatIds]));

    return { booking, amounts };
  });
}

/** Simulated sandbox payment. Never stores card numbers — only the last 4 digits. */
export async function payBooking(input: {
  user: SessionUser;
  bookingId: number;
  method: "card" | "cash";
  cardNumber?: string;
  expiry?: string;
  cvv?: string;
}) {
  const digits = (input.cardNumber ?? "").replace(/\s+/g, "");
  if (input.method === "card") {
    if (!/^\d{16}$/.test(digits)) throw new ApiError(422, "Card number must be 16 digits (demo cards only).");
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(input.expiry ?? "")) throw new ApiError(422, "Expiry must use MM/YY format.");
    if (!/^\d{3,4}$/.test(input.cvv ?? "")) throw new ApiError(422, "CVV must be 3–4 digits.");
  }
  const declined = input.method === "card" && digits.endsWith("0002");

  return db.transaction(async (tx) => {
    const res = await tx.execute(sql`select * from bookings where id = ${input.bookingId} for update`);
    const b = (res.rows as Record<string, unknown>[])[0];
    if (!b) throw new ApiError(404, "Booking not found.");
    if (Number(b.user_id) !== input.user.id && input.user.role !== "admin")
      throw new ApiError(403, "This booking belongs to another account.");
    if (b.status !== "pending") throw new ApiError(422, "This booking is not awaiting payment.");

    const locked = await tx.execute(sql`
      select fs.id from flight_seats fs where fs.booking_id = ${input.bookingId} and fs.status = 'reserved' for update of fs
    `);
    const seatRows = locked.rows as { id: number }[];
    const reference = `PAY-${randomRef(10)}`;

    if (declined) {
      await tx.update(flightSeats).set({ status: "available", bookingId: null })
        .where(eq(flightSeats.bookingId, input.bookingId));
      await tx.update(bookings).set({ status: "failed" }).where(eq(bookings.id, input.bookingId));
      const pay = await tx.insert(payments)
        .values({ bookingId: input.bookingId, amount: Number(b.total_amount), method: "card", status: "failed", cardLast4: digits.slice(-4), reference })
        .returning();
      return { outcome: "failed" as const, payment: pay[0]!, message: "The demo card was declined. No charge was made and your seats were released." };
    }

    await tx.update(flightSeats).set({ status: "occupied" })
      .where(eq(flightSeats.bookingId, input.bookingId));
    await tx.update(bookings).set({ status: "confirmed" }).where(eq(bookings.id, input.bookingId));
    const pay = await tx.insert(payments)
      .values({
        bookingId: input.bookingId,
        amount: Number(b.total_amount),
        method: input.method,
        status: input.method === "cash" ? "pending" : "successful",
        cardLast4: input.method === "card" ? digits.slice(-4) : "",
        reference,
      })
      .returning();
    if (seatRows.length === 0) throw new ApiError(409, "Seat reservation expired. Please start again.");
    return {
      outcome: "successful" as const,
      payment: pay[0]!,
      message: input.method === "cash"
        ? "Booking confirmed. Payment will be collected at the airport check-in desk."
        : "Demo payment successful. Your e-ticket is ready.",
    };
  });
}

async function releaseBookingSeats(tx: Tx, bookingId: number) {
  await tx.update(flightSeats).set({ status: "available", bookingId: null })
    .where(eq(flightSeats.bookingId, bookingId));
}

export async function cancelBooking(input: { user: SessionUser; bookingId: number; force?: boolean }) {
  return db.transaction(async (tx) => {
    const res = await tx.execute(sql`select * from bookings where id = ${input.bookingId} for update`);
    const b = (res.rows as Record<string, unknown>[])[0];
    if (!b) throw new ApiError(404, "Booking not found.");
    const isAdmin = input.user.role === "admin";
    if (Number(b.user_id) !== input.user.id && !isAdmin)
      throw new ApiError(403, "This booking belongs to another account.");
    if (!["pending", "confirmed"].includes(String(b.status)))
      throw new ApiError(422, "Only pending or confirmed bookings can be cancelled.");

    const fRows = await tx.select().from(flights).where(eq(flights.id, Number(b.flight_id))).limit(1);
    const dep = fRows[0]?.departureAt ? new Date(fRows[0].departureAt).getTime() : 0;
    const within24h = dep - Date.now() < 24 * 3600 * 1000;

    if (within24h && !isAdmin && !input.force) {
      await tx.update(bookings).set({ cancelRequestedAt: new Date() }).where(eq(bookings.id, input.bookingId));
      return { requested: true, message: "Departure is within 24 hours — a cancellation request was sent to our team for review." };
    }

    await releaseBookingSeats(tx, input.bookingId);
    await tx.update(bookings).set({ status: "cancelled", cancelRequestedAt: null }).where(eq(bookings.id, input.bookingId));
    const pays = await tx.select().from(payments).where(eq(payments.bookingId, input.bookingId));
    for (const p of pays) {
      if (p.status === "successful")
        await tx.update(payments).set({ status: "refunded" }).where(eq(payments.id, p.id));
      else if (p.status === "pending")
        await tx.update(payments).set({ status: "failed" }).where(eq(payments.id, p.id));
    }
    return { requested: false, message: "Booking cancelled. Any demo payment has been marked as refunded." };
  });
}

export async function rescheduleBooking(input: { user: SessionUser; bookingId: number; newFlightId: number }) {
  return db.transaction(async (tx) => {
    const res = await tx.execute(sql`select * from bookings where id = ${input.bookingId} for update`);
    const b = (res.rows as Record<string, unknown>[])[0];
    if (!b) throw new ApiError(404, "Booking not found.");
    if (Number(b.user_id) !== input.user.id && input.user.role !== "admin")
      throw new ApiError(403, "This booking belongs to another account.");
    if (b.status !== "confirmed") throw new ApiError(422, "Only confirmed bookings can be rescheduled.");
    if (b.return_flight_id) throw new ApiError(422, "Round trips cannot be rescheduled online yet — please contact support.");

    const oldF = (await tx.select().from(flights).where(eq(flights.id, Number(b.flight_id))).limit(1))[0];
    const newF = (await tx.select().from(flights).where(eq(flights.id, input.newFlightId)).limit(1))[0];
    if (!oldF || !newF) throw new ApiError(404, "Flight not found.");
    if (newF.originId !== oldF.originId || newF.destinationId !== oldF.destinationId)
      throw new ApiError(422, "You can only reschedule onto the same route.");
    if (new Date(newF.departureAt).getTime() < Date.now()) throw new ApiError(422, "Choose a future departure.");

    const pax = await tx.select().from(bookingPassengers).where(eq(bookingPassengers.bookingId, input.bookingId));
    const numbers = pax.map((p) => p.seatNumber);
    const matchRows = await tx.execute(sql`
      select fs.id, fs.status, s.seat_number, s.extra_price from flight_seats fs
      join seats s on s.id = fs.seat_id
      where fs.flight_id = ${input.newFlightId} and s.seat_number in (${sql.join(numbers.map((n) => sql`${n}`), sql`, `)})
      for update of fs
    `);
    const rows = matchRows.rows as { id: number; status: string; seat_number: string; extra_price: number }[];
    if (rows.length !== numbers.length)
      throw new ApiError(409, "This aircraft has a different seat layout. Please contact support.");
    for (const r of rows)
      if (r.status !== "available")
        throw new ApiError(409, `Seat ${r.seat_number} is not available on the new flight. Please contact support.`);

    await releaseBookingSeats(tx, input.bookingId);
    const byNumber = new Map(rows.map((r) => [r.seat_number, r]));
    for (const p of pax) {
      const seat = byNumber.get(p.seatNumber)!;
      await tx.update(bookingPassengers).set({ flightSeatId: seat.id }).where(eq(bookingPassengers.id, p.id));
    }
    await tx.update(flightSeats).set({ status: "occupied", bookingId: input.bookingId })
      .where(inArray(flightSeats.id, rows.map((r) => r.id)));

    const extras = rows.reduce((s, r) => s + r.extra_price, 0);
    const amounts = computeAmounts([newF.basePrice], String(b.cabin_class), pax.length, extras);
    await tx.update(bookings)
      .set({ flightId: input.newFlightId, baseAmount: amounts.base, taxesAmount: amounts.taxes, seatsAmount: amounts.seats, totalAmount: amounts.total })
      .where(eq(bookings.id, input.bookingId));
    return { message: "Flight changed successfully. Any fare difference is shown on your booking (demo — no real charge)." };
  });
}

export async function adminBookingAction(bookingId: number, action: "confirm" | "complete" | "approve-cancel") {
  if (action === "approve-cancel") {
    const admin = { id: 0, role: "admin" } as SessionUser;
    return cancelBooking({ user: admin, bookingId, force: true });
  }
  return db.transaction(async (tx) => {
    const res = await tx.execute(sql`select * from bookings where id = ${bookingId} for update`);
    const b = (res.rows as Record<string, unknown>[])[0];
    if (!b) throw new ApiError(404, "Booking not found.");
    if (action === "confirm") {
      if (b.status !== "pending") throw new ApiError(422, "Only pending bookings can be confirmed.");
      await tx.update(bookings).set({ status: "confirmed" }).where(eq(bookings.id, bookingId));
      await tx.update(flightSeats).set({ status: "occupied" }).where(eq(flightSeats.bookingId, bookingId));
      await tx.update(payments).set({ status: "successful" })
        .where(and(eq(payments.bookingId, bookingId), eq(payments.status, "pending")));
      return { message: "Booking confirmed manually." };
    }
    if (b.status !== "confirmed") throw new ApiError(422, "Only confirmed bookings can be completed.");
    await tx.update(bookings).set({ status: "completed" }).where(eq(bookings.id, bookingId));
    return { message: "Booking marked as completed." };
  });
}

export const verifyRef = (pnr: string) =>
  createHash("sha256").update(`${pnr}:${process.env.AUTH_SECRET ?? "aerovel"}`).digest("hex").slice(0, 16);

export const ticketQr = (pnr: string) =>
  QRCode.toDataURL(JSON.stringify({ pnr, verify: verifyRef(pnr) }), {
    margin: 1,
    width: 240,
    color: { dark: "#101D32", light: "#FFFFFF" },
  });

export async function getBookingDetail(id: number, user: SessionUser) {
  const rows = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  const b = rows[0];
  if (!b) throw new ApiError(404, "Booking not found.");
  if (b.userId !== user.id && user.role !== "admin")
    throw new ApiError(403, "This booking belongs to another account.");
  const outbound = await getFlight(b.flightId, b.cabinClass);
  const inbound = b.returnFlightId ? await getFlight(b.returnFlightId, b.cabinClass) : null;
  const pax = await db.select().from(bookingPassengers).where(eq(bookingPassengers.bookingId, id));
  const pays = await db.select().from(payments).where(eq(payments.bookingId, id));
  return { booking: b, outbound, inbound, passengers: pax, payments: pays };
}

export type BookingDetail = Awaited<ReturnType<typeof getBookingDetail>>;

export async function seatsForFlight(flightId: number) {
  return getFlightSeats(flightId);
}