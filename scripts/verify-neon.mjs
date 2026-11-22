/* Proves AEROVÉL's Neon Postgres + Object Storage wiring end to end.
   Run against a running app: node scripts/verify-neon.mjs */
import "dotenv/config";
import pg from "pg";
import { S3Client, HeadObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

const BASE = process.env.BASE ?? "http://localhost:3000";
let failures = 0;
const check = (name, cond, extra = "") => {
  console.log(`${cond ? "✓" : "✗ FAIL"} ${name}${extra ? ` — ${extra}` : ""}`);
  if (!cond) failures++;
};

const sessionCookie = (res) => (res.headers.get("set-cookie") ?? "").split(";")[0];

async function main() {
  /* 1. Direct Neon Postgres connection with the same pooled URL the app uses. */
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: true } });
  const dbResult = await pool.query(`
    select current_database() as db,
           (select count(*) from users)::int as users,
           (select count(*) from destinations)::int as destinations,
           (select count(*) from flights)::int as flights,
           (select count(*) from flight_seats)::int as seats,
           (select count(*) from bookings)::int as bookings
  `);
  const d = dbResult.rows[0];
  check("Neon Postgres connected with seeded app data", d.db === "neondb" && d.users >= 4 && d.destinations === 12 && d.flights > 500 && d.seats > 100000,
    `${d.db}: ${d.users} users, ${d.destinations} destinations, ${d.flights} flights, ${d.bookings} bookings`);
  await pool.end();

  /* 2. Both services from inside the running Next.js app. */
  const health = await fetch(`${BASE}/api/health/services`, { cache: "no-store" });
  const healthData = await health.json();
  check("in-app /api/health/services verifies Postgres", health.status === 200 && healthData.postgres?.connected === true, healthData.postgres?.database);
  check("in-app /api/health/services verifies Object Storage round trip", health.status === 200 && healthData.objectStorage?.verified === true,
    `bucket ${healthData.objectStorage?.bucket}, ${healthData.objectStorage?.bytes} bytes`);

  /* 3. A real booking writes a real e-ticket into Neon Object Storage. */
  const login = await fetch(`${BASE}/api/auth/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "traveler@aerovel.demo", password: "FlyBeyond2025" }),
  });
  const cookie = sessionCookie(login);
  check("demo traveler session on Neon data", login.status === 200 && cookie.includes("aerovel_session"));

  const bookings = await fetch(`${BASE}/api/bookings`, { headers: { cookie } });
  const bookingData = await bookings.json();
  const booking = bookingData.bookings?.[0]?.booking;
  check("bookings read from Neon", bookings.status === 200 && Boolean(booking?.pnr), booking?.pnr);

  if (booking?.pnr) {
    const ticket = await fetch(`${BASE}/api/bookings/${booking.id}/ticket`, { headers: { cookie } });
    const bytes = Buffer.from(await ticket.arrayBuffer());
    const pnr = booking.pnr;
    check("e-ticket PDF generated/downloaded", ticket.status === 200 && bytes.subarray(0, 4).toString() === "%PDF", `${bytes.length} bytes`);
    check("ticket archived on Neon Object Storage", ticket.headers.get("x-aerovel-ticket-source") === "neon-object-storage");

    const s3 = new S3Client({
      endpoint: process.env.AWS_ENDPOINT_URL_S3,
      region: process.env.AWS_REGION,
      forcePathStyle: true,
      credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY },
    });
    const head = await s3.send(new HeadObjectCommand({ Bucket: "aerovel-tickets", Key: `tickets/${pnr}.pdf` }));
    check("stored object readable in bucket", head.ContentType === "application/pdf" && head.ContentLength > 1000, `${head.ContentLength} bytes`);

    const second = await fetch(`${BASE}/api/bookings/${booking.id}/ticket`, { headers: { cookie } });
    const secondBytes = Buffer.from(await second.arrayBuffer());
    check("second download served from Neon storage", second.headers.get("x-aerovel-ticket-source") === "neon-object-storage" && secondBytes.equals(bytes));

    const list = await s3.send(new ListObjectsV2Command({ Bucket: "aerovel-tickets", Prefix: "tickets/" }));
    check("bucket lists archived tickets", (list.Contents ?? []).length > 0, `${(list.Contents ?? []).length} object(s)`);

    /* 4. A flight search proves the app queries the Neon database. */
    const soon = new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10);
    const search = await fetch(`${BASE}/api/flights/search?from=LHE&to=DXB&date=${soon}&cabin=economy&pax=1`);
    const searchData = await search.json();
    check("flight search queries Neon inventory", search.status === 200 && searchData.flights?.length > 0, `${searchData.flights?.length ?? 0} flights`);
  }

  console.log(failures === 0 ? "\nNEON END-TO-END VERIFICATION PASSED ✅" : `\n${failures} FAILURES ❌`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => { console.error("Verification error:", err.message); process.exit(1); });
