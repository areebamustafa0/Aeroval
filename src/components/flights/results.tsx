"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Plane, BadgeDollarSign, Zap, Clock, SlidersHorizontal, ArrowRight, ArrowLeft,
  Luggage, ChevronDown, Check, RotateCcw,
} from "lucide-react";
import FlightSearchPanel from "@/components/search/flight-search";
import { Alert, EmptyState, FlightCardSkeleton, Modal, Spinner } from "@/components/ui";
import { cx, money, fmtDate, fmtTime, fmtDur, CABIN_LABEL } from "@/lib/format";
import type { AirportDTO, FlightDTO } from "@/lib/data";

export type SearchParams = {
  trip: "round" | "oneway" | "multi";
  from: string; to: string; depart: string; ret?: string;
  from2?: string; to2?: string; depart2?: string;
  pax: number; cabin: string;
};

type Sort = "cheapest" | "fastest" | "earliest";
type Filters = { maxPrice: number; maxDuration: number; stops: "any" | "nonstop"; airlines: string[]; times: string[] };

const TIME_BUCKETS = [
  { key: "morning", label: "Morning", range: "05:00–11:59", test: (h: number) => h >= 5 && h < 12 },
  { key: "afternoon", label: "Afternoon", range: "12:00–16:59", test: (h: number) => h >= 12 && h < 17 },
  { key: "evening", label: "Evening", range: "17:00–21:59", test: (h: number) => h >= 17 && h < 22 },
  { key: "night", label: "Night", range: "22:00–04:59", test: (h: number) => h >= 22 || h < 5 },
];

const depHour = (f: FlightDTO) => new Date(f.departureAt).getHours();
const arrHour = (f: FlightDTO) => new Date(f.arrivalAt).getHours();

function FilterPanel({ flights, filters, setFilters, bounds }: {
  flights: FlightDTO[]; filters: Filters; setFilters: (f: Filters) => void;
  bounds: { price: [number, number]; duration: [number, number] };
}) {
  const airlineNames = [...new Set(flights.map((f) => f.airline.name))];
  const toggle = (key: "airlines" | "times", v: string) => {
    const cur = filters[key];
    setFilters({ ...filters, [key]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] });
  };
  return (
    <div className="space-y-7">
      <div>
        <div className="flex items-center justify-between">
          <span className="label mb-0">Max price</span>
          <span className="font-num text-sm font-bold text-navy-900">{money(filters.maxPrice)}</span>
        </div>
        <input type="range" min={bounds.price[0]} max={bounds.price[1]} value={filters.maxPrice}
          onChange={(e) => setFilters({ ...filters, maxPrice: Number(e.target.value) })}
          className="mt-3 w-full accent-gold-500" aria-label="Maximum price" />
        <div className="font-num flex justify-between text-[11px] text-mist">
          <span>{money(bounds.price[0])}</span><span>{money(bounds.price[1])}</span>
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between">
          <span className="label mb-0">Max duration</span>
          <span className="font-num text-sm font-bold text-navy-900">{fmtDur(filters.maxDuration)}</span>
        </div>
        <input type="range" min={bounds.duration[0]} max={bounds.duration[1]} step={15} value={filters.maxDuration}
          onChange={(e) => setFilters({ ...filters, maxDuration: Number(e.target.value) })}
          className="mt-3 w-full accent-gold-500" aria-label="Maximum duration" />
      </div>
      <div>
        <span className="label">Stops</span>
        <div className="flex gap-2">
          {([["any", "Any"], ["nonstop", "Non-stop"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setFilters({ ...filters, stops: k })}
              className={cx("rounded-full border px-4 py-1.5 text-[12px] font-bold transition",
                filters.stops === k ? "border-navy-900 bg-navy-900 text-gold-300" : "border-navy-900/15 text-navy-900/60 hover:border-gold-500")}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <div>
        <span className="label">Departure & arrival time</span>
        <div className="grid grid-cols-2 gap-2">
          {TIME_BUCKETS.map((t) => (
            <button key={t.key} onClick={() => toggle("times", t.key)} aria-pressed={filters.times.includes(t.key)}
              className={cx("rounded-xl border px-3 py-2 text-left transition",
                filters.times.includes(t.key) ? "border-gold-500 bg-gold-400/15" : "border-navy-900/12 hover:border-gold-400")}>
              <span className="block text-[12px] font-bold text-navy-900">{t.label}</span>
              <span className="font-num block text-[10px] text-mist">{t.range}</span>
            </button>
          ))}
        </div>
      </div>
      {airlineNames.length > 1 && (
        <div>
          <span className="label">Airlines</span>
          <div className="space-y-2">
            {airlineNames.map((a) => (
              <label key={a} className="flex cursor-pointer items-center gap-2.5 text-[13px] font-semibold text-navy-900/80">
                <span className={cx("flex h-4.5 w-4.5 items-center justify-center rounded border transition",
                  filters.airlines.includes(a) ? "border-navy-900 bg-navy-900 text-gold-300" : "border-navy-900/25 bg-white")}>
                  {filters.airlines.includes(a) && <Check size={11} />}
                </span>
                <input type="checkbox" className="sr-only" checked={filters.airlines.includes(a)} onChange={() => toggle("airlines", a)} />
                {a}
              </label>
            ))}
          </div>
        </div>
      )}
      <button onClick={() => setFilters({ maxPrice: bounds.price[1], maxDuration: bounds.duration[1], stops: "any", airlines: [], times: [] })}
        className="btn btn-outline btn-sm w-full"><RotateCcw size={13} /> Reset filters</button>
    </div>
  );
}

function FlightCard({ f, pax, cabin, onSelect, selecting, badge }: {
  f: FlightDTO; pax: number; cabin: string; onSelect: () => void; selecting: boolean; badge?: string;
}) {
  return (
    <motion.article layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      className="aero-flight-result card group p-5 transition-shadow hover:shadow-lift md:p-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex min-w-[180px] items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[12px] font-extrabold text-white shadow-md" style={{ background: f.airline.accent }}>
            {f.airline.code}
          </span>
          <div>
            <p className="text-[14px] font-bold text-navy-900">{f.airline.name}</p>
            <p className="font-num text-[11.5px] text-mist">{f.flightNumber} · {f.aircraft.model}</p>
          </div>
        </div>
        {badge && <span className="rounded-full bg-gold-400/20 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-gold-600">{badge}</span>}
        <div className="ml-auto flex items-center gap-2 text-[11px] font-semibold text-mist">
          <Luggage size={13} className="text-gold-600" />
          {cabin === "business" ? "2 × 32kg checked · 10kg cabin" : "23kg checked · 7kg cabin"}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-5 md:flex-row md:items-center">
        <div className="flex flex-1 items-center gap-3 md:gap-5">
          <div className="text-left">
            <p className="font-num text-2xl font-bold text-navy-900">{fmtTime(f.departureAt)}</p>
            <p className="text-[12px] font-bold text-navy-900/70">{f.origin.code} <span className="hidden font-normal text-mist sm:inline">· {f.origin.city}</span></p>
            <p className="font-num text-[10.5px] text-mist">{fmtDate(f.departureAt)}</p>
          </div>
          <div className="relative flex-1 px-1 text-center">
            <p className="font-num text-[11px] font-semibold text-mist">{fmtDur(f.durationMinutes)}</p>
            <div className="relative mt-1 h-px bg-navy-900/15">
              <span className="absolute -left-0.5 -top-[3px] h-[7px] w-[7px] rounded-full border border-gold-500 bg-white" />
              <Plane size={15} className="absolute -top-[7px] left-1/2 -translate-x-1/2 text-gold-600 transition-transform duration-500 group-hover:translate-x-[calc(-50%+8px)]" />
              <span className="absolute -right-0.5 -top-[3px] h-[7px] w-[7px] rounded-full bg-gold-500" />
            </div>
            <p className="mt-1.5 text-[11px] font-bold text-emerald-600">{f.stops === 0 ? "Non-stop" : `${f.stops} stop${f.stops > 1 ? "s" : ""}`}</p>
          </div>
          <div className="text-right">
            <p className="font-num text-2xl font-bold text-navy-900">{fmtTime(f.arrivalAt)}</p>
            <p className="text-[12px] font-bold text-navy-900/70"><span className="hidden font-normal text-mist sm:inline">{f.destination.city} · </span>{f.destination.code}</p>
            <p className="font-num text-[10.5px] text-mist">{fmtDate(f.arrivalAt)}</p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-5 border-t border-navy-900/8 pt-4 md:w-56 md:flex-col md:items-end md:border-l md:border-t-0 md:pl-6 md:pt-0">
          <div className="text-left md:text-right">
            <p className="font-num text-[26px] font-bold leading-none text-navy-900">{money(f.price)}</p>
            <p className="mt-1 text-[11px] text-mist">per guest · {CABIN_LABEL[cabin]}</p>
            {pax > 1 && <p className="font-num text-[11px] font-semibold text-navy-900/60">{money(f.price * pax)} total</p>}
            <p className={cx("mt-1 text-[11px] font-bold", f.seatsLeft <= 12 ? "text-rose-500" : "text-emerald-600")}>
              {f.seatsLeft} seats left
            </p>
          </div>
          <button onClick={onSelect} disabled={selecting} className="btn btn-gold btn-sm md:w-full">
            {selecting ? <Spinner className="h-4 w-4" /> : <>Select <ArrowRight size={13} /></>}
          </button>
        </div>
      </div>
    </motion.article>
  );
}

export default function Results({ airports, params }: { airports: AirportDTO[]; params: SearchParams }) {
  const router = useRouter();
  const [outbound, setOutbound] = useState<FlightDTO[]>([]);
  const [legTwo, setLegTwo] = useState<FlightDTO[]>([]);
  const [returns, setReturns] = useState<FlightDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [returnLoading, setReturnLoading] = useState(false);
  const [error, setError] = useState("");
  const [stage, setStage] = useState<"outbound" | "return">("outbound");
  const [chosenOut, setChosenOut] = useState<FlightDTO | null>(null);
  const [sort, setSort] = useState<Sort>("cheapest");
  const [filters, setFilters] = useState<Filters | null>(null);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [showSearch, setShowSearch] = useState(!Boolean(params.from && params.to && params.depart));
  const [selectingId, setSelectingId] = useState<number | null>(null);

  const hasSearch = Boolean(params.from && params.to && params.depart);

  const fetchLeg = useCallback(async (from: string, to: string, date: string): Promise<FlightDTO[]> => {
    const res = await fetch(`/api/flights/search?from=${from}&to=${to}&date=${date}&cabin=${params.cabin}&pax=${params.pax}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Search failed.");
    return data.flights as FlightDTO[];
  }, [params.cabin, params.pax]);

  useEffect(() => {
    let live = true;
    setLoading(true); setError(""); setStage("outbound"); setChosenOut(null); setFilters(null);
    (async () => {
      try {
        if (!hasSearch) {
          const res = await fetch(`/api/flights?cabin=${params.cabin}&pax=${params.pax}&limit=24`, { cache: "no-store" });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? "Could not load upcoming flights.");
          if (live) { setOutbound(data.flights as FlightDTO[]); setLegTwo([]); }
          return;
        }
        const one = await fetchLeg(params.from, params.to, params.depart);
        if (!live) return;
        setOutbound(one);
        if (params.trip === "multi" && params.from2 && params.to2 && params.depart2) {
          const two = await fetchLeg(params.from2, params.to2, params.depart2);
          if (live) setLegTwo(two);
        }
      } catch (err) {
        if (live) setError(err instanceof Error ? err.message : "Search failed.");
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => { live = false; };
  }, [params.from, params.to, params.depart, params.from2, params.to2, params.depart2, params.trip, params.cabin, params.pax, fetchLeg, hasSearch]);

  const activeList = stage === "return" ? returns : outbound;

  const bounds = useMemo(() => {
    if (activeList.length === 0) return { price: [0, 2000] as [number, number], duration: [60, 900] as [number, number] };
    const prices = activeList.map((f) => f.price);
    const durs = activeList.map((f) => f.durationMinutes);
    return {
      price: [Math.min(...prices), Math.max(...prices)] as [number, number],
      duration: [Math.min(...durs), Math.max(...durs)] as [number, number],
    };
  }, [activeList]);

  useEffect(() => {
    setFilters({ maxPrice: bounds.price[1], maxDuration: bounds.duration[1], stops: "any", airlines: [], times: [] });
  }, [bounds.price[1], bounds.duration[1], stage]); // eslint-disable-line react-hooks/exhaustive-deps

  const shown = useMemo(() => {
    if (!filters) return activeList;
    const filtered = activeList.filter((f) =>
      f.price <= filters.maxPrice &&
      f.durationMinutes <= filters.maxDuration &&
      (filters.stops === "any" || f.stops === 0) &&
      (filters.airlines.length === 0 || filters.airlines.includes(f.airline.name)) &&
      (filters.times.length === 0 || TIME_BUCKETS.some((t) => filters.times.includes(t.key) && (t.test(depHour(f)) || t.test(arrHour(f)))))
    );
    return [...filtered].sort((a, b) =>
      sort === "cheapest" ? a.price - b.price :
      sort === "fastest" ? a.durationMinutes - b.durationMinutes :
      new Date(a.departureAt).getTime() - new Date(b.departureAt).getTime()
    );
  }, [activeList, filters, sort]);

  const selectOutbound = async (f: FlightDTO) => {
    if (hasSearch && params.trip === "round" && params.ret) {
      setChosenOut(f); setStage("return"); setReturnLoading(true); setError("");
      window.scrollTo({ top: 0, behavior: "smooth" });
      try {
        const rets = await fetchLeg(params.to, params.from, params.ret);
        setReturns(rets);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Return search failed.");
      } finally {
        setReturnLoading(false);
      }
    } else {
      setSelectingId(f.id);
      router.push(`/book/${f.id}?pax=${params.pax}&cabin=${params.cabin}`);
    }
  };

  const selectReturn = (f: FlightDTO) => {
    setSelectingId(f.id);
    router.push(`/book/${chosenOut!.id}?return=${f.id}&pax=${params.pax}&cabin=${params.cabin}`);
  };

  const cheapest = activeList.length ? Math.min(...activeList.map((f) => f.price)) : 0;
  const fastest = activeList.length ? Math.min(...activeList.map((f) => f.durationMinutes)) : 0;

  const sortTabs: { key: Sort; label: string; sub: string; icon: typeof Zap }[] = [
    { key: "cheapest", label: "Cheapest", sub: activeList.length ? `from ${money(cheapest)}` : "—", icon: BadgeDollarSign },
    { key: "fastest", label: "Fastest", sub: activeList.length ? fmtDur(fastest) : "—", icon: Zap },
    { key: "earliest", label: "Earliest", sub: "departure time", icon: Clock },
  ];

  const summary = (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] font-semibold text-white/80">
      {hasSearch ? (
        <>
          <span className="font-num text-lg font-bold text-white">{params.from} <ArrowRight size={14} className="mx-1 inline text-gold-400" /> {params.to}</span>
          <span>{fmtDate(params.depart + "T12:00:00")}</span>
          {params.trip === "round" && params.ret && <span>→ {fmtDate(params.ret + "T12:00:00")}</span>}
        </>
      ) : <span className="text-white/70">Browse upcoming departures from our demo schedule</span>}
      <span>{params.pax} {params.pax === 1 ? "guest" : "guests"}</span>
      <span className="rounded-full border border-gold-400/50 px-3 py-0.5 text-[11px] font-bold uppercase tracking-widest text-gold-300">{CABIN_LABEL[params.cabin]}</span>
      <button onClick={() => setShowSearch((v) => !v)} className="ml-auto flex items-center gap-1.5 text-[12px] font-bold text-gold-300 hover:text-gold-200">
        {hasSearch ? "Modify search" : showSearch ? "Hide search" : "Search a route"} <ChevronDown size={13} className={cx("transition", showSearch && "rotate-180")} />
      </button>
    </div>
  );

  return (
    <>
      <section className="flight-search-hero relative overflow-hidden bg-navy-950 pb-10 pt-28">
        <Image src="/images/flight-islands.svg" alt="" fill priority sizes="100vw" className="flight-search-hero-image object-cover" aria-hidden="true" />
        <div className="flight-search-hero-shade absolute inset-0" />
        <div className="container-x relative z-10">
          <p className="eyebrow text-gold-300">Flight search</p>
          <h1 className="mt-3 font-display text-3xl text-white md:text-4xl">
            {hasSearch ? (stage === "return" ? "Choose your return" : params.trip === "multi" ? "Your multi-city journey" : "Choose your flight") : "Discover upcoming flights"}
          </h1>
          <div className="mt-5">{summary}</div>
          {hasSearch && params.trip === "round" && params.ret && (
            <div className="mt-5 flex items-center gap-3 text-[12px] font-bold">
              <span className={cx("flex items-center gap-2 rounded-full px-4 py-1.5", stage === "outbound" ? "bg-gold-400 text-navy-900" : "bg-white/10 text-white/70")}>
                {chosenOut ? <Check size={13} /> : "1"} Outbound {chosenOut && `· ${chosenOut.flightNumber}`}
              </span>
              <span className="h-px w-8 bg-white/25" />
              <span className={cx("flex items-center gap-2 rounded-full px-4 py-1.5", stage === "return" ? "bg-gold-400 text-navy-900" : "bg-white/10 text-white/50")}>
                2 Return
              </span>
              {stage === "return" && (
                <button onClick={() => { setStage("outbound"); setChosenOut(null); }} className="ml-2 flex items-center gap-1 text-white/60 hover:text-gold-300">
                  <ArrowLeft size={13} /> change outbound
                </button>
              )}
            </div>
          )}
          {showSearch && (
            <div className="mt-6">
              <FlightSearchPanel airports={airports} variant="hero" initial={{ ...params, trip: params.trip }} />
            </div>
          )}
        </div>
      </section>

      <section className="aero-flight-results container-x grid gap-8 py-10 lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block">
          <div className="card sticky top-24 p-6">
            <h2 className="mb-6 flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.24em] text-navy-900">
              <SlidersHorizontal size={14} className="text-gold-600" /> Filters
            </h2>
            {filters && <FilterPanel flights={activeList} filters={filters} setFilters={setFilters} bounds={bounds} />}
          </div>
        </aside>

        <div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="grid flex-1 grid-cols-3 gap-2">
              {sortTabs.map((t) => (
                <button key={t.key} onClick={() => setSort(t.key)} aria-pressed={sort === t.key}
                  className={cx("rounded-2xl border px-3 py-2.5 text-left transition",
                    sort === t.key ? "border-navy-900 bg-navy-900 text-white" : "border-navy-900/12 bg-white hover:border-gold-500")}>
                  <span className="flex items-center gap-1.5 text-[12.5px] font-bold"><t.icon size={13} className={sort === t.key ? "text-gold-300" : "text-gold-600"} /> {t.label}</span>
                  <span className={cx("font-num block text-[10.5px]", sort === t.key ? "text-white/60" : "text-mist")}>{t.sub}</span>
                </button>
              ))}
            </div>
             <button onClick={() => setMobileFilters(true)} className="flights-mobile-filter btn btn-outline btn-sm lg:hidden">
               <SlidersHorizontal size={13} /> Filters
            </button>
          </div>

          <p className="mt-4 text-[12.5px] font-semibold text-mist">
            {loading || returnLoading ? "Searching demo inventory…" : hasSearch
              ? `${shown.length} of ${activeList.length} flights · ${stage === "return" ? "return" : "outbound"} · prices per guest`
              : `${shown.length} of ${activeList.length} upcoming demo flights · prices per guest`}
          </p>

          <div className="mt-4 space-y-4">
            {error && <Alert tone="error">{error}</Alert>}
            {(loading || returnLoading) && Array.from({ length: 4 }).map((_, i) => <FlightCardSkeleton key={i} />)}
            {!loading && !returnLoading && !error && shown.length === 0 && (
              <EmptyState
                title={activeList.length === 0 ? (hasSearch ? "No flights on this date" : "No upcoming flights available") : "No flights match your filters"}
                sub={activeList.length === 0
                  ? (hasSearch ? "Our demo schedule doesn't cover this route/date yet. Try another date, or explore Lahore → Dubai and Islamabad → Istanbul." : "The demo schedule is currently empty. Try searching a specific route or check back shortly.")
                  : "Loosen a filter or two and the perfect flight will reappear."}
                action={<button onClick={() => setShowSearch(true)} className="btn btn-gold btn-sm mt-2">Modify search</button>}
              />
            )}
            {!loading && !returnLoading && shown.map((f, i) => (
              <FlightCard key={f.id} f={f} pax={params.pax} cabin={params.cabin}
                selecting={selectingId === f.id}
                badge={sort === "cheapest" && i === 0 ? "Best price" : sort === "fastest" && i === 0 ? "Fastest" : undefined}
                onSelect={() => (stage === "return" ? selectReturn(f) : selectOutbound(f))} />
            ))}
          </div>

          {params.trip === "multi" && params.from2 && params.to2 && (
            <div className="mt-14">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-900 font-num text-[13px] font-bold text-gold-300">2</span>
                <h2 className="font-display text-2xl text-navy-900">
                  {params.from2} → {params.to2} <span className="text-base text-mist">· {params.depart2 && fmtDate(params.depart2 + "T12:00:00")}</span>
                </h2>
              </div>
              <p className="mt-2 text-[12.5px] text-mist">Each leg of a multi-city trip is booked as its own reservation.</p>
              <div className="mt-5 space-y-4">
                {loading && Array.from({ length: 2 }).map((_, i) => <FlightCardSkeleton key={i} />)}
                {!loading && legTwo.length === 0 && <EmptyState title="No second-leg flights" sub="Try a different date or route for the second leg." />}
                {!loading && legTwo.map((f) => (
                  <FlightCard key={f.id} f={f} pax={params.pax} cabin={params.cabin} selecting={selectingId === f.id}
                    onSelect={() => { setSelectingId(f.id); router.push(`/book/${f.id}?pax=${params.pax}&cabin=${params.cabin}`); }} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <Modal open={mobileFilters} onClose={() => setMobileFilters(false)} title="Filter flights">
        {filters && <FilterPanel flights={activeList} filters={filters} setFilters={setFilters} bounds={bounds} />}
        <button onClick={() => setMobileFilters(false)} className="btn btn-gold mt-6 w-full">Show {shown.length} flights</button>
      </Modal>
    </>
  );
}