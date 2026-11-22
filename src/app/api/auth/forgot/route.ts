import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ApiError, body, clientIp, ok, rateLimit, route, vEmail, vStr } from "@/lib/api";
import { hashPassword } from "@/lib/auth";
import { randomRef } from "@/lib/api";

export const POST = route(async (req) => {
  rateLimit(`forgot:${clientIp(req)}`, 6);
  const b = await body(req);
  const action = b.action === "reset" ? "reset" : "request";

  if (action === "request") {
    const email = vEmail(b.email);
    const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const u = rows[0];
    if (u) {
      const token = randomRef(24);
      await db.update(users)
        .set({ resetToken: token, resetExpires: new Date(Date.now() + 3600 * 1000) })
        .where(eq(users.id, u.id));
      // Demo platform: no mail service — the reset code is shown directly, clearly labeled.
      return ok({ sent: true, demoToken: token, note: "Demo mode: no email is sent. Use this reset code below." });
    }
    return ok({ sent: true, demoToken: null, note: "If that address exists, a reset code has been generated." });
  }

  const token = vStr(b.token, "Reset code", 8, 40);
  const password = vStr(b.password, "New password", 8, 100);
  const rows = await db.select().from(users).where(eq(users.resetToken, token)).limit(1);
  const u = rows[0];
  if (!u || !u.resetExpires || u.resetExpires.getTime() < Date.now())
    throw new ApiError(422, "Reset code is invalid or expired.");
  await db.update(users)
    .set({ passwordHash: await hashPassword(password), resetToken: null, resetExpires: null })
    .where(eq(users.id, u.id));
  return ok({ reset: true });
});