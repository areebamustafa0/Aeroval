/* AEROVÉL demo seed — run with: npx tsx scripts/seed.ts */
import "dotenv/config";
import { eq, and, inArray } from "drizzle-orm";
import { hash } from "bcryptjs";
import { db, pool } from "../src/db";
import {
  roles, users, airports, airlines, aircraft, seats, routes, flights, flightSeats,
  bookings, bookingPassengers, payments, destinations, newsletterSubscribers, settings,
} from "../src/db/schema";
import { buildSeatRows, createFlightSeats } from "../src/lib/fleet";
import { DEST_GALLERY } from "../src/lib/images";
import { DEST_IMAGES } from "../src/lib/images";

let rngState = 20260214;
const rand = () => {
  rngState = (rngState * 1664525 + 1013904223) % 4294967296;
  return rngState / 4294967296;
};
const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)]!;

async function main() {
  const existing = await db.select({ id: users.id }).from(users).limit(1);
  if (existing.length > 0) {
    console.log("✓ Database already seeded — skipping.");
    await pool.end();
    return;
  }
  console.log("Seeding AEROVÉL demo data…");

  /* roles + users */
  const [adminRole, customerRole] = await db.insert(roles).values([{ name: "admin" }, { name: "customer" }]).returning();
  const [admin, traveler, daniel, amara] = await db.insert(users).values([
    { roleId: adminRole!.id, firstName: "Ava", lastName: "Sterling", email: "admin@aerovel.demo", passwordHash: await hash("AdminBeyond2025", 10), phone: "+92 300 1110001", nationality: "Pakistani", dateOfBirth: "1988-04-12" },
    { roleId: customerRole!.id, firstName: "Sarah", lastName: "Khan", email: "traveler@aerovel.demo", passwordHash: await hash("FlyBeyond2025", 10), phone: "+92 300 1110002", nationality: "Pakistani", dateOfBirth: "1995-09-23" },
    { roleId: customerRole!.id, firstName: "Daniel", lastName: "Reyes", email: "daniel@aerovel.demo", passwordHash: await hash("FlyBeyond2025", 10), nationality: "Spanish", dateOfBirth: "1990-01-15" },
    { roleId: customerRole!.id, firstName: "Amara", lastName: "Okafor", email: "amara@aerovel.demo", passwordHash: await hash("FlyBeyond2025", 10), nationality: "Nigerian", dateOfBirth: "1992-07-08" },
  ]).returning();

  /* airports */
  const airportData = [
    ["LHE", "Allama Iqbal International", "Lahore", "Pakistan", "Asia/Karachi"],
    ["ISB", "Islamabad International", "Islamabad", "Pakistan", "Asia/Karachi"],
    ["KHI", "Jinnah International", "Karachi", "Pakistan", "Asia/Karachi"],
    ["DXB", "Dubai International", "Dubai", "United Arab Emirates", "Asia/Dubai"],
    ["DOH", "Hamad International", "Doha", "Qatar", "Asia/Qatar"],
    ["IST", "Istanbul Airport", "Istanbul", "Türkiye", "Europe/Istanbul"],
    ["LHR", "London Heathrow", "London", "United Kingdom", "Europe/London"],
    ["CDG", "Charles de Gaulle", "Paris", "France", "Europe/Paris"],
    ["ZRH", "Zurich Airport", "Zurich", "Switzerland", "Europe/Zurich"],
    ["MLE", "Velana International", "Malé", "Maldives", "Indian/Maldives"],
    ["DPS", "Ngurah Rai International", "Bali", "Indonesia", "Asia/Makassar"],
    ["JTR", "Santorini International", "Santorini", "Greece", "Europe/Athens"],
    ["HND", "Tokyo Haneda", "Tokyo", "Japan", "Asia/Tokyo"],
    ["JFK", "John F. Kennedy International", "New York", "United States", "America/New_York"],
    ["KUL", "Kuala Lumpur International", "Kuala Lumpur", "Malaysia", "Asia/Kuala_Lumpur"],
    ["FCO", "Leonardo da Vinci–Fiumicino", "Rome", "Italy", "Europe/Rome"],
    ["SIN", "Singapore Changi", "Singapore", "Singapore", "Asia/Singapore"],
  ] as const;
  const airportRows = await db.insert(airports).values(
    airportData.map(([code, name, city, country, timezone]) => ({ code, name, city, country, timezone }))
  ).returning();
  const ap = new Map(airportRows.map((a) => [a.code, a]));

  /* airlines (all fictional) */
  const airlineRows = await db.insert(airlines).values([
    { code: "AV", name: "AEROVÉL", accent: "#162A43" },
    { code: "GA", name: "GulfArc Airways", accent: "#0F766E" },
    { code: "NB", name: "Nimbus Air", accent: "#5B5A7A" },
    { code: "SO", name: "Solstice International", accent: "#B4552D" },
  ]).returning();

  /* aircraft + seat configs */
  const aircraftRows = await db.insert(aircraft).values([
    { name: "AEROVÉL Celeste", model: "Airbus A320neo", manufacturer: "Airbus", businessRows: 3, economyRows: 24, cruiseSpeedKmh: 840, rangeKm: 6300 },
    { name: "AEROVÉL Meridian", model: "Boeing 787-9", manufacturer: "Boeing", businessRows: 5, economyRows: 30, cruiseSpeedKmh: 903, rangeKm: 14000 },
    { name: "AEROVÉL Sovereign", model: "Airbus A350-900", manufacturer: "Airbus", businessRows: 6, economyRows: 34, cruiseSpeedKmh: 910, rangeKm: 15000 },
  ]).returning();
  for (const a of aircraftRows) {
    await db.insert(seats).values(buildSeatRows(a.id, a.businessRows, a.economyRows));
  }

  /* destinations */
  const D = (slug: string) => DEST_IMAGES[slug]!;
  const destRows = await db.insert(destinations).values([
    {
      slug: "maldives", name: "Maldives", country: "Maldives", region: "Islands", airportCode: "MLE",
      tagline: "Paradise on earth, scattered across a turquoise sea.",
      description: "Twenty-six atolls, a thousand islands and water so clear it feels like flying. The Maldives is where overwater villas, glassy lagoons and house reefs turn a holiday into a screensaver you get to live inside. Arrive by seaplane for the full cinematic opening.",
      imageUrl: D("maldives").main, gallery: DEST_GALLERY["maldives"],
      attractions: [
        { name: "Overwater villa sunrise", description: "Wake above a glass lagoon and step straight from your deck into bath-warm water." },
        { name: "Manta point snorkeling", description: "Drift with reef mantas and turtles on guided house-reef excursions." },
        { name: "Sandbank dinner", description: "A private table on a disappearing sandbank, lit by lanterns and the Milky Way." },
      ],
      startingPrice: 599, bestTime: "November – April", language: "Dhivehi", currencyName: "Rufiyaa (MVR)", flightTime: "4h 15m from Dubai", trending: true, popular: true,
    },
    {
      slug: "switzerland", name: "Switzerland", country: "Switzerland", region: "Europe", airportCode: "ZRH",
      tagline: "Alpine villages, glacier air and chocolate-box perfection.",
      description: "Snow-dusted peaks, meadows stitched with wildflowers and trains that glide like clockwork through postcard valleys. From Lauterbrunnen's 72 waterfalls to Zurich's lakeside elegance, Switzerland is precision wrapped in romance.",
      imageUrl: D("switzerland").main, gallery: DEST_GALLERY["switzerland"],
      attractions: [
        { name: "Lauterbrunnen Valley", description: "A glacial valley of cliffside waterfalls beneath the Jungfrau massif." },
        { name: "Jungfraujoch — Top of Europe", description: "Europe's highest railway station, 3,454m into eternal snow." },
        { name: "Lake Zurich promenade", description: "Swan-lined quays, old-town lanes and Alpine silhouettes at dusk." },
      ],
      startingPrice: 649, bestTime: "Dec – Mar · Jun – Sep", language: "German / French", currencyName: "Swiss Franc (CHF)", flightTime: "1h 20m from Paris", trending: false, popular: true,
    },
    {
      slug: "dubai", name: "Dubai", country: "United Arab Emirates", region: "Middle East", airportCode: "DXB",
      tagline: "A skyline that turned the desert into a daydream.",
      description: "The Burj Khalifa pierces golden haze while dhows drift along the Creek below. Dubai layers souks, beaches, desert dunes and impossible architecture into one glittering stopover that never sleeps quietly.",
      imageUrl: D("dubai").main, gallery: DEST_GALLERY["dubai"],
      attractions: [
        { name: "Burj Khalifa at golden hour", description: "Sunset from the 148th floor as the city lights flicker on beneath you." },
        { name: "Old Dubai & the Creek", description: "Abra rides, spice souks and gold souks along the historic waterway." },
        { name: "Desert conservation drive", description: "Arabian oryx and gazelles at dusk, forty minutes from the skyline." },
      ],
      startingPrice: 299, bestTime: "November – March", language: "Arabic", currencyName: "Dirham (AED)", flightTime: "3h 10m from Lahore", trending: true, popular: true,
    },
    {
      slug: "paris", name: "Paris", country: "France", region: "Europe", airportCode: "CDG",
      tagline: "The city of light, and of a thousand quiet love stories.",
      description: "Haussmann boulevards, corner cafés and the Eiffel Tower sparkling on the hour. Paris rewards wanderers: a croissant still warm, a Monet at the Orangerie, the Seine turning gold at dusk.",
      imageUrl: D("paris").main, gallery: DEST_GALLERY["paris"],
      attractions: [
        { name: "Eiffel Tower at twilight", description: "Champagne on the second floor as the city switches to evening mode." },
        { name: "Louvre & Tuileries", description: "From the Mona Lisa to a slow stroll through sculpted gardens." },
        { name: "Montmartre mornings", description: "Cobbled lanes, crêpe stands and the white dome of Sacré-Cœur." },
      ],
      startingPrice: 449, bestTime: "April – June · Sep – Oct", language: "French", currencyName: "Euro (EUR)", flightTime: "3h 45m from Istanbul", trending: false, popular: true,
    },
    {
      slug: "istanbul", name: "Istanbul", country: "Türkiye", region: "Europe", airportCode: "IST",
      tagline: "Where two continents share one unforgettable skyline.",
      description: "Minarets and ferries, bazaars and Bosphorus sunsets. Istanbul straddles Europe and Asia with effortless drama — sip çay by the water, then lose yourself in six centuries of covered markets.",
      imageUrl: D("istanbul").main, gallery: DEST_GALLERY["istanbul"],
      attractions: [
        { name: "Bosphorus at sunset", description: "A ferry between continents as mosques silhouette against amber water." },
        { name: "Hagia Sophia & Blue Mosque", description: "Fifteen centuries of domes, calligraphy and impossible light." },
        { name: "Grand Bazaar", description: "Four thousand shops of lanterns, carpets, ceramics and sweet negotiation." },
      ],
      startingPrice: 379, bestTime: "April – May · Sep – Nov", language: "Turkish", currencyName: "Lira (TRY)", flightTime: "5h 30m from Islamabad", trending: true, popular: false,
    },
    {
      slug: "bali", name: "Bali", country: "Indonesia", region: "Islands", airportCode: "DPS",
      tagline: "Emerald rice terraces and temples wrapped in incense.",
      description: "Bali moves to a gentler rhythm: offerings on doorsteps, gamelan at dusk, jungle rivers and surf beaches. Climb a volcano for sunrise, then float through the day in a cliff-edge infinity pool.",
      imageUrl: D("bali").main, gallery: DEST_GALLERY["bali"],
      attractions: [
        { name: "Tegallalang rice terraces", description: "Sculpted emerald steps that glow at first light above Ubud." },
        { name: "Uluwatu cliff temple", description: "A sea temple 70m above the Indian Ocean, with kecak fire dances at sunset." },
        { name: "Mount Batur sunrise", description: "A pre-dawn volcano climb rewarded with clouds beneath your feet." },
      ],
      startingPrice: 529, bestTime: "May – September", language: "Indonesian", currencyName: "Rupiah (IDR)", flightTime: "9h from Dubai", trending: true, popular: false,
    },
    {
      slug: "santorini", name: "Santorini", country: "Greece", region: "Europe", airportCode: "JTR",
      tagline: "White villages spilling down a volcanic cliff into blue.",
      description: "Born from a volcanic eruption, Santorini is the Aegean's showstopper: blue-domed churches, cave suites carved into the caldera and sunsets in Oia that draw applause.",
      imageUrl: D("santorini").main, gallery: DEST_GALLERY["santorini"],
      attractions: [
        { name: "Oia sunset", description: "The world's most famous golden hour, from a caldera-edge terrace." },
        { name: "Caldera catamaran cruise", description: "Hot springs, red beaches and grilled octopus at anchor." },
        { name: "Akrotiri excavations", description: "A Minoan city frozen in volcanic ash 3,600 years ago." },
      ],
      startingPrice: 479, bestTime: "May – June · September", language: "Greek", currencyName: "Euro (EUR)", flightTime: "1h 35m from Istanbul", trending: true, popular: true,
    },
    {
      slug: "london", name: "London", country: "United Kingdom", region: "Europe", airportCode: "LHR",
      tagline: "A thousand years of history, remixed nightly.",
      description: "Roman walls beside glass towers, afternoon tea beside midnight markets. London is theatre — West End lights, Thames bridges and neighborhoods each with their own accent and appetite.",
      imageUrl: D("london").main, gallery: DEST_GALLERY["london"],
      attractions: [
        { name: "Tower Bridge & the Shard", description: "Two eras of engineering glowing over the Thames at blue hour." },
        { name: "South Bank wander", description: "Street performers, the London Eye and book stalls under Waterloo Bridge." },
        { name: "West End evening", description: "A world-class show, then late-night Soho." },
      ],
      startingPrice: 519, bestTime: "May – September", language: "English", currencyName: "Pound Sterling (GBP)", flightTime: "7h 15m from Dubai", trending: false, popular: false,
    },
    {
      slug: "tokyo", name: "Tokyo", country: "Japan", region: "Asia", airportCode: "HND",
      tagline: "Neon futures and cherry-blossom pasts, in perfect balance.",
      description: "Tokyo is controlled wonder: silent shrines a block from Shibuya's scramble, Michelin ramen under train tracks, and Mount Fuji watching over it all on clear winter mornings.",
      imageUrl: D("tokyo").main, gallery: DEST_GALLERY["tokyo"],
      attractions: [
        { name: "Chureito Pagoda & Fuji", description: "Five story pagoda, cherry blossoms, and the mountain — Japan in one frame." },
        { name: "Shibuya & Shinjuku nights", description: "The world's busiest crossing, then lantern-lit alley izakayas." },
        { name: "Senso-ji at dawn", description: "Tokyo's oldest temple before the crowds, incense curling in first light." },
      ],
      startingPrice: 699, bestTime: "Mar – Apr · Oct – Nov", language: "Japanese", currencyName: "Yen (JPY)", flightTime: "9h 30m from Dubai", trending: true, popular: true,
    },
    {
      slug: "new-york", name: "New York", country: "United States", region: "Americas", airportCode: "JFK",
      tagline: "The skyline that defined skylines.",
      description: "Manhattan at sunset is pure cinema — steam rising off avenues, bridges strung with lights, and a city that treats ambition as a public art form. Every neighborhood is its own capital city.",
      imageUrl: D("new-york").main, gallery: DEST_GALLERY["new-york"],
      attractions: [
        { name: "Manhattan skyline cruise", description: "The Statue of Liberty and Lower Manhattan from the water at golden hour." },
        { name: "Central Park in fall", description: "Elm-lined malls, rowboats and skyscraper views through turning leaves." },
        { name: "Brooklyn Bridge at dawn", description: "Walk the cables east-to-west as the financial district catches fire with light." },
      ],
      startingPrice: 749, bestTime: "Apr – Jun · Sep – Nov", language: "English", currencyName: "US Dollar (USD)", flightTime: "8h from London", trending: false, popular: false,
    },
    {
      slug: "kuala-lumpur", name: "Kuala Lumpur", country: "Malaysia", region: "Asia", airportCode: "KUL",
      tagline: "Twin towers, jungle hills and the best street food in Asia.",
      description: "The Petronas Towers glow like polished steel lanterns over a city of rain trees, batik and hawker smoke. KL is Southeast Asia's easygoing crossroads — modern, multicultural and delicious.",
      imageUrl: D("kuala-lumpur").main, gallery: DEST_GALLERY["kuala-lumpur"],
      attractions: [
        { name: "Petronas Twin Towers", description: "The skybridge at dusk, then the fountain symphony in KLCC Park." },
        { name: "Batu Caves", description: "272 rainbow steps into a limestone cathedral of Hindu shrines." },
        { name: "Jalan Alor night market", description: "Char kway teow, satay and mango sticky rice under a canopy of lanterns." },
      ],
      startingPrice: 459, bestTime: "May – July · Dec – Feb", language: "Malay", currencyName: "Ringgit (MYR)", flightTime: "5h 45m from Lahore", trending: false, popular: false,
    },
    {
      slug: "rome", name: "Rome", country: "Italy", region: "Europe", airportCode: "FCO",
      tagline: "The eternal city, golden at every hour.",
      description: "Three thousand years layered into one amber city: the Colosseum at dawn, fountains you can hear before you see, and trattorias where the cacio e pepe hasn't changed in a century.",
      imageUrl: D("rome").main, gallery: DEST_GALLERY["rome"],
      attractions: [
        { name: "Colosseum & Forum", description: "Gladiator arenas and the marble heart of an empire, best at first light." },
        { name: "Trevi & the historic center", description: "Coin tosses, baroque piazzas and gelato that ruins all other gelato." },
        { name: "Trastevere evenings", description: "Ivy-covered lanes, candlelit tables and Rome's warmest nightlife." },
      ],
      startingPrice: 469, bestTime: "April – June · Sep – Oct", language: "Italian", currencyName: "Euro (EUR)", flightTime: "6h 20m from Dubai", trending: false, popular: false,
    },
  ]).returning();
  void destRows;

  /* routes */
  const routeDefs: [string, string, number][] = [
    ["LHE", "DXB", 1980], ["ISB", "IST", 3550], ["KHI", "DOH", 1520], ["DXB", "LHR", 5500],
    ["IST", "CDG", 2250], ["KUL", "SIN", 300], ["LHE", "IST", 3900], ["DXB", "MLE", 3020],
    ["LHR", "JFK", 5540], ["DXB", "HND", 7950], ["IST", "JTR", 620], ["CDG", "ZRH", 490],
    ["DXB", "DPS", 7480], ["LHE", "KUL", 4300], ["KHI", "DXB", 1190], ["ISB", "DXB", 1930],
    ["DXB", "FCO", 4340], ["KUL", "HND", 5320], ["LHR", "CDG", 350], ["JFK", "LHR", 5540],
    ["DXB", "IST", 3000], ["KHI", "IST", 3980],
  ];
  const routePairs = new Map<string, [string, string, number]>();
  for (const [o, d, km] of routeDefs) {
    routePairs.set(`${o}-${d}`, [o, d, km]);
    if (!routePairs.has(`${d}-${o}`)) routePairs.set(`${d}-${o}`, [d, o, km]);
  }
  await db.insert(routes).values([...routePairs.values()].map(([o, d, km]) => ({
    originId: ap.get(o)!.id, destinationId: ap.get(d)!.id, distanceKm: km,
  })));

  /* flights: [from, to, base fare, minutes, day offsets, hours]
     Flagship routes fly daily for 60 days so round trips work on more dates. */
  const daily = Array.from({ length: 60 }, (_, i) => i + 1);
  const templates: [string, string, number, number, number[], number[]][] = [
    ["LHE", "DXB", 219, 195, daily, [7, 14, 21]],
    ["ISB", "IST", 339, 335, daily, [8, 20]],
    ["KHI", "DOH", 189, 155, daily, [6, 17]],
    ["DXB", "LHR", 519, 440, daily, [9, 15]],
    ["IST", "CDG", 359, 225, daily, [10, 18]],
    ["KUL", "SIN", 89, 65, daily, [8, 13, 19]],
    ["LHE", "IST", 349, 355, [6, 13, 20], [9]],
    ["DXB", "MLE", 429, 255, daily, [10, 16]],
    ["LHR", "JFK", 649, 480, daily, [11, 17]],
    ["DXB", "HND", 719, 575, [6, 15, 25], [8, 22]],
    ["IST", "JTR", 179, 95, [4, 11, 18], [9, 15]],
    ["CDG", "ZRH", 149, 80, [2, 8, 14, 20], [7, 12, 18]],
    ["DXB", "DPS", 559, 545, [7, 16, 24], [9]],
    ["LHE", "KUL", 439, 345, [5, 12, 21], [23]],
    ["KHI", "DXB", 169, 135, daily, [6, 12, 20]],
    ["ISB", "DXB", 259, 205, [4, 9, 17], [8, 19]],
    ["DXB", "FCO", 479, 385, [6, 13, 22], [10]],
    ["KUL", "HND", 539, 425, [8, 17], [9, 23]],
    ["LHR", "CDG", 139, 80, [2, 6, 11, 15], [7, 16]],
    ["JFK", "LHR", 629, 430, daily, [20]],
    ["DXB", "IST", 309, 290, [3, 10, 18], [9, 17]],
    ["KHI", "IST", 369, 340, [7, 15], [10]],
    /* return legs so round trips work beautifully */
    ["DXB", "LHE", 229, 195, daily, [8, 16]],
    ["LHR", "DXB", 509, 435, daily, [10, 21]],
    ["IST", "ISB", 329, 330, daily, [9, 21]],
    ["CDG", "IST", 349, 220, daily, [11, 19]],
    ["MLE", "DXB", 419, 250, daily, [11, 17]],
    ["SIN", "KUL", 89, 65, daily, [9, 15, 20]],
    ["DOH", "KHI", 179, 150, daily, [7, 18]],
    ["HND", "DXB", 709, 580, [8, 17], [10, 23]],
    ["JTR", "IST", 169, 95, [6, 13, 20], [10, 16]],
    ["ZRH", "CDG", 145, 80, [3, 9, 15], [8, 13, 19]],
    ["IST", "LHE", 339, 350, [8, 15], [10]],
    ["DXB", "KHI", 165, 130, daily, [7, 13, 21]],
    ["DXB", "ISB", 249, 200, [5, 11, 18], [9, 20]],
    ["CDG", "LHR", 135, 80, [3, 7, 12], [8, 17]],
    ["FCO", "DXB", 469, 380, [9, 16], [11]],
    ["DPS", "DXB", 549, 545, [10, 18], [10]],
    ["KUL", "LHE", 429, 340, [7, 14], [22]],
    ["HND", "KUL", 529, 425, [9, 19], [10]],
  ];

  const now = new Date();
  const dayAt = (offset: number, hour: number) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, hour, pick([0, 15, 30, 45]), 0, 0);
    return d;
  };
  const aircraftFor = (min: number) =>
    min <= 240 ? aircraftRows[0]! : min <= 480 ? aircraftRows[1]! : aircraftRows[2]!;

  const flightValues: (typeof flights.$inferInsert)[] = [];
  let n = 200;
  for (const [from, to, fare, mins, days, hours] of templates) {
    for (const day of days) {
      const hour = hours[day % hours.length]!;
      const dep = dayAt(day, hour);
      const arr = new Date(dep.getTime() + mins * 60000);
      const airline = rand() < 0.62 ? airlineRows[0]! : pick(airlineRows.slice(1));
      flightValues.push({
        flightNumber: `${airline.code}${n++}`,
        airlineId: airline.id,
        aircraftId: aircraftFor(mins).id,
        originId: ap.get(from)!.id,
        destinationId: ap.get(to)!.id,
        departureAt: dep, arrivalAt: arr, durationMinutes: mins,
        basePrice: fare + Math.floor(rand() * 40),
        stops: 0, status: "scheduled",
        gate: `${pick(["A", "B", "C", "D"])}${1 + Math.floor(rand() * 24)}`,
        terminal: String(1 + Math.floor(rand() * 3)),
      });
    }
  }
  /* two past flights for completed-trip history */
  const pastDep1 = new Date(now.getTime() - 10 * 864e5); pastDep1.setHours(9, 0, 0, 0);
  const pastDep2 = new Date(now.getTime() - 5 * 864e5); pastDep2.setHours(15, 30, 0, 0);
  flightValues.push(
    { flightNumber: "AV118", airlineId: airlineRows[0]!.id, aircraftId: aircraftRows[0]!.id, originId: ap.get("LHE")!.id, destinationId: ap.get("DXB")!.id, departureAt: pastDep1, arrivalAt: new Date(pastDep1.getTime() + 195 * 60000), durationMinutes: 195, basePrice: 209, stops: 0, status: "arrived", gate: "B7", terminal: "1" },
    { flightNumber: "AV342", airlineId: airlineRows[0]!.id, aircraftId: aircraftRows[1]!.id, originId: ap.get("DXB")!.id, destinationId: ap.get("LHR")!.id, departureAt: pastDep2, arrivalAt: new Date(pastDep2.getTime() + 440 * 60000), durationMinutes: 440, basePrice: 505, stops: 0, status: "arrived", gate: "C12", terminal: "3" },
  );

  const flightRows = await db.insert(flights).values(flightValues).returning();
  console.log(`  ✓ ${flightRows.length} flights`);

  /* seat maps + realistic occupancy */
  for (const f of flightRows) {
    await createFlightSeats(db, f.id, f.aircraftId);
  }
  const allSeats = await db.select({ fs: flightSeats, s: seats }).from(flightSeats).innerJoin(seats, eq(flightSeats.seatId, seats.id));
  const toOccupy = allSeats
    .filter(({ s }) => rand() < (s.cabinClass === "business" ? 0.22 : 0.3))
    .map(({ fs }) => fs.id);
  for (let i = 0; i < toOccupy.length; i += 800) {
    await db.update(flightSeats).set({ status: "occupied" })
      .where(and(inArray(flightSeats.id, toOccupy.slice(i, i + 800)), eq(flightSeats.status, "available")));
  }
  console.log(`  ✓ seat maps generated (${allSeats.length} flight seats, ~30% occupied)`);

  /* sample bookings */
  const makeBooking = async (opts: {
    user: typeof traveler; flight: typeof flightRows[number]; status: string; pnr: string;
    pax: { fn: string; ln: string; nat: string; pp: string; dob: string }[];
    payMethod: string; payStatus: string; createdDaysAgo: number; cabin?: string;
  }) => {
    const cabin = opts.cabin ?? "economy";
    const avail = await db.select({ fs: flightSeats, s: seats }).from(flightSeats)
      .innerJoin(seats, eq(flightSeats.seatId, seats.id))
      .where(and(eq(flightSeats.flightId, opts.flight.id), eq(flightSeats.status, "available"), eq(seats.cabinClass, cabin)))
      .limit(opts.pax.length);
    if (avail.length < opts.pax.length) return;
    const base = Math.round(opts.flight.basePrice * (cabin === "business" ? 2.6 : 1)) * opts.pax.length;
    const extras = avail.reduce((s, a) => s + a.s.extraPrice, 0);
    const taxes = Math.round(base * 0.12);
    const total = base + taxes + extras;
    const createdAt = new Date(now.getTime() - opts.createdDaysAgo * 864e5);
    const [b] = await db.insert(bookings).values({
      pnr: opts.pnr, userId: opts.user!.id, flightId: opts.flight.id, cabinClass: cabin,
      status: opts.status, passengerCount: opts.pax.length,
      baseAmount: base, taxesAmount: taxes, seatsAmount: extras, totalAmount: total,
      contactEmail: opts.user!.email, contactPhone: opts.user!.phone ?? "", createdAt,
    }).returning();
    await db.insert(bookingPassengers).values(opts.pax.map((p, i) => ({
      bookingId: b!.id, flightSeatId: avail[i]!.fs.id, seatNumber: avail[i]!.s.seatNumber,
      firstName: p.fn, lastName: p.ln, email: opts.user!.email, phone: opts.user!.phone ?? "",
      dateOfBirth: p.dob, nationality: p.nat, passportNumber: p.pp,
    })));
    if (opts.status !== "cancelled") {
      await db.update(flightSeats).set({ status: opts.status === "pending" ? "reserved" : "occupied", bookingId: b!.id })
        .where(inArray(flightSeats.id, avail.map((a) => a.fs.id)));
    }
    await db.insert(payments).values({
      bookingId: b!.id, amount: total, method: opts.payMethod, status: opts.payStatus,
      cardLast4: opts.payMethod === "card" ? "4242" : "", reference: `PAY-SEED${opts.pnr}`, createdAt,
    });
  };

  const future = flightRows.filter((f) => f.departureAt > now && f.status === "scheduled");
  const byRoute = (o: string, d: string) => future.find((f) => f.originId === ap.get(o)!.id && f.destinationId === ap.get(d)!.id);
  const past1 = flightRows.find((f) => f.flightNumber === "AV118")!;
  const past2 = flightRows.find((f) => f.flightNumber === "AV342")!;

  const dxbLhr = byRoute("DXB", "LHR");
  const lheDxb = byRoute("LHE", "DXB");
  const isbIst = byRoute("ISB", "IST");
  const dxbMle = byRoute("DXB", "MLE");
  if (dxbLhr) await makeBooking({
    user: traveler!, flight: dxbLhr, status: "confirmed", pnr: "AV7K2M", cabin: "business",
    pax: [{ fn: "Sarah", ln: "Khan", nat: "Pakistani", pp: "PK8301221", dob: "1995-09-23" }],
    payMethod: "card", payStatus: "successful", createdDaysAgo: 3,
  });
  if (lheDxb) await makeBooking({
    user: traveler!, flight: lheDxb, status: "pending", pnr: "AV9Q4T",
    pax: [{ fn: "Sarah", ln: "Khan", nat: "Pakistani", pp: "PK8301221", dob: "1995-09-23" }, { fn: "Omar", ln: "Khan", nat: "Pakistani", pp: "PK9917345", dob: "1992-02-11" }],
    payMethod: "cash", payStatus: "pending", createdDaysAgo: 1,
  });
  await makeBooking({
    user: traveler!, flight: past1, status: "completed", pnr: "AV2H8N",
    pax: [{ fn: "Sarah", ln: "Khan", nat: "Pakistani", pp: "PK8301221", dob: "1995-09-23" }],
    payMethod: "card", payStatus: "successful", createdDaysAgo: 14,
  });
  await makeBooking({
    user: traveler!, flight: past2, status: "completed", pnr: "AV5R1P",
    pax: [{ fn: "Sarah", ln: "Khan", nat: "Pakistani", pp: "PK8301221", dob: "1995-09-23" }],
    payMethod: "card", payStatus: "successful", createdDaysAgo: 9,
  });
  if (isbIst) await makeBooking({
    user: traveler!, flight: isbIst, status: "cancelled", pnr: "AV3W7X",
    pax: [{ fn: "Sarah", ln: "Khan", nat: "Pakistani", pp: "PK8301221", dob: "1995-09-23" }],
    payMethod: "card", payStatus: "refunded", createdDaysAgo: 6,
  });
  if (dxbMle) await makeBooking({
    user: amara!, flight: dxbMle, status: "confirmed", pnr: "AV8B3C",
    pax: [{ fn: "Amara", ln: "Okafor", nat: "Nigerian", pp: "NG5528190", dob: "1992-07-08" }],
    payMethod: "card", payStatus: "successful", createdDaysAgo: 2,
  });
  if (isbIst) await makeBooking({
    user: daniel!, flight: isbIst, status: "confirmed", pnr: "AV6J9D",
    pax: [{ fn: "Daniel", ln: "Reyes", nat: "Spanish", pp: "ES7714923", dob: "1990-01-15" }],
    payMethod: "card", payStatus: "successful", createdDaysAgo: 4,
  });
  console.log("  ✓ sample bookings, passengers & payments");

  await db.insert(newsletterSubscribers).values([{ email: "traveler@aerovel.demo" }, { email: "wanderlust@example.demo" }]).onConflictDoNothing();
  await db.insert(settings).values({
    key: "platform",
    value: {
      supportEmail: "care@aerovel.demo",
      supportPhone: "+92 42 111 237 685",
      address: "AEROVÉL House, 12 Skyline Boulevard, Lahore",
      notice: "Demonstration platform — flights, fares and payments are simulated.",
    },
  }).onConflictDoNothing();

  console.log("✓ AEROVÉL seed complete.");
  console.log("  Demo traveler: traveler@aerovel.demo / FlyBeyond2025");
  console.log("  Demo admin:    admin@aerovel.demo / AdminBeyond2025");
  await pool.end();
}

main().catch(async (e) => {
  console.error("Seed failed:", e);
  await pool.end();
  process.exit(1);
});