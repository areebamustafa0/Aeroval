import type { Metadata } from "next";
import Results, { type SearchParams } from "@/components/flights/results";
import { getAirports } from "@/lib/data";
import { isoDay, addDays, todayISO } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Find Flights" };

export default async function FlightsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const get = (k: string, fallback = "") => {
    const v = sp[k];
    return (typeof v === "string" ? v : fallback).toUpperCase().slice(0, 40);
  };
  const getDate = (k: string, fallback: string) => {
    const v = sp[k];
    return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && v >= todayISO() ? v : fallback;
  };
  const tripRaw = typeof sp.trip === "string" ? sp.trip : "oneway";
  const trip: SearchParams["trip"] = tripRaw === "round" ? "round" : tripRaw === "multi" ? "multi" : "oneway";
  const paxNum = parseInt(typeof sp.pax === "string" ? sp.pax : "1", 10);

  const params: SearchParams = {
    trip,
    from: get("from"),
    to: get("to"),
    depart: getDate("depart", isoDay(addDays(new Date(), 14))),
    ret: trip === "round" ? getDate("ret", isoDay(addDays(new Date(), 21))) : undefined,
    from2: get("from2") || undefined,
    to2: get("to2") || undefined,
    depart2: typeof sp.depart2 === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.depart2) ? sp.depart2 : undefined,
    pax: Number.isFinite(paxNum) ? Math.min(Math.max(paxNum, 1), 9) : 1,
    cabin: get("cabin", "economy").toLowerCase() === "business" ? "business" : "economy",
  };

  let airports: Awaited<ReturnType<typeof getAirports>> = [];
  try { airports = await getAirports(); } catch { /* db warming */ }

  return <Results airports={airports} params={params} />;
}