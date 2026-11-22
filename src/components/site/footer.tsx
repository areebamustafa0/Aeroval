import Link from "next/link";
import { Mail, Phone, MapPin, ArrowRight } from "lucide-react";
import { BrandMark } from "@/components/site/nav";

const QUICK = [
  { href: "/", label: "Home" },
  { href: "/destinations", label: "Explore" },
  { href: "/deals", label: "Flight Deals" },
  { href: "/flights", label: "Book a Flight" },
  { href: "/dashboard", label: "Manage Booking" },
  { href: "/about", label: "About Us" },
];
const DESTS = [
  { href: "/destinations/maldives", label: "Maldives" },
  { href: "/destinations/paris", label: "Paris" },
  { href: "/destinations/dubai", label: "Dubai" },
  { href: "/destinations/santorini", label: "Santorini" },
  { href: "/destinations/tokyo", label: "Tokyo" },
  { href: "/destinations/switzerland", label: "Switzerland" },
];
const SUPPORT = [
  { href: "/dashboard", label: "Booking Support" },
  { href: "/about#contact", label: "Contact Us" },
  { href: "/legal/privacy", label: "Privacy Policy" },
  { href: "/legal/terms", label: "Terms & Conditions" },
  { href: "/legal/cancellation", label: "Cancellation Policy" },
];

const SOCIALS: { label: string; d: string }[] = [
  { label: "Instagram", d: "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm5 5.5A4.5 4.5 0 1 0 16.5 12 4.5 4.5 0 0 0 12 7.5Zm0 2A2.5 2.5 0 1 1 9.5 12 2.5 2.5 0 0 1 12 9.5ZM17.8 5a1.2 1.2 0 1 0 1.2 1.2A1.2 1.2 0 0 0 17.8 5Z" },
  { label: "Facebook", d: "M14 8h3V5h-3a4 4 0 0 0-4 4v3H7v3h3v7h3v-7h3l1-3h-4V9a1 1 0 0 1 1-1Z" },
  { label: "X", d: "M4 3h4.6l4.1 5.9L17.8 3H21l-6.6 7.6L21.4 21h-4.6l-4.5-6.4L6.7 21H3.5l7-8.1Z" },
  { label: "YouTube", d: "M22 12s0-3.4-.4-5a2.8 2.8 0 0 0-2-2C17.9 4.5 12 4.5 12 4.5s-5.9 0-7.6.5a2.8 2.8 0 0 0-2 2C2 8.6 2 12 2 12s0 3.4.4 5a2.8 2.8 0 0 0 2 2c1.7.5 7.6.5 7.6.5s5.9 0 7.6-.5a2.8 2.8 0 0 0 2-2c.4-1.6.4-5 .4-5ZM10 15.5v-7l6 3.5Z" },
  { label: "LinkedIn", d: "M6.5 8.5v12H3v-12ZM4.7 3a2 2 0 1 1-2 2 2 2 0 0 1 2-2ZM21 13.4v7.1h-3.5v-6.6c0-1.7-.6-2.8-2.1-2.8a2.3 2.3 0 0 0-2.1 1.5 2.9 2.9 0 0 0-.1 1v6.9H9.7v-12h3.5v1.6a3.5 3.5 0 0 1 3.2-1.8c2.3 0 4.6 1.5 4.6 5.1Z" },
];

const COLS = [
  { title: "Quick Links", items: QUICK },
  { title: "Destinations", items: DESTS },
  { title: "Support", items: SUPPORT },
];

export default function SiteFooter() {
  return (
    <footer className="no-print relative overflow-hidden bg-navy-950 pb-28 pt-24 text-white md:pb-14">
      {/* soft gold bloom */}
      <div aria-hidden="true" className="pointer-events-none absolute -top-56 right-[-10%] h-[26rem] w-[26rem] rounded-full bg-gold-400/[0.055] blur-[110px]" />

      <div className="container-x relative">
        {/* top: brand + contact (newsletter lives once, in the Stay Inspired band above) */}
        <div className="grid gap-14 lg:grid-cols-[1.15fr_1fr] lg:items-start">
          <div>
            <BrandMark />
            <p className="lede mt-7 max-w-sm text-white/52">
              The world is yours. A premium demonstration airline experience —
              crafted for travelers who believe every journey should be extraordinary.
            </p>
            <div className="mt-8 flex gap-2">
              {SOCIALS.map((s) => (
                <a
                  key={s.label} href="#"
                  aria-label={`${s.label} (demo)`}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.13] text-white/55 transition duration-300 hover:border-gold-400/60 hover:text-gold-300"
                >
                  <svg viewBox="0 0 24 24" className="h-[14px] w-[14px]" fill="currentColor" aria-hidden="true"><path d={s.d} /></svg>
                </a>
              ))}
            </div>
          </div>

          <div className="lg:pt-1">
            <p className="eyebrow text-gold-400">Concierge & contact</p>
            <p className="lede-sm mt-4 max-w-sm text-white/52">
              Questions about a booking or your next journey? Our demo travel team is here to help.
            </p>
            <ul className="mt-7 grid gap-x-6 gap-y-3.5 text-[13px] text-white/52 sm:grid-cols-2">
              <li className="flex items-center gap-2.5"><Mail size={13.5} className="shrink-0 text-gold-400" /> care@aerovel.demo</li>
              <li className="flex items-center gap-2.5"><Phone size={13.5} className="shrink-0 text-gold-400" /> +92 42 111 237 685</li>
              <li className="flex items-start gap-2.5 sm:col-span-2">
                <MapPin size={13.5} className="mt-0.5 shrink-0 text-gold-400" />
                AEROVÉL House, 12 Skyline Boulevard, Lahore
              </li>
            </ul>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link href="/flights" className="link-quiet text-gold-300 hover:text-gold-200">PLAN YOUR JOURNEY <ArrowRight size={13} /></Link>
              <Link href="/about#contact" className="link-quiet text-white/55 hover:text-white">CONTACT US <ArrowRight size={13} /></Link>
            </div>
          </div>
        </div>

        {/* hairline */}
        <div className="rule my-16" />

        {/* link columns */}
        <div className="grid gap-12 sm:grid-cols-3">
          {COLS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h4 className="text-[10px] font-semibold uppercase tracking-[0.32em] text-gold-400">{col.title}</h4>
              <ul className="mt-6 space-y-3.5">
                {col.items.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="group inline-flex items-center gap-0 text-[13.5px] text-white/55 transition-colors duration-300 hover:text-gold-200"
                    >
                      <span className="h-px w-0 bg-gold-400 transition-all duration-300 group-hover:mr-2.5 group-hover:w-3" />
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* bottom bar */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/[0.08] pt-7 text-[11.5px] text-white/35 md:flex-row">
          <p>© {new Date().getFullYear()} AEROVÉL. All rights reserved. Demonstration platform — no real flights or payments.</p>
          <div className="flex gap-7">
            <Link href="/legal/privacy" className="link-quiet normal-case tracking-[0.06em] text-[11.5px]">Privacy</Link>
            <Link href="/legal/terms" className="link-quiet normal-case tracking-[0.06em] text-[11.5px]">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
