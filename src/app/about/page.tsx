import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Gem, Compass, ShieldCheck, HeartHandshake, Mail, Phone, MapPin } from "lucide-react";
import { Reveal, SectionHead } from "@/components/ui";
import { IMG } from "@/lib/images";

export const metadata: Metadata = { title: "About Us" };

const VALUES = [
  { icon: Gem, title: "Quiet luxury", sub: "Rich photography, editorial typography and champagne details — never loud, always considered." },
  { icon: Compass, title: "Wanderlust, engineered", sub: "A booking engine with transactional seat locking behind a magazine-like experience." },
  { icon: ShieldCheck, title: "Trust by design", sub: "Hashed passwords, JWT sessions, role-based access and honest demo labeling." },
  { icon: HeartHandshake, title: "Care everywhere", sub: "One experience that feels native on a cinema display or a phone in your palm." },
];

export default function AboutPage() {
  return (
    <>
      <section className="relative flex min-h-[62svh] items-end overflow-hidden pb-16 pt-40">
        <Image src={IMG.goldenFlight} alt="Airliner crossing a golden sunset sky" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/92 via-navy-950/35 to-navy-950/30" />
        <div className="container-x relative z-10">
          <Reveal>
            <p className="eyebrow text-gold-300">About AEROVÉL</p>
            <h1 className="mt-5 max-w-3xl font-display text-4xl leading-[1.08] text-white md:text-6xl">
              We believe the journey <span className="italic text-gold-300">is the destination.</span>
            </h1>
            <p className="mt-5 max-w-xl text-[15.5px] leading-relaxed text-white/75">
              AEROVÉL is a premium demonstration airline platform — a love letter to travel
              built with real booking logic, real seat locking and unreal scenery.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section-tight">
        <div className="container-x grid items-center gap-16 lg:grid-cols-2">
          <div>
            <SectionHead eyebrow="Our story" title={<>Born from a simple idea: <span className="italic text-gold-600">booking should feel like boarding.</span></>} />
            <Reveal delay={0.1}>
              <p className="lede mt-7 text-navy-900/68">
                Most airline websites feel like paperwork. We imagined one that feels like the
                window seat — cinematic, calm and quietly exciting. Every screen, from the
                sunset hero to the QR-coded e-ticket, is designed to make you feel the trip
                before you take it.
              </p>
              <p className="lede mt-5 text-navy-900/68">
                Under the beauty sits a serious engine: PostgreSQL transactions that prevent
                double-booked seats, sandbox payments that never touch real cards, and a
                progressive web app that travels offline with you. All flights, fares and
                reviews are fictional demo data — clearly labeled, honestly presented.
              </p>
              <Link href="/destinations" className="btn btn-navy mt-9">Start exploring <ArrowRight size={14} /></Link>
            </Reveal>
          </div>
          <Reveal delay={0.15}>
            <div className="relative">
              <div className="relative h-[420px] overflow-hidden rounded-3xl">
                <Image src={IMG.wingClouds} alt="Wing above soft clouds" fill sizes="(max-width:1024px) 100vw, 50vw" className="object-cover" />
              </div>
              <div className="card absolute -bottom-8 -left-4 hidden w-56 p-5 sm:block lg:-left-10">
                <p className="font-num text-3xl font-bold text-navy-900">40,000<span className="text-gold-500">ft</span></p>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.2em] text-mist">of perspective, standard</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-navy-950 section">
        <div className="container-x">
          <SectionHead tone="light" center eyebrow="What guides us"
            title={<>Four values, <span className="italic text-gold-300">one standard.</span></>} />
          <div className="mt-16 grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v, i) => (
              <Reveal key={v.title} delay={0.07 * i} className="text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-gold-400/35 bg-gold-400/10 text-gold-300">
                  <v.icon size={19} />
                </span>
                <h3 className="display-sm mt-6 text-white">{v.title}</h3>
                <p className="lede-sm mt-3 text-white/55">{v.sub}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="scroll-mt-24 section-tight">
        <div className="container-x grid gap-12 lg:grid-cols-2">
          <SectionHead eyebrow="Contact & care" title={<>We&apos;re here, <span className="italic text-gold-600">wherever you are.</span></>}
            sub="This is a demonstration platform — the channels below are illustrative, but the care behind the product is real." />
          <Reveal delay={0.1} className="space-y-4">
            {[
              { icon: Mail, label: "Email", value: "care@aerovel.demo" },
              { icon: Phone, label: "Phone", value: "+92 42 111 237 685" },
              { icon: MapPin, label: "Studio", value: "AEROVÉL House, 12 Skyline Boulevard, Lahore" },
            ].map((c) => (
              <div key={c.label} className="card card-lux flex items-center gap-4 p-6">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-gold-300"><c.icon size={17} /></span>
                <div>
                  <p className="text-[9.5px] font-semibold uppercase tracking-[0.22em] text-mist">{c.label}</p>
                  <p className="mt-0.5 text-[15px] font-semibold text-navy-900">{c.value}</p>
                </div>
              </div>
            ))}
          </Reveal>
        </div>
      </section>
    </>
  );
}