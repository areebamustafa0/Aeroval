import { NextRequest } from "next/server";
import { body, ok, route, vInt } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { rescheduleBooking } from "@/lib/booking";

export const PATCH = route(async (req: NextRequest, ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const b = await body(req);
  const result = await rescheduleBooking({
    user,
    bookingId: vInt(id, "Booking id", 1, 1_000_000),
    newFlightId: vInt(b.flightId, "New flight", 1, 1_000_000),
  });
  return ok(result);
});