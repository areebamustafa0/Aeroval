"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Luggage, Wifi, UtensilsCrossed, Armchair, ShieldCheck, Film } from "lucide-react";
import { Reveal, SectionHead, Spotlight } from "@/components/ui";
import { IMG } from "@/lib/images";
import { cx } from "@/lib/format";

const SEATS = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  taken: [2, 5, 9, 14, 18, 21].includes(i),
  premium: i < 6,
  chosen: i === 7 || i === 8,
}));

export default function Bento() {
  return (
    <section className="section-tight">
      <div className="container-x">
        <SectionHead
          eyebrow="Included with every fare"
          title={<>No surprises. <span className="italic text-gold-gradient">Just the good stuff.</span></>}
          sub="The things other airlines charge for are simply part of an AEROVÉL booking."
        />

        <div className="mt-14 grid auto-rows-[150px] grid-cols-2 gap-4 md:grid-cols-6 md:auto-rows-[160px]">
          {/* hero tile */}
          <Reveal className="col-span-2 row-span-2 md:col-span-4 md:row-span-2">
            <Spotlight className="group relative h-full overflow-hidden rounded-3xl border border-navy-900/8">
              <Image src={IMG.cabinSeats} alt="AEROVÉL cabin interior" fill sizes="(max-width:768px) 100vw, 66vw" className="object-cover transition-transform duration-[1200ms] group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950/92 via-navy-950/35 to-transparent" />
              <div className="relative flex h-full flex-col justify-end p-7">
                <p className="eyebrow text-gold-300">Cabins, reimagined</p>
                <h3 className="font-display mt-3 max-w-sm text-2xl leading-tight text-white md:text-3xl">
                  Designed around the window seat, not the aisle.
                </h3>
                <Link href="/about" className="mt-4 inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.2em] text-gold-300 transition hover:text-gold-200">
                  Our story <ArrowRight size={13} />
                </Link>
              </div>
            </Spotlight>
          </Reveal>

          {/* stat tiles */}
          {[
            { icon: Luggage, big: "23kg", sub: "checked baggage, included" },
            { icon: Wifi, big: "Wi-Fi", sub: "streaming at 40,000 ft" },
            { icon: UtensilsCrossed, big: "Dining", sub: "curated regional menus" },
          ].map((t, i) => (
            <Reveal key={t.big} delay={0.06 * (i + 1)} className="md:col-span-2">
              <Spotlight className="card card-lux flex h-full items-center gap-4 p-6">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-navy-900 text-gold-300">
                  <t.icon size={20} />
                </span>
                <div className="min-w-0">
                  <p className="font-num text-2xl font-bold text-navy-900">{t.big}</p>
                  <p className="text-[12px] leading-snug text-mist">{t.sub}</p>
                </div>
              </Spotlight>
            </Reveal>
          ))}

          {/* seat map tile */}
          <Reveal delay={0.1} className="col-span-2 md:col-span-3">
            <Spotlight className="card card-lux h-full p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ivory text-gold-600"><Armchair size={17} /></span>
                <div>
                  <p className="text-[14px] font-bold text-navy-900">Seat selection, free</p>
                  <p className="text-[11.5px] text-mist">Pick your spot on a live cabin map</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-6 gap-1.5">
                {SEATS.map((s) => (
                  <span
                    key={s.id}
                    className={cx(
                      "h-5 rounded-md border transition",
                      s.chosen ? "border-navy-900 bg-navy-900"
                        : s.taken ? "border-navy-900/10 bg-navy-900/12"
                        : s.premium ? "border-gold-500/60 bg-gold-400/25"
                        : "border-navy-900/15 bg-white"
                    )}
                  />
                ))}
              </div>
              <p className="mt-3 text-[11px] text-mist">Gold = premium · dark = taken · white = yours</p>
            </Spotlight>
          </Reveal>

          {/* trust tile */}
          <Reveal delay={0.16} className="col-span-2 md:col-span-3">
            <Spotlight className="card card-lux flex h-full flex-col justify-between p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ivory text-gold-600"><ShieldCheck size={17} /></span>
                <p className="text-[14px] font-bold text-navy-900">Booked safely, by design</p>
              </div>
              <p className="mt-3 text-[12.5px] leading-relaxed text-navy-900/60">
                Transactional seat locking means a seat can never be sold twice, hashed credentials
                and signed sessions protect your account, and sandbox payments never store card numbers.
              </p>
              <div className="mt-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-gold-600">
                <Film size={13} /> Demo platform · no real charges
              </div>
            </Spotlight>
          </Reveal>
        </div>
      </div>
    </section>
  );
}