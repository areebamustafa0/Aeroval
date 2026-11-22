"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { animate, useInView } from "framer-motion";
import { ArrowRight, ArrowUpRight, MousePointerClick, Armchair, Globe, Luggage, BadgeDollarSign, ShieldCheck, CalendarClock, Ticket, Headphones } from "lucide-react";
import { Reveal, SectionHead, Spotlight } from "@/components/ui";
import SaveButton from "@/components/save-button";
import NewsletterForm from "@/components/site/newsletter-form";
import { IMG, destinationImage } from "@/lib/images";
import { EASE } from "@/lib/anim";
import { money, fmtDate, cx } from "@/lib/format";
import type { DestinationDTO, FlightDTO, NetworkStats } from "@/lib/data";

/* ---------------- animated counters ---------------- */
function CountUp({ to, decimals = 0, suffix = "" }: { to: number; decimals?: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, { duration: 1.8, ease: EASE, onUpdate: (v) => setVal(v) });
    return () => controls.stop();
  }, [inView, to]);
  return <span ref={ref}>{val.toFixed(decimals)}{suffix}</span>;
}

export function CountersStrip({ stats }: { stats: NetworkStats | null }) {
  const items = [
    { to: stats?.destinations ?? 12, decimals: 0, suffix: "", label: "Curated destinations" },
    { to: stats?.flights ?? 400, decimals: 0, suffix: "+", label: "Scheduled demo flights" },
    { to: stats?.airports ?? 17, decimals: 0, suffix: "", label: "Airports served" },
    { to: 98.2, decimals: 1, suffix: "%", label: "On-time performance*" },
  ];
  return (
    <section className="container-x relative z-10 pb-16 pt-2">
      <div className="grid grid-cols-2 gap-y-10 border-t border-white/[0.08] pt-12 md:grid-cols-4">
        {items.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.09} className="text-center">
            <p className="font-num text-[2.6rem] font-medium leading-none tracking-tight text-gold-gradient md:text-[3rem]">
              <CountUp to={s.to} decimals={s.decimals} suffix={s.suffix} />
            </p>
            <p className="mt-4 text-[9.5px] font-medium uppercase tracking-[0.26em] text-white/42">{s.label}</p>
          </Reveal>
        ))}
      </div>
      <p className="mt-10 text-center text-[9.5px] text-white/22">*Illustrative figures for this demonstration platform.</p>
    </section>
  );
}

/* ---------------- destination gallery ---------------- */
export function DestinationCard({ d, tall, canSave }: { d: DestinationDTO; tall?: boolean; canSave?: boolean }) {
  return (
    <article
      className={cx(
        "card-lux group relative block h-full w-full overflow-hidden rounded-3xl border border-white/10 bg-navy-900 shadow-panel",
        tall ? "min-h-[420px]" : "min-h-[240px]"
      )}
    >
      <Image
        src={destinationImage(d.slug, d.imageUrl)} alt={`${d.name}, ${d.country}`} fill
        sizes="(max-width: 768px) 100vw, 50vw"
        className="photo object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.07]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-navy-950/94 via-navy-950/26 to-navy-950/10" />
      <div className="absolute inset-0 bg-gradient-to-tr from-gold-500/0 via-transparent to-transparent opacity-0 transition-all duration-[900ms] group-hover:from-gold-500/14 group-hover:opacity-100" />
      <Link href={`/destinations/${d.slug}`} aria-label={`Explore ${d.name}`} className="absolute inset-0 z-10 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-gold-300" />
      {canSave && d.id > 0 && <SaveButton destinationId={d.id} className="absolute right-4 top-4 z-20" />}
      <span className="absolute left-5 top-5 rounded-full border border-white/[0.18] bg-navy-950/30 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.24em] text-white/80 backdrop-blur-md">
        {d.country}
      </span>
      <div className="absolute inset-x-0 bottom-0 p-6 md:p-7">
        <div className="flex items-end justify-between gap-3">
          <h3 className={cx("font-display font-medium text-white", tall ? "display-md" : "text-[1.6rem] leading-tight")}>{d.name}</h3>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/30 text-white transition-all duration-500 group-hover:border-gold-400 group-hover:bg-gold-400 group-hover:text-navy-900">
            <ArrowUpRight size={16} className="transition-transform duration-500 group-hover:rotate-45" />
          </span>
        </div>
        <div className="grid grid-rows-[0fr] transition-all duration-500 ease-out group-hover:grid-rows-[1fr]">
          <p className="overflow-hidden text-[13px] leading-relaxed text-white/68">
            <span className="block pt-2.5">{d.tagline}</span>
          </p>
        </div>
        <div className="mt-3.5 flex items-baseline gap-2 border-t border-white/[0.12] pt-3.5">
          <span className="text-[9.5px] font-semibold uppercase tracking-[0.24em] text-white/48">from</span>
          <span className="font-num text-[17px] font-medium tracking-tight text-gold-300">{money(d.startingPrice)}</span>
        </div>
      </div>
    </article>
  );
}

export function DestinationGallery({ destinations }: { destinations: DestinationDTO[] }) {
  const six = destinations.slice(0, 6);
  return (
    <section id="destinations" className="scroll-mt-24 section">
      <div className="container-x">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHead
            eyebrow="Explore the world"
            title={<>Where will your next <span className="italic text-gold-600">story</span> begin?</>}
            sub="Explore extraordinary places and discover journeys worth remembering."
          />
          <Reveal delay={0.15}>
            <Link href="/destinations" className="btn btn-outline">View all destinations <ArrowRight size={14} /></Link>
          </Reveal>
        </div>
        <div className="mt-12 grid auto-rows-[250px] grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-12">
          {six.map((d, i) => (
            <Reveal
              key={d.slug} delay={0.06 * i}
              className={cx(
                i === 0 && "sm:col-span-2 md:col-span-7 md:row-span-2",
                (i === 1 || i === 2) && "md:col-span-5",
                i >= 3 && "md:col-span-4",
                i === 3 && "sm:col-span-2 md:col-span-4"
              )}
            >
              <DestinationCard d={d} tall={i === 0} canSave />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- offers ---------------- */
export type Offer = { flight: FlightDTO | null; destination: DestinationDTO };

export function Offers({ offers }: { offers: Offer[] }) {
  return (
    <section className="bg-white section-tight">
      <div className="container-x">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHead
            eyebrow="Exclusive flight offers"
            title={<>Extraordinary journeys. <span className="italic text-gold-600">Exceptional fares.</span></>}
            sub="Hand-picked sample fares from our demo inventory — refreshed as seats are booked."
          />
          <Reveal delay={0.15}><Link href="/deals" className="btn btn-outline">All flight deals <ArrowRight size={14} /></Link></Reveal>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {offers.map((o, i) => (
            <Reveal key={o.destination.slug} delay={0.06 * i}>
              <article className="card card-lux group overflow-hidden transition-all duration-500 hover:-translate-y-1.5 hover:shadow-lift">
                <div className="relative h-48 overflow-hidden">
                  <Image src={o.destination.imageUrl} alt={o.destination.name} fill sizes="(max-width:640px) 100vw, 25vw"
                    className="photo object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.06]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-950/78 via-navy-950/18 to-transparent" />
                  <span className="absolute left-4 top-4 rounded-full border border-gold-400/40 bg-navy-950/40 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-gold-200 backdrop-blur-md">
                    {i === 0 ? "Best fare" : "Limited seats"}
                  </span>
                  <p className="absolute bottom-4 left-5 display-sm text-white">{o.destination.name}</p>
                </div>
                <div className="p-6">
                  {o.flight ? (
                    <>
                      <div className="flex items-center justify-between font-num text-sm font-bold text-navy-900">
                        <span>{o.flight.origin.code}</span>
                        <span className="relative mx-2 h-px flex-1 bg-navy-900/15">
                          <ArrowRight size={13} className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-gold-600" />
                        </span>
                        <span>{o.flight.destination.code}</span>
                      </div>
                      <p className="mt-1.5 text-[12px] text-mist">
                        {o.flight.origin.city} → {o.flight.destination.city} · {fmtDate(o.flight.departureAt)}
                      </p>
                      <p className="mt-1 text-[12px] font-semibold text-navy-900/60">
                        {o.flight.airline.name} · <span className="font-num">{o.flight.flightNumber}</span>
                      </p>
                      <div className="mt-5 flex items-end justify-between border-t border-navy-900/[0.08] pt-4">
                        <div>
                          <p className="text-[9.5px] font-semibold uppercase tracking-[0.2em] text-mist">from</p>
                          <p className="font-num mt-1 text-[1.6rem] font-medium leading-none tracking-tight text-navy-900">{money(o.flight.price)}</p>
                          <p className="mt-1.5 text-[11px] font-semibold text-emerald-600">{o.flight.seatsLeft} seats left</p>
                        </div>
                        <Link href={`/book/${o.flight.id}?pax=1&cabin=economy`} className="btn btn-navy btn-sm">View Flight</Link>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-navy-900/60">Flights to {o.destination.name} from {money(o.destination.startingPrice)}.</p>
                      <Link href={`/flights?to=${o.destination.airportCode}`} className="btn btn-navy btn-sm mt-4">View Flights</Link>
                    </>
                  )}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- experience ---------------- */
export function Experience() {
  const features = [
    { icon: MousePointerClick, title: "Seamless Booking", sub: "Five elegant steps from inspiration to e-ticket." },
    { icon: Armchair, title: "Exceptional Comfort", sub: "Choose your perfect seat on an interactive cabin map." },
    { icon: Globe, title: "Beautiful Destinations", sub: "Twelve destinations, curated like a travel magazine." },
    { icon: Luggage, title: "Effortless Management", sub: "Reschedule, cancel and download tickets in a tap." },
  ];
  return (
    <section className="relative overflow-hidden section">
      <Image src={IMG.cabinBright} alt="Sunlit premium aircraft cabin" fill sizes="100vw" className="photo-deep object-cover" />
      <div className="absolute inset-0 bg-navy-950/80" />
      <div className="container-x relative z-10">
        <SectionHead
          tone="light" eyebrow="The AEROVÉL experience"
          title={<>More than a flight. <span className="italic text-gold-300">An experience.</span></>}
          sub="Every detail is considered — from the first search to the moment your boarding pass appears."
        />
        <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={0.1 * i}>
              <div className="group">
                <span className="flex h-13 w-13 items-center justify-center rounded-2xl border border-gold-400/40 bg-gold-400/10 p-3.5 text-gold-300 transition group-hover:bg-gold-400 group-hover:text-navy-900">
                  <f.icon size={22} />
                </span>
                <h3 className="mt-5 font-display text-xl text-white">{f.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-white/60">{f.sub}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.3} className="mt-12">
          <Link href="/about" className="btn btn-ghost-light">Discover our story <ArrowRight size={14} /></Link>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- why us ---------------- */
export function WhyUs() {
  const items = [
    { icon: MousePointerClick, title: "Easy & convenient booking", sub: "A refined five-step flow that remembers everything as you go." },
    { icon: BadgeDollarSign, title: "Transparent pricing", sub: "Fare, taxes and seat extras itemized before you ever pay." },
    { icon: ShieldCheck, title: "Secure booking process", sub: "Hashed credentials, JWT sessions and transactional seat locking." },
    { icon: CalendarClock, title: "Simple management", sub: "Cancel eligible trips or reschedule onto the same route in moments." },
    { icon: Ticket, title: "Digital tickets", sub: "Beautiful e-tickets with QR verification, PDF download and print." },
    { icon: Headphones, title: "Responsive care", sub: "A support experience designed for every device you travel with." },
  ];
  return (
    <section className="section-tight">
      <div className="container-x">
        <SectionHead center eyebrow="Why choose AEROVÉL"
          title={<>Travel, <span className="italic text-gold-600">elevated</span> at every step</>}
          sub="Six quiet promises that make the extraordinary feel effortless." />
        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((f, i) => (
            <Reveal key={f.title} delay={0.05 * i} className="h-full">
              <Spotlight className="card card-lux group relative h-full overflow-hidden p-8 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-lift">
                <span aria-hidden="true" className="absolute inset-x-0 top-0 h-px scale-x-0 bg-gradient-to-r from-transparent via-gold-400 to-transparent transition-transform duration-700 group-hover:scale-x-100" />
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-900 text-gold-300 transition duration-500 group-hover:bg-gold-400 group-hover:text-navy-900">
                  <f.icon size={18} />
                </span>
                <h3 className="mt-6 text-[15px] font-bold leading-snug text-navy-900">{f.title}</h3>
                <p className="lede-sm mt-2.5 text-navy-900/55">{f.sub}</p>
              </Spotlight>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- newsletter band ---------------- */
export function NewsletterBand() {
  return (
    <section className="relative overflow-hidden section-tight">
      <Image src={IMG.wingSunset} alt="Aircraft wing above a sunset sea of clouds" fill sizes="100vw" className="photo object-cover" />
      <div className="absolute inset-0 bg-navy-950/70" />
      <div className="container-x relative z-10 grid items-center gap-10 lg:grid-cols-2">
        <SectionHead tone="light" eyebrow="Stay inspired"
          title={<>Let the world <span className="italic text-gold-300">come to you.</span></>}
          sub="Discover beautiful destinations, exclusive travel offers and inspiration for your next journey." />
        <Reveal delay={0.15}><NewsletterForm /></Reveal>
      </div>
    </section>
  );
}