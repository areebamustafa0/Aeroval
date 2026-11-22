import { NextRequest } from "next/server";
import { ok, route, vInt } from "@/lib/api";
import { getFlightSeats } from "@/lib/data";

export const GET = route(async (_req: NextRequest, ctx) => {
  const { id } = await ctx.params;
  const seats = await getFlightSeats(vInt(id, "Flight id", 1, 1_000_000));
  return ok({ seats });
});