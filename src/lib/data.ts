import { and, eq, gte, lt, sql, ne, asc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { flights, airlines, airports, aircraft, flightSeats, seats, destinations } from "@/db/schema";
import { cabinPrice } from "@/lib/format";
import { destinationImage } from "@/lib/images";
import { alias } from "drizzle-orm/pg-core";

export type FlightDTO = {
  id: number;
  flightNumber: string;
  airline: { id: number; name: string; code: string; accent: string };
  aircraft: { id: number; name: string; model: string };
  origin: { code: string; city: string; name: string; country: string };
  destination: { code: string; city: string; name: string; country: string };
  departureAt: string;
  arrivalAt: string;
  durationMinutes: number;
  stops: number;
  basePrice: number;
  price: number;
  status: string;
  gate: string;
  terminal: string;
  seatsLeft: number;
  cabin: string;
};

const origin = alias(airports, "origin");
const destination = alias(airports, "destination");

function flightSelect(cabin: string) {
  return db
    .select({
      id: flights.id,
      flightNumber: flights.flightNumber,
      airlineId: airlines.id,
      airlineName: airlines.name,
      airlineCode: airlines.code,
      airlineAccent: airlines.accent,
      aircraftId: aircraft.id,
      aircraftName: aircraft.name,
      aircraftModel: aircraft.model,
      originCode: origin.code,
      originCity: origin.city,
      originName: origin.name,
      originCountry: origin.country,
      destCode: destination.code,
      destCity: destination.city,
      destName: destination.name,
      destCountry: destination.country,
      departureAt: flights.departureAt,
      arrivalAt: flights.arrivalAt,
      durationMinutes: flights.durationMinutes,
      stops: flights.stops,
      basePrice: flights.basePrice,
      status: flights.status,
      gate: flights.gate,
      terminal: flights.terminal,
      seatsLeft: sql<number>`(
        select count(*) from flight_seats fs
        join seats s on s.id = fs.seat_id
        where fs.flight_id = ${flights.id} and fs.status = 'available' and s.cabin_class = ${cabin}
      )`.mapWith(Number),
    })
    .from(flights)
    .innerJoin(airlines, eq(flights.airlineId, airlines.id))
    .innerJoin(aircraft, eq(flights.aircraftId, aircraft.id))
    .innerJoin(origin, eq(flights.originId, origin.id))
    .innerJoin(destination, eq(flights.destinationId, destination.id));
}

type FlightRow = Awaited<ReturnType<ReturnType<typeof flightSelect>["where"]>>[number];

export const toFlightDTO = (r: FlightRow, cabin: string): FlightDTO => ({
  id: r.id,
  flightNumber: r.flightNumber,
  airline: { id: r.airlineId, name: r.airlineName, code: r.airlineCode, accent: r.airlineAccent },
  aircraft: { id: r.aircraftId, name: r.aircraftName, model: r.aircraftModel },
  origin: { code: r.originCode, city: r.originCity, name: r.originName, country: r.originCountry },
  destination: { code: r.destCode, city: r.destCity, name: r.destName, country: r.destCountry },
  departureAt: new Date(r.departureAt).toISOString(),
  arrivalAt: new Date(r.arrivalAt).toISOString(),
  durationMinutes: r.durationMinutes,
  stops: r.stops,
  basePrice: r.basePrice,
  price: cabinPrice(r.basePrice, cabin),
  status: r.status,
  gate: r.gate,
  terminal: r.terminal,
  seatsLeft: r.seatsLeft,
  cabin,
});

export async function searchFlights(opts: {
  from: string;
  to: string;
  date: string;
  cabin: string;
  passengers: number;
}) {
  const day = new Date(`${opts.date}T00:00:00`);
  if (Number.isNaN(day.getTime())) return [];
  const next = new Date(day.getTime() + 24 * 3600 * 1000);
  const rows = await flightSelect(opts.cabin)
    .where(
      and(
        eq(origin.code, opts.from.toUpperCase()),
        eq(destination.code, opts.to.toUpperCase()),
        gte(flights.departureAt, day < new Date() ? new Date() : day),
        lt(flights.departureAt, next),
        ne(flights.status, "cancelled")
      )
    )
    .orderBy(asc(flights.departureAt))
    .limit(60);
  return rows
    .map((r) => toFlightDTO(r, opts.cabin))
    .filter((f) => f.seatsLeft >= opts.passengers);
}

export async function getFlight(id: number, cabin = "economy") {
  const rows = await flightSelect(cabin).where(eq(flights.id, id)).limit(1);
  const r = rows[0];
  return r ? toFlightDTO(r, cabin) : null;
}

export async function getFlightSeats(flightId: number) {
  return db
    .select({
      id: flightSeats.id,
      seatNumber: seats.seatNumber,
      row: seats.row,
      letter: seats.letter,
      cabinClass: seats.cabinClass,
      isExit: seats.isExit,
      isPremium: seats.isPremium,
      extraPrice: seats.extraPrice,
      status: flightSeats.status,
    })
    .from(flightSeats)
    .innerJoin(seats, eq(flightSeats.seatId, seats.id))
    .where(eq(flightSeats.flightId, flightId))
    .orderBy(asc(seats.row), asc(seats.letter));
}

export type SeatDTO = Awaited<ReturnType<typeof getFlightSeats>>[number];

export async function getAirports() {
  return db
    .select({ id: airports.id, code: airports.code, name: airports.name, city: airports.city, country: airports.country })
    .from(airports)
    .orderBy(asc(airports.city));
}

export type AirportDTO = Awaited<ReturnType<typeof getAirports>>[number];

export async function getDestinations() {
  const rows = await db.select().from(destinations).orderBy(asc(destinations.id));
  return rows.map((item) => ({ ...item, imageUrl: destinationImage(item.slug, item.imageUrl) }));
}

export type DestinationDTO = Awaited<ReturnType<typeof getDestinations>>[number];

export async function getDestination(slug: string) {
  const rows = await db.select().from(destinations).where(eq(destinations.slug, slug)).limit(1);
  const item = rows[0];
  return item ? { ...item, imageUrl: destinationImage(item.slug, item.imageUrl) } : null;
}

/** The best available demo fare per destination, using actual flight-seat availability. */
export async function getOffers(limit = 4) {
  const dests = await getDestinations();
  if (!dests.length) return [];
  const byCode = new Map(dests.map((d) => [d.airportCode, d]));

  // DISTINCT ON avoids allowing a single cheap route to occupy the entire result set.
  // EXISTS uses the flight-seat index and excludes sold-out flights before choosing a fare.
  const cheapest = await db
    .selectDistinctOn([flights.destinationId], {
      id: flights.id,
      airportCode: destination.code,
      basePrice: flights.basePrice,
    })
    .from(flights)
    .innerJoin(destination, eq(flights.destinationId, destination.id))
    .innerJoin(destinations, eq(destinations.airportCode, destination.code))
    .where(and(
      gte(flights.departureAt, new Date()),
      ne(flights.status, "cancelled"),
      sql`exists (
        select 1 from flight_seats fs
        join seats s on s.id = fs.seat_id
        where fs.flight_id = ${flights.id} and fs.status = 'available' and s.cabin_class = 'economy'
      )`
    ))
    .orderBy(asc(flights.destinationId), asc(flights.basePrice), asc(flights.departureAt));

  const priority = ["MLE", "DXB", "CDG", "JTR", "IST", "HND", "LHR", "ZRH", "KUL", "DPS", "JFK", "FCO"];
  const chosen = cheapest.sort((a, b) => {
    const ai = priority.indexOf(a.airportCode);
    const bi = priority.indexOf(b.airportCode);
    return (ai < 0 ? priority.length : ai) - (bi < 0 ? priority.length : bi) || a.basePrice - b.basePrice;
  }).slice(0, Math.max(0, Math.min(limit, 12)));
  const details = await getFlightsByIds(chosen.map((row) => row.id), "economy");
  const byId = new Map(details.map((flight) => [flight.id, flight]));
  return chosen.flatMap((row) => {
    const flight = byId.get(row.id);
    const destinationItem = byCode.get(row.airportCode);
    return flight && destinationItem && flight.seatsLeft > 0 ? [{ flight, destination: destinationItem }] : [];
  });
}

export async function getFlightsToAirport(code: string, limit = 6) {
  const rows = await flightSelect("economy")
    .where(
      and(
        eq(destination.code, code.toUpperCase()),
        gte(flights.departureAt, new Date()),
        ne(flights.status, "cancelled")
      )
    )
    .orderBy(asc(flights.departureAt))
    .limit(limit);
  return rows.map((r) => toFlightDTO(r, "economy"));
}

export async function getFlightsByIds(ids: number[], cabin: string) {
  if (ids.length === 0) return [];
  const rows = await flightSelect(cabin).where(inArray(flights.id, ids));
  return rows.map((r) => toFlightDTO(r, cabin));
}

export type NetworkStats = {
  flights: number;
  airports: number;
  destinations: number;
  seats: number;
  economyFrom: number;
  businessFrom: number;
};

/** Aggregate demo figures used by the homepage counters and network panel. */
export async function getNetworkStats(): Promise<NetworkStats> {
  const [row] = await db
    .select({
      flights: sql<number>`(select count(*) from flights where departure_at > now() and status <> 'cancelled')`.mapWith(Number),
      airports: sql<number>`(select count(*) from airports)`.mapWith(Number),
      destinations: sql<number>`(select count(*) from destinations)`.mapWith(Number),
      seats: sql<number>`(select count(*) from flight_seats where status = 'available')`.mapWith(Number),
      economyFrom: sql<number>`(select coalesce(min(base_price), 0) from flights where departure_at > now())`.mapWith(Number),
      businessFrom: sql<number>`(select coalesce(min(round(base_price * 2.6)), 0) from flights where departure_at > now())`.mapWith(Number),
    })
    .from(sql`(select 1) as dummy`);
  return row;
}

/** Upcoming demo departures with enough seats for the selected cabin and party. */
export async function getUpcoming(limit = 24, cabin = "economy", passengers = 1) {
  const rows = await flightSelect(cabin)
    .where(and(
      gte(flights.departureAt, new Date()),
      ne(flights.status, "cancelled"),
      sql`(
        select count(*) from flight_seats fs
        join seats s on s.id = fs.seat_id
        where fs.flight_id = ${flights.id} and fs.status = 'available' and s.cabin_class = ${cabin}
      ) >= ${passengers}`
    ))
    .orderBy(asc(flights.departureAt))
    .limit(Math.min(50, Math.max(1, limit)));
  return rows.map((r) => toFlightDTO(r, cabin));
}