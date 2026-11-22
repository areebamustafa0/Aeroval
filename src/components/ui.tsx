
"use client";

import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { Star, X, Loader2, PlaneTakeoff } from "lucide-react";
import {
  useRef,
  type ReactNode,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { cx, STATUS_TONE } from "@/lib/format";
import { EASE } from "@/lib/anim";

/** Scroll-triggered reveal animation with hydration-safe initial styles. */
export function Reveal({
  children,
  delay = 0,
  y = 22,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{
        duration: reduce ? 0 : 0.85,
        delay: reduce ? 0 : delay,
        ease: EASE,
      }}
    >
      {children}
    </motion.div>
  );
}

/** Editorial section heading — eyebrow, display type, measured lede. */
export function SectionHead({
  eyebrow,
  title,
  sub,
  tone = "dark",
  center,
}: {
  eyebrow: string;
  title: ReactNode;
  sub?: string;
  tone?: "dark" | "light";
  center?: boolean;
}) {
  const light = tone === "light";

  return (
    <Reveal className={cx("max-w-2xl", center && "mx-auto text-center")}>
      <p
        className={cx(
          "eyebrow",
          light ? "text-gold-300" : "text-gold-600",
          center && "eyebrow-center justify-center"
        )}
      >
        {eyebrow}
      </p>

      <h2 className={cx("display-lg mt-5", light ? "text-white" : "text-navy-900")}>
        {title}
      </h2>

      {sub && (
        <p
          className={cx(
            "lede mt-5 max-w-xl",
            center && "mx-auto",
            light ? "text-white/62" : "text-navy-900/58"
          )}
        >
          {sub}
        </p>
      )}
    </Reveal>
  );
}

export const Stars = ({
  n = 5,
  className,
}: {
  n?: number;
  className?: string;
}) => (
  <span
    className={cx("inline-flex gap-0.5", className)}
    aria-label={`${n} star rating`}
  >
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        size={12.5}
        className={
          i < n
            ? "fill-gold-500 text-gold-500"
            : "text-mist/35"
        }
      />
    ))}
  </span>
);

export const Spinner = ({ className }: { className?: string }) => (
  <Loader2 className={cx("animate-spin", className)} size={17} />
);

export const StatusBadge = ({ status }: { status: string }) => (
  <span
    className={cx(
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]",
      STATUS_TONE[status] ??
        "bg-slate-50 text-slate-600 border-slate-200"
    )}
  >
    {status.replace(/_/g, " ")}
  </span>
);

/** Accessible animated modal dialog. */
export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-navy-950/62 p-0 backdrop-blur-md sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={cx(
              "max-h-[92vh] w-full overflow-y-auto rounded-t-[1.75rem] bg-white p-7 shadow-2xl sm:rounded-[1.75rem]",
              wide ? "sm:max-w-3xl" : "sm:max-w-lg"
            )}
            initial={{ y: 48, opacity: 0, scale: 0.985 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 32, opacity: 0, scale: 0.985 }}
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 300,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h3 className="display-sm text-navy-900">{title}</h3>

              <button
                onClick={onClose}
                aria-label="Close dialog"
                className="rounded-full p-2 text-mist transition hover:bg-sand hover:text-navy-900"
              >
                <X size={17} />
              </button>
            </div>

            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const EmptyState = ({
  title,
  sub,
  action,
}: {
  title: string;
  sub: string;
  action?: ReactNode;
}) => (
  <div className="card flex flex-col items-center gap-3 px-8 py-16 text-center">
    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-sand text-gold-600">
      <PlaneTakeoff size={22} />
    </span>

    <h3 className="display-sm mt-1 text-navy-900">{title}</h3>

    <p className="lede-sm max-w-sm text-navy-900/55">{sub}</p>

    {action}
  </div>
);

export const Field = ({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) => (
  <div>
    <span className="label">{label}</span>

    {children}

    {error && (
      <p className="mt-1.5 text-[11.5px] font-semibold text-rose-600">
        {error}
      </p>
    )}
  </div>
);

export const Alert = ({
  tone,
  children,
}: {
  tone: "error" | "success" | "info";
  children: ReactNode;
}) => (
  <div
    className={cx(
      "rounded-xl border px-4 py-3 text-[13.5px] font-medium leading-relaxed",
      tone === "error" &&
        "border-rose-200 bg-rose-50/70 text-rose-700",
      tone === "success" &&
        "border-emerald-200 bg-emerald-50/70 text-emerald-700",
      tone === "info" &&
        "border-skyblue/35 bg-skyblue/10 text-navy-800"
    )}
  >
    {children}
  </div>
);

export const FlightCardSkeleton = () => (
  <div className="card p-6">
    <div className="flex items-center gap-4">
      <div className="skeleton h-11 w-11 rounded-full" />

      <div className="flex-1 space-y-2.5">
        <div className="skeleton h-3.5 w-2/5" />
        <div className="skeleton h-2.5 w-1/4" />
      </div>

      <div className="skeleton h-8 w-24 rounded-full" />
    </div>

    <div className="mt-6 flex items-center justify-between gap-6">
      <div className="skeleton h-7 w-20" />
      <div className="skeleton h-1.5 flex-1" />
      <div className="skeleton h-7 w-20" />
      <div className="skeleton h-10 w-28" />
    </div>
  </div>
);

/** Tracks the cursor to drive a radial gold spotlight via CSS variables. */
export function Spotlight({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    const el = ref.current;

    if (!el) return;

    const r = el.getBoundingClientRect();

    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      className={cx("spot", className)}
    >
      {children}
    </div>
  );
}


