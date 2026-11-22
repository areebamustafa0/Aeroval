import { NextRequest } from "next/server";
import { eq, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { airports, airlines, aircraft, routes, flights, seats } from "@/db/schema";
import { ApiError, body, ok, route, vInt, vStr } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { buildSeatRows } from "@/lib/fleet";

const TABLES = { airports, airlines, aircraft, routes } as const;
type Entity = keyof typeof TABLES;

const usageCount = async (e: Entity, id: number): Promise<number> => {
  let q;
  if (e === "airports") q = sql`select count(*)::int as n from flights where origin_id = ${id} or destination_id = ${id}`;
  else if (e === "airlines") q = sql`select count(*)::int as n from flights where airline_id = ${id}`;
  else if (e === "aircraft") q = sql`select count(*)::int as n from flights where aircraft_id = ${id}`;
  else q = sql`select 0::int as n`;
  const res = await db.execute(q);
  return Number((res.rows[0] as { n: number } | undefined)?.n ?? 0);
};

export const PUT = route(async (req: NextRequest, ctx) => {
  await requireAdmin();
  const { entity, id } = await ctx.params;
  if (!(entity in TABLES)) throw new ApiError(404, "Unknown entity.");
  const e = entity as Entity;
  const rowId = vInt(id, "Id", 1, 1_000_000);
  const b = await body(req);

  if (e === "aircraft") {
    const current = (await db.select().from(aircraft).where(eq(aircraft.id, rowId)).limit(1))[0];
    if (!current) throw new ApiError(404, "Aircraft not found.");
    const businessRows = b.businessRows !== undefined ? vInt(b.businessRows, "Business rows", 0, 10) : current.businessRows;
    const economyRows = b.economyRows !== undefined ? vInt(b.economyRows, "Economy rows", 6, 45) : current.economyRows;
    const configChanged = businessRows !== current.businessRows || economyRows !== current.economyRows;
    if (configChanged && (await usageCount(e, rowId)) > 0)
      throw new ApiError(409, "Seat layout cannot change while flights use this aircraft.");
    await db.transaction(async (tx) => {
      await tx.update(aircraft).set({
        name: b.name !== undefined ? vStr(b.name, "Name", 2, 80) : current.name,
        model: b.model !== undefined ? vStr(b.model, "Model", 2, 60) : current.model,
        manufacturer: b.manufacturer !== undefined ? vStr(b.manufacturer, "Manufacturer", 2, 60) : current.manufacturer,
        businessRows, economyRows,
        cruiseSpeedKmh: b.cruiseSpeedKmh !== undefined ? vInt(b.cruiseSpeedKmh, "Cruise speed", 300, 1200) : current.cruiseSpeedKmh,
        rangeKm: b.rangeKm !== undefined ? vInt(b.rangeKm, "Range", 500, 20000) : current.rangeKm,
      }).where(eq(aircraft.id, rowId));
      if (configChanged) {
        await tx.delete(seats).where(eq(seats.aircraftId, rowId));
        await tx.insert(seats).values(buildSeatRows(rowId, businessRows, economyRows));
      }
    });
    return ok({ updated: true });
  }

  if (e === "airports") {
    await db.update(airports).set({
      name: vStr(b.name, "Name", 3, 120), city: vStr(b.city, "City", 2, 80),
      country: vStr(b.country, "Country", 2, 80), timezone: vStr(b.timezone ?? "UTC", "Timezone", 1, 40),
    }).where(eq(airports.id, rowId));
    return ok({ updated: true });
  }
  if (e === "airlines") {
    await db.update(airlines).set({
      name: vStr(b.name, "Name", 2, 80), accent: vStr(b.accent ?? "#D9C18D", "Accent", 4, 9),
    }).where(eq(airlines.id, rowId));
    return ok({ updated: true });
  }
  const originId = vInt(b.originId, "Origin", 1, 1_000_000);
  const destinationId = vInt(b.destinationId, "Destination", 1, 1_000_000);
  if (originId === destinationId) throw new ApiError(422, "Origin and destination must differ.");
  await db.update(routes).set({
    originId, destinationId, distanceKm: vInt(b.distanceKm ?? 1000, "Distance", 50, 20000),
  }).where(eq(routes.id, rowId));
  return ok({ updated: true });
});

export const DELETE = route(async (_req: NextRequest, ctx) => {
  await requireAdmin();
  const { entity, id } = await ctx.params;
  if (!(entity in TABLES)) throw new ApiError(404, "Unknown entity.");
  const e = entity as Entity;
  const rowId = vInt(id, "Id", 1, 1_000_000);
  if ((await usageCount(e, rowId)) > 0)
    throw new ApiError(409, "This record is used by flights and cannot be deleted.");
  if (e === "routes") {
    await db.delete(routes).where(eq(routes.id, rowId));
  } else {
    const t = TABLES[e];
    const used = await db.select({ n: sql<number>`count(*)`.mapWith(Number) })
      .from(flights)
      .where(or(eq(flights.originId, rowId), eq(flights.destinationId, rowId)));
    void used;
    await db.delete(t).where(eq(t.id, rowId));
  }
  return ok({ deleted: true });
});