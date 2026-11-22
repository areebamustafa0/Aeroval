import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight, CalendarDays, Languages, Coins, Clock, MapPin, Plane } from "lucide-react";
import { getDestination, getDestinations, getFlightsToAirport } from "@/lib/data";
import { Reveal, SectionHead } from "@/components/ui";
import { DestinationCard } from "@/components/home/sections";
import SaveButton from "@/components/save-button";
import { DEST_GALLERY } from "@/lib/images";
import { money, fmtDate, fmtTime, fmtDur, isoDay, addDays, cx } from "@/lib/format";

const GALLERY_CAPTIONS = [
  "Golden hour", "Local colour", "Street scenes",
  "Quiet corners", "From above", "After dark",
];

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const d = await getDestination(slug);
    if (d) return { title: `${d.name}, ${d.country}` };
  } catch { /* ignore */ }
  return { title: "Destination" };
}

export default async function DestinationDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const d = await getDestination(slug).catch(() => null);
  if (!d) notFound();

  const [flights, all] = await Promise.all([
    getFlightsToAirport(d.airportCode, 5).catch(() => []),
    getDestinations().catch(() => []),
  ]);
  const related = all.filter((x) => x.slug !== d.slug && x.region === d.region).slice(0, 3);
  const relatedFinal = related.length >= 3 ? related : all.filter((x) => x.slug !== d.slug).slice(0, 3);
  const galleryImages = [d.imageUrl, ...(DEST_GALLERY[d.slug] ?? d.gallery).filter((src) => src !== d.imageUrl)];
  const bookHref = `/flights?trip=oneway&to=${d.airportCode}&from=LHE&depart=${isoDay(addDays(new Date(), 14))}&pax=1&cabin=economy`;

  const facts = [
    { icon: CalendarDays, label: "Best time to visit", value: d.bestTime },
    { icon: Languages, label: "Language", value: d.language },
    { icon: Coins, label: "Currency", value: d.currencyName },
    { icon: Clock, label: "Typical flight time", value: d.flightTime },
  ];

  return (
    <>
      <section className="relative flex min-h-[64svh] items-end overflow-hidden pb-14 pt-40">
        <Image src={d.imageUrl} alt={`${d.name}, ${d.country}`} fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/92 via-navy-950/30 to-navy-950/25" />
        <div className="container-x relative z-10">
          <Reveal>
            <p className="eyebrow text-gold-300">{d.country} · {d.region}</p>
            <div className="mt-4 flex flex-wrap items-center gap-5">
              <h1 className="font-display text-5xl text-white md:text-7xl">{d.name}</h1>
              <SaveButton destinationId={d.id} />
            </div>
            <p className="mt-4 max-w-xl text-[16px] italic leading-relaxed text-white/80">{d.tagline}</p>
            <div className="mt-7 flex flex-wrap items-center gap-5">
              <Link href={bookHref} className="btn btn-gold">Book a flight <ArrowRight size={15} /></Link>
              <p className="text-sm text-white/70">
                from <span className="font-num text-2xl font-bold text-gold-300">{money(d.startingPrice)}</span> · demo fares
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="py-20">
        <div className="container-x grid gap-12 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <SectionHead eyebrow="Overview" title={<>Why <span className="italic text-gold-600">{d.name}</span> belongs on your story</>} />
            <Reveal delay={0.1}><p className="mt-6 text-[15.5px] leading-[1.9] text-navy-900/70">{d.description}</p></Reveal>
            <div className="mt-10 grid auto-rows-[160px] grid-cols-2 gap-1.5 sm:auto-rows-[190px] md:grid-cols-12">
              {galleryImages.slice(0, 7).map((src, i) => (
                <Reveal
                  key={`${src}-${i}`}
                  delay={Math.min(i * 0.04, 0.4)}
                  className={cx(
                    "group relative overflow-hidden rounded-2xl bg-linen",
                    i === 0 ? "col-span-2 row-span-2 md:col-span-8" : "",
                    i === 1 && "col-span-1 md:col-span-4",
                    i === 2 && "col-span-1 md:col-span-4",
                    i >= 3 && i <= 5 && "col-span-1 md:col-span-4",
                    i === 6 && "col-span-2 md:col-span-12"
                  )}
                >
                  <div className="relative h-full w-full">
                    <Image
                      src={src} alt={`${d.name} — gallery image ${i + 1}`} fill
                      loading="lazy"
                      sizes="(max-width:768px) 50vw, 33vw"
                      className="photo object-cover transition-transform duration-[1300ms] ease-out group-hover:scale-[1.07]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy-950/62 via-transparent to-transparent opacity-90 transition-opacity group-hover:opacity-100" />
                    <span className="absolute bottom-3.5 left-4 display-sm text-white drop-shadow-[0_1px_8px_rgb(8_17_30/0.5)]">
                      {i === 0 ? d.name : GALLERY_CAPTIONS[(i - 1) % GALLERY_CAPTIONS.length]!}
                    </span>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
          <div>
            <Reveal className="card sticky top-24 p-7">
              <h3 className="font-display text-xl text-navy-900">Country essentials</h3>
              <ul className="mt-5 space-y-5">
                {facts.map((f) => (
                  <li key={f.label} className="flex items-start gap-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ivory text-gold-600"><f.icon size={17} /></span>
                    <span>
                      <span className="block text-[10.5px] font-extrabold uppercase tracking-[0.2em] text-mist">{f.label}</span>
                      <span className="block text-sm font-semibold text-navy-900">{f.value || "—"}</span>
                    </span>
                  </li>
                ))}
                <li className="flex items-start gap-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ivory text-gold-600"><Plane size={17} /></span>
                  <span>
                    <span className="block text-[10.5px] font-extrabold uppercase tracking-[0.2em] text-mist">Arrival airport</span>
                    <span className="font-num block text-sm font-semibold text-navy-900">{d.airportCode}</span>
                  </span>
                </li>
              </ul>
              <Link href={bookHref} className="btn btn-navy mt-7 w-full">Find flights to {d.name}</Link>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="container-x">
          <SectionHead eyebrow="Best attractions" title={<>Unmissable in <span className="italic text-gold-600">{d.name}</span></>} />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {d.attractions.map((a, i) => (
              <Reveal key={a.name} delay={0.06 * i}>
                <div className="card h-full p-6">
                  <span className="font-num text-3xl font-bold text-gold-400">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="mt-3 flex items-center gap-2 text-[15px] font-bold text-navy-900"><MapPin size={15} className="text-gold-600" /> {a.name}</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-navy-900/55">{a.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container-x">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHead eyebrow="Available flights" title={<>Fly to <span className="italic text-gold-600">{d.name}</span></>} sub="Live demo inventory — seats update as bookings are made." />
            <Reveal delay={0.1}><Link href={bookHref} className="btn btn-outline">Compare all flights <ArrowRight size={14} /></Link></Reveal>
          </div>
          <div className="mt-10 space-y-4">
            {flights.length === 0 && (
              <Reveal><p className="card p-8 text-center text-sm text-mist">No scheduled demo flights to {d.airportCode} yet — check the deals page for alternatives.</p></Reveal>
            )}
            {flights.map((f, i) => (
              <Reveal key={f.id} delay={0.05 * i}>
                <div className="card flex flex-col gap-4 p-5 transition hover:shadow-lift sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3 sm:w-52">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full text-[11px] font-extrabold text-white" style={{ background: f.airline.accent }}>
                      {f.airline.code}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-navy-900">{f.airline.name}</p>
                      <p className="font-num text-[11px] text-mist">{f.flightNumber}</p>
                    </div>
                  </div>
                  <div className="flex flex-1 items-center gap-4">
                    <div className="text-center">
                      <p className="font-num text-lg font-bold text-navy-900">{fmtTime(f.departureAt)}</p>
                      <p className="text-[11px] font-bold text-mist">{f.origin.code}</p>
                    </div>
                    <div className="relative h-px flex-1 bg-navy-900/15">
                      <Plane size={14} className="absolute -top-[7px] left-1/2 -translate-x-1/2 text-gold-600" />
                    </div>
                    <div className="text-center">
                      <p className="font-num text-lg font-bold text-navy-900">{fmtTime(f.arrivalAt)}</p>
                      <p className="text-[11px] font-bold text-mist">{f.destination.code}</p>
                    </div>
                  </div>
                  <div className="text-[12px] text-mist sm:w-40">
                    <p>{fmtDate(f.departureAt)}</p>
                    <p>{fmtDur(f.durationMinutes)} · non-stop</p>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:w-48">
                    <p className="font-num text-xl font-bold text-navy-900">{money(f.price)}</p>
                    <Link href={`/book/${f.id}?pax=1&cabin=economy`} className="btn btn-gold btn-sm">Select</Link>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {relatedFinal.length > 0 && (
        <section className="bg-white py-20">
          <div className="container-x">
            <SectionHead eyebrow="Keep exploring" title={<>More journeys to <span className="italic text-gold-600">fall for</span></>} />
            <div className="mt-10 grid auto-rows-[280px] gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {relatedFinal.map((r, i) => (
                <Reveal key={r.slug} delay={0.07 * i}><DestinationCard d={r} canSave /></Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}