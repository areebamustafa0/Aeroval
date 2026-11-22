import { NextRequest } from "next/server";
import { eq, and, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { flights, bookings, flightSeats } from "@/db/schema";
import { ApiError, body, ok, route, vDate, vInt, vOneOf, vStr } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { createFlightSeats } from "@/lib/fleet";

const activeBookings = async (flightId: number) => {
  const rows = await db.select({ n: sql<number>`count(*)`.mapWith(Number) })
    .from(bookings)
    .where(and(
      or(eq(bookings.flightId, flightId), eq(bookings.returnFlightId, flightId)),
      inArray(bookings.status, ["pending", "confirmed"])
    ));
  return rows[0]?.n ?? 0;
};

export const PUT = route(async (req: NextRequest, ctx) => {
  await requireAdmin();
  const { id } = await ctx.params;
  const flightId = vInt(id, "Flight id", 1, 1_000_000);
  const b = await body(req);
  const existing = (await db.select().from(flights).where(eq(flights.id, flightId)).limit(1))[0];
  if (!existing) throw new ApiError(404, "Flight not found.");

  const patch: Partial<typeof flights.$inferInsert> = {};
  if (b.status !== undefined) {
    const status = vOneOf(b.status, "Status", ["scheduled", "boarding", "departed", "arrived", "delayed", "cancelled"] as const);
    if (status === "cancelled" && (await activeBookings(flightId)) > 0)
      throw new ApiError(409, "This flight has active bookings. Resolve them before cancelling the flight.");
    patch.status = status;
  }
  if (b.basePrice !== undefined) patch.basePrice = vInt(b.basePrice, "Base fare", 50, 20_000);
  if (b.gate !== undefined) patch.gate = vStr(b.gate, "Gate", 1, 6);
  if (b.terminal !== undefined) patch.terminal = vStr(b.terminal, "Terminal", 1, 4);
  if (b.stops !== undefined) patch.stops = vInt(b.stops, "Stops", 0, 2);
  if (b.departureAt !== undefined || b.arrivalAt !== undefined) {
    const dep = b.departureAt !== undefined ? vDate(b.departureAt, "Departure") : existing.departureAt;
    const arr = b.arrivalAt !== undefined ? vDate(b.arrivalAt, "Arrival") : existing.arrivalAt;
    if (arr <= dep) throw new ApiError(422, "Arrival must be after departure.");
    patch.departureAt = dep;
    patch.arrivalAt = arr;
    patch.durationMinutes = Math.round((arr.getTime() - dep.getTime()) / 60000);
  }
  if (b.aircraftId !== undefined && vInt(b.aircraftId, "Aircraft", 1, 1_000_000) !== existing.aircraftId) {
    if ((await activeBookings(flightId)) > 0)
      throw new ApiError(409, "Cannot swap aircraft while active bookings exist.");
    const newAircraft = vInt(b.aircraftId, "Aircraft", 1, 1_000_000);
    await db.transaction(async (tx) => {
      await tx.delete(flightSeats).where(eq(flightSeats.flightId, flightId));
      const n = await createFlightSeats(tx, flightId, newAircraft);
      if (n === 0) throw new ApiError(422, "That aircraft has no seat configuration.");
      await tx.update(flights).set({ aircraftId: newAircraft }).where(eq(flights.id, flightId));
    });
  }
  if (Object.keys(patch).length > 0)
    await db.update(flights).set(patch).where(eq(flights.id, flightId));
  return ok({ updated: true });
});

export const DELETE = route(async (_req: NextRequest, ctx) => {
  await requireAdmin();
  const { id } = await ctx.params;
  const flightId = vInt(id, "Flight id", 1, 1_000_000);
  const anyBookings = await db.select({ n: sql<number>`count(*)`.mapWith(Number) })
    .from(bookings)
    .where(or(eq(bookings.flightId, flightId), eq(bookings.returnFlightId, flightId)));
  if ((anyBookings[0]?.n ?? 0) > 0)
    throw new ApiError(409, "This flight has booking history and cannot be deleted. Cancel it instead.");
  await db.delete(flights).where(eq(flights.id, flightId));
  return ok({ deleted: true });
});