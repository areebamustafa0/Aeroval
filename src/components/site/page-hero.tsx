"use client";

import Image from "next/image";
import { useRef, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { EASE } from "@/lib/anim";
import { cx } from "@/lib/format";

/** Cinematic sub-page hero: parallax photography, masked word reveal. */
export default function PageHero({
  img, eyebrow, title, accent, sub, alt, height = "md", children,
}: {
  img: string; eyebrow: string; title: string; accent?: string;
  sub?: string; alt: string; height?: "sm" | "md" | "lg"; children?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 130]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.14]);
  const fade = useTransform(scrollYProgress, [0, 0.9], [1, 0.25]);

  const heights = { sm: "min-h-[48svh]", md: "min-h-[62svh]", lg: "min-h-[72svh]" };

  const words = (text: string, base: number, cls: string) =>
    text.split(" ").map((w, i) => (
      <span key={`${w}-${i}`} className="word-mask mr-[0.28em] last:mr-0">
        <motion.span
          className={cx("inline-block", cls)}
          initial={reduce ? false : { y: "112%" }}
          animate={{ y: 0 }}
          transition={{ duration: 0.95, delay: base + i * 0.07, ease: EASE }}
        >
          {w}
        </motion.span>
      </span>
    ));

  return (
    <section ref={ref} className={cx("relative flex items-end overflow-hidden pb-20 pt-40", heights[height])}>
      <motion.div style={{ y, scale }} className="absolute inset-[-6%]">
        <Image src={img} alt={alt} fill priority sizes="100vw" className="photo object-cover" />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-t from-navy-950/95 via-navy-950/36 to-navy-950/32" />
      <div className="absolute inset-0 bg-gradient-to-r from-navy-950/52 to-transparent" />

      <motion.div style={{ opacity: fade }} className="container-x relative z-10">
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE }}
          className="eyebrow text-gold-300"
        >
          {eyebrow}
        </motion.p>
        <h1 className={cx("display-xl mt-6 max-w-3xl", height !== "lg" && "text-[clamp(2.1rem,4.6vw,3.4rem)]")}>
          {words(title, 0.15, "text-white")}
          {accent && <span className="mt-1.5 block">{words(accent, 0.4, "italic text-gold-gradient")}</span>}
        </h1>
        {sub && (
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.75, ease: EASE }}
            className="lede mt-6 max-w-xl text-white/70"
          >
            {sub}
          </motion.p>
        )}
        {children && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.9, ease: EASE }}
            className="mt-7"
          >
            {children}
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}