import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { ApiError, body, ok, route, vEmail, vInt, vOneOf, vOptionalStr, vStr } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { createBooking, ticketQr, type PassengerInput } from "@/lib/booking";
import { getFlightsByIds } from "@/lib/data";

export const GET = route(async () => {
  const user = await requireUser();
  const rows = await db.select().from(bookings).where(eq(bookings.userId, user.id)).orderBy(desc(bookings.createdAt));
  const ids = rows.flatMap((b) => (b.returnFlightId ? [b.flightId, b.returnFlightId] : [b.flightId]));
  const flights = await getFlightsByIds([...new Set(ids)], "economy");
  const byId = new Map(flights.map((f) => [f.id, f]));
  return ok({
    bookings: rows.map((b) => ({
      booking: b,
      outbound: byId.get(b.flightId) ?? null,
      inbound: b.returnFlightId ? byId.get(b.returnFlightId) ?? null : null,
    })),
  });
});

export const POST = route(async (req) => {
  const user = await requireUser();
  const b = await body(req);
  const flightId = vInt(b.flightId, "Flight", 1, 1_000_000);
  const returnFlightId = b.returnFlightId ? vInt(b.returnFlightId, "Return flight", 1, 1_000_000) : null;
  const cabin = vOneOf(b.cabin, "Cabin class", ["economy", "business"] as const);
  const contactEmail = vEmail(b.contactEmail, "Contact email");
  const contactPhone = vOptionalStr(b.contactPhone, 30);

  const rawPax = Array.isArray(b.passengers) ? b.passengers : [];
  if (rawPax.length < 1 || rawPax.length > 9) throw new ApiError(422, "Between 1 and 9 passengers are allowed.");
  const passengers: PassengerInput[] = rawPax.map((p, i) => {
    const o = (typeof p === "object" && p !== null ? p : {}) as Record<string, unknown>;
    return {
      firstName: vStr(o.firstName, `Passenger ${i + 1} first name`, 2, 60),
      lastName: vStr(o.lastName, `Passenger ${i + 1} last name`, 2, 60),
      email: vOptionalStr(o.email, 160),
      phone: vOptionalStr(o.phone, 30),
      dateOfBirth: vStr(o.dateOfBirth, `Passenger ${i + 1} date of birth`, 8, 12),
      nationality: vStr(o.nationality, `Passenger ${i + 1} nationality`, 2, 60),
      passportNumber: vStr(o.passportNumber, `Passenger ${i + 1} passport number`, 5, 20),
    };
  });

  const seatIds = (Array.isArray(b.seatIds) ? b.seatIds : []).map((s) => vInt(s, "Seat", 1, 100_000_000));
  const returnSeatIds = (Array.isArray(b.returnSeatIds) ? b.returnSeatIds : []).map((s) => vInt(s, "Return seat", 1, 100_000_000));
  if (new Set(seatIds).size !== seatIds.length) throw new ApiError(422, "Duplicate seats selected.");

  const { booking, amounts } = await createBooking({
    user, flightId, returnFlightId, cabin, passengers, seatIds, returnSeatIds, contactEmail, contactPhone,
  });
  const qr = await ticketQr(booking.pnr);
  return ok({ booking, amounts, qr }, 201);
});