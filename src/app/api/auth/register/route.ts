import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, roles } from "@/db/schema";
import { ApiError, body, clientIp, ok, rateLimit, route, vEmail, vStr } from "@/lib/api";
import { hashPassword, signSession, setSessionCookie } from "@/lib/auth";

export const POST = route(async (req) => {
  rateLimit(`register:${clientIp(req)}`, 8);
  const b = await body(req);
  const firstName = vStr(b.firstName, "First name", 2, 60);
  const lastName = vStr(b.lastName, "Last name", 2, 60);
  const email = vEmail(b.email);
  const password = vStr(b.password, "Password", 8, 100);

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) throw new ApiError(409, "An account with this email already exists. Try signing in.");

  const roleRows = await db.select().from(roles).where(eq(roles.name, "customer")).limit(1);
  const role = roleRows[0];
  if (!role) throw new ApiError(500, "Roles are not seeded yet.");

  const inserted = await db
    .insert(users)
    .values({ roleId: role.id, firstName, lastName, email, passwordHash: await hashPassword(password) })
    .returning();
  const u = inserted[0]!;
  await setSessionCookie(await signSession({ id: u.id, role: "customer", email: u.email }));
  return ok({ user: { id: u.id, firstName, lastName, email, role: "customer" } }, 201);
});