import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings, savedDestinations, destinations } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getFlightsByIds, getDestinations } from "@/lib/data";
import DashboardClient, { type BookingItem } from "@/components/dashboard/dashboard-client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My Dashboard" };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard");

  let items: BookingItem[] = [];
  let saved: Awaited<ReturnType<typeof getDestinations>> = [];
  let all: Awaited<ReturnType<typeof getDestinations>> = [];
  try {
    const rows = await db.select().from(bookings).where(eq(bookings.userId, user.id)).orderBy(desc(bookings.createdAt));
    const ids = rows.flatMap((b) => (b.returnFlightId ? [b.flightId, b.returnFlightId] : [b.flightId]));
    const flights = await getFlightsByIds([...new Set(ids)], "economy");
    const byId = new Map(flights.map((f) => [f.id, f]));
    items = rows.map((b) => ({
      booking: {
        id: b.id, pnr: b.pnr, status: b.status, cabinClass: b.cabinClass, totalAmount: b.totalAmount,
        passengerCount: b.passengerCount, createdAt: b.createdAt.toISOString(),
        cancelRequestedAt: b.cancelRequestedAt?.toISOString() ?? null, returnFlightId: b.returnFlightId,
      },
      outbound: byId.get(b.flightId) ?? null,
      inbound: b.returnFlightId ? byId.get(b.returnFlightId) ?? null : null,
    }));
    all = await getDestinations();
    const savedRows = await db
      .select({ d: destinations })
      .from(savedDestinations)
      .innerJoin(destinations, eq(savedDestinations.destinationId, destinations.id))
      .where(eq(savedDestinations.userId, user.id));
    saved = savedRows.map((r) => r.d);
  } catch { /* db warming */ }

  const destByCode: Record<string, { imageUrl: string; name: string; slug: string }> = {};
  for (const d of all) destByCode[d.airportCode] = { imageUrl: d.imageUrl, name: d.name, slug: d.slug };

  return <DashboardClient user={user} items={items} saved={saved} destByCode={destByCode} />;
}