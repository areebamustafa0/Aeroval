import { desc, eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { flights, airlines, aircraft, airports, bookings } from "@/db/schema";
import { ApiError, body, ok, route, vDate, vInt, vOneOf, vStr } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { createFlightSeats } from "@/lib/fleet";

const o = alias(airports, "o");
const d = alias(airports, "d");

export const GET = route(async () => {
  await requireAdmin();
  const rows = await db
    .select({
      id: flights.id, flightNumber: flights.flightNumber, status: flights.status,
      departureAt: flights.departureAt, arrivalAt: flights.arrivalAt, basePrice: flights.basePrice,
      durationMinutes: flights.durationMinutes, stops: flights.stops, gate: flights.gate, terminal: flights.terminal,
      airlineId: flights.airlineId, aircraftId: flights.aircraftId, originId: flights.originId, destinationId: flights.destinationId,
      airline: airlines.name, aircraftName: aircraft.name, origin: o.code, destination: d.code,
      booked: sql<number>`(select count(*) from bookings b where b.flight_id = ${flights.id} and b.status in ('pending','confirmed'))`.mapWith(Number),
    })
    .from(flights)
    .innerJoin(airlines, eq(flights.airlineId, airlines.id))
    .innerJoin(aircraft, eq(flights.aircraftId, aircraft.id))
    .innerJoin(o, eq(flights.originId, o.id))
    .innerJoin(d, eq(flights.destinationId, d.id))
    .orderBy(desc(flights.departureAt))
    .limit(200);
  const [airlineList, aircraftList, airportList] = await Promise.all([
    db.select().from(airlines),
    db.select().from(aircraft),
    db.select().from(airports),
  ]);
  return ok({ flights: rows, airlines: airlineList, aircraft: aircraftList, airports: airportList });
});

export const POST = route(async (req) => {
  await requireAdmin();
  const b = await body(req);
  const flightNumber = vStr(b.flightNumber, "Flight number", 4, 10).toUpperCase();
  if (!/^[A-Z]{2}\d{2,4}$/.test(flightNumber)) throw new ApiError(422, "Flight number must look like AV204.");
  const airlineId = vInt(b.airlineId, "Airline", 1, 1_000_000);
  const aircraftId = vInt(b.aircraftId, "Aircraft", 1, 1_000_000);
  const originId = vInt(b.originId, "Origin", 1, 1_000_000);
  const destinationId = vInt(b.destinationId, "Destination", 1, 1_000_000);
  if (originId === destinationId) throw new ApiError(422, "Origin and destination must differ.");
  const departureAt = vDate(b.departureAt, "Departure");
  const arrivalAt = vDate(b.arrivalAt, "Arrival");
  if (arrivalAt <= departureAt) throw new ApiError(422, "Arrival must be after departure.");
  const basePrice = vInt(b.basePrice, "Base fare", 50, 20_000);
  const stops = vInt(b.stops ?? 0, "Stops", 0, 2);
  const gate = vStr(b.gate ?? "A1", "Gate", 1, 6);
  const terminal = vStr(b.terminal ?? "1", "Terminal", 1, 4);
  const durationMinutes = Math.round((arrivalAt.getTime() - departureAt.getTime()) / 60000);

  const created = await db.transaction(async (tx) => {
    const inserted = await tx.insert(flights).values({
      flightNumber, airlineId, aircraftId, originId, destinationId, departureAt, arrivalAt,
      durationMinutes, basePrice, stops, gate, terminal, status: "scheduled",
    }).returning();
    const f = inserted[0]!;
    const n = await createFlightSeats(tx, f.id, aircraftId);
    if (n === 0) throw new ApiError(422, "This aircraft has no seat configuration yet.");
    return f;
  });
  return ok({ flight: created }, 201);
});