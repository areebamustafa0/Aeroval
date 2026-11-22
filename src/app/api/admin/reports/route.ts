import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { payments, bookings, users } from "@/db/schema";
import { ok, route } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";

export const GET = route(async () => {
  await requireAdmin();
  const daily = await db.execute(sql`
    select to_char(d.day, 'YYYY-MM-DD') as day,
      coalesce(b.n, 0)::int as bookings,
      coalesce(b.amount, 0)::int as revenue,
      coalesce(b.cancelled, 0)::int as cancelled
    from generate_series(current_date - interval '29 days', current_date, interval '1 day') as d(day)
    left join (
      select date_trunc('day', created_at) as day, count(*) as n,
        sum(total_amount) filter (where status in ('confirmed','completed')) as amount,
        count(*) filter (where status = 'cancelled') as cancelled
      from bookings group by 1
    ) b on b.day = d.day order by d.day
  `);

  const occupancy = await db.execute(sql`
    select f.id, f.flight_number as "flightNumber", o.code || ' → ' || d.code as route,
      f.departure_at as "departureAt",
      count(fs.id)::int as capacity,
      count(fs.id) filter (where fs.status in ('occupied','reserved'))::int as taken
    from flights f
    join airports o on o.id = f.origin_id
    join airports d on d.id = f.destination_id
    left join flight_seats fs on fs.flight_id = f.id
    where f.departure_at > now() and f.status <> 'cancelled'
    group by f.id, o.code, d.code
    order by f.departure_at limit 40
  `);

  const popular = await db.execute(sql`
    select o.code || ' → ' || d.code as route, o.city || ' to ' || d.city as label,
      count(*)::int as bookings, coalesce(sum(b.total_amount), 0)::int as revenue
    from bookings b
    join flights f on f.id = b.flight_id
    join airports o on o.id = f.origin_id
    join airports d on d.id = f.destination_id
    where b.status in ('confirmed','completed')
    group by 1, 2 order by bookings desc limit 10
  `);

  const payRows = await db
    .select({
      id: payments.id, amount: payments.amount, method: payments.method, status: payments.status,
      reference: payments.reference, cardLast4: payments.cardLast4, createdAt: payments.createdAt,
      pnr: bookings.pnr, customer: users.email,
    })
    .from(payments)
    .innerJoin(bookings, eq(payments.bookingId, bookings.id))
    .innerJoin(users, eq(bookings.userId, users.id))
    .orderBy(desc(payments.createdAt))
    .limit(80);

  return ok({ daily: daily.rows, occupancy: occupancy.rows, popular: popular.rows, payments: payRows });
});