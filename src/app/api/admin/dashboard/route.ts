import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { bookings, flights, users, flightSeats, payments, roles, bookingPassengers } from "@/db/schema";
import { ok, route } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";

const count = (t: unknown) => sql<number>`(select count(*) from ${t})`.mapWith(Number);

export const GET = route(async () => {
  await requireAdmin();
  const [stats] = await db.select({
    totalFlights: count(flights),
    totalBookings: count(bookings),
    customers: sql<number>`(select count(*) from users u join roles r on r.id = u.role_id where r.name = 'customer')`.mapWith(Number),
    availableSeats: sql<number>`(select count(*) from flight_seats where status = 'available')`.mapWith(Number),
    revenue: sql<number>`(select coalesce(sum(amount), 0) from payments where status = 'successful')`.mapWith(Number),
    cancelled: sql<number>`(select count(*) from bookings where status = 'cancelled')`.mapWith(Number),
  }).from(sql`(select 1) as dummy`);

  const daily = await db.execute(sql`
    select to_char(d.day, 'DD Mon') as label,
      coalesce(b.n, 0)::int as bookings,
      coalesce(p.amount, 0)::int as revenue
    from generate_series(current_date - interval '13 days', current_date, interval '1 day') as d(day)
    left join (select date_trunc('day', created_at) as day, count(*) as n from bookings group by 1) b on b.day = d.day
    left join (select date_trunc('day', p.created_at) as day, sum(p.amount) as amount from payments p where p.status = 'successful' group by 1) p on p.day = d.day
    order by d.day
  `);

  const cabins = await db.select({
    cabin: bookings.cabinClass,
    n: sql<number>`count(*)`.mapWith(Number),
  }).from(bookings).groupBy(bookings.cabinClass);

  const recent = await db
    .select({
      id: bookings.id, pnr: bookings.pnr, status: bookings.status, total: bookings.totalAmount,
      createdAt: bookings.createdAt, cancelRequestedAt: bookings.cancelRequestedAt,
      user: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
      email: users.email,
      flightNumber: flights.flightNumber,
    })
    .from(bookings)
    .innerJoin(users, eq(bookings.userId, users.id))
    .innerJoin(flights, eq(bookings.flightId, flights.id))
    .orderBy(desc(bookings.createdAt))
    .limit(8);

  const popular = await db.execute(sql`
    select o.code || ' → ' || d.code as route, count(*)::int as n
    from bookings b
    join flights f on f.id = b.flight_id
    join airports o on o.id = f.origin_id
    join airports d on d.id = f.destination_id
    group by 1 order by n desc limit 6
  `);

  void roles; void flightSeats; void bookingPassengers;
  return ok({ stats, daily: daily.rows, cabins, recent, popular: popular.rows });
});