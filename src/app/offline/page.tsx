import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { WifiOff, Compass, Home } from "lucide-react";

export const metadata: Metadata = { title: "You're Offline" };

export default function OfflinePage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-navy-950 px-5">
      <div className="pointer-events-none absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-gold-400/8 blur-3xl" />
      <div className="relative z-10 max-w-md text-center">
        <Image src="/icons/icon-512.svg" alt="AEROVÉL" width={72} height={72} className="mx-auto rounded-2xl" />
        <p className="eyebrow mt-8 justify-center text-gold-300">AEROVÉL</p>
        <h1 className="mt-4 font-display text-3xl text-white md:text-4xl">You&apos;re above the clouds — and offline.</h1>
        <div className="mt-5 flex items-center justify-center gap-2 text-white/60">
          <WifiOff size={16} className="text-gold-400" />
          <p className="text-sm">Live flight availability and bookings need a connection.</p>
        </div>
        <p className="mt-3 text-[13px] leading-relaxed text-white/45">
          We never show cached seat availability as if it were live. Reconnect and everything
          refreshes instantly — your saved session stays with you.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn btn-gold btn-sm"><Home size={13} /> Try again</Link>
          <Link href="/destinations" className="btn btn-ghost-light btn-sm"><Compass size={13} /> Explore when online</Link>
        </div>
      </div>
    </div>
  );
}