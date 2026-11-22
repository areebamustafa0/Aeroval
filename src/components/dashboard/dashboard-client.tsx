"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, Ticket, Heart, UserRound, Plane, CalendarClock, CheckCircle2,
  XCircle, ArrowRight, Download, RefreshCw, LogOut, Luggage,
} from "lucide-react";
import { Alert, EmptyState, Field, Modal, Spinner, StatusBadge } from "@/components/ui";
import { DestinationCard } from "@/components/home/sections";
import { cx, money, fmtDate, fmtTime, fmtDur, CABIN_LABEL, todayISO, isoDay, addDays } from "@/lib/format";
import type { FlightDTO, DestinationDTO } from "@/lib/data";
import type { SessionUser } from "@/lib/auth";

export type BookingItem = {
  booking: {
    id: number; pnr: string; status: string; cabinClass: string; totalAmount: number;
    passengerCount: number; createdAt: string; cancelRequestedAt: string | null; returnFlightId: number | null;
  };
  outbound: FlightDTO | null;
  inbound: FlightDTO | null;
};

type Tab = "overview" | "bookings" | "saved" | "profile";

export default function DashboardClient({ user, items, saved, destByCode }: {
  user: SessionUser; items: BookingItem[]; saved: DestinationDTO[];
  destByCode: Record<string, { imageUrl: string; name: string; slug: string }>;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [cancelTarget, setCancelTarget] = useState<BookingItem | null>(null);
  const [reschedTarget, setReschedTarget] = useState<BookingItem | null>(null);
  const [actionMsg, setActionMsg] = useState<{ tone: "success" | "error" | "info"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const now = Date.now();
  const upcoming = items.filter((i) => i.booking.status === "confirmed" && i.outbound && new Date(i.outbound.departureAt).getTime() > now);
  const completed = items.filter((i) => i.booking.status === "completed");
  const cancelled = items.filter((i) => i.booking.status === "cancelled");
  const nextTrip = upcoming[0];

  const doCancel = async () => {
    if (!cancelTarget) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/bookings/${cancelTarget.booking.id}/cancel`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Cancellation failed.");
      setActionMsg({ tone: data.requested ? "info" : "success", text: data.message });
      setCancelTarget(null);
      router.refresh();
    } catch (err) {
      setActionMsg({ tone: "error", text: err instanceof Error ? err.message : "Cancellation failed." });
    } finally { setBusy(false); }
  };

  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.dispatchEvent(new Event("aerovel-auth"));
    router.push("/");
    router.refresh();
  };

  const stats = [
    { label: "Total bookings", value: items.length, icon: Ticket, tone: "text-navy-900" },
    { label: "Upcoming flights", value: upcoming.length, icon: Plane, tone: "text-gold-600" },
    { label: "Completed trips", value: completed.length, icon: CheckCircle2, tone: "text-emerald-600" },
    { label: "Cancelled", value: cancelled.length, icon: XCircle, tone: "text-rose-500" },
  ];

  const tabs: { key: Tab; label: string; icon: typeof Ticket }[] = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "bookings", label: "My Bookings", icon: Ticket },
    { key: "saved", label: "Saved Places", icon: Heart },
    { key: "profile", label: "Profile", icon: UserRound },
  ];

  const BookingCard = ({ item }: { item: BookingItem }) => {
    const b = item.booking;
    const f = item.outbound;
    const canCancel = ["pending", "confirmed"].includes(b.status);
    const canResched = b.status === "confirmed" && !b.returnFlightId && f && new Date(f.departureAt).getTime() > now;
    const img = f ? destByCode[f.destination.code]?.imageUrl : undefined;
    return (
      <div className="card overflow-hidden">
        <div className="flex flex-col sm:flex-row">
          {img && (
            <div className="relative h-32 w-full shrink-0 sm:h-auto sm:w-40">
              <Image src={img} alt={f?.destination.city ?? ""} fill sizes="160px" className="object-cover" />
            </div>
          )}
          <div className="flex-1 p-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-num text-[15px] font-bold tracking-[0.15em] text-navy-900">{b.pnr}</span>
              <StatusBadge status={b.status} />
              {b.cancelRequestedAt && <span className="text-[11px] font-bold text-amber-600">cancellation requested</span>}
              <span className="ml-auto font-num text-[15px] font-bold text-navy-900">{money(b.totalAmount)}</span>
            </div>
            {f ? (
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] text-navy-900/70">
                <span className="font-bold text-navy-900">{f.origin.city} → {f.destination.city}{item.inbound ? " · return" : ""}</span>
                <span className="font-num">{fmtDate(f.departureAt)} · {fmtTime(f.departureAt)}</span>
                <span>{f.airline.name} {f.flightNumber}</span>
                <span>{CABIN_LABEL[b.cabinClass]} · {b.passengerCount} pax</span>
              </div>
            ) : <p className="mt-3 text-sm text-mist">Flight details unavailable.</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`/bookings/${b.pnr}`} className="btn btn-navy btn-sm"><Ticket size={12} /> E-ticket</Link>
              <a href={`/api/bookings/${b.id}/ticket`} className="btn btn-outline btn-sm"><Download size={12} /> PDF</a>
              {canResched && (
                <button onClick={() => { setReschedTarget(item); setActionMsg(null); }} className="btn btn-outline btn-sm"><CalendarClock size={12} /> Reschedule</button>
              )}
              {canCancel && !b.cancelRequestedAt && (
                <button onClick={() => { setCancelTarget(item); setActionMsg(null); }} className="btn btn-outline btn-sm text-rose-600 hover:border-rose-300"><XCircle size={12} /> Cancel</button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <section className="bg-navy-950 pb-10 pt-28">
        <div className="container-x">
          <p className="eyebrow text-gold-300">My AEROVÉL</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <h1 className="font-display text-3xl text-white md:text-4xl">
              Welcome back, <span className="italic text-gold-300">{user.firstName}.</span>
            </h1>
            <Link href="/flights" className="btn btn-gold btn-sm">Book a new flight <ArrowRight size={13} /></Link>
          </div>
          <div className="scrollbar-hide mt-8 flex gap-2 overflow-x-auto">
            {tabs.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)} aria-pressed={tab === t.key}
                className={cx("flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-[12.5px] font-bold transition",
                  tab === t.key ? "bg-gold-400 text-navy-900" : "bg-white/8 text-white/70 hover:bg-white/15")}>
                <t.icon size={14} /> {t.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="container-x py-10">
        {actionMsg && <div className="mb-6"><Alert tone={actionMsg.tone}>{actionMsg.text}</Alert></div>}

        {tab === "overview" && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="card p-5">
                  <s.icon size={20} className={s.tone} />
                  <p className="font-num mt-3 text-3xl font-bold text-navy-900">{s.value}</p>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-mist">{s.label}</p>
                </div>
              ))}
            </div>

            {nextTrip?.outbound ? (
              <div className="relative overflow-hidden rounded-3xl bg-navy-900">
                {destByCode[nextTrip.outbound.destination.code]?.imageUrl && (
                  <Image src={destByCode[nextTrip.outbound.destination.code]!.imageUrl} alt={nextTrip.outbound.destination.city} fill sizes="100vw" className="object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-navy-950/90 via-navy-950/60 to-navy-950/20" />
                <div className="relative z-10 p-8 md:p-12">
                  <p className="eyebrow text-gold-300">Next departure</p>
                  <h2 className="mt-3 font-display text-3xl text-white md:text-4xl">
                    {nextTrip.outbound.origin.city} → {nextTrip.outbound.destination.city}
                  </h2>
                  <p className="mt-2 text-[14px] text-white/75">
                    {fmtDate(nextTrip.outbound.departureAt)} · {fmtTime(nextTrip.outbound.departureAt)} · {nextTrip.outbound.flightNumber} · {fmtDur(nextTrip.outbound.durationMinutes)}
                  </p>
                  <div className="mt-6 flex flex-wrap items-center gap-4">
                    <Link href={`/bookings/${nextTrip.booking.pnr}`} className="btn btn-gold btn-sm">View e-ticket</Link>
                    <span className="font-num text-sm font-bold tracking-[0.2em] text-white/80">PNR {nextTrip.booking.pnr}</span>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState title="No upcoming journeys yet" sub="The world is waiting. Find a fare worthy of your next story."
                action={<Link href="/destinations" className="btn btn-gold btn-sm mt-2">Explore destinations</Link>} />
            )}

            <div>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl text-navy-900">Recent bookings</h2>
                <button onClick={() => setTab("bookings")} className="text-[12.5px] font-bold text-gold-600 hover:underline">View all</button>
              </div>
              <div className="mt-4 space-y-4">
                {items.slice(0, 3).map((i) => <BookingCard key={i.booking.id} item={i} />)}
                {items.length === 0 && <p className="card p-6 text-sm text-mist">Bookings will appear here after your first reservation.</p>}
              </div>
            </div>
          </div>
        )}

        {tab === "bookings" && (
          <div className="space-y-4">
            <h2 className="font-display text-2xl text-navy-900">Booking history</h2>
            {items.length === 0 && <EmptyState title="No bookings yet" sub="Your reservation history will live here — beautifully." action={<Link href="/flights" className="btn btn-gold btn-sm mt-2">Search flights</Link>} />}
            {items.map((i) => <BookingCard key={i.booking.id} item={i} />)}
          </div>
        )}

        {tab === "saved" && (
          <div>
            <h2 className="font-display text-2xl text-navy-900">Saved destinations</h2>
            <p className="mt-2 text-sm text-navy-900/55">Tap the heart on any destination to keep it here.</p>
            {saved.length === 0 ? (
              <div className="mt-6"><EmptyState title="Nothing saved yet" sub="Wander the gallery and heart the places that move you." action={<Link href="/destinations" className="btn btn-gold btn-sm mt-2">Start exploring</Link>} /></div>
            ) : (
              <div className="mt-6 grid auto-rows-[280px] gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {saved.map((d) => <DestinationCard key={d.slug} d={d} canSave />)}
              </div>
            )}
          </div>
        )}

        {tab === "profile" && <ProfileForm user={user} onSignOut={signOut} />}
      </div>

      <Modal open={Boolean(cancelTarget)} onClose={() => setCancelTarget(null)} title="Cancel this booking?">
        {cancelTarget && (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-navy-900/70">
              <span className="font-num font-bold">{cancelTarget.booking.pnr}</span> · {cancelTarget.outbound?.origin.city} → {cancelTarget.outbound?.destination.city}.
              Seats are released immediately and any successful demo payment is marked refunded.
              Within 24 hours of departure, cancellations need team approval.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setCancelTarget(null)} className="btn btn-outline flex-1">Keep booking</button>
              <button onClick={doCancel} disabled={busy} className="btn btn-navy flex-1 bg-rose-600 hover:bg-rose-500">
                {busy ? <Spinner /> : "Cancel booking"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <RescheduleModal item={reschedTarget} onClose={() => setReschedTarget(null)}
        onDone={(msg) => { setActionMsg({ tone: "success", text: msg }); setReschedTarget(null); router.refresh(); }} />
    </>
  );
}

function RescheduleModal({ item, onClose, onDone }: { item: BookingItem | null; onClose: () => void; onDone: (msg: string) => void }) {
  const [date, setDate] = useState(isoDay(addDays(new Date(), 7)));
  const [flights, setFlights] = useState<FlightDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const f = item?.outbound;

  const search = async (d: string) => {
    if (!f) return;
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/flights/search?from=${f.origin.code}&to=${f.destination.code}&date=${d}&cabin=${item!.booking.cabinClass}&pax=${item!.booking.passengerCount}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Search failed.");
      setFlights((data.flights as FlightDTO[]).filter((x) => x.id !== f.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed.");
    } finally { setLoading(false); }
  };

  const pick = async (nf: FlightDTO) => {
    setBusyId(nf.id); setError("");
    try {
      const res = await fetch(`/api/bookings/${item!.booking.id}/reschedule`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flightId: nf.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Reschedule failed.");
      onDone(data.message ?? "Flight changed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reschedule failed.");
    } finally { setBusyId(null); }
  };

  return (
    <Modal open={Boolean(item)} onClose={onClose} title="Reschedule onto a new date" wide>
      {item && f && (
        <div className="space-y-4">
          <p className="text-sm text-navy-900/60">
            Same route ({f.origin.code} → {f.destination.code}), same seat numbers if available. Your booking keeps its PNR.
          </p>
          <div className="flex items-end gap-3">
            <Field label="New departure date">
              <input type="date" className="input" min={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <button onClick={() => search(date)} className="btn btn-navy btn-sm mb-0.5"><RefreshCw size={13} /> Find flights</button>
          </div>
          {error && <Alert tone="error">{error}</Alert>}
          {loading && <div className="flex justify-center py-6"><Spinner className="text-gold-600" /></div>}
          {!loading && flights.length === 0 && <p className="text-sm text-mist">Pick a date and search to see alternative departures.</p>}
          <div className="max-h-72 space-y-2.5 overflow-y-auto">
            {flights.map((x) => (
              <button key={x.id} onClick={() => pick(x)} disabled={busyId !== null}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-navy-900/10 bg-white px-4 py-3 text-left transition hover:border-gold-500">
                <span>
                  <span className="font-num block text-sm font-bold text-navy-900">{fmtTime(x.departureAt)} → {fmtTime(x.arrivalAt)}</span>
                  <span className="block text-[11.5px] text-mist">{x.flightNumber} · {fmtDur(x.durationMinutes)} · {x.seatsLeft} seats</span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="font-num text-sm font-bold text-navy-900">{money(x.price)}</span>
                  {busyId === x.id ? <Spinner className="h-4 w-4" /> : <ArrowRight size={14} className="text-gold-600" />}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}

function ProfileForm({ user, onSignOut }: { user: SessionUser; onSignOut: () => void }) {
  const [form, setForm] = useState({
    firstName: user.firstName, lastName: user.lastName, phone: user.phone,
    nationality: user.nationality, dateOfBirth: user.dateOfBirth,
  });
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      const payload: Record<string, string> = { ...form };
      if (pw.newPassword) { payload.currentPassword = pw.currentPassword; payload.newPassword = pw.newPassword; }
      const res = await fetch("/api/auth/me", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Update failed.");
      setMsg({ tone: "success", text: "Profile updated." });
      setPw({ currentPassword: "", newPassword: "" });
      window.dispatchEvent(new Event("aerovel-auth"));
    } catch (err) {
      setMsg({ tone: "error", text: err instanceof Error ? err.message : "Update failed." });
    } finally { setBusy(false); }
  };

  return (
    <form onSubmit={save} className="grid gap-6 lg:grid-cols-2">
      <div className="card space-y-4 p-6">
        <h2 className="font-display text-xl text-navy-900">Personal details</h2>
        {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
        <div className="grid grid-cols-2 gap-4">
          <Field label="First name"><input className="input" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></Field>
          <Field label="Last name"><input className="input" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></Field>
        </div>
        <Field label="Email (sign-in)"><input className="input bg-ivory" value={user.email} disabled /></Field>
        <Field label="Phone"><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+92 300 0000000" /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nationality"><input className="input" value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} /></Field>
          <Field label="Date of birth"><input className="input" type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} /></Field>
        </div>
        <p className="flex items-center gap-2 text-[11.5px] text-mist"><Luggage size={13} className="text-gold-600" /> These details pre-fill your lead passenger on every booking.</p>
      </div>
      <div className="space-y-6">
        <div className="card space-y-4 p-6">
          <h2 className="font-display text-xl text-navy-900">Change password</h2>
          <Field label="Current password"><input className="input" type="password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} autoComplete="current-password" /></Field>
          <Field label="New password (min 8)"><input className="input" type="password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} autoComplete="new-password" /></Field>
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={busy} className="btn btn-gold flex-1">{busy ? <Spinner /> : "Save changes"}</button>
          <button type="button" onClick={onSignOut} className="btn btn-outline"><LogOut size={14} /> Sign out</button>
        </div>
      </div>
    </form>
  );
}