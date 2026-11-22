import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ApiError, body, ok, route, vOptionalStr, vStr } from "@/lib/api";
import { getCurrentUser, requireUser, hashPassword, verifyPassword } from "@/lib/auth";

export const GET = route(async () => {
  const user = await getCurrentUser();
  return ok({ user });
});

export const PATCH = route(async (req) => {
  const user = await requireUser();
  const b = await body(req);
  const patch: Record<string, string> = {};
  if (b.firstName !== undefined) patch.firstName = vStr(b.firstName, "First name", 2, 60);
  if (b.lastName !== undefined) patch.lastName = vStr(b.lastName, "Last name", 2, 60);
  if (b.phone !== undefined) patch.phone = vOptionalStr(b.phone, 30);
  if (b.nationality !== undefined) patch.nationality = vOptionalStr(b.nationality, 60);
  if (b.dateOfBirth !== undefined) patch.dateOfBirth = vOptionalStr(b.dateOfBirth, 12);
  if (b.newPassword !== undefined && String(b.newPassword).length > 0) {
    const current = vStr(b.currentPassword, "Current password", 1, 100);
    const next = vStr(b.newPassword, "New password", 8, 100);
    const rows = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
    const u = rows[0];
    if (!u || !(await verifyPassword(current, u.passwordHash)))
      throw new ApiError(401, "Current password is incorrect.");
    patch.passwordHash = await hashPassword(next);
  }
  if (Object.keys(patch).length > 0)
    await db.update(users).set(patch).where(eq(users.id, user.id));
  const fresh = await getCurrentUser();
  return ok({ user: fresh });
});