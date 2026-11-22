/* Adds extra demo flights without touching existing bookings. Run: npx tsx scripts/add-demo-flights.ts */
import "dotenv/config";
import { db, pool } from "../src/db";
import { aircraft, airlines, airports, flights, flightSeats, seats } from "../src/db/schema";

type RouteTemplate = { from: string; to: string; minutes: number; fare: number; hour: number; wide?: boolean };
const routes: RouteTemplate[] = [
  { from: "LHE", to: "DXB", minutes: 195, fare: 239, hour: 9 },
  { from: "DXB", to: "LHE", minutes: 195, fare: 249, hour: 16 },
  { from: "ISB", to: "IST", minutes: 335, fare: 369, hour: 8, wide: true },
  { from: "IST", to: "ISB", minutes: 330, fare: 359, hour: 15, wide: true },
  { from: "KHI", to: "DOH", minutes: 155, fare: 199, hour: 11 },
  { from: "DOH", to: "KHI", minutes: 150, fare: 209, hour: 18 },
  { from: "DXB", to: "MLE", minutes: 255, fare: 449, hour: 8, wide: true },
  { from: "MLE", to: "DXB", minutes: 250, fare: 439, hour: 15, wide: true },
  { from: "DXB", to: "LHR", minutes: 440, fare: 549, hour: 9, wide: true },
  { from: "LHR", to: "DXB", minutes: 435, fare: 529, hour: 21, wide: true },
  { from: "IST", to: "CDG", minutes: 225, fare: 289, hour: 10 },
  { from: "CDG", to: "IST", minutes: 220, fare: 299, hour: 16 },
  { from: "KUL", to: "SIN", minutes: 65, fare: 109, hour: 10 },
  { from: "SIN", to: "KUL", minutes: 65, fare: 119, hour: 15 },
  { from: "LHR", to: "JFK", minutes: 480, fare: 679, hour: 12, wide: true },
  { from: "JFK", to: "LHR", minutes: 430, fare: 659, hour: 21, wide: true },
];

async function main() {
  const [airportRows, aircraftRows, airlineRows, seatRows] = await Promise.all([
    db.select().from(airports), db.select().from(aircraft), db.select().from(airlines), db.select().from(seats),
  ]);
  const airportByCode = new Map(airportRows.map((airport) => [airport.code, airport.id]));
  const airline = airlineRows.find((item) => item.code === "AV");
  const narrow = aircraftRows.find((item) => item.model.includes("A320"));
  const wide = aircraftRows.find((item) => item.model.includes("787"));
  if (!airline || !narrow || !wide) throw new Error("Seed the base demo data before adding flights.");
  const seatsByAircraft = new Map<number, number[]>();
  for (const seat of seatRows) {
    const list = seatsByAircraft.get(seat.aircraftId) ?? [];
    list.push(seat.id);
    seatsByAircraft.set(seat.aircraftId, list);
  }

  const now = new Date();
  // Extra departures in the next week, then extend the demo schedule through day 60.
  const offsets = [...Array.from({ length: 7 }, (_, i) => i + 1), ...Array.from({ length: 33 }, (_, i) => i + 28)];
  const candidates: (typeof flights.$inferInsert)[] = [];
  for (const [index, route] of routes.entries()) {
    const originId = airportByCode.get(route.from);
    const destinationId = airportByCode.get(route.to);
    if (!originId || !destinationId) continue;
    for (const offset of offsets) {
      const departureAt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offset, route.hour, (index % 4) * 15));
      if (departureAt <= now) continue;
      candidates.push({
        flightNumber: `AV${9001 + index}`,
        airlineId: airline.id,
        aircraftId: route.wide ? wide.id : narrow.id,
        originId, destinationId, departureAt,
        arrivalAt: new Date(departureAt.getTime() + route.minutes * 60_000),
        durationMinutes: route.minutes,
        basePrice: route.fare + (offset % 5) * 5,
        stops: 0, status: "scheduled", gate: `${String.fromCharCode(65 + index % 4)}${2 + index}`, terminal: String(1 + index % 3),
      });
    }
  }

  let created = 0;
  for (let i = 0; i < candidates.length; i += 80) {
    await db.transaction(async (tx) => {
      const inserted = await tx.insert(flights).values(candidates.slice(i, i + 80))
        .onConflictDoNothing({ target: [flights.flightNumber, flights.departureAt] })
        .returning({ id: flights.id, aircraftId: flights.aircraftId });
      const rows = inserted.flatMap((flight) =>
        (seatsByAircraft.get(flight.aircraftId) ?? []).map((seatId) => ({ flightId: flight.id, seatId, status: "available" }))
      );
      for (let j = 0; j < rows.length; j += 1000) await tx.insert(flightSeats).values(rows.slice(j, j + 1000));
      created += inserted.length;
    });
  }
  console.log(`Added ${created} demo flights across ${routes.length} routes; existing bookings were preserved.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => pool.end());
