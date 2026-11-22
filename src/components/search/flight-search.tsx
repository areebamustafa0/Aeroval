"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  PlaneTakeoff, PlaneLanding, CalendarDays, Users, Armchair, ArrowLeftRight,
  Search, Minus, Plus, ChevronDown, MapPin, Repeat2, ArrowRight, GitBranch,
} from "lucide-react";
import { cx, addDays, isoDay, todayISO } from "@/lib/format";
import type { AirportDTO } from "@/lib/data";
import { Spinner } from "@/components/ui";

type Trip = "round" | "oneway" | "multi";
type Leg = { from: AirportDTO | null; to: AirportDTO | null; date: string };

const findAirport = (airports: AirportDTO[], code: string) => airports.find((a) => a.code === code) ?? null;

function AirportPicker({ label, value, onChange, airports, exclude, icon: Icon, dark, popKey, openPop, setOpenPop }: {
  label: string; value: AirportDTO | null; onChange: (a: AirportDTO) => void; airports: AirportDTO[];
  exclude?: string; icon: typeof PlaneTakeoff; dark?: boolean;
  popKey: string; openPop: string | null; setOpenPop: (k: string | null) => void;
}) {
  const [q, setQ] = useState("");
  const open = openPop === popKey;
  const list = airports.filter((a) =>
    a.code !== exclude &&
    (q === "" || `${a.city} ${a.code} ${a.name} ${a.country}`.toLowerCase().includes(q.toLowerCase()))
  ).slice(0, 8);

  return (
    <div className="relative" data-pop={popKey}>
      <span className={cx("label", dark && "text-white/50")}>{label}</span>
      <button
        type="button"
        onClick={() => setOpenPop(open ? null : popKey)}
        className={cx(
          "aero-search-control flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition",
          dark ? "border-white/15 bg-white/5 hover:border-gold-400/50" : "border-navy-900/15 bg-white hover:border-gold-500"
        )}
        aria-expanded={open}
      >
        <Icon size={16} className={dark ? "text-gold-300" : "text-gold-600"} />
        <span className="min-w-0 flex-1">
          {value ? (
            <>
              <span className={cx("block truncate text-sm font-bold", dark ? "text-white" : "text-navy-900")}>
                {value.city} <span className="font-num text-gold-500">({value.code})</span>
              </span>
              <span className={cx("block truncate text-[11px]", dark ? "text-white/45" : "text-mist")}>{value.country}</span>
            </>
          ) : (
            <span className={cx("text-sm", dark ? "text-white/45" : "text-mist")}>Select airport</span>
          )}
        </span>
        <ChevronDown size={14} className={cx("shrink-0 transition", open && "rotate-180", dark ? "text-white/40" : "text-mist")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.18 }}
            className={cx("absolute top-full z-40 mt-2 w-full min-w-[260px] overflow-hidden rounded-2xl border border-navy-900/10 bg-white shadow-2xl", popKey === "to" || popKey === "to2" ? "right-0" : "left-0")}
          >
            <div className="flex items-center gap-2 border-b border-navy-900/8 px-3 py-2.5">
              <MapPin size={14} className="text-gold-600" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search city or airport code"
                className="w-full bg-transparent text-sm text-navy-900 outline-none placeholder:text-mist"
                aria-label={`Search ${label} airports`}
              />
            </div>
            <ul className="max-h-60 overflow-y-auto py-1">
              {list.length === 0 && <li className="px-4 py-3 text-sm text-mist">No airports match.</li>}
              {list.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition hover:bg-ivory"
                    onClick={() => { onChange(a); setOpenPop(null); setQ(""); }}
                  >
                    <span>
                      <span className="block text-sm font-semibold text-navy-900">{a.city}</span>
                      <span className="block max-w-[200px] truncate text-[11px] text-mist">{a.name}</span>
                    </span>
                    <span className="font-num rounded-md bg-navy-900 px-2 py-1 text-[11px] font-bold text-gold-300">{a.code}</span>
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FlightSearchPanel({ airports, variant = "hero", initial }: {
  airports: AirportDTO[];
  variant?: "hero" | "page" | "editorial";
  initial?: Partial<{ from: string; to: string; depart: string; ret: string; pax: number; cabin: string; trip: Trip }>;
}) {
  const router = useRouter();
  const dark = variant === "hero";
  const editorial = variant === "editorial";
  const d14 = isoDay(addDays(new Date(), 14));
  const d21 = isoDay(addDays(new Date(), 21));

  const [trip, setTrip] = useState<Trip>(initial?.trip ?? "round");
  const [leg1, setLeg1] = useState<Leg>({
    from: findAirport(airports, initial?.from ?? "LHE"),
    to: findAirport(airports, initial?.to ?? "DXB"),
    date: initial?.depart && initial.depart >= todayISO() ? initial.depart : d14,
  });
  const [leg2, setLeg2] = useState<Leg>({ from: null, to: null, date: isoDay(addDays(new Date(), 28)) });
  const [ret, setRet] = useState(initial?.ret && initial.ret >= todayISO() ? initial.ret : d21);
  const [adults, setAdults] = useState(Math.min(initial?.pax ?? 1, 9));
  const [children, setChildren] = useState(0);
  const [cabin, setCabin] = useState(initial?.cabin === "business" ? "business" : "economy");
  const [openPop, setOpenPop] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [searching, setSearching] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (openPop && !t.closest(`[data-pop="${openPop}"]`)) setOpenPop(null);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [openPop]);

  const pax = adults + children;
  const swap = () => setLeg1((l) => ({ ...l, from: l.to, to: l.from }));

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!leg1.from) e.from = "Choose a departure airport.";
    if (!leg1.to) e.to = "Choose a destination airport.";
    if (leg1.from && leg1.to && leg1.from.code === leg1.to.code) e.to = "Destination must differ from origin.";
    if (!leg1.date) e.date = "Choose a departure date.";
    else if (leg1.date < todayISO()) e.date = "Departure cannot be in the past.";
    if (trip === "round") {
      if (!ret) e.ret = "Choose a return date.";
      else if (ret <= leg1.date) e.ret = "Return must be after departure.";
    }
    if (trip === "multi") {
      if (!leg2.from) e.from2 = "Choose a second-leg origin.";
      if (!leg2.to) e.to2 = "Choose a second-leg destination.";
      if (leg2.from && leg2.to && leg2.from.code === leg2.to.code) e.to2 = "Destination must differ from origin.";
      if (!leg2.date) e.date2 = "Choose a second-leg date.";
      else if (leg2.date < leg1.date) e.date2 = "Second leg must be after the first.";
    }
    if (pax < 1 || pax > 9) e.pax = "1–9 passengers per booking.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSearching(true);
    const p = new URLSearchParams({
      trip, from: leg1.from!.code, to: leg1.to!.code, depart: leg1.date,
      pax: String(pax), cabin,
    });
    if (trip === "round") p.set("ret", ret);
    if (trip === "multi") {
      p.set("from2", leg2.from!.code);
      p.set("to2", leg2.to!.code);
      p.set("depart2", leg2.date);
    }
    router.push(`/flights?${p.toString()}`);
  };

  const dateInput = (label: string, val: string, set: (s: string) => void, min: string, err?: string) => (
    <div>
      <span className={cx("label", dark && "text-white/50")}>{label}</span>
      <div className="relative">
        <CalendarDays size={15} className={cx("pointer-events-none absolute left-3 top-1/2 -translate-y-1/2", dark ? "text-gold-300" : "text-gold-600")} />
        <input
          type="date" value={val} min={min} onChange={(e) => set(e.target.value)}
          aria-label={label}
          className={cx(
            "aero-search-control w-full rounded-xl border py-2.5 pl-9 pr-2 font-num text-sm font-semibold transition [color-scheme:light]",
            dark ? "border-white/15 bg-white/5 text-white [color-scheme:dark]" : "border-navy-900/15 bg-white text-navy-900",
            err && "border-rose-400"
          )}
        />
      </div>
      {err && <p className="mt-1 text-[11px] font-semibold text-rose-400">{err}</p>}
    </div>
  );

  const tabs: { key: Trip; label: string; icon: typeof Repeat2 }[] = [
    { key: "round", label: "Round Trip", icon: Repeat2 },
    { key: "oneway", label: "One Way", icon: ArrowRight },
    { key: "multi", label: "Multi-City", icon: GitBranch },
  ];

  return (
    <div
      ref={rootRef}
      className={cx(
        editorial ? "aero-editorial-search" : "rounded-3xl p-5 md:p-6",
        !editorial && (dark ? "glass shadow-panel" : "card shadow-lift")
      )}
    >
      <div className={cx("flex flex-wrap items-center gap-2", editorial ? "aero-search-tabs" : "mb-5")}>
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTrip(t.key)}
            className={cx(
              "flex items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-bold tracking-wide transition",
              editorial ? (trip === t.key ? "aero-tab-active" : "aero-tab") :
              trip === t.key
                ? "bg-gold-400 text-navy-900 shadow-md shadow-gold-500/30"
                : dark ? "text-white/70 hover:bg-white/10" : "text-navy-900/60 hover:bg-ivory"
            )}
            aria-pressed={trip === t.key}
          >
            <t.icon size={13} /> {t.label}
          </button>
        ))}
        <span className={cx("ml-auto hidden text-[11px] font-semibold uppercase tracking-[0.2em] md:block", dark ? "text-white/35" : "text-mist")}>
          Demo inventory · sample fares
        </span>
      </div>

      <form onSubmit={submit} noValidate>
        <div className={cx(
          "grid gap-3",
          editorial && trip !== "multi" ? "grid-cols-2 xl:grid-cols-[1.15fr_1.15fr_1fr_1fr_.86fr_.86fr_auto] xl:items-end" :
          trip === "multi" ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2 xl:grid-cols-[1.15fr_1.15fr_0.95fr_0.95fr_0.85fr_0.85fr]"
        )}>
          <div className={cx("relative", editorial && trip !== "multi" && "col-span-2 sm:col-span-1")}>
            <AirportPicker dark={dark} label="From" value={leg1.from} airports={airports} exclude={leg1.to?.code}
              onChange={(a) => setLeg1((l) => ({ ...l, from: a }))} icon={PlaneTakeoff}
              popKey="from" openPop={openPop} setOpenPop={setOpenPop} />
            {errors.from && <p className="mt-1 text-[11px] font-semibold text-rose-400">{errors.from}</p>}
            {trip !== "multi" && (
              <button
                type="button" onClick={swap} aria-label="Swap origin and destination"
                className={cx(
                  "absolute z-20 h-8 w-8 items-center justify-center rounded-full border text-xs transition hover:rotate-180",
                  editorial ? "-bottom-4 right-3 flex sm:-right-[22px] sm:bottom-auto sm:top-[38px]" : "-right-[22px] top-[38px] hidden xl:flex",
                  dark ? "border-gold-400/50 bg-navy-900 text-gold-300" : "border-navy-900/15 bg-white text-navy-900 shadow-md"
                )}
                style={{ transitionDuration: "400ms" }}
              >
                <ArrowLeftRight size={13} />
              </button>
            )}
          </div>
          <div className={cx(editorial && trip !== "multi" && "col-span-2 sm:col-span-1")}>
            <AirportPicker dark={dark} label="To" value={leg1.to} airports={airports} exclude={leg1.from?.code}
              onChange={(a) => setLeg1((l) => ({ ...l, to: a }))} icon={PlaneLanding}
              popKey="to" openPop={openPop} setOpenPop={setOpenPop} />
            {errors.to && <p className="mt-1 text-[11px] font-semibold text-rose-400">{errors.to}</p>}
          </div>
          {dateInput("Departure", leg1.date, (s) => setLeg1((l) => ({ ...l, date: s })), todayISO(), errors.date)}
          {trip === "round" && dateInput("Return", ret, setRet, leg1.date || todayISO(), errors.ret)}
          {trip === "oneway" && (
            <div className="hidden xl:block" aria-hidden="true">
              <span className={cx("label", dark && "text-white/50")}>Trip</span>
              <div className={cx("flex h-[46px] items-center rounded-xl border px-3 text-sm font-semibold", dark ? "border-white/10 bg-white/[0.03] text-white/50" : "border-navy-900/10 bg-ivory text-mist")}>
                One way
              </div>
            </div>
          )}

          <div className="relative" data-pop="pax">
            <span className={cx("label", dark && "text-white/50")}>Passengers</span>
            <button
              type="button"
              onClick={() => setOpenPop(openPop === "pax" ? null : "pax")}
              className={cx(
                "aero-search-control flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition",
                dark ? "border-white/15 bg-white/5 hover:border-gold-400/50" : "border-navy-900/15 bg-white hover:border-gold-500"
              )}
              aria-expanded={openPop === "pax"}
            >
              <Users size={16} className={dark ? "text-gold-300" : "text-gold-600"} />
              <span className={cx("flex-1 font-num text-sm font-semibold", dark ? "text-white" : "text-navy-900")}>
                {pax} {pax === 1 ? "Guest" : "Guests"}
              </span>
              <ChevronDown size={14} className={cx("transition", openPop === "pax" && "rotate-180", dark ? "text-white/40" : "text-mist")} />
            </button>
            <AnimatePresence>
              {openPop === "pax" && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                  className="absolute left-0 top-full z-40 mt-2 w-64 rounded-2xl border border-navy-900/10 bg-white p-4 shadow-2xl"
                >
                  {[
                    { label: "Adults", sub: "12+ years", val: adults, set: setAdults, min: 1, max: 9 - children },
                    { label: "Children", sub: "2–11 years", val: children, set: setChildren, min: 0, max: 9 - adults },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm font-bold text-navy-900">{row.label}</p>
                        <p className="text-[11px] text-mist">{row.sub}</p>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <button type="button" aria-label={`Fewer ${row.label}`} disabled={row.val <= row.min}
                          onClick={() => row.set(row.val - 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-navy-900/20 text-navy-900 transition hover:border-gold-500 disabled:opacity-30">
                          <Minus size={12} />
                        </button>
                        <span className="font-num w-5 text-center text-sm font-bold">{row.val}</span>
                        <button type="button" aria-label={`More ${row.label}`} disabled={row.val >= row.max}
                          onClick={() => row.set(row.val + 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-navy-900/20 text-navy-900 transition hover:border-gold-500 disabled:opacity-30">
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <p className="mt-1 border-t border-navy-900/8 pt-2 text-[11px] text-mist">Maximum 9 passengers per booking.</p>
                </motion.div>
              )}
            </AnimatePresence>
            {errors.pax && <p className="mt-1 text-[11px] font-semibold text-rose-400">{errors.pax}</p>}
          </div>

          <div>
            <span className={cx("label", dark && "text-white/50")}>Cabin Class</span>
            <div className="relative">
              <Armchair size={15} className={cx("pointer-events-none absolute left-3 top-1/2 -translate-y-1/2", dark ? "text-gold-300" : "text-gold-600")} />
              <select
                value={cabin} onChange={(e) => setCabin(e.target.value)} aria-label="Cabin class"
                className={cx(
                  "aero-search-control w-full appearance-none rounded-xl border py-2.5 pl-9 pr-8 text-sm font-semibold transition",
                  dark ? "border-white/15 bg-white/5 text-white [&>option]:text-navy-900" : "border-navy-900/15 bg-white text-navy-900"
                )}
              >
                <option value="economy">Economy</option>
                <option value="business">Business</option>
              </select>
              <ChevronDown size={14} className={cx("pointer-events-none absolute right-3 top-1/2 -translate-y-1/2", dark ? "text-white/40" : "text-mist")} />
            </div>
          </div>
          {editorial && trip !== "multi" && (
            <button type="submit" disabled={searching} className="aero-search-submit col-span-2 xl:col-span-1">
              {searching ? <Spinner /> : <><Search size={16} /> <span>SEARCH FLIGHTS</span></>}
            </button>
          )}
        </div>

        {trip === "multi" && (
          <div className="mt-4 grid gap-3 rounded-2xl border border-dashed border-gold-400/40 p-4 sm:grid-cols-2 lg:grid-cols-3">
            <p className={cx("col-span-full text-[11px] font-bold uppercase tracking-[0.2em]", dark ? "text-gold-300" : "text-gold-600")}>
              Second leg — each leg is booked separately
            </p>
            <div>
              <AirportPicker dark={dark} label="From (leg 2)" value={leg2.from} airports={airports} exclude={leg2.to?.code}
                onChange={(a) => setLeg2((l) => ({ ...l, from: a }))} icon={PlaneTakeoff}
                popKey="from2" openPop={openPop} setOpenPop={setOpenPop} />
              {errors.from2 && <p className="mt-1 text-[11px] font-semibold text-rose-400">{errors.from2}</p>}
            </div>
            <div>
              <AirportPicker dark={dark} label="To (leg 2)" value={leg2.to} airports={airports} exclude={leg2.from?.code}
                onChange={(a) => setLeg2((l) => ({ ...l, to: a }))} icon={PlaneLanding}
                popKey="to2" openPop={openPop} setOpenPop={setOpenPop} />
              {errors.to2 && <p className="mt-1 text-[11px] font-semibold text-rose-400">{errors.to2}</p>}
            </div>
            {dateInput("Departure (leg 2)", leg2.date, (s) => setLeg2((l) => ({ ...l, date: s })), leg1.date || todayISO(), errors.date2)}
          </div>
        )}

        {(!editorial || trip === "multi") && (
          <div className="mt-5 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className={cx("text-[12px]", dark ? "text-white/45" : "text-mist")}>
              {trip === "round" ? "Outbound and return are combined into one elegant booking." : trip === "multi" ? "Search two legs, then book each one in a tap." : "Simple one-way journeys, beautifully done."}
            </p>
            <button type="submit" disabled={searching} className={editorial ? "aero-search-submit" : "btn btn-gold sm:min-w-[210px]"}>
              {searching ? <Spinner /> : <><Search size={15} /> Search Flights</>}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}