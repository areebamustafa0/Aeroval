"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { SectionHead } from "@/components/ui";
import { SHOWCASE } from "@/lib/images";
import { cx } from "@/lib/format";

export default function Showcase() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (paused || reduce) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % SHOWCASE.length), 6500);
    return () => clearInterval(t);
  }, [paused, reduce]);

  const item = SHOWCASE[idx]!;

  return (
    <section className="bg-navy-950 section">
      <div className="container-x">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHead tone="light" eyebrow="Aircraft showcase"
            title={<>Engineered for <span className="italic text-gold-300">the journey.</span></>}
            sub="A visual love letter to flight — golden climbs, quiet cruises and cabins full of light." />
          <p className="font-num text-[11px] font-medium tracking-[0.34em] text-white/35">
            {String(idx + 1).padStart(2, "0")} / {String(SHOWCASE.length).padStart(2, "0")}
          </p>
        </div>

        <div
          className="relative mt-14 aspect-[16/10] overflow-hidden rounded-[1.75rem] border border-white/[0.07] md:aspect-[16/7]"
          onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={item.src}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="absolute inset-0"
            >
              <Image src={item.src} alt={item.title} fill sizes="(max-width:1280px) 100vw, 1280px" className="photo object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950/85 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 p-8 md:p-11">
                <p className="eyebrow text-gold-300">{item.caption}</p>
                <h3 className="display-lg mt-3.5 text-white">{item.title}</h3>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="scrollbar-hide mt-4 flex gap-3 overflow-x-auto pb-1">
          {SHOWCASE.map((s, i) => (
            <button
              key={s.src}
              onClick={() => setIdx(i)}
              aria-label={`Show ${s.title}`}
              className={cx(
                "relative h-16 w-28 shrink-0 overflow-hidden rounded-xl transition-all duration-500 md:h-[4.5rem] md:w-36",
                i === idx
                  ? "ring-1 ring-gold-400 ring-offset-2 ring-offset-navy-950"
                  : "opacity-45 hover:opacity-85"
              )}
            >
              <Image src={s.src} alt="" fill sizes="144px" className="object-cover" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}