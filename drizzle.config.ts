import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required for Drizzle migrations.");
const isNeon = /neon\.tech/i.test(databaseUrl);
const parsed = new URL(databaseUrl);
if (isNeon && parsed.searchParams.get("sslmode") === "require") {
  parsed.searchParams.set("sslmode", "verify-full");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    // The pooled URL is suitable for this Drizzle schema push; pg_dump needs a direct host.
    url: parsed.toString(),
    ssl: isNeon,
  },
});
