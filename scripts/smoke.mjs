/* End-to-end smoke test against a running AEROVÉL server.
   Run: node scripts/smoke.mjs  (BASE env optional, defaults to http://localhost:3000) */
const BASE = process.env.BASE ?? "http://localhost:3000";
let failures = 0;
const check = (name, cond, extra = "") => {
  console.log(`${cond ? "✓" : "✗ FAIL"} ${name}${extra ? ` — ${extra}` : ""}`);
  if (!cond) failures++;
};

const call = async (path, { method = "GET", body, cookie } = {}) => {
  const res = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json", ...(cookie ? { cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  const setCookie = res.headers.get("set-cookie") ?? "";
  const session = setCookie.split(";")[0];
  const type = res.headers.get("content-type") ?? "";
  const data = type.includes("json") ? await res.json().catch(() => ({})) : await res.arrayBuffer();
  return { status: res.status, data, cookie: session || cookie, type };
};

const day = (n) => {
  const d = new Date(Date.now() + n * 864e5);
  return d.toISOString().slice(0, 10);
};

const pax = (fn, ln) => ({
  firstName: fn, lastName: ln, email: "smoke@test.demo", phone: "+923001234567",
  dateOfBirth: "1994-05-05", nationality: "Pakistani", passportNumber: "SM1234567",
});

const main = async () => {
  /* health */
  const health = await call("/api/health");
  check("health", health.status === 200 && health.data.ok === true);

  /* browse upcoming demo flights without requiring a route search */
  const browse = await call("/api/flights?limit=8&cabin=economy&pax=1");
  check("browse upcoming flights with real available seats", browse.status === 200 && browse.data.flights?.length > 0 && browse.data.flights.every((f) => f.seatsLeft >= 1 && new Date(f.departureAt).getTime() > Date.now()));
  const businessBrowse = await call("/api/flights?limit=8&cabin=business&pax=2");
  check("browse business cabin for two passengers", businessBrowse.status === 200 && businessBrowse.data.flights?.length > 0 && businessBrowse.data.flights.every((f) => f.cabin === "business" && f.seatsLeft >= 2));
  const invalidCabin = await call("/api/flights?cabin=invalid");
  check("browse rejects invalid cabin", invalidCabin.status === 422);

  /* search validation */
  const sameAirports = await call(`/api/flights/search?from=LHE&to=LHE&date=${day(2)}&cabin=economy&pax=1`);
  check("search rejects identical airports", sameAirports.status === 422);
  const pastDate = await call(`/api/flights/search?from=LHE&to=DXB&date=2020-01-01&cabin=economy&pax=1`);
  check("search rejects past date", pastDate.status === 422);

  /* search */
  const search = await call(`/api/flights/search?from=LHE&to=DXB&date=${day(2)}&cabin=economy&pax=1`);
  check("flight search returns results", search.status === 200 && search.data.flights?.length > 0, `${search.data.flights?.length ?? 0} flights`);
  const flight = search.data.flights[0];

  /* auth */
  const badLogin = await call("/api/auth/login", { method: "POST", body: { email: "traveler@aerovel.demo", password: "wrong" } });
  check("login rejects wrong password", badLogin.status === 401);
  const login = await call("/api/auth/login", { method: "POST", body: { email: "traveler@aerovel.demo", password: "FlyBeyond2025" } });
  check("traveler login", login.status === 200 && login.cookie.includes("aerovel_session"));
  const me = await call("/api/auth/me", { cookie: login.cookie });
  check("auth/me returns user", me.status === 200 && me.data.user?.email === "traveler@aerovel.demo");

  /* guest cannot book */
  const guestBook = await call("/api/bookings", { method: "POST", body: { flightId: flight.id, cabin: "economy", passengers: [pax("Guest", "User")], seatIds: [1], contactEmail: "g@t.demo" } });
  check("guest booking blocked (401)", guestBook.status === 401);

  /* seats */
  const seatsRes = await call(`/api/flights/${flight.id}/seats`);
  const avail = seatsRes.data.seats.filter((s) => s.status === "available" && s.cabinClass === "economy");
  check("seat map loaded", seatsRes.status === 200 && avail.length > 10, `${avail.length} economy seats free`);
  const [seatA, seatB] = avail;

  /* concurrent double-booking prevention: two travelers race for seatB */
  const mkBody = (seat) => ({
    flightId: flight.id, cabin: "economy", passengers: [pax("Race", "Tester")],
    seatIds: [seat.id], contactEmail: "race@test.demo", contactPhone: "+923000000000",
  });
  const [r1, r2] = await Promise.all([
    call("/api/bookings", { method: "POST", body: mkBody(seatB), cookie: login.cookie }),
    call("/api/bookings", { method: "POST", body: mkBody(seatB), cookie: login.cookie }),
  ]);
  const statuses = [r1.status, r2.status].sort();
  check("concurrent same-seat booking: exactly one wins", statuses[0] === 201 && statuses[1] === 409, `statuses ${r1.status}/${r2.status}`);
  const raceWinner = r1.status === 201 ? r1 : r2;

  /* normal booking + payment */
  const created = await call("/api/bookings", { method: "POST", body: mkBody(seatA), cookie: login.cookie });
  check("booking created (pending, seat reserved)", created.status === 201 && created.data.booking?.status === "pending", `PNR ${created.data.booking?.pnr}`);
  const bookingId = created.data.booking.id;

  const declined = await call("/api/payments", { method: "POST", cookie: login.cookie, body: { bookingId: raceWinner.data.booking.id, method: "card", cardNumber: "4000000000000002", expiry: "12/29", cvv: "123" } });
  check("decline card fails honestly (402) & releases seats", declined.status === 402 && declined.data.outcome === "failed");
  const seatAfterDecline = await call(`/api/flights/${flight.id}/seats`);
  const seatBNow = seatAfterDecline.data.seats.find((s) => s.id === seatB.id);
  check("declined seat returned to available", seatBNow?.status === "available");

  const paid = await call("/api/payments", { method: "POST", cookie: login.cookie, body: { bookingId, method: "card", cardNumber: "4242424242424242", expiry: "12/29", cvv: "123" } });
  check("demo payment succeeds & confirms booking", paid.status === 200 && paid.data.booking?.status === "confirmed" && Boolean(paid.data.qr));

  /* seat now occupied */
  const seatsAfter = await call(`/api/flights/${flight.id}/seats`);
  check("paid seat is occupied", seatsAfter.data.seats.find((s) => s.id === seatA.id)?.status === "occupied");

  /* ticket pdf */
  const pdf = await call(`/api/bookings/${bookingId}/ticket`, { cookie: login.cookie });
  check("PDF ticket generated", pdf.status === 200 && pdf.type.includes("pdf") && pdf.data.byteLength > 2000, `${pdf.data.byteLength} bytes`);

  /* ownership */
  const otherLogin = await call("/api/auth/login", { method: "POST", body: { email: "daniel@aerovel.demo", password: "FlyBeyond2025" } });
  const foreign = await call(`/api/bookings/${bookingId}`, { cookie: otherLogin.cookie });
  check("other user cannot read booking (403)", foreign.status === 403);

  /* reschedule onto same route different flight */
  const alt = search.data.flights.find((f) => f.id !== flight.id);
  if (alt) {
    const resched = await call(`/api/bookings/${bookingId}/reschedule`, { method: "PATCH", cookie: login.cookie, body: { flightId: alt.id } });
    check("reschedule same route", resched.status === 200 || resched.status === 409, `status ${resched.status} (${resched.data.message ?? resched.data.error})`);
    if (resched.status === 200) {
      const oldSeats = await call(`/api/flights/${flight.id}/seats`);
      check("old seat released after reschedule", oldSeats.data.seats.find((s) => s.id === seatA.id)?.status === "available");
    }
  }

  /* cancel + refund */
  const cancel = await call(`/api/bookings/${bookingId}/cancel`, { method: "PATCH", cookie: login.cookie });
  check("cancellation refunds demo payment", cancel.status === 200 && cancel.data.requested === false);
  const detail = await call(`/api/bookings/${bookingId}`, { cookie: login.cookie });
  check("booking cancelled & payment refunded", detail.data.booking?.status === "cancelled" && detail.data.payments?.some((p) => p.status === "refunded"));

  /* admin authorization */
  const adminDenied = await call("/api/admin/dashboard", { cookie: login.cookie });
  check("customer blocked from admin API (403)", adminDenied.status === 403);
  const adminLogin = await call("/api/auth/login", { method: "POST", body: { email: "admin@aerovel.demo", password: "AdminBeyond2025" } });
  check("admin login", adminLogin.status === 200 && adminLogin.data.user?.role === "admin");
  const dash = await call("/api/admin/dashboard", { cookie: adminLogin.cookie });
  check("admin dashboard stats", dash.status === 200 && dash.data.stats?.totalFlights >= 30, `${dash.data.stats?.totalFlights} flights, revenue $${dash.data.stats?.revenue}`);
  const reports = await call("/api/admin/reports", { cookie: adminLogin.cookie });
  check("admin reports", reports.status === 200 && reports.data.daily?.length === 30 && reports.data.occupancy?.length > 0);

  /* admin flight create + safe delete */
  const refs = await call("/api/admin/flights", { cookie: adminLogin.cookie });
  const newFlight = await call("/api/admin/flights", {
    method: "POST", cookie: adminLogin.cookie,
    body: {
      flightNumber: "AV999", airlineId: refs.data.airlines[0].id, aircraftId: refs.data.aircraft[0].id,
      originId: refs.data.airports[0].id, destinationId: refs.data.airports[3].id,
      departureAt: new Date(Date.now() + 30 * 864e5).toISOString(), arrivalAt: new Date(Date.now() + 30 * 864e5 + 4 * 36e5).toISOString(),
      basePrice: 350, stops: 0, gate: "D9", terminal: "2",
    },
  });
  check("admin creates flight with seat map", newFlight.status === 201);
  if (newFlight.status === 201) {
    const del = await call(`/api/admin/flights/${newFlight.data.flight.id}`, { method: "DELETE", cookie: adminLogin.cookie });
    check("admin deletes unused flight", del.status === 200);
  }
  const protectedDel = await call(`/api/admin/flights/${flight.id}`, { method: "DELETE", cookie: adminLogin.cookie });
  check("flight with booking history protected from delete", protectedDel.status === 409);

  /* round-trip legs exist */
  const outLeg = await call(`/api/flights/search?from=LHR&to=JFK&date=${day(7)}&cabin=business&pax=2`);
  const retLeg = await call(`/api/flights/search?from=JFK&to=LHR&date=${day(14)}&cabin=business&pax=2`);
  check("round-trip both legs available (business, 2 pax)", outLeg.data.flights?.length > 0 && retLeg.data.flights?.length > 0, `${outLeg.data.flights?.length} out / ${retLeg.data.flights?.length} ret`);
  if (outLeg.data.flights?.length && retLeg.data.flights?.length) {
    const of = outLeg.data.flights[0];
    const rf = retLeg.data.flights[0];
    const os = (await call(`/api/flights/${of.id}/seats`)).data.seats.filter((s) => s.status === "available" && s.cabinClass === "business").slice(0, 2);
    const rs = (await call(`/api/flights/${rf.id}/seats`)).data.seats.filter((s) => s.status === "available" && s.cabinClass === "business").slice(0, 2);
    const rt = await call("/api/bookings", {
      method: "POST", cookie: login.cookie,
      body: {
        flightId: of.id, returnFlightId: rf.id, cabin: "business",
        passengers: [pax("Round", "Tripper"), pax("Second", "Guest")],
        seatIds: os.map((s) => s.id), returnSeatIds: rs.map((s) => s.id),
        contactEmail: "rt@test.demo",
      },
    });
    check("round-trip 2-pax business booking created", rt.status === 201, rt.data.error ?? `PNR ${rt.data.booking?.pnr}`);
    if (rt.status === 201) {
      const cash = await call("/api/payments", { method: "POST", cookie: login.cookie, body: { bookingId: rt.data.booking.id, method: "cash" } });
      check("cash payment confirms with pending status", cash.status === 200 && cash.data.payment?.status === "pending");
      await call(`/api/bookings/${rt.data.booking.id}/cancel`, { method: "PATCH", cookie: login.cookie });
    }
  }

  /* authenticated pages */
  const ticketPage = await fetch(BASE + "/bookings/AV7K2M", { headers: { cookie: login.cookie }, redirect: "manual" });
  check("e-ticket page renders for owner", ticketPage.status === 200);
  const adminPage = await fetch(BASE + "/admin", { headers: { cookie: adminLogin.cookie }, redirect: "manual" });
  check("admin page renders for admin", adminPage.status === 200);
  const adminGuard = await fetch(BASE + "/admin", { headers: { cookie: login.cookie }, redirect: "manual" });
  const guardHtml = await adminGuard.text();
  check("admin page gated for customers", adminGuard.status === 200 && guardHtml.includes("Administrators only"));
  for (const asset of ["/manifest.webmanifest", "/sw.js", "/icons/icon-192.svg", "/icons/icon-512.svg", "/images/hero-aerovel.svg", "/images/hero-mobile.svg", "/images/flight-islands.svg"]) {
    const r = await fetch(BASE + asset);
    check(`PWA asset ${asset}`, r.status === 200);
  }

  /* newsletter + destinations */
  const news = await call("/api/newsletter", { method: "POST", body: { email: `smoke-${Date.now()}@test.demo` } });
  check("newsletter subscribe", news.status === 200 && news.data.subscribed === true);
  const dests = await call("/api/destinations");
  check("12 destinations served", dests.status === 200 && dests.data.destinations?.length === 12);
  const save = await call(`/api/destinations/${dests.data.destinations[0].id}/save`, { method: "POST", cookie: login.cookie });
  check("save destination toggle", save.status === 200 && typeof save.data.saved === "boolean");

  /* pages render */
  for (const path of ["/", "/destinations", "/destinations/maldives", "/flights?from=LHE&to=DXB&depart=" + day(2), "/deals", "/about", "/signin", "/offline", "/legal/privacy"]) {
    const res = await fetch(BASE + path);
    check(`page ${path.split("?")[0]} renders`, res.status === 200);
  }

  console.log(failures === 0 ? "\nALL SMOKE TESTS PASSED ✅" : `\n${failures} FAILURES ❌`);
  process.exit(failures === 0 ? 0 : 1);
};

main().catch((e) => { console.error("Smoke run error:", e); process.exit(1); });