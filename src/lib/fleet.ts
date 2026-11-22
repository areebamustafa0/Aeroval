import { eq } from "drizzle-orm";
import { db } from "@/db";
import { seats, flightSeats } from "@/db/schema";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Builds a realistic 2-2 business / 3-3 economy seat map for an aircraft. */
export function buildSeatRows(aircraftId: number, businessRows: number, economyRows: number) {
  const rows: {
    aircraftId: number; seatNumber: string; row: number; letter: string;
    cabinClass: string; isExit: boolean; isPremium: boolean; extraPrice: number;
  }[] = [];
  const bizLetters = ["A", "C", "D", "F"];
  const ecoLetters = ["A", "B", "C", "D", "E", "F"];
  for (let r = 1; r <= businessRows; r++) {
    for (const l of bizLetters) {
      rows.push({
        aircraftId, seatNumber: `${r}${l}`, row: r, letter: l,
        cabinClass: "business", isExit: false, isPremium: r === 1, extraPrice: r === 1 ? 45 : 0,
      });
    }
  }
  const exitRowA = businessRows + 1;
  const exitRowB = businessRows + Math.ceil(economyRows / 2);
  for (let i = 0; i < economyRows; i++) {
    const r = exitRowA + i;
    const isExit = r === exitRowA || r === exitRowB;
    const isFront = i < 3;
    for (const l of ecoLetters) {
      rows.push({
        aircraftId, seatNumber: `${r}${l}`, row: r, letter: l,
        cabinClass: "economy", isExit, isPremium: isExit || isFront,
        extraPrice: isExit ? 35 : isFront ? 18 : 0,
      });
    }
  }
  return rows;
}

/** Materializes flight_seats rows for a flight from its aircraft configuration. */
export async function createFlightSeats(tx: Tx | typeof db, flightId: number, aircraftId: number) {
  const config = await tx.select().from(seats).where(eq(seats.aircraftId, aircraftId));
  if (config.length === 0) return 0;
  await tx.insert(flightSeats).values(
    config.map((s) => ({ flightId, seatId: s.id, status: "available" as string, bookingId: null }))
  );
  return config.length;
}