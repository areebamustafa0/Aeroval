import { db } from "@/db";
import { newsletterSubscribers } from "@/db/schema";
import { body, ok, route, vEmail, clientIp, rateLimit } from "@/lib/api";

export const POST = route(async (req) => {
  rateLimit(`newsletter:${clientIp(req)}`, 10);
  const b = await body(req);
  const email = vEmail(b.email);
  await db.insert(newsletterSubscribers).values({ email }).onConflictDoNothing();
  return ok({ subscribed: true, message: "Welcome aboard — inspiration is on its way." });
});