
"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowRight, Sparkles } from "lucide-react";
import { IMG } from "@/lib/images";
import { EASE } from "@/lib/anim";

export default function Hero() {
  const reduced = useReducedMotion();

  const reveal = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: reduced ? 0 : 0.8,
      delay: reduced ? 0 : delay,
      ease: EASE,
    },
  });

  return (
    <section className="aero-hero relative flex overflow-hidden bg-navy-950 text-white">
      <div className="absolute inset-0">
        <Image
          src={IMG.hero}
          alt="An AEROVÉL aircraft flying over golden clouds at sunset"
          fill
          priority
          sizes="100vw"
          className="aero-hero-image hidden object-cover sm:block"
        />

        <Image
          src={IMG.heroMobile}
          alt=""
          fill
          priority
          sizes="(max-width: 640px) 100vw, 1px"
          className="aero-hero-image object-cover sm:hidden"
          aria-hidden="true"
        />

        <div className="aero-hero-overlay absolute inset-0" />
      </div>

      <div className="container-x relative z-10 flex w-full items-center">
        <div className="aero-hero-copy">
          <motion.p {...reveal(0.05)} className="aero-hero-kicker">
            <span /> THE ART OF TRAVEL <span className="aero-hero-kicker-line" />
          </motion.p>

          <motion.h1 {...reveal(0.16)} className="aero-hero-title">
            The world is yours.
            <em>Make it extraordinary.</em>
          </motion.h1>

          <motion.p {...reveal(0.28)} className="aero-hero-description">
            Discover remarkable destinations and experience a more beautiful way to travel.
          </motion.p>

          <motion.div {...reveal(0.4)} className="aero-hero-actions">
            <Link href="/destinations" className="aero-hero-primary">
              EXPLORE DESTINATIONS <ArrowRight size={16} />
            </Link>

            <a href="#search" className="aero-hero-secondary">
              <span className="aero-play">
                <ArrowDown size={14} />
              </span>
              BOOK A FLIGHT
            </a>
          </motion.div>

          <motion.div {...reveal(0.52)} className="aero-hero-note">
            <Sparkles size={14} /> A LITTLE MORE WONDER IN EVERY JOURNEY
          </motion.div>
        </div>
      </div>

      <div className="aero-hero-side" aria-hidden="true">
        <span className="aero-hero-side-line" />
        <span>THE WORLD IS YOURS</span>
        <span>01 / 12</span>
      </div>
    </section>
  );
}
