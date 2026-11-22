import { NextRequest } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { flightSeats } from "@/db/schema";
import { ApiError, body, ok, route, vInt, vOneOf } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { getFlightSeats } from "@/lib/data";

export const GET = route(async (req: NextRequest) => {
  await requireAdmin();
  const flightId = vInt(req.nextUrl.searchParams.get("flightId") ?? "0", "Flight", 1, 1_000_000);
  const seats = await getFlightSeats(flightId);
  return ok({ seats });
});

export const POST = route(async (req) => {
  await requireAdmin();
  const b = await body(req);
  const flightId = vInt(b.flightId, "Flight", 1, 1_000_000);
  const status = vOneOf(b.status, "Status", ["available", "blocked"] as const);
  const ids = (Array.isArray(b.seatIds) ? b.seatIds : []).map((s) => vInt(s, "Seat", 1, 100_000_000));
  if (ids.length === 0) throw new ApiError(422, "Select at least one seat.");
  const rows = await db.select().from(flightSeats)
    .where(and(eq(flightSeats.flightId, flightId), inArray(flightSeats.id, ids)));
  for (const r of rows)
    if (!["available", "blocked"].includes(r.status))
      throw new ApiError(409, "Reserved or occupied seats cannot be modified.");
  await db.update(flightSeats).set({ status })
    .where(and(eq(flightSeats.flightId, flightId), inArray(flightSeats.id, ids)));
  return ok({ updated: rows.length });
});