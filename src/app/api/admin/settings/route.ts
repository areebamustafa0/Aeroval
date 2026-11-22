import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { body, ok, route, vEmail, vOptionalStr, vStr } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";

const DEFAULTS = {
  supportEmail: "care@aerovel.demo",
  supportPhone: "+92 42 111 237 685",
  address: "AEROVÉL House, 12 Skyline Boulevard, Lahore",
  notice: "Demonstration platform — flights, fares and payments are simulated.",
};

export const GET = route(async () => {
  await requireAdmin();
  const rows = await db.select().from(settings).where(eq(settings.key, "platform")).limit(1);
  return ok({ settings: { ...DEFAULTS, ...(rows[0]?.value ?? {}) } });
});

export const POST = route(async (req) => {
  await requireAdmin();
  const b = await body(req);
  const value = {
    supportEmail: vEmail(b.supportEmail, "Support email"),
    supportPhone: vStr(b.supportPhone, "Support phone", 5, 30),
    address: vStr(b.address, "Address", 5, 160),
    notice: vOptionalStr(b.notice, 240),
  };
  await db.insert(settings).values({ key: "platform", value })
    .onConflictDoUpdate({ target: settings.key, set: { value } });
  return ok({ settings: value });
});