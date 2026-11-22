"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/ui";
import { EASE } from "@/lib/anim";
import { cx } from "@/lib/format";
import type { Moment } from "@/lib/images";

/**
 * Dense editorial mosaic — tight gaps, mixed tile sizes, serif labels.
 * Replicates the "travel magazine collage" layout: two wide hero tiles,
 * then bands of three and four.
 */
export default function Mosaic({ moments, cta }: { moments: Moment[]; cta?: { href: string; label: string } }) {
  const reduce = useReducedMotion();

  /* editorial span cycle: two tall heroes, three mediums, four smalls = 9 tiles / 4 rows */
  const SPANS = [
    "md:col-span-6 md:row-span-2",
    "md:col-span-6 md:row-span-2",
    "md:col-span-4",
    "md:col-span-4",
    "md:col-span-4",
    "md:col-span-3",
    "md:col-span-3",
    "md:col-span-3",
    "md:col-span-3",
  ];

  const list = moments.slice(0, 24);
  const last = list.length - 1;

  return (
    <section className="bg-ivory section-tight">
      <div className="container-x">
        {cta && (
          <Reveal className="mb-10 flex items-end justify-between gap-6">
            <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-mist">
              A glimpse of what awaits
            </p>
            <Link href={cta.href} className="link-quiet text-gold-600 hover:text-gold-500">
              {cta.label} <ArrowUpRight size={12} />
            </Link>
          </Reveal>
        )}

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, ease: EASE }}
          className="grid auto-rows-[150px] grid-cols-2 gap-1.5 sm:auto-rows-[170px] md:grid-cols-12 md:auto-rows-[186px]"
        >
          {list.map((m, i) => (
            <motion.figure
              key={`${m.label}-${i}`}
              initial={reduce ? false : { opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, delay: Math.min(i * 0.035, 0.7), ease: EASE }}
              className={cx(
                "group relative overflow-hidden bg-linen",
                i === last
                  ? "col-span-2 md:col-span-12 md:row-span-1"
                  : cx(i < 2 ? "col-span-2" : "col-span-1", SPANS[i % SPANS.length]!)
              )}
            >
              <Image
                src={m.src}
                alt={m.label}
                fill
                loading="lazy"
                sizes="(max-width:768px) 50vw, 33vw"
                className="photo object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.08]"
              />
              {/* scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950/78 via-navy-950/10 to-transparent opacity-95 transition-opacity duration-500 group-hover:opacity-100" />
              {/* gold hairline on hover */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-0 ring-1 ring-inset ring-gold-300/60 transition-opacity duration-500 group-hover:opacity-100"
              />
              <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 md:p-5">
                <span className="min-w-0">
                  <span className="display-sm block truncate text-white drop-shadow-[0_1px_10px_rgb(8_17_30/0.5)]">
                    {m.label}
                  </span>
                  <span className="mt-1 block truncate text-[9.5px] font-medium uppercase tracking-[0.22em] text-white/60">
                    {m.sub}
                  </span>
                </span>
                <span className="flex h-8 w-8 shrink-0 translate-y-1.5 items-center justify-center rounded-full border border-white/35 text-white opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:border-gold-300 group-hover:bg-gold-400 group-hover:text-navy-900 group-hover:opacity-100">
                  <ArrowUpRight size={13} />
                </span>
              </figcaption>
            </motion.figure>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
