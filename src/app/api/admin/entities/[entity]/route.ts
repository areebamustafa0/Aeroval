import { NextRequest } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { airports, airlines, aircraft, routes } from "@/db/schema";
import { ApiError, body, ok, route, vInt, vStr } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { buildSeatRows } from "@/lib/fleet";
import { seats } from "@/db/schema";

const TABLES = { airports, airlines, aircraft, routes } as const;
type Entity = keyof typeof TABLES;

const entityFrom = (s: string): Entity => {
  if (!(s in TABLES)) throw new ApiError(404, "Unknown entity.");
  return s as Entity;
};

export const GET = route(async (_req: NextRequest, ctx) => {
  await requireAdmin();
  const { entity } = await ctx.params;
  const e = entityFrom(entity);
  const rows = await db.select().from(TABLES[e]).limit(500);
  return ok({ rows });
});

export const POST = route(async (req: NextRequest, ctx) => {
  await requireAdmin();
  const { entity } = await ctx.params;
  const e = entityFrom(entity);
  const b = await body(req);

  if (e === "airports") {
    const code = vStr(b.code, "IATA code", 3, 3).toUpperCase();
    if (!/^[A-Z]{3}$/.test(code)) throw new ApiError(422, "IATA code must be 3 letters.");
    const inserted = await db.insert(airports).values({
      code, name: vStr(b.name, "Name", 3, 120), city: vStr(b.city, "City", 2, 80),
      country: vStr(b.country, "Country", 2, 80), timezone: vStr(b.timezone ?? "UTC", "Timezone", 1, 40),
    }).returning();
    return ok({ row: inserted[0] }, 201);
  }
  if (e === "airlines") {
    const code = vStr(b.code, "Airline code", 2, 2).toUpperCase();
    const inserted = await db.insert(airlines).values({
      code, name: vStr(b.name, "Name", 2, 80), accent: vStr(b.accent ?? "#D9C18D", "Accent", 4, 9),
    }).returning();
    return ok({ row: inserted[0] }, 201);
  }
  if (e === "aircraft") {
    const businessRows = vInt(b.businessRows ?? 3, "Business rows", 0, 10);
    const economyRows = vInt(b.economyRows ?? 24, "Economy rows", 6, 45);
    const created = await db.transaction(async (tx) => {
      const inserted = await tx.insert(aircraft).values({
        name: vStr(b.name, "Name", 2, 80), model: vStr(b.model, "Model", 2, 60),
        manufacturer: vStr(b.manufacturer, "Manufacturer", 2, 60),
        businessRows, economyRows,
        cruiseSpeedKmh: vInt(b.cruiseSpeedKmh ?? 870, "Cruise speed", 300, 1200),
        rangeKm: vInt(b.rangeKm ?? 6500, "Range", 500, 20000),
      }).returning();
      const a = inserted[0]!;
      await tx.insert(seats).values(buildSeatRows(a.id, businessRows, economyRows));
      return a;
    });
    return ok({ row: created }, 201);
  }
  const originId = vInt(b.originId, "Origin", 1, 1_000_000);
  const destinationId = vInt(b.destinationId, "Destination", 1, 1_000_000);
  if (originId === destinationId) throw new ApiError(422, "Origin and destination must differ.");
  const inserted = await db.insert(routes).values({
    originId, destinationId, distanceKm: vInt(b.distanceKm ?? 1000, "Distance", 50, 20000),
  }).returning();
  void sql;
  return ok({ row: inserted[0] }, 201);
});