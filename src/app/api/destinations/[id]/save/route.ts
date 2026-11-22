import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { savedDestinations } from "@/db/schema";
import { ok, route, vInt } from "@/lib/api";
import { requireUser } from "@/lib/auth";

export const POST = route(async (_req: NextRequest, ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const destinationId = vInt(id, "Destination id", 1, 1_000_000);
  const existing = await db
    .select()
    .from(savedDestinations)
    .where(and(eq(savedDestinations.userId, user.id), eq(savedDestinations.destinationId, destinationId)))
    .limit(1);
  if (existing.length > 0) {
    await db.delete(savedDestinations).where(eq(savedDestinations.id, existing[0]!.id));
    return ok({ saved: false });
  }
  await db.insert(savedDestinations).values({ userId: user.id, destinationId });
  return ok({ saved: true });
});