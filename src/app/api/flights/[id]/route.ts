import { NextRequest } from "next/server";
import { ApiError, ok, route, vInt, vOneOf } from "@/lib/api";
import { getFlight } from "@/lib/data";

export const GET = route(async (req: NextRequest, ctx) => {
  const { id } = await ctx.params;
  const cabin = vOneOf(req.nextUrl.searchParams.get("cabin") ?? "economy", "Cabin", ["economy", "business"] as const);
  const flight = await getFlight(vInt(id, "Flight id", 1, 1_000_000), cabin);
  if (!flight) throw new ApiError(404, "Flight not found.");
  return ok({ flight });
});