import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { bookings, users, flights, bookingPassengers, payments } from "@/db/schema";
import { body, ok, route, vInt, vOneOf } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { adminBookingAction } from "@/lib/booking";

export const GET = route(async () => {
  await requireAdmin();
  const rows = await db
    .select({
      id: bookings.id, pnr: bookings.pnr, status: bookings.status, cabin: bookings.cabinClass,
      total: bookings.totalAmount, passengerCount: bookings.passengerCount, createdAt: bookings.createdAt,
      cancelRequestedAt: bookings.cancelRequestedAt, flightId: bookings.flightId,
      customer: sqlName(), email: users.email, flightNumber: flights.flightNumber,
      departureAt: flights.departureAt,
    })
    .from(bookings)
    .innerJoin(users, eq(bookings.userId, users.id))
    .innerJoin(flights, eq(bookings.flightId, flights.id))
    .orderBy(desc(bookings.createdAt))
    .limit(150);
  const ids = rows.map((r) => r.id);
  const pax = ids.length ? await db.select().from(bookingPassengers).where(inArray(bookingPassengers.bookingId, ids)) : [];
  const pays = ids.length ? await db.select().from(payments).where(inArray(payments.bookingId, ids)) : [];
  return ok({ bookings: rows, passengers: pax, payments: pays });
});

function sqlName() {
  return users.firstName;
}

export const PATCH = route(async (req) => {
  await requireAdmin();
  const b = await body(req);
  const id = vInt(b.id, "Booking id", 1, 1_000_000);
  const action = vOneOf(b.action, "Action", ["confirm", "complete", "approve-cancel"] as const);
  const result = await adminBookingAction(id, action);
  return ok(result);
});