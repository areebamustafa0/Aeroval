"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Compass } from "lucide-react";
import { Reveal } from "@/components/ui";
import { DestinationCard } from "@/components/home/sections";
import { cx } from "@/lib/format";
import type { DestinationDTO } from "@/lib/data";

/** Editorial horizontally-scrolling destination rail with snap points. */
export default function DestinationRail({ destinations }: { destinations: DestinationDTO[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [prog, setProg] = useState(0);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setProg(max > 0 ? el.scrollLeft / max : 0);
  };

  const nudge = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.8, 420), behavior: "smooth" });
  };

  return (
    <section className="overflow-hidden section-tight">
      <div className="container-x flex flex-wrap items-end justify-between gap-6">
        <Reveal className="max-w-2xl">
          <p className="eyebrow text-gold-600">Editor&apos;s picks</p>
          <h2 className="display-lg mt-5 text-navy-900">
            Destinations our travelers <span className="italic text-gold-gradient">dream about.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.12} className="flex items-center gap-3">
          <button
            onClick={() => nudge(-1)}
            aria-label="Scroll destinations left"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-navy-900/15 text-navy-900 transition hover:border-gold-500 hover:bg-gold-400/15"
          >
            <ArrowLeft size={16} />
          </button>
          <button
            onClick={() => nudge(1)}
            aria-label="Scroll destinations right"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-navy-900/15 text-navy-900 transition hover:border-gold-500 hover:bg-gold-400/15"
          >
            <ArrowRight size={16} />
          </button>
        </Reveal>
      </div>

      <Reveal delay={0.15}>
        <div
          ref={ref}
          onScroll={onScroll}
          className="scrollbar-hide mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-2 md:px-8"
        >
          {/* intro tile */}
          <div className="flex h-[440px] w-[250px] shrink-0 snap-start flex-col justify-between rounded-[1.75rem] bg-navy-950 p-8 sm:w-[290px]">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-gold-400/35 bg-gold-400/10 text-gold-300">
              <Compass size={19} />
            </span>
            <div>
              <p className="font-num text-[3.4rem] font-medium leading-none tracking-tight text-gold-gradient">{destinations.length}</p>
              <p className="display-sm mt-4 leading-tight text-white">
                destinations, one extraordinary standard
              </p>
              <Link href="/destinations" className="btn btn-gold btn-sm mt-7">
                View all <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          {destinations.map((d) => (
            <div key={d.slug} className="h-[440px] w-[310px] shrink-0 snap-start sm:w-[370px]">
              <DestinationCard d={d} tall canSave />
            </div>
          ))}
        </div>
      </Reveal>

      <div className="container-x mt-5 md:px-8">
        <div className="h-[3px] w-full max-w-xs overflow-hidden rounded-full bg-navy-900/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-300 transition-[width] duration-200"
            style={{ width: `${Math.max(12, prog * 100)}%` }}
          />
        </div>
        <p className={cx("mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-mist")}>
          Drag or use the arrows to explore
        </p>
      </div>
    </section>
  );
}