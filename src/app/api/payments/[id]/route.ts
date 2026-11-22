import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { payments, bookings } from "@/db/schema";
import { ApiError, ok, route, vInt } from "@/lib/api";
import { requireUser } from "@/lib/auth";

export const GET = route(async (_req: NextRequest, ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const rows = await db
    .select({ payment: payments, ownerId: bookings.userId })
    .from(payments)
    .innerJoin(bookings, eq(payments.bookingId, bookings.id))
    .where(eq(payments.id, vInt(id, "Payment id", 1, 1_000_000)))
    .limit(1);
  const row = rows[0];
  if (!row) throw new ApiError(404, "Payment not found.");
  if (row.ownerId !== user.id && user.role !== "admin")
    throw new ApiError(403, "This payment belongs to another account.");
  return ok({ payment: row.payment });
});