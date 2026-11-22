import { NextRequest } from "next/server";
import { ok, route, vInt, vOneOf } from "@/lib/api";
import { getUpcoming } from "@/lib/data";

/** Browse real upcoming demo inventory, without requiring a route search. */
export const GET = route(async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams;
  const cabin = vOneOf(sp.get("cabin") ?? "economy", "Cabin", ["economy", "business"] as const);
  const passengers = vInt(sp.get("pax") ?? "1", "Passengers", 1, 9);
  const limit = vInt(sp.get("limit") ?? "24", "Limit", 1, 50);
  const flights = await getUpcoming(limit, cabin, passengers);
  return ok({ flights, count: flights.length, inventory: "demo" });
});