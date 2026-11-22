"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check, Luggage, Sofa, UtensilsCrossed, Wifi, Clock3, Martini } from "lucide-react";
import { Reveal, SectionHead, Spotlight } from "@/components/ui";
import { IMG } from "@/lib/images";
import { money, cx } from "@/lib/format";
import type { NetworkStats } from "@/lib/data";

const CABINS = [
  {
    key: "economy",
    name: "Economy",
    label: "Smart comfort",
    img: IMG.windowClouds,
    blurb: "Generous legroom, a curated menu and entertainment at every seat.",
    perks: [
      { icon: Luggage, text: "23kg checked bag included" },
      { icon: Sofa, text: "Seat selection from the interactive map" },
      { icon: UtensilsCrossed, text: "Complimentary dining & drinks" },
      { icon: Wifi, text: "Streaming Wi-Fi on board" },
    ],
  },
  {
    key: "business",
    name: "Business",
    label: "The full experience",
    img: IMG.cabinBright,
    blurb: "Lie-flat comfort, lounge access and priority everything.",
    perks: [
      { icon: Luggage, text: "2 × 32kg checked bags" },
      { icon: Martini, text: "Lounge access & priority boarding" },
      { icon: Sofa, text: "Wide 2–2 seating, first-row options" },
      { icon: Clock3, text: "Flexible same-route changes" },
    ],
  },
] as const;

export default function Cabins({ stats }: { stats: NetworkStats | null }) {
  return (
    <section className="section">
      <div className="container-x">
        <SectionHead
          center
          eyebrow="Choose your cabin"
          title={<>Two ways to fly. <span className="italic text-gold-gradient">Both beautiful.</span></>}
          sub="Every fare includes baggage, dining, entertainment and seat selection — the difference is how much of the sky you get to yourself."
        />

        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          {CABINS.map((c, i) => {
            const price = c.key === "economy" ? stats?.economyFrom : stats?.businessFrom;
            return (
              <Reveal key={c.key} delay={i * 0.12}>
                <Spotlight className="card-lux group relative h-full overflow-hidden rounded-3xl border border-navy-900/8 bg-white shadow-lift transition-transform duration-500 hover:-translate-y-1.5">
                  {c.key === "business" && (
                    <span className="absolute right-4 top-4 z-20 rounded-full bg-gold-400 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-navy-900 shadow-lg">
                      Most loved
                    </span>
                  )}
                  <div className="relative h-60 overflow-hidden sm:h-72">
                    <Image
                      src={c.img} alt={`${c.name} cabin`} fill
                      sizes="(max-width:1024px) 100vw, 50vw"
                      className="photo object-cover transition-transform duration-[1300ms] ease-out group-hover:scale-[1.06]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy-950/88 via-navy-950/18 to-transparent" />
                    <div className="absolute bottom-6 left-7">
                      <p className="text-[9.5px] font-semibold uppercase tracking-[0.28em] text-gold-300">{c.label}</p>
                      <h3 className="display-md mt-2 text-white">{c.name}</h3>
                    </div>
                  </div>

                  <div className="p-7 sm:p-8">
                    <p className="lede-sm text-navy-900/62">{c.blurb}</p>

                    <ul className="mt-7 space-y-3.5">
                      {c.perks.map((p) => (
                        <li key={p.text} className="flex items-center gap-3.5 text-[13.5px] font-medium text-navy-900/78">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sand text-gold-600 transition duration-500 group-hover:bg-gold-400 group-hover:text-navy-900">
                            <p.icon size={15} />
                          </span>
                          {p.text}
                        </li>
                      ))}
                    </ul>

                    <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-navy-900/[0.08] pt-6">
                      <div>
                        <p className="text-[9.5px] font-semibold uppercase tracking-[0.22em] text-mist">demo fares from</p>
                        <p className="font-num mt-1.5 text-[1.75rem] font-medium leading-none tracking-tight text-navy-900">
                          {money(price ?? (c.key === "economy" ? 139 : 399))}
                        </p>
                      </div>
                      <motion.span whileHover={{ y: -2 }} className="inline-flex">
                        <Link href={`/flights?cabin=${c.key}`} className={cx("btn", c.key === "business" ? "btn-gold" : "btn-navy")}>
                          Search {c.name} <ArrowRight size={14} />
                        </Link>
                      </motion.span>
                    </div>
                  </div>
                </Spotlight>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={0.2} className="mt-8">
          <p className="flex items-center justify-center gap-2 text-center text-[12px] text-mist">
            <Check size={13} className="text-gold-600" />
            Prices shown are the lowest live demo fares in each cabin and update as seats are booked.
          </p>
        </Reveal>
      </div>
    </section>
  );
}