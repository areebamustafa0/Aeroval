import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, roles } from "@/db/schema";
import { ApiError, body, clientIp, ok, rateLimit, route, vEmail, vStr } from "@/lib/api";
import { verifyPassword, signSession, setSessionCookie } from "@/lib/auth";

export const POST = route(async (req) => {
  // Generous enough for real people re-trying, tight enough to blunt brute force.
  rateLimit(`login:${clientIp(req)}`, 30);
  const b = await body(req);
  const email = vEmail(b.email);
  const password = vStr(b.password, "Password", 1, 100);

  const rows = await db
    .select({ u: users, role: roles.name })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.email, email))
    .limit(1);
  const row = rows[0];
  if (!row || !(await verifyPassword(password, row.u.passwordHash)))
    throw new ApiError(401, "Incorrect email or password.");

  await setSessionCookie(await signSession({ id: row.u.id, role: row.role, email: row.u.email }));
  return ok({
    user: { id: row.u.id, firstName: row.u.firstName, lastName: row.u.lastName, email: row.u.email, role: row.role },
  });
});