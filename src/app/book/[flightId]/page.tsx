import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import BookingFlow from "@/components/booking/booking-flow";
import { getFlight, getFlightSeats } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { fmtDate, fmtTime } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Complete Your Booking" };

export default async function BookPage({ params, searchParams }: {
  params: Promise<{ flightId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { flightId } = await params;
  const sp = await searchParams;
  const id = parseInt(flightId, 10);
  if (!Number.isFinite(id) || id < 1) notFound();

  const cabin = (typeof sp.cabin === "string" && sp.cabin === "business") ? "business" : "economy";
  const paxRaw = parseInt(typeof sp.pax === "string" ? sp.pax : "1", 10);
  const pax = Number.isFinite(paxRaw) ? Math.min(Math.max(paxRaw, 1), 9) : 1;
  const returnId = parseInt(typeof sp.return === "string" ? sp.return : "0", 10);

  const [flight, user] = await Promise.all([
    getFlight(id, cabin).catch(() => null),
    getCurrentUser(),
  ]);
  if (!flight) notFound();

  const returnFlight = Number.isFinite(returnId) && returnId > 0 ? await getFlight(returnId, cabin).catch(() => null) : null;
  const [seatsOut, seatsRet] = await Promise.all([
    getFlightSeats(flight.id).catch(() => []),
    returnFlight ? getFlightSeats(returnFlight.id).catch(() => []) : Promise.resolve([]),
  ]);

  const departed = new Date(flight.departureAt).getTime() < Date.now() || flight.status === "cancelled";
  if (departed) {
    return (
      <div className="container-x flex min-h-[70vh] items-center justify-center pt-24">
        <div className="card max-w-md p-10 text-center">
          <h1 className="font-display text-2xl text-navy-900">This flight is no longer bookable</h1>
          <p className="mt-3 text-sm text-navy-900/60">
            {flight.flightNumber} on {fmtDate(flight.departureAt)} at {fmtTime(flight.departureAt)} has departed or was cancelled.
          </p>
          <Link href="/flights" className="btn btn-gold mt-6">Find another flight</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <section className="bg-navy-950 pb-8 pt-28">
        <div className="container-x">
          <p className="eyebrow text-gold-300">Booking · {flight.flightNumber}</p>
          <h1 className="mt-3 font-display text-3xl text-white md:text-4xl">
            {flight.origin.city} <span className="italic text-gold-300">to</span> {flight.destination.city}
            {returnFlight && <span className="text-white/60"> · return</span>}
          </h1>
        </div>
      </section>
      <BookingFlow
        flight={flight} returnFlight={returnFlight}
        seatsOut={seatsOut} seatsRet={seatsRet}
        pax={pax} cabin={cabin} user={user}
      />
    </>
  );
}