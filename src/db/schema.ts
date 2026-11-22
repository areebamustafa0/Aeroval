import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    roleId: integer("role_id")
      .notNull()
      .references(() => roles.id),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    phone: text("phone").default(""),
    nationality: text("nationality").default(""),
    dateOfBirth: text("date_of_birth").default(""),
    resetToken: text("reset_token"),
    resetExpires: timestamp("reset_expires", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [uniqueIndex("users_email_uq").on(t.email)]
);

export const airports = pgTable(
  "airports",
  {
    id: serial("id").primaryKey(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    city: text("city").notNull(),
    country: text("country").notNull(),
    timezone: text("timezone").notNull().default("UTC"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("airports_code_uq").on(t.code)]
);

export const airlines = pgTable(
  "airlines",
  {
    id: serial("id").primaryKey(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    accent: text("accent").notNull().default("#D9C18D"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("airlines_code_uq").on(t.code)]
);

export const aircraft = pgTable("aircraft", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  model: text("model").notNull(),
  manufacturer: text("manufacturer").notNull(),
  businessRows: integer("business_rows").notNull().default(3),
  economyRows: integer("economy_rows").notNull().default(24),
  cruiseSpeedKmh: integer("cruise_speed_kmh").notNull().default(870),
  rangeKm: integer("range_km").notNull().default(6500),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const seats = pgTable(
  "seats",
  {
    id: serial("id").primaryKey(),
    aircraftId: integer("aircraft_id")
      .notNull()
      .references(() => aircraft.id, { onDelete: "cascade" }),
    seatNumber: text("seat_number").notNull(),
    row: integer("row").notNull(),
    letter: text("letter").notNull(),
    cabinClass: text("cabin_class").notNull().default("economy"),
    isExit: boolean("is_exit").notNull().default(false),
    isPremium: boolean("is_premium").notNull().default(false),
    extraPrice: integer("extra_price").notNull().default(0),
  },
  (t) => [uniqueIndex("seats_aircraft_number_uq").on(t.aircraftId, t.seatNumber)]
);

export const routes = pgTable(
  "routes",
  {
    id: serial("id").primaryKey(),
    originId: integer("origin_id")
      .notNull()
      .references(() => airports.id),
    destinationId: integer("destination_id")
      .notNull()
      .references(() => airports.id),
    distanceKm: integer("distance_km").notNull().default(1000),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("routes_pair_uq").on(t.originId, t.destinationId)]
);

export const flights = pgTable(
  "flights",
  {
    id: serial("id").primaryKey(),
    flightNumber: text("flight_number").notNull(),
    airlineId: integer("airline_id")
      .notNull()
      .references(() => airlines.id),
    aircraftId: integer("aircraft_id")
      .notNull()
      .references(() => aircraft.id),
    originId: integer("origin_id")
      .notNull()
      .references(() => airports.id),
    destinationId: integer("destination_id")
      .notNull()
      .references(() => airports.id),
    departureAt: timestamp("departure_at", { withTimezone: true }).notNull(),
    arrivalAt: timestamp("arrival_at", { withTimezone: true }).notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    basePrice: integer("base_price").notNull(),
    stops: integer("stops").notNull().default(0),
    status: text("status").notNull().default("scheduled"),
    gate: text("gate").notNull().default("A1"),
    terminal: text("terminal").notNull().default("1"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("flights_number_departure_uq").on(t.flightNumber, t.departureAt),
    index("flights_route_idx").on(t.originId, t.destinationId),
    index("flights_departure_idx").on(t.departureAt),
  ]
);

export const flightSeats = pgTable(
  "flight_seats",
  {
    id: serial("id").primaryKey(),
    flightId: integer("flight_id")
      .notNull()
      .references(() => flights.id, { onDelete: "cascade" }),
    seatId: integer("seat_id")
      .notNull()
      .references(() => seats.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("available"),
    bookingId: integer("booking_id"),
  },
  (t) => [
    uniqueIndex("flight_seats_uq").on(t.flightId, t.seatId),
    index("flight_seats_flight_idx").on(t.flightId),
    index("flight_seats_booking_idx").on(t.bookingId),
  ]
);

export const bookings = pgTable(
  "bookings",
  {
    id: serial("id").primaryKey(),
    pnr: text("pnr").notNull(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    flightId: integer("flight_id")
      .notNull()
      .references(() => flights.id),
    returnFlightId: integer("return_flight_id").references(() => flights.id),
    cabinClass: text("cabin_class").notNull().default("economy"),
    status: text("status").notNull().default("pending"),
    passengerCount: integer("passenger_count").notNull().default(1),
    baseAmount: integer("base_amount").notNull().default(0),
    taxesAmount: integer("taxes_amount").notNull().default(0),
    seatsAmount: integer("seats_amount").notNull().default(0),
    totalAmount: integer("total_amount").notNull().default(0),
    contactEmail: text("contact_email").notNull().default(""),
    contactPhone: text("contact_phone").notNull().default(""),
    cancelRequestedAt: timestamp("cancel_requested_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("bookings_pnr_uq").on(t.pnr),
    index("bookings_user_idx").on(t.userId),
    index("bookings_flight_idx").on(t.flightId),
  ]
);

export const bookingPassengers = pgTable(
  "booking_passengers",
  {
    id: serial("id").primaryKey(),
    bookingId: integer("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    flightSeatId: integer("flight_seat_id").references(() => flightSeats.id),
    returnFlightSeatId: integer("return_flight_seat_id").references(() => flightSeats.id),
    seatNumber: text("seat_number").notNull().default(""),
    returnSeatNumber: text("return_seat_number").notNull().default(""),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull().default(""),
    phone: text("phone").notNull().default(""),
    dateOfBirth: text("date_of_birth").notNull().default(""),
    nationality: text("nationality").notNull().default(""),
    passportNumber: text("passport_number").notNull().default(""),
  },
  (t) => [index("booking_passengers_booking_idx").on(t.bookingId)]
);

export const payments = pgTable(
  "payments",
  {
    id: serial("id").primaryKey(),
    bookingId: integer("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    method: text("method").notNull().default("card"),
    status: text("status").notNull().default("pending"),
    cardLast4: text("card_last4").notNull().default(""),
    reference: text("reference").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("payments_reference_uq").on(t.reference),
    index("payments_booking_idx").on(t.bookingId),
  ]
);

export const destinations = pgTable(
  "destinations",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    country: text("country").notNull(),
    region: text("region").notNull().default("Asia"),
    airportCode: text("airport_code").notNull().default(""),
    tagline: text("tagline").notNull().default(""),
    description: text("description").notNull().default(""),
    imageUrl: text("image_url").notNull(),
    gallery: jsonb("gallery").$type<string[]>().notNull().default([]),
    attractions: jsonb("attractions").$type<{ name: string; description: string }[]>().notNull().default([]),
    startingPrice: integer("starting_price").notNull().default(499),
    bestTime: text("best_time").notNull().default("Year-round"),
    language: text("language").notNull().default(""),
    currencyName: text("currency_name").notNull().default(""),
    flightTime: text("flight_time").notNull().default(""),
    trending: boolean("trending").notNull().default(false),
    popular: boolean("popular").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("destinations_slug_uq").on(t.slug)]
);

export const newsletterSubscribers = pgTable(
  "newsletter_subscribers",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("newsletter_email_uq").on(t.email)]
);

export const savedDestinations = pgTable(
  "saved_destinations",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    destinationId: integer("destination_id")
      .notNull()
      .references(() => destinations.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("saved_destinations_uq").on(t.userId, t.destinationId)]
);

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<Record<string, unknown>>().notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});