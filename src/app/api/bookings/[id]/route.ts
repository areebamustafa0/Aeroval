import { NextRequest } from "next/server";
import { ok, route, vInt } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { getBookingDetail, ticketQr } from "@/lib/booking";

export const GET = route(async (_req: NextRequest, ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const detail = await getBookingDetail(vInt(id, "Booking id", 1, 1_000_000), user);
  const qr = await ticketQr(detail.booking.pnr);
  return ok({ ...detail, qr });
});