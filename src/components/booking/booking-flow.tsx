"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plane, Check, ArrowRight, ArrowLeft, Users, Armchair, CreditCard, Ticket,
  Luggage, Wifi, UtensilsCrossed, PlugZap, ShieldCheck, Banknote, Lock, Download, LayoutDashboard, RefreshCw,
} from "lucide-react";
import SeatMap from "@/components/booking/seat-map";
import { Alert, Field, Spinner } from "@/components/ui";
import { cx, money, fmtDate, fmtTime, fmtDur, CABIN_LABEL, cabinPrice } from "@/lib/format";
import type { FlightDTO, SeatDTO } from "@/lib/data";
import type { SessionUser } from "@/lib/auth";

type Pax = { firstName: string; lastName: string; email: string; phone: string; dateOfBirth: string; nationality: string; passportNumber: string };
const emptyPax = (): Pax => ({ firstName: "", lastName: "", email: "", phone: "", dateOfBirth: "", nationality: "", passportNumber: "" });

const STEPS = [
  { label: "Flight", icon: Plane },
  { label: "Passengers", icon: Users },
  { label: "Seats", icon: Armchair },
  { label: "Payment", icon: CreditCard },
  { label: "Confirmation", icon: Ticket },
];

function FlightSummary({ f, label }: { f: FlightDTO; label: string }) {
  return (
    <div className="rounded-2xl border border-navy-900/10 bg-white p-4">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-gold-600">{label}</p>
      <div className="mt-2 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full text-[10px] font-extrabold text-white" style={{ background: f.airline.accent }}>{f.airline.code}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-bold text-navy-900">{f.airline.name} · <span className="font-num">{f.flightNumber}</span></p>
          <p className="text-[11px] text-mist">{fmtDate(f.departureAt)} · {f.aircraft.model}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div>
          <p className="font-num text-lg font-bold text-navy-900">{fmtTime(f.departureAt)}</p>
          <p className="text-[11px] font-bold text-mist">{f.origin.code}</p>
        </div>
        <div className="relative h-px flex-1 bg-navy-900/15">
          <Plane size={13} className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-gold-600" />
        </div>
        <div className="text-right">
          <p className="font-num text-lg font-bold text-navy-900">{fmtTime(f.arrivalAt)}</p>
          <p className="text-[11px] font-bold text-mist">{f.destination.code}</p>
        </div>
      </div>
      <p className="mt-2 text-[11px] text-mist">{fmtDur(f.durationMinutes)} · {f.stops === 0 ? "Non-stop" : `${f.stops} stops`} · Terminal {f.terminal}, Gate {f.gate}</p>
    </div>
  );
}

export default function BookingFlow({ flight, returnFlight, seatsOut, seatsRet, pax, cabin, user }: {
  flight: FlightDTO; returnFlight: FlightDTO | null; seatsOut: SeatDTO[]; seatsRet: SeatDTO[];
  pax: number; cabin: string; user: SessionUser | null;
}) {
  const router = useRouter();
  const storageKey = `aerovel-book-${flight.id}-${returnFlight?.id ?? 0}-${pax}-${cabin}`;

  const [step, setStep] = useState(1);
  const [passengers, setPassengers] = useState<Pax[]>(() => Array.from({ length: pax }, (_, i) => ({
    ...emptyPax(),
    ...(i === 0 && user ? { firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone, nationality: user.nationality, dateOfBirth: user.dateOfBirth } : {}),
  })));
  const [contactEmail, setContactEmail] = useState(user?.email ?? "");
  const [contactPhone, setContactPhone] = useState(user?.phone ?? "");
  const [selOut, setSelOut] = useState<number[]>([]);
  const [selRet, setSelRet] = useState<number[]>([]);
  const [seatTab, setSeatTab] = useState<"out" | "ret">("out");
  const [liveSeatsOut, setLiveSeatsOut] = useState(seatsOut);
  const [liveSeatsRet, setLiveSeatsRet] = useState(seatsRet);
  const [method, setMethod] = useState<"card" | "cash">("card");
  const [card, setCard] = useState({ name: "", number: "", expiry: "", cvv: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ pnr: string; id: number; qr: string; total: number; message: string } | null>(null);
  const [hydrated, setHydrated] = useState(false);

  /* preserve progress across refreshes */
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw) {
        const s = JSON.parse(raw);
        if (Array.isArray(s.passengers) && s.passengers.length === pax) setPassengers(s.passengers);
        if (typeof s.contactEmail === "string") setContactEmail(s.contactEmail);
        if (typeof s.contactPhone === "string") setContactPhone(s.contactPhone);
        if (Array.isArray(s.selOut)) setSelOut(s.selOut);
        if (Array.isArray(s.selRet)) setSelRet(s.selRet);
        if (typeof s.step === "number" && s.step >= 1 && s.step <= 2) setStep(s.step);
      }
    } catch { /* fresh start */ }
    setHydrated(true);
  }, [storageKey, pax]);

  useEffect(() => {
    if (!hydrated || result) return;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({ passengers, contactEmail, contactPhone, selOut, selRet, step }));
    } catch { /* storage full */ }
  }, [passengers, contactEmail, contactPhone, selOut, selRet, step, storageKey, hydrated, result]);

  const seatExtras = useMemo(() => {
    const sum = (seats: SeatDTO[], ids: number[]) => seats.filter((s) => ids.includes(s.id)).reduce((a, s) => a + s.extraPrice, 0);
    return sum(liveSeatsOut, selOut) + sum(liveSeatsRet, selRet);
  }, [liveSeatsOut, liveSeatsRet, selOut, selRet]);

  const segments = returnFlight ? [flight, returnFlight] : [flight];
  const base = segments.reduce((a, f) => a + cabinPrice(f.basePrice, cabin), 0) * pax;
  const taxes = Math.round(base * 0.12);
  const total = base + taxes + seatExtras;

  const setPaxField = (i: number, k: keyof Pax, v: string) =>
    setPassengers((ps) => ps.map((p, j) => (j === i ? { ...p, [k]: v } : p)));

  const validatePassengers = () => {
    const e: Record<string, string> = {};
    if (!user) { e.auth = "Please sign in to book — it takes ten seconds."; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contactEmail)) e.contactEmail = "Enter a valid contact email.";
    passengers.forEach((p, i) => {
      if (p.firstName.trim().length < 2) e[`fn${i}`] = "Required";
      if (p.lastName.trim().length < 2) e[`ln${i}`] = "Required";
      if (!p.dateOfBirth) e[`dob${i}`] = "Required";
      else if (new Date(p.dateOfBirth) >= new Date()) e[`dob${i}`] = "Must be in the past";
      if (p.nationality.trim().length < 2) e[`nat${i}`] = "Required";
      if (p.passportNumber.trim().length < 5) e[`pp${i}`] = "Min 5 characters";
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateSeats = () => {
    const e: Record<string, string> = {};
    if (selOut.length !== pax) e.seats = `Choose ${pax} outbound seat${pax > 1 ? "s" : ""}.`;
    if (returnFlight && selRet.length !== pax) e.seatsRet = `Choose ${pax} return seat${pax > 1 ? "s" : ""}.`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validatePayment = () => {
    const e: Record<string, string> = {};
    if (method === "card") {
      if (card.name.trim().length < 3) e.cardName = "Enter the name on the card.";
      if (!/^\d{16}$/.test(card.number.replace(/\s+/g, ""))) e.cardNumber = "Use a 16-digit demo card.";
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(card.expiry)) e.expiry = "MM/YY";
      else {
        const [mm, yy] = card.expiry.split("/").map(Number);
        if (new Date(2000 + (yy ?? 0), mm ?? 1) < new Date()) e.expiry = "Card expired";
      }
      if (!/^\d{3,4}$/.test(card.cvv)) e.cvv = "3–4 digits";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const refreshSeats = async () => {
    try {
      const [a, b] = await Promise.all([
        fetch(`/api/flights/${flight.id}/seats`).then((r) => r.json()),
        returnFlight ? fetch(`/api/flights/${returnFlight.id}/seats`).then((r) => r.json()) : Promise.resolve({ seats: [] }),
      ]);
      setLiveSeatsOut(a.seats); setLiveSeatsRet(b.seats);
      setSelOut((ids) => ids.filter((id) => a.seats.some((s: SeatDTO) => s.id === id && s.status === "available")));
      setSelRet((ids) => ids.filter((id) => b.seats.some((s: SeatDTO) => s.id === id && s.status === "available")));
    } catch { /* keep current view */ }
  };

  const bookingHref = `/book/${flight.id}${returnFlight ? `?return=${returnFlight.id}&` : "?"}pax=${pax}&cabin=${cabin}`;

  /** Surface validation feedback next to the button the user just pressed. */
  const showFeedback = (message: string) => {
    setApiError(message);
    requestAnimationFrame(() => {
      const target = document.getElementById("booking-feedback") ?? document.querySelector(".input-error");
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  const next = () => {
    setApiError("");
    if (step === 1) {
      // Auth first: a signed-out visitor must land on sign-in immediately,
      // instead of being stopped by empty passenger fields with no visible change.
      if (!user) {
        router.push(`/signin?next=${encodeURIComponent(bookingHref)}`);
        return;
      }
      if (!validatePassengers()) {
        showFeedback("Please complete the highlighted passenger details before choosing seats.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!validateSeats()) {
        showFeedback(`Please select ${pax > 1 ? `all ${pax} seats` : "a seat"} on the seat map above before continuing.`);
        return;
      }
      setStep(3);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const pay = async () => {
    if (!validatePayment()) return;
    setBusy(true); setApiError("");
    try {
      const createRes = await fetch("/api/bookings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flightId: flight.id, returnFlightId: returnFlight?.id ?? null, cabin,
          passengers, seatIds: selOut, returnSeatIds: returnFlight ? selRet : [],
          contactEmail, contactPhone,
        }),
      });
      const created = await createRes.json();
      if (createRes.status === 401) { router.push(`/signin?next=${encodeURIComponent(bookingHref)}`); return; }
      if (!createRes.ok) {
        if (createRes.status === 409) { await refreshSeats(); setStep(2); }
        throw new Error(created.error ?? "Could not create the booking.");
      }
      const payRes = await fetch("/api/payments", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: created.booking.id, method,
          cardNumber: card.number, expiry: card.expiry, cvv: card.cvv,
        }),
      });
      const paid = await payRes.json();
      if (!payRes.ok) throw new Error(paid.message ?? paid.error ?? "Payment failed.");
      setResult({ pnr: paid.booking.pnr, id: paid.booking.id, qr: paid.qr, total: paid.booking.totalAmount, message: paid.message });
      setStep(4);
      try { sessionStorage.removeItem(storageKey); } catch { /* ok */ }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const progress = (
    <ol className="flex items-center gap-1 sm:gap-2" aria-label="Booking progress">
      {STEPS.map((s, i) => {
        const state = i === 0 || i < step ? "done" : i === step ? "current" : "todo";
        return (
          <li key={s.label} className="flex flex-1 items-center gap-1 sm:gap-2">
            <button
              type="button"
              disabled={i > step || i === 0 || step === 4}
              onClick={() => i < step && setStep(i)}
              className={cx("flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-xl px-1 py-2 transition sm:flex-row sm:justify-center sm:gap-2",
                state === "current" ? "text-navy-900" : state === "done" ? "text-gold-600 hover:bg-gold-400/10" : "text-mist")}
              aria-current={state === "current" ? "step" : undefined}
            >
              <span className={cx("flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold transition",
                state === "done" ? "border-gold-500 bg-gold-400 text-navy-900" :
                state === "current" ? "border-navy-900 bg-navy-900 text-gold-300" : "border-navy-900/20 bg-white")}>
                {state === "done" ? <Check size={13} /> : <s.icon size={13} />}
              </span>
              <span className="truncate text-[9.5px] font-bold uppercase tracking-wider sm:text-[11px]">{s.label}</span>
            </button>
            {i < STEPS.length - 1 && <span className={cx("hidden h-px w-4 sm:block", i < step ? "bg-gold-500" : "bg-navy-900/15")} />}
          </li>
        );
      })}
    </ol>
  );

  const sidebar = (
    <div className="card sticky top-24 space-y-4 p-6">
      <h3 className="font-display text-lg text-navy-900">Your journey</h3>
      <FlightSummary f={flight} label={returnFlight ? "Outbound" : "Flight"} />
      {returnFlight && <FlightSummary f={returnFlight} label="Return" />}
      <div className="space-y-2 border-t border-navy-900/10 pt-4 text-[13px]">
        <div className="flex justify-between text-navy-900/70">
          <span>{CABIN_LABEL[cabin]} × {pax} guest{pax > 1 ? "s" : ""}{returnFlight ? " · 2 flights" : ""}</span>
          <span className="font-num font-semibold">{money(base)}</span>
        </div>
        <div className="flex justify-between text-navy-900/70"><span>Taxes & fees (12%)</span><span className="font-num font-semibold">{money(taxes)}</span></div>
        <div className="flex justify-between text-navy-900/70"><span>Seat selection</span><span className="font-num font-semibold">{seatExtras ? money(seatExtras) : "Included"}</span></div>
        <div className="flex justify-between border-t border-navy-900/10 pt-3 text-[16px] font-bold text-navy-900">
          <span>Total</span><span className="font-num text-xl">{money(total)}</span>
        </div>
        <p className="text-[10.5px] leading-relaxed text-mist">Demo pricing in USD. No real charge is ever made.</p>
      </div>
      <ul className="space-y-2 border-t border-navy-900/10 pt-4 text-[12px] text-navy-900/60">
        <li className="flex items-center gap-2"><Luggage size={13} className="text-gold-600" /> {cabin === "business" ? "2 × 32kg checked bags" : "23kg checked bag"} included</li>
        <li className="flex items-center gap-2"><UtensilsCrossed size={13} className="text-gold-600" /> Complimentary dining</li>
        <li className="flex items-center gap-2"><Wifi size={13} className="text-gold-600" /> Wi-Fi & entertainment</li>
        <li className="flex items-center gap-2"><PlugZap size={13} className="text-gold-600" /> USB-C power at every seat</li>
        <li className="flex items-center gap-2"><ShieldCheck size={13} className="text-gold-600" /> Free same-route reschedule</li>
      </ul>
    </div>
  );

  return (
    <div className="container-x py-10">
      <div className="card p-3 sm:p-4">{progress}</div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          {apiError && <div id="booking-feedback" className="mb-5"><Alert tone="error">{apiError}</Alert></div>}

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="pax" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.35 }}>
                <h2 className="font-display text-2xl text-navy-900 md:text-3xl">Who&apos;s traveling?</h2>
                <p className="mt-2 text-sm text-navy-900/55">Details are kept as you move between steps — take your time.</p>
                {!user && (
                  <div className="mt-5">
                    <Alert tone="info">
                      You&apos;ll need an account to complete the booking. <Link className="font-bold underline" href={`/signin?next=/book/${flight.id}?pax=${pax}&cabin=${cabin}`}>Sign in</Link> or <Link className="font-bold underline" href="/register">create one</Link> — demo credentials are on the sign-in page.
                    </Alert>
                  </div>
                )}
                <div className="card mt-6 space-y-4 p-6">
                  <h3 className="text-[12px] font-extrabold uppercase tracking-[0.24em] text-gold-600">Contact details</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Contact email" error={errors.contactEmail}>
                      <input className={cx("input", errors.contactEmail && "input-error")} type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="you@example.com" />
                    </Field>
                    <Field label="Contact phone">
                      <input className="input" type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+92 300 0000000" />
                    </Field>
                  </div>
                </div>
                {passengers.map((p, i) => (
                  <div key={i} className="card mt-5 space-y-4 p-6">
                    <h3 className="flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.24em] text-gold-600">
                      <Users size={14} /> Passenger {i + 1} {i === 0 && "(lead traveler)"}
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="First name" error={errors[`fn${i}`]}>
                        <input className={cx("input", errors[`fn${i}`] && "input-error")} value={p.firstName} onChange={(e) => setPaxField(i, "firstName", e.target.value)} placeholder="As on passport" />
                      </Field>
                      <Field label="Last name" error={errors[`ln${i}`]}>
                        <input className={cx("input", errors[`ln${i}`] && "input-error")} value={p.lastName} onChange={(e) => setPaxField(i, "lastName", e.target.value)} placeholder="As on passport" />
                      </Field>
                      <Field label="Date of birth" error={errors[`dob${i}`]}>
                        <input className={cx("input", errors[`dob${i}`] && "input-error")} type="date" max={new Date().toISOString().slice(0, 10)} value={p.dateOfBirth} onChange={(e) => setPaxField(i, "dateOfBirth", e.target.value)} />
                      </Field>
                      <Field label="Nationality" error={errors[`nat${i}`]}>
                        <input className={cx("input", errors[`nat${i}`] && "input-error")} value={p.nationality} onChange={(e) => setPaxField(i, "nationality", e.target.value)} placeholder="e.g. Pakistani" />
                      </Field>
                      <Field label="Passport number" error={errors[`pp${i}`]}>
                        <input className={cx("input", errors[`pp${i}`] && "input-error")} value={p.passportNumber} onChange={(e) => setPaxField(i, "passportNumber", e.target.value.toUpperCase())} placeholder="AB1234567" />
                      </Field>
                      <Field label="Email (optional)">
                        <input className="input" type="email" value={p.email} onChange={(e) => setPaxField(i, "email", e.target.value)} placeholder="For their copy of the ticket" />
                      </Field>
                    </div>
                  </div>
                ))}
                <div className="mt-7 flex justify-between">
                  <Link href="/flights" className="btn btn-outline"><ArrowLeft size={14} /> Back to flights</Link>
                  <button onClick={next} className="btn btn-gold">Choose seats <ArrowRight size={14} /></button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="seats" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.35 }}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display text-2xl text-navy-900 md:text-3xl">Choose your seats</h2>
                    <p className="mt-2 text-sm text-navy-900/55">{flight.aircraft.name} · {CABIN_LABEL[cabin]} cabin · live availability</p>
                  </div>
                  <button onClick={refreshSeats} className="btn btn-outline btn-sm"><RefreshCw size={13} /> Refresh map</button>
                </div>
                {errors.seats && <div className="mt-4"><Alert tone="error">{errors.seats}</Alert></div>}
                {errors.seatsRet && <div className="mt-4"><Alert tone="error">{errors.seatsRet}</Alert></div>}
                {returnFlight && (
                  <div className="mt-5 flex gap-2">
                    {([["out", `Outbound · ${flight.origin.code}→${flight.destination.code}`], ["ret", `Return · ${returnFlight.origin.code}→${returnFlight.destination.code}`]] as const).map(([k, l]) => (
                      <button key={k} onClick={() => setSeatTab(k)}
                        className={cx("rounded-full px-4 py-2 text-[12px] font-bold transition",
                          seatTab === k ? "bg-navy-900 text-gold-300" : "bg-white text-navy-900/60 border border-navy-900/15 hover:border-gold-500")}>
                        {l} {(k === "out" ? selOut : selRet).length}/{pax}
                      </button>
                    ))}
                  </div>
                )}
                <div className="card mt-6 overflow-x-auto p-6">
                  <SeatMap
                    seats={seatTab === "out" || !returnFlight ? liveSeatsOut : liveSeatsRet}
                    cabin={cabin} count={pax}
                    selected={seatTab === "out" || !returnFlight ? selOut : selRet}
                    onChange={seatTab === "out" || !returnFlight ? setSelOut : setSelRet}
                  />
                </div>
                <div className="mt-7 flex justify-between">
                  <button onClick={() => setStep(1)} className="btn btn-outline"><ArrowLeft size={14} /> Passengers</button>
                  <button onClick={next} className="btn btn-gold">Continue to payment <ArrowRight size={14} /></button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="pay" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.35 }}>
                <h2 className="font-display text-2xl text-navy-900 md:text-3xl">Payment, beautifully simple</h2>
                <p className="mt-2 text-sm text-navy-900/55">This is a sandbox checkout — no real money moves, and card details are never stored.</p>
                <div className="mt-6 flex gap-3">
                  {([["card", "Demo card", CreditCard], ["cash", "Pay at airport", Banknote]] as const).map(([k, l, Icon]) => (
                    <button key={k} onClick={() => setMethod(k)} aria-pressed={method === k}
                      className={cx("flex flex-1 items-center justify-center gap-2 rounded-2xl border px-4 py-4 text-[13px] font-bold transition",
                        method === k ? "border-navy-900 bg-navy-900 text-gold-300" : "border-navy-900/15 bg-white text-navy-900/60 hover:border-gold-500")}>
                      <Icon size={16} /> {l}
                    </button>
                  ))}
                </div>
                {method === "card" ? (
                  <div className="card mt-5 space-y-4 p-6">
                    <Alert tone="info">
                      Use demo card <span className="font-num font-bold">4242 4242 4242 4242</span> (any future expiry, any CVV) to succeed —
                      or a card ending <span className="font-num font-bold">0002</span> to see a decline.
                    </Alert>
                    <Field label="Name on card" error={errors.cardName}>
                      <input className={cx("input", errors.cardName && "input-error")} value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} placeholder="AMARA OKAFOR" autoComplete="off" />
                    </Field>
                    <Field label="Card number" error={errors.cardNumber}>
                      <input className={cx("input font-num", errors.cardNumber && "input-error")} inputMode="numeric" value={card.number}
                        onChange={(e) => setCard({ ...card, number: e.target.value.replace(/[^\d]/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ") })}
                        placeholder="4242 4242 4242 4242" autoComplete="off" />
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Expiry (MM/YY)" error={errors.expiry}>
                        <input className={cx("input font-num", errors.expiry && "input-error")} value={card.expiry}
                          onChange={(e) => { let v = e.target.value.replace(/[^\d]/g, "").slice(0, 4); if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2); setCard({ ...card, expiry: v }); }}
                          placeholder="12/28" autoComplete="off" />
                      </Field>
                      <Field label="CVV" error={errors.cvv}>
                        <input className={cx("input font-num", errors.cvv && "input-error")} inputMode="numeric" type="password" value={card.cvv}
                          onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/[^\d]/g, "").slice(0, 4) })} placeholder="•••" autoComplete="off" />
                      </Field>
                    </div>
                    <p className="flex items-center gap-2 text-[11.5px] text-mist"><Lock size={12} /> Only the last 4 digits are kept, for your receipt. Full numbers and CVV are discarded immediately.</p>
                  </div>
                ) : (
                  <div className="card mt-5 p-6">
                    <p className="text-sm leading-relaxed text-navy-900/70">
                      Your seats will be confirmed now and payment of <span className="font-num font-bold">{money(total)}</span> collected
                      at the airport check-in desk. The payment stays <em>pending</em> until an agent confirms it.
                    </p>
                  </div>
                )}
                <div className="mt-7 flex flex-col-reverse justify-between gap-3 sm:flex-row">
                  <button onClick={() => setStep(2)} className="btn btn-outline"><ArrowLeft size={14} /> Seats</button>
                  <button onClick={pay} disabled={busy} className="btn btn-gold sm:min-w-[240px]">
                    {busy ? <><Spinner /> Processing…</> : <><Lock size={14} /> {method === "card" ? `Pay ${money(total)} (demo)` : "Confirm booking"}</>}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 4 && result && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
                <div className="card overflow-hidden text-center">
                  <div className="bg-navy-950 px-8 py-10">
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2, damping: 12 }}
                      className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold-400 text-navy-900">
                      <Check size={30} strokeWidth={3} />
                    </motion.span>
                    <h2 className="mt-5 font-display text-3xl text-white">You&apos;re going to {flight.destination.city}.</h2>
                    <p className="mt-2 text-sm text-white/60">{result.message}</p>
                    <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.3em] text-gold-300">Booking reference</p>
                    <p className="font-num mt-1 text-4xl font-bold tracking-[0.25em] text-white">{result.pnr}</p>
                  </div>
                  <div className="grid items-center gap-6 p-8 sm:grid-cols-[1fr_auto]">
                    <div className="text-left">
                      <p className="text-sm text-navy-900/70">Total {method === "cash" ? "due at airport" : "paid (demo)"}: <span className="font-num text-lg font-bold text-navy-900">{money(result.total)}</span></p>
                      <p className="mt-2 text-[13px] leading-relaxed text-mist">Your e-ticket with QR verification is ready. Download the PDF, print it, or find it anytime in your dashboard.</p>
                      <div className="mt-5 flex flex-wrap gap-3">
                        <Link href={`/bookings/${result.pnr}`} className="btn btn-gold btn-sm"><Ticket size={13} /> View e-ticket</Link>
                        <a href={`/api/bookings/${result.id}/ticket`} className="btn btn-navy btn-sm"><Download size={13} /> Download PDF</a>
                        <Link href="/dashboard" className="btn btn-outline btn-sm"><LayoutDashboard size={13} /> Dashboard</Link>
                      </div>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={result.qr} alt={`QR verification code for booking ${result.pnr}`} className="mx-auto h-36 w-36 rounded-xl border border-navy-900/10" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <aside className={step === 4 ? "hidden" : ""}>{sidebar}</aside>
      </div>
    </div>
  );
}