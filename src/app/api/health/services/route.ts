import { sql } from "drizzle-orm";
import { db } from "@/db";
import { ok, route } from "@/lib/api";
import { isStorageConfigured, storageRoundTrip } from "@/lib/storage";

export const dynamic = "force-dynamic";

/** Proves both wired Neon services work from inside the running Next.js app. */
export const GET = route(async () => {
  const result = await db.execute(sql`select current_database() as database, now() as checked_at`);
  const row = result.rows[0] as { database?: string; checked_at?: Date } | undefined;
  // S3 is optional on a personal computer. The Postgres health check still works
  // and ticket PDFs can be generated on demand without Object Storage.
  const storage = isStorageConfigured()
    ? await storageRoundTrip()
    : { configured: false, verified: false, note: "Object Storage is optional in local development." };
  return ok({
    postgres: { connected: true, database: row?.database ?? null, checkedAt: row?.checked_at ?? null },
    objectStorage: storage,
    ok: true,
  });
});
