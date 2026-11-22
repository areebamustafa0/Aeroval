import { NextRequest } from "next/server";
import { ApiError, ok, route, vInt, vOneOf } from "@/lib/api";
import { searchFlights } from "@/lib/data";

export const GET = route(async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams;
  const from = (sp.get("from") ?? "").toUpperCase().trim();
  const to = (sp.get("to") ?? "").toUpperCase().trim();
  const date = sp.get("date") ?? "";
  const cabin = vOneOf(sp.get("cabin") ?? "economy", "Cabin", ["economy", "business"] as const);
  const passengers = vInt(sp.get("pax") ?? "1", "Passengers", 1, 9);

  if (!/^[A-Z]{3}$/.test(from) || !/^[A-Z]{3}$/.test(to))
    throw new ApiError(422, "Choose a valid origin and destination airport.");
  if (from === to) throw new ApiError(422, "Origin and destination cannot be the same.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new ApiError(422, "Choose a departure date.");
  const day = new Date(`${date}T23:59:59`);
  if (Number.isNaN(day.getTime()) || day.getTime() < Date.now())
    throw new ApiError(422, "Departure date cannot be in the past.");

  const flights = await searchFlights({ from, to, date, cabin, passengers });
  return ok({ flights, count: flights.length });
});