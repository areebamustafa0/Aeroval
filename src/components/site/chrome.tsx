"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { ArrowUp } from "lucide-react";

/** Gold scroll-progress hairline above the navigation. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 240, damping: 40, restDelta: 0.001 });
  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX }}
      className="no-print fixed inset-x-0 top-0 z-[75] h-[2.5px] origin-left bg-gradient-to-r from-gold-600 via-gold-300 to-gold-500"
    />
  );
}

/** Static film-grain veil for a subtle analog finish. */
export function Grain() {
  return <div aria-hidden="true" className="grain-overlay no-print" />;
}

/** Floating back-to-top control. */
export function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 900);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, scale: 0.6, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 16 }}
          whileHover={{ y: -3 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Back to top"
          className="no-print fixed bottom-20 right-5 z-[55] flex h-11 w-11 items-center justify-center rounded-full border border-gold-400/50 bg-navy-950/85 text-gold-300 shadow-lg backdrop-blur-md transition hover:bg-navy-900 md:bottom-7 md:right-7"
        >
          <ArrowUp size={17} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export default function Chrome() {
  return (
    <>
      <ScrollProgress />
      <Grain />
      <BackToTop />
    </>
  );
}