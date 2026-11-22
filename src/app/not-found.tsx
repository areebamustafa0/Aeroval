import Link from "next/link";
import { Compass, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative flex min-h-[80vh] items-center justify-center bg-navy-950 px-5 pt-20">
      <div className="pointer-events-none absolute -top-24 right-1/4 h-80 w-80 rounded-full bg-gold-400/8 blur-3xl" />
      <div className="relative z-10 text-center">
        <p className="eyebrow justify-center text-gold-300">Off the flight path</p>
        <h1 className="mt-4 font-display text-6xl text-white md:text-7xl">404</h1>
        <p className="mx-auto mt-4 max-w-md text-[15px] text-white/60">
          This page drifted beyond our route map. Let&apos;s get you back somewhere extraordinary.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/" className="btn btn-gold btn-sm"><Home size={13} /> Home</Link>
          <Link href="/destinations" className="btn btn-ghost-light btn-sm"><Compass size={13} /> Explore destinations</Link>
        </div>
      </div>
    </div>
  );
}