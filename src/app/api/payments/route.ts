import { body, ok, route, vInt, vOneOf, vOptionalStr } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { payBooking, ticketQr } from "@/lib/booking";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ApiError } from "@/lib/api";

export const POST = route(async (req) => {
  const user = await requireUser();
  const b = await body(req);
  const bookingId = vInt(b.bookingId, "Booking", 1, 1_000_000);
  const method = vOneOf(b.method, "Payment method", ["card", "cash"] as const);
  const result = await payBooking({
    user,
    bookingId,
    method,
    cardNumber: vOptionalStr(b.cardNumber, 24),
    expiry: vOptionalStr(b.expiry, 5),
    cvv: vOptionalStr(b.cvv, 4),
  });
  if (result.outcome === "failed") return ok(result, 402);
  const rows = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
  const booking = rows[0];
  if (!booking) throw new ApiError(404, "Booking not found.");
  const qr = await ticketQr(booking.pnr);
  return ok({ ...result, booking, qr });
});