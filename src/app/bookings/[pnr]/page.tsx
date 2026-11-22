import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { Plane, Download, LayoutDashboard, Luggage, Wifi, UtensilsCrossed } from "lucide-react";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getBookingDetail, ticketQr } from "@/lib/booking";
import { StatusBadge } from "@/components/ui";
import PrintButton from "@/components/ticket-actions";
import { BrandMark } from "@/components/site/nav";
import { money, fmtDateLong, fmtTime, fmtDur, CABIN_LABEL } from "@/lib/format";
import type { FlightDTO } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your E-Ticket" };

function Segment({ f, seats, cabin, label }: { f: FlightDTO; seats: string; cabin: string; label: string }) {
  return (
    <div className="grid gap-0 md:grid-cols-[1fr_240px]">
      <div className="p-7 md:p-9">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-gold-600">{label}</p>
          <p className="font-num text-[12px] font-bold text-mist">{f.airline.name} · {f.flightNumber} · {f.aircraft.model}</p>
        </div>
        <div className="mt-5 flex items-center gap-5">
          <div>
            <p className="font-num text-4xl font-bold text-navy-900 md:text-5xl">{f.origin.code}</p>
            <p className="mt-1 text-[13px] font-semibold text-navy-900/60">{f.origin.city}</p>
            <p className="font-num text-lg font-bold text-gold-600">{fmtTime(f.departureAt)}</p>
          </div>
          <div className="relative flex-1 px-2 text-center">
            <p className="font-num text-[11px] font-semibold text-mist">{fmtDur(f.durationMinutes)}</p>
            <div className="relative mt-2 h-px bg-navy-900/20">
              <span className="absolute -left-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-gold-500 bg-white" />
              <Plane size={18} className="absolute -top-[9px] left-1/2 -translate-x-1/2 text-gold-600" />
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-gold-500" />
            </div>
            <p className="mt-2 text-[11px] font-bold text-emerald-600">{f.stops === 0 ? "Non-stop" : `${f.stops} stops`}</p>
          </div>
          <div className="text-right">
            <p className="font-num text-4xl font-bold text-navy-900 md:text-5xl">{f.destination.code}</p>
            <p className="mt-1 text-[13px] font-semibold text-navy-900/60">{f.destination.city}</p>
            <p className="font-num text-lg font-bold text-gold-600">{fmtTime(f.arrivalAt)}</p>
          </div>
        </div>
        <p className="mt-5 text-[13.5px] font-semibold text-navy-900">{fmtDateLong(f.departureAt)}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-[12px] sm:grid-cols-4">
          {[["Cabin", CABIN_LABEL[cabin] ?? cabin], ["Seats", seats], ["Terminal", f.terminal], ["Gate", f.gate]].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-ivory px-3 py-2.5">
              <p className="text-[9.5px] font-extrabold uppercase tracking-[0.2em] text-mist">{k}</p>
              <p className="font-num mt-0.5 text-[14px] font-bold text-navy-900">{v}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-[11.5px] text-navy-900/55">
          <span className="flex items-center gap-1.5"><Luggage size={12} className="text-gold-600" /> {cabin === "business" ? "2 × 32kg" : "23kg"} checked</span>
          <span className="flex items-center gap-1.5"><UtensilsCrossed size={12} className="text-gold-600" /> Dining included</span>
          <span className="flex items-center gap-1.5"><Wifi size={12} className="text-gold-600" /> Wi-Fi on board</span>
        </div>
      </div>
      <div className="relative border-t-2 border-dashed border-navy-900/15 bg-ivory/60 p-7 md:border-l-2 md:border-t-0">
        <span className="absolute -left-3 -top-3 hidden h-6 w-6 rounded-full bg-ivory md:block" aria-hidden="true" />
        <p className="text-[9.5px] font-extrabold uppercase tracking-[0.24em] text-mist">Boarding stub</p>
        <p className="font-num mt-2 text-2xl font-bold tracking-[0.18em] text-navy-900">{f.origin.code}→{f.destination.code}</p>
        <p className="mt-1 text-[12px] font-semibold text-navy-900/60">{fmtTime(f.departureAt)} · {fmtDateLong(f.departureAt).split(",")[0]}</p>
        <p className="mt-3 text-[12px] text-navy-900/60">Seats <span className="font-num font-bold text-navy-900">{seats}</span></p>
        <p className="mt-1 text-[12px] text-navy-900/60">Cabin <span className="font-bold text-navy-900">{CABIN_LABEL[cabin]}</span></p>
        <p className="mt-4 text-[10px] leading-relaxed text-mist">Boarding closes 45 minutes before departure. Demo ticket — not valid for real travel.</p>
      </div>
    </div>
  );
}

export default async function TicketPage({ params }: { params: Promise<{ pnr: string }> }) {
  const { pnr } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/signin?next=/bookings/${encodeURIComponent(pnr)}`);

  const rows = await db.select().from(bookings).where(eq(bookings.pnr, pnr.toUpperCase())).limit(1).catch(() => []);
  const b = rows[0];
  if (!b || (b.userId !== user.id && user.role !== "admin")) notFound();

  const detail = await getBookingDetail(b.id, user);
  const qr = await ticketQr(b.pnr);
  const { outbound, inbound, passengers, payments } = detail;
  if (!outbound) notFound();
  const pay = payments[0];

  return (
    <div className="bg-ivory pb-20">
      <section className="no-print bg-navy-950 pb-10 pt-28">
        <div className="container-x flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="eyebrow text-gold-300">Digital e-ticket</p>
            <h1 className="mt-3 font-display text-3xl text-white md:text-4xl">Bon voyage, {passengers[0]?.firstName ?? user.firstName}.</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={`/api/bookings/${b.id}/ticket`} className="btn btn-gold btn-sm"><Download size={13} /> Download PDF</a>
            <PrintButton />
            <Link href="/dashboard" className="btn btn-ghost-light btn-sm"><LayoutDashboard size={13} /> Dashboard</Link>
          </div>
        </div>
      </section>

      <div className="container-x mt-10">
        <div className="print-ticket mx-auto max-w-4xl overflow-hidden rounded-3xl border border-navy-900/10 bg-white shadow-lift">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-navy-950 px-7 py-6 md:px-9">
            <BrandMark />
            <div className="text-right">
              <p className="text-[9.5px] font-extrabold uppercase tracking-[0.3em] text-white/50">Booking reference</p>
              <p className="font-num text-2xl font-bold tracking-[0.25em] text-gold-300">{b.pnr}</p>
            </div>
          </div>
          <div className="h-1 bg-gradient-to-r from-gold-300 via-gold-500 to-gold-300" />

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-navy-900/8 px-7 py-4 md:px-9">
            <div className="flex items-center gap-3">
              <StatusBadge status={b.status} />
              {pay && <StatusBadge status={pay.status} />}
              {b.cancelRequestedAt && <span className="text-[11px] font-bold text-amber-600">Cancellation under review</span>}
            </div>
            <p className="text-[12.5px] text-navy-900/60">
              Total <span className="font-num font-bold text-navy-900">{money(b.totalAmount)}</span>
              {pay?.method === "card" && pay.cardLast4 && <span className="font-num"> · card •••• {pay.cardLast4}</span>}
              {pay?.method === "cash" && <span> · pay at airport</span>}
            </p>
          </div>

          <Segment f={outbound} cabin={b.cabinClass} label={inbound ? "Outbound segment" : "Flight segment"}
            seats={passengers.map((p) => p.seatNumber).join(", ")} />
          {inbound && (
            <div className="border-t border-navy-900/10">
              <Segment f={inbound} cabin={b.cabinClass} label="Return segment"
                seats={passengers.map((p) => p.returnSeatNumber).join(", ")} />
            </div>
          )}

          <div className="grid gap-6 border-t border-navy-900/10 px-7 py-7 md:grid-cols-[1fr_auto] md:px-9">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-mist">Passengers</p>
              <ul className="mt-3 space-y-2.5">
                {passengers.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[13.5px]">
                    <span className="font-num font-bold uppercase text-navy-900">{p.lastName}/{p.firstName}</span>
                    <span className="text-mist">Seat <span className="font-num font-bold text-navy-900">{p.seatNumber}{p.returnSeatNumber ? ` / ${p.returnSeatNumber}` : ""}</span></span>
                    <span className="text-mist">{p.nationality}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 max-w-md text-[10.5px] leading-relaxed text-mist">
                This is a demonstration e-ticket issued by the AEROVÉL sample platform. Flights, fares and payments are simulated.
                The QR code contains only a non-sensitive verification reference.
              </p>
            </div>
            <div className="text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt={`QR verification for ${b.pnr}`} className="mx-auto h-36 w-36 rounded-xl border border-navy-900/10" />
              <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-mist">Scan to verify</p>
            </div>
          </div>
        </div>

        <div className="no-print mx-auto mt-8 flex max-w-4xl flex-wrap justify-center gap-3">
          <Link href="/flights" className="btn btn-navy btn-sm">Book another journey</Link>
          <Link href="/destinations" className="btn btn-outline btn-sm">Keep exploring</Link>
        </div>
      </div>
    </div>
  );
}