import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const isNeon = /neon\.tech/i.test(databaseUrl);
// `pg` treats sslmode=require as verify-full today but warns that this alias
// changes in a future release. Explicitly request strict hostname validation.
const connectionString = (() => {
  if (!isNeon) return databaseUrl;
  const parsed = new URL(databaseUrl);
  if (parsed.searchParams.get("sslmode") === "require") {
    parsed.searchParams.set("sslmode", "verify-full");
  }
  return parsed.toString();
})();

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

/** Preserve node-postgres + Drizzle, with pooled TLS connections on Neon. */
export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString,
    ...(isNeon
      ? {
          ssl: { rejectUnauthorized: true },
          max: 10,
          idleTimeoutMillis: 30_000,
          connectionTimeoutMillis: 15_000,
          keepAlive: true,
        }
      : {}),
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);
