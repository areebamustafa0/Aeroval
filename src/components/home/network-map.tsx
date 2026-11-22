"use client";

import { useEffect, useRef, useState, type FC } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { SectionHead } from "@/components/ui";
import { EASE } from "@/lib/anim";
import { cx } from "@/lib/format";
import type { NetworkStats } from "@/lib/data";

const AnimateMotion = "animateMotion" as unknown as FC<Record<string, string | number | undefined>>;

const W = 1100;
const H = 470;

type Node = { code: string; x: number; y: number; city: string; country: string; hub?: boolean };

const NODES: Node[] = [
  { code: "JFK", x: 92, y: 148, city: "New York", country: "United States" },
  { code: "LHR", x: 428, y: 116, city: "London", country: "United Kingdom" },
  { code: "CDG", x: 470, y: 152, city: "Paris", country: "France" },
  { code: "ZRH", x: 498, y: 190, city: "Zurich", country: "Switzerland" },
  { code: "FCO", x: 522, y: 232, city: "Rome", country: "Italy" },
  { code: "IST", x: 592, y: 184, city: "Istanbul", country: "Türkiye", hub: true },
  { code: "JTR", x: 606, y: 238, city: "Santorini", country: "Greece" },
  { code: "DXB", x: 700, y: 252, city: "Dubai", country: "UAE", hub: true },
  { code: "DOH", x: 664, y: 288, city: "Doha", country: "Qatar" },
  { code: "LHE", x: 770, y: 208, city: "Lahore", country: "Pakistan", hub: true },
  { code: "ISB", x: 786, y: 186, city: "Islamabad", country: "Pakistan" },
  { code: "KHI", x: 756, y: 254, city: "Karachi", country: "Pakistan" },
  { code: "HND", x: 962, y: 186, city: "Tokyo", country: "Japan" },
  { code: "KUL", x: 884, y: 300, city: "Kuala Lumpur", country: "Malaysia" },
  { code: "SIN", x: 916, y: 330, city: "Singapore", country: "Singapore" },
  { code: "MLE", x: 792, y: 356, city: "Malé", country: "Maldives" },
  { code: "DPS", x: 952, y: 356, city: "Bali", country: "Indonesia" },
];

const ARCS: [string, string][] = [
  ["LHE", "DXB"], ["DXB", "LHR"], ["DXB", "DOH"], ["IST", "CDG"], ["IST", "JTR"],
  ["LHR", "JFK"], ["DXB", "HND"], ["DXB", "MLE"], ["KUL", "SIN"], ["ISB", "IST"],
  ["KHI", "DOH"], ["DPS", "DXB"], ["CDG", "ZRH"], ["KUL", "HND"], ["FCO", "DXB"],
  ["LHE", "IST"],
];

const byCode = new Map(NODES.map((n) => [n.code, n]));

function arcPath(a: Node, b: Node) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dist = Math.hypot(b.x - a.x, b.y - a.y);
  const lift = Math.min(130, dist * 0.2 + 18);
  return `M ${a.x} ${a.y} Q ${mx} ${my - lift} ${b.x} ${b.y}`;
}

function useScale() {
  const ref = useRef<HTMLDivElement>(null);
  const [s, setS] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      if (w > 0) setS(Math.max(0.8, Math.min(1, w / W)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, s };
}

export default function NetworkMap({ stats }: { stats: NetworkStats | null }) {
  const { ref, s } = useScale();
  const [hover, setHover] = useState<Node | null>(null);
  const reduce = useReducedMotion() ?? false;

  const active = hover ?? byCode.get("DXB")!;

  return (
    <section className="relative overflow-hidden bg-navy-950 section">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-gold-400/[0.05] blur-[120px]"
      />
      <div className="container-x relative z-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHead
            tone="light"
            eyebrow="Route network"
            title={<>One network, <span className="italic text-gold-gradient">seventeen skies.</span></>}
            sub="A stylized illustration of the demo AEROVÉL network — hover a city to see where it connects."
          />
          <div className="flex gap-6 text-right">
            {[
              { n: stats?.airports ?? 17, l: "Airports" },
              { n: stats?.flights ?? 400, l: "Live flights" },
              { n: stats?.destinations ?? 12, l: "Destinations" },
            ].map((x) => (
              <div key={x.l}>
                <p className="font-num text-2xl font-bold text-gold-300">{x.n}</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">{x.l}</p>
              </div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.9, ease: EASE }}
          className="mt-12"
        >
          <div className="glass-deep relative overflow-hidden rounded-[1.75rem] p-3 md:p-5">
            <div ref={ref} className="scrollbar-hide overflow-x-auto">
              <div style={{ width: W * s, height: H * s }} className="relative">
                <svg
                  viewBox={`0 0 ${W} ${H}`}
                  width={W}
                  height={H}
                  style={{ transform: `scale(${s})`, transformOrigin: "top left" }}
                  className="absolute left-0 top-0"
                  role="img"
                  aria-label="Stylized map of the AEROVÉL demo route network"
                >
                  <defs>
                    <radialGradient id="mapGlow" cx="50%" cy="45%" r="60%">
                      <stop offset="0%" stopColor="#162A43" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#0A1424" stopOpacity="0.2" />
                    </radialGradient>
                    <linearGradient id="arcGold" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#D9C18D" stopOpacity="0.15" />
                      <stop offset="50%" stopColor="#E8D9B5" stopOpacity="0.95" />
                      <stop offset="100%" stopColor="#D9C18D" stopOpacity="0.15" />
                    </linearGradient>
                  </defs>

                  <rect width={W} height={H} fill="url(#mapGlow)" />

                  {/* faint graticule */}
                  <g stroke="#FFFFFF" strokeOpacity="0.05">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <line key={`h${i}`} x1={0} y1={60 + i * 58} x2={W} y2={60 + i * 58} />
                    ))}
                    {Array.from({ length: 11 }).map((_, i) => (
                      <line key={`v${i}`} x1={70 + i * 96} y1={0} x2={70 + i * 96} y2={H} />
                    ))}
                  </g>

                  {/* arcs */}
                  <g fill="none">
                    {ARCS.map(([a, b], i) => {
                      const na = byCode.get(a);
                      const nb = byCode.get(b);
                      if (!na || !nb) return null;
                      const d = arcPath(na, nb);
                      const lit = hover?.code === a || hover?.code === b;
                      return (
                        <g key={`${a}-${b}`}>
                          <path d={d} stroke="#FFFFFF" strokeOpacity={lit ? 0.22 : 0.1} strokeWidth={1} />
                          <path
                            d={d}
                            stroke="url(#arcGold)"
                            strokeWidth={lit ? 2 : 1.3}
                            className="arc-flow"
                            style={{ animationDuration: `${6 + (i % 5)}s` }}
                          />
                          {!reduce && i % 2 === 0 && (
                            <g fill="#D9C18D">
                              <path d="M0 -5.5 L1.5 -1.2 L8 0 L1.5 1.2 L0 5.5 L-0.8 1.2 L-8 0 L-0.8 -1.2 Z" />
                              <AnimateMotion
                                dur={`${13 + (i % 6)}s`}
                                repeatCount="indefinite"
                                path={d}
                                rotate="auto"
                                begin={`${i * 0.9}s`}
                              />
                            </g>
                          )}
                        </g>
                      );
                    })}
                  </g>

                  {/* nodes */}
                  <g>
                    {NODES.map((n) => {
                      const isHub = Boolean(n.hub);
                      const lit = hover?.code === n.code;
                      const r = lit ? (isHub ? 8 : 6.5) : isHub ? 5.5 : 4;
                      return (
                        <g
                          key={n.code}
                          onMouseEnter={() => setHover(n)}
                          onMouseLeave={() => setHover(null)}
                          className="cursor-pointer"
                        >
                          <circle cx={n.x} cy={n.y} r={16} fill="transparent" />
                          {!reduce && (
                            <circle
                              cx={n.x} cy={n.y} r={r}
                              fill="none" stroke={isHub ? "#D9C18D" : "#91B9D8"}
                              strokeWidth={1}
                              className="node-pulse"
                              style={{ animationDelay: `${(n.x % 7) * 0.4}s` }}
                            />
                          )}
                          <circle
                            cx={n.x} cy={n.y} r={r}
                            fill={isHub ? "#D9C18D" : "#C7D8E8"}
                            stroke={lit ? "#F0E6CD" : "#0A1424"}
                            strokeWidth={lit ? 2 : 1.5}
                          />
                          <text
                            x={n.x}
                            y={n.y - (isHub ? 13 : 11)}
                            textAnchor="middle"
                            fontSize={13}
                            fontWeight={700}
                            fill={lit ? "#F0E6CD" : isHub ? "#D9C18D" : "#9AA6B4"}
                            style={{ fontFamily: "var(--font-num)", letterSpacing: "0.06em" }}
                          >
                            {n.code}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                </svg>
              </div>
            </div>

            {/* legend */}
            <div className="relative flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-3 py-3.5 md:px-5">
              <p className="text-[12.5px] text-white/55">
                {hover ? (
                  <>
                    <span className="font-num font-bold text-gold-300">{active.code}</span>
                    <span className="text-white/70"> — {active.city}, {active.country}</span>
                  </>
                ) : (
                  <>Hover a city to explore the network · hubs highlighted in gold</>
                )}
              </p>
              <div className="flex items-center gap-4 text-[10.5px] font-bold uppercase tracking-[0.18em] text-white/35">
                <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-gold-400" /> Hub</span>
                <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-skyblue" /> City</span>
                <span className="hidden items-center gap-1.5 sm:flex"><span className="h-px w-5 bg-gold-300/70" /> Route</span>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mt-6 flex flex-wrap gap-2">
          {NODES.filter((n) => n.hub).map((n) => (
            <span key={n.code} className={cx(
              "font-num rounded-full border border-gold-400/30 bg-gold-400/8 px-3 py-1.5 text-[11px] font-bold text-gold-300",
              hover?.code === n.code && "border-gold-400 bg-gold-400 text-navy-900"
            )}>
              {n.code} hub
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}