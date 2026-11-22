import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import { hash, compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, roles } from "@/db/schema";
import { ApiError } from "@/lib/api";

const COOKIE = "aerovel_session";
const secret = () =>
  new TextEncoder().encode(
    process.env.AUTH_SECRET || "aerovel-local-demo-secret-change-in-production"
  );

export type SessionUser = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone: string;
  nationality: string;
  dateOfBirth: string;
};

export const hashPassword = (pw: string) => hash(pw, 10);
export const verifyPassword = (pw: string, h: string) => compare(pw, h);

export async function signSession(user: { id: number; role: string; email: string }) {
  return new SignJWT({ role: user.role, email: user.email })
    .setSubject(String(user.id))
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function setSessionCookie(token: string) {
  const store = await cookies();
  // Decide `Secure` from the actual request protocol. Marking it Secure while the
  // preview is served over plain HTTP makes browsers silently drop the cookie,
  // which looks exactly like "the demo account did not work".
  const h = await headers();
  const proto = (h.get("x-forwarded-proto") ?? "").split(",")[0]?.trim().toLowerCase();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: proto === "https",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.set(COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
}

/** Returns the authenticated user (fresh from DB) or null. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const store = await cookies();
    const token = store.get(COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret());
    const id = parseInt(String(payload.sub), 10);
    if (!Number.isFinite(id)) return null;
    const rows = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
        nationality: users.nationality,
        dateOfBirth: users.dateOfBirth,
        role: roles.name,
      })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.id, id))
      .limit(1);
    const u = rows[0];
    if (!u) return null;
    return {
      ...u,
      phone: u.phone ?? "",
      nationality: u.nationality ?? "",
      dateOfBirth: u.dateOfBirth ?? "",
    };
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const u = await getCurrentUser();
  if (!u) throw new ApiError(401, "Please sign in to continue.");
  return u;
}

export async function requireAdmin(): Promise<SessionUser> {
  const u = await requireUser();
  if (u.role !== "admin") throw new ApiError(403, "Administrator access required.");
  return u;
}