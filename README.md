# AEROVÉL — Premium Airline Booking & Management Platform

**THE WORLD IS YOURS. MAKE EVERY JOURNEY EXTRAORDINARY.**

AEROVÉL is a luxury-inspired, photography-driven airline booking experience: cinematic homepage,
magazine-style destination discovery, real flight search, an interactive seat map, a five-step
booking flow with sandbox payments, QR-coded e-tickets with PDF download, a customer dashboard,
and a full administration panel with analytics — installable as a PWA.

> ⚠️ **Demonstration platform.** All flights, fares, schedules, occupancy figures and testimonials
> are fictional sample data, clearly labeled throughout. No real payments are processed and no
> card numbers or CVVs are ever stored.

---

## Tech stack

This sandbox provides **Next.js (App Router) + PostgreSQL via Drizzle ORM** as the fullstack
runtime, so the brief's Vite/Express/MySQL architecture is mapped onto equivalent, production-style
patterns:

| Brief requirement            | Implementation                                             |
| ---------------------------- | ---------------------------------------------------------- |
| React + Tailwind + Framer Motion + Lucide + Recharts | Same libraries, inside Next.js App Router |
| Express REST API             | Next.js route handlers under `src/app/api/**` (REST-shaped) |
| MySQL                        | PostgreSQL (sandbox standard) via Drizzle ORM               |
| JWT auth + hashing + RBAC    | `jose` JWT in HTTP-only cookies, `bcryptjs`, role checks    |
| PWA / QR / PDF               | manifest + service worker, `qrcode`, `pdf-lib`              |

## Demo accounts

| Role     | Email                  | Password         |
| -------- | ---------------------- | ---------------- |
| Traveler | `traveler@aerovel.demo` | `FlyBeyond2025`   |
| Admin    | `admin@aerovel.demo`    | `AdminBeyond2025` |

Extra sample customers: `daniel@aerovel.demo`, `amara@aerovel.demo` (same traveler password).

**Sandbox cards:** `4242 4242 4242 4242` succeeds (any future expiry / any CVV).
Any 16-digit card ending `0002` is declined — seats are released and the booking marked failed.
"Pay at airport" confirms the booking with a **pending** manual payment.

## Where is `.env`?

It lives in the **project root**, next to `package.json`:

```text
aerovel/
├── .env              ← your private credentials, create this on your PC
├── env.example       ← visible safe template (included in this project)
├── .env.example      ← same template with a leading dot (may be hidden)
├── package.json
├── drizzle.config.ts
└── src/
```

The sandbox path is `/app/.env`. On your own PC, it will be `<your-project-folder>/.env`.
Files beginning with a dot may be hidden by your file manager: enable **Show hidden files**.
For convenience, the project also includes the **visible `env.example`** with the same safe placeholder settings.
`.env` is deliberately gitignored and normally absent from GitHub downloads / ZIPs.
Copy `env.example` to `.env` and fill your own values. Never commit or paste credentials into a public repo.

## Run on your PC (local PostgreSQL)

Install **Node.js 22+** and **PostgreSQL 15+**. Open a terminal **inside the folder containing `package.json`**.

1. Create an empty database. With the same username/password as `.env.example`:

   ```bash
   psql -U postgres -c 'CREATE DATABASE aerovel_db;'
   ```

   On Windows PowerShell, if `psql` is not on your PATH, open **SQL Shell (psql)** from the PostgreSQL installer or run that SQL in pgAdmin.

2. Create your private env file:

   ```bash
   # macOS / Linux
   cp env.example .env

   # Windows PowerShell
   Copy-Item env.example .env
   ```

   Open `.env` and set `DATABASE_URL` to your actual Postgres username/password/port/database. For the example database above:
   `postgresql://postgres:postgres@127.0.0.1:5432/aerovel_db`.
   Generate an `AUTH_SECRET` (never use the example placeholder):

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

   Paste the printed 64-character value in `.env` as `AUTH_SECRET="..."`. Local development **does not need S3**: leave the optional `AWS_*` values empty. PDF e-tickets still download; Neon Object Storage archiving is skipped.

3. Install dependencies, apply the schema, seed demo accounts/flights, then start the website:

   ```bash
   npm install
   npx drizzle-kit push
   npx tsx scripts/seed.ts
   npm run dev
   ```

   Open **http://localhost:3000**. The seed is safe to rerun: it skips when users already exist.
   On a first seed, the flight-seat setup can take a few minutes.
   If you want more sample departures without removing bookings, run
   `npx tsx scripts/add-demo-flights.ts` once (also safe to rerun).
   For a production-style local test, use `npm run build` then `npm start` instead of `npm run dev`.

4. Sign in at `/signin` using the **one-tap Traveler or Administrator buttons**, or type the demo credentials listed above. These accounts exist **only after** the seed command finishes.

### Use Neon instead of local PostgreSQL (optional)

Use a **pooled** Neon Postgres connection string (`-pooler` host) as `DATABASE_URL` in `.env`, then run the **same** `npm install`, `npx drizzle-kit push`, `npx tsx scripts/seed.ts`, and `npm run dev` commands.
If you own the Neon project and want its private Object Storage too, fill the four `AWS_*` env vars from the Neon dashboard/CLI. The app's `neon.ts` declares the private `aerovel-tickets` bucket; `neon login` (complete browser sign-in) and `neon deploy` can reconcile it and pull branch env vars for you. S3 credentials must stay server-side and secret.
The existing app uses `pg` + Drizzle with the pooled endpoint and TLS, and the S3 client uses `forcePathStyle: true` as required by Neon. `GET /api/health/services` tests Postgres + a storage write/read/delete round trip **only when storage is configured**. `node scripts/verify-neon.mjs` tests both Neon services end to end.

If the website does not start: check that Postgres is running, `.env` is in the project root, `DATABASE_URL` matches the database you created, and that port 3000 is free. `/api/health` verifies database connectivity. `node scripts/smoke.mjs` exercises login, flight search, seat locking and booking against a running app.

## Feature map

- **Homepage** — cinematic branded hero (generated AEROVÉL aircraft artwork), floating glass flight
  search (round trip / one way / multi-city with swap, passenger steppers, cabin class, validation),
  asymmetric destination gallery, live demo offers, experience band, aircraft showcase carousel,
  benefits, testimonial slider (labeled sample content), newsletter with success state, premium footer.
- **Destinations** — searchable/filterable travel-magazine explorer, trending rail, 12 detail pages
  with galleries, attractions, country facts and live available flights.
- **Flight results** — server-backed search, price/duration/stops/airline/time filters, cheapest /
  fastest / earliest sorting, skeletons, empty states, mobile filter sheet, round-trip two-stage
  selection, multi-city dual lists.
- **Booking** — Flight → Passengers → Seats → Payment → Confirmation with progress indicator,
  per-field validation, sessionStorage persistence, interactive 2–2 / 3–3 seat map (premium, exit,
  occupied, live refresh), itemized pricing, sandbox card/cash payment.
- **E-tickets** — boarding-pass UI with perforated stub, QR verification reference (non-sensitive),
  PDF download (`pdf-lib`), print stylesheet.
- **Dashboard** — overview stats, upcoming trip hero, booking history, cancel (24h rule → admin
  approval queue), same-route reschedule keeping seat numbers, saved destinations, profile + password.
- **Admin** (`/admin`, role-gated) — KPI cards, revenue/booking charts (Recharts), cabin mix, popular
  routes, flight CRUD (safe delete, seat-map generation, status control), airports/routes/aircraft
  management, seat blocking, booking confirm/complete/cancel-approval, passenger & payment records,
  30-day reports with CSV export, platform settings.
- **PWA** — manifest, generated icons, service worker (offline fallback page, static caching,
  **API never cached** so offline never fakes availability), app-style bottom tab bar on mobile.

## Double-booking prevention

`POST /api/bookings` runs inside a PostgreSQL transaction:

1. `SELECT … FOR UPDATE` locks the chosen `flight_seats` rows.
2. Availability + cabin are re-verified under the lock.
3. Booking + passengers are inserted, seats set to `reserved` with the booking id.
4. Payment (`POST /api/payments`) locks again and flips seats to `occupied` (or releases on decline).

A unique constraint on `(flight_id, seat_id)` plus row-level locking means concurrent attempts on
the same seat serialize — only one succeeds, the other receives a 409 with a friendly message.

## API surface (REST)

```
POST /api/auth/register | login | logout | forgot     GET/PATCH /api/auth/me
GET  /api/flights (upcoming demo inventory) | /api/flights/search | /api/flights/:id | /api/flights/:id/seats
GET/POST /api/bookings   GET /api/bookings/:id        PATCH /api/bookings/:id/cancel
PATCH /api/bookings/:id/reschedule                    GET /api/bookings/:id/ticket (PDF)
POST /api/payments       GET /api/payments/:id
GET  /api/destinations   POST /api/destinations/:id/save
POST /api/newsletter
GET  /api/admin/dashboard | bookings | reports | seats | settings
GET/POST /api/admin/flights          PUT/DELETE /api/admin/flights/:id
PATCH /api/admin/bookings            POST /api/admin/settings
GET/POST /api/admin/entities/:entity PUT/DELETE /api/admin/entities/:entity/:id
GET  /api/health
```

Auth endpoints are rate-limited; every endpoint validates input server-side; admin routes require
the `admin` role; owners can only touch their own bookings/payments.

## Photography credits (Pexels license)

Aircraft: Stefan Stefancik (91217), William Lopez (6479834), Quang Nguyen Vinh (8281060, 8281070),
Mike Marchetti (10834384), Media Lens King (36705757), Adrien Olichon (32138460, 2817479),
Thomas (36016234), Max Chen (18090297), Dylan Bueltel (5233240), Salva F. Ayala (10357472).

Destinations: Asad Photo Maldives (9080953, 1456297), Parth Patel (37713450, 37713470),
Yassen Kounchev (19894545), Nadiia Astakhova (31472700), Josh Withers (16823628),
Rubal N Simran Rainu (2939808), Sami Aksu (17872545), Yasir Gürbüz (11088144),
Tom Fisk (35428411), Balazs Simon (15994332), AXP Photography (18774888, 30624873, 33008932),
K (37844492), Ivan Dražić (35696241), Rafael Hideki Tamanaha (31418358), Max Mishin (31710067),
Ivana Rodriguez (8569166), Laura Tancredi (7078882), Mohammed Alim (37723021), Pixabay (415921),
C1 Superstar (27112031).

Portraits (fictional demo testimonials): Tamra Creatives Agency (6497114), Allan (33799456),
Peter Platou (35490803, 35490806).

Hero aircraft, mobile aircraft, island panorama, cabin artwork, aircraft-over-islands artwork and app icon: generated brand assets for this demo.

Additional locally optimized destination photography: Asad Photo Maldives (1456297, 1724430), Jean-Paul Wettstein (32496419), Hans D. (10930112), Dreamer Dude (18341554), Abbas Mohammed (3611545), Diego F. Parra (15532995), Tom Fisk (36896228), Sami Aksu (17872545), Johannes Plenio (1227808), Rafael Hideki Tamanaha (31418358), Federico Abis (33619969), Mohammed Alim (35059637), Federica Amerio (12268343), Ilia Bronskiy (29734980), kevin yung (34790496), and Stefan Stefancik (91217). These photographs are provided under the Pexels license.
### Portable images for Windows / source-only ZIP downloads

Some project exports omit binary files in `public/` (JPG/PNG), which previously caused
`internal image response failed … 404` on a PC. AEROVÉL now ships its curated core
photographs and PWA icons as **self-contained text SVG files** in `public/images/`
and `public/icons/`. Each SVG embeds its original optimized photo, so it renders
without the omitted JPG/PNG files and needs no image-download step. The other
editorial galleries use licensed Pexels images and need an internet connection.

After starting the app, confirm every bundled file is accessible:

```bash
node scripts/verify-assets.mjs
```

If you download a fresh ZIP, confirm it contains `public/images/hero-aerovel.svg`,
`public/images/hero-mobile.svg`, `public/images/places/paris.svg`, and
`public/icons/icon-512.svg`. They are text files and should be present even if
`.jpg` or `.png` files are missing. Restart `npm run dev` after replacing an old
copy of the project so Next.js rebuilds the new image paths.

## Validation

```bash
npx next typegen
npm exec tsc -- --noEmit
npm run build
```"# Aeroval" 
