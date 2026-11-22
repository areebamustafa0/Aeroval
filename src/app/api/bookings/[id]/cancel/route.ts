import { NextRequest } from "next/server";
import { ok, route, vInt } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { cancelBooking } from "@/lib/booking";

export const PATCH = route(async (_req: NextRequest, ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const result = await cancelBooking({ user, bookingId: vInt(id, "Booking id", 1, 1_000_000) });
  return ok(result);
});