import { NextRequest } from "next/server";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const ok = (data: unknown, status = 200) =>
  Response.json(data as object, { status });

export const bad = (status: number, message: string) =>
  Response.json({ error: message }, { status });

type Handler = (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => Promise<Response>;

/** Wraps a route handler with consistent error handling. */
export function route(handler: Handler): Handler {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      if (err instanceof ApiError) return bad(err.status, err.message);
      const msg = err instanceof Error ? err.message : "Unexpected server error";
      if (/unique|duplicate key/i.test(msg))
        return bad(409, "This record conflicts with an existing one.");
      console.error("[api]", msg);
      return bad(500, "Something went wrong on our side. Please try again.");
    }
  };
}

export async function body(req: NextRequest): Promise<Record<string, unknown>> {
  try {
    const b = await req.json();
    return typeof b === "object" && b !== null ? (b as Record<string, unknown>) : {};
  } catch {
    throw new ApiError(400, "Invalid request body.");
  }
}

/* ---------- validators (never trust the client) ---------- */

export const vStr = (v: unknown, field: string, min = 1, max = 200): string => {
  const s = typeof v === "string" ? v.trim() : "";
  if (s.length < min || s.length > max)
    throw new ApiError(422, `${field} must be ${min}–${max} characters.`);
  return s;
};

export const vEmail = (v: unknown, field = "Email"): string => {
  const s = typeof v === "string" ? v.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s) || s.length > 160)
    throw new ApiError(422, `${field} must be a valid email address.`);
  return s;
};

export const vInt = (v: unknown, field: string, min: number, max: number): number => {
  const n = typeof v === "number" ? v : parseInt(String(v), 10);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < min || n > max)
    throw new ApiError(422, `${field} must be a whole number between ${min} and ${max}.`);
  return n;
};

export const vOneOf = <T extends string>(v: unknown, field: string, allowed: readonly T[]): T => {
  if (typeof v !== "string" || !allowed.includes(v as T))
    throw new ApiError(422, `${field} must be one of: ${allowed.join(", ")}.`);
  return v as T;
};

export const vDate = (v: unknown, field: string): Date => {
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) throw new ApiError(422, `${field} must be a valid date.`);
  return d;
};

export const vOptionalStr = (v: unknown, max = 200): string =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

/* ---------- simple in-memory rate limiter for auth endpoints ---------- */

const buckets = new Map<string, { count: number; reset: number }>();

export function rateLimit(key: string, max = 12, windowMs = 10 * 60 * 1000) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return;
  }
  b.count += 1;
  if (b.count > max)
    throw new ApiError(429, "Too many attempts. Please wait a few minutes and try again.");
}

export const clientIp = (req: NextRequest) =>
  req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";

export const randomRef = (len = 6) => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  for (const b of bytes) out += chars[b % chars.length];
  return out;
};