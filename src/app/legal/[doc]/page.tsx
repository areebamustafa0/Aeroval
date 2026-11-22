import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Reveal } from "@/components/ui";

const DOCS: Record<string, { title: string; intro: string; sections: { h: string; p: string }[] }> = {
  privacy: {
    title: "Privacy Policy",
    intro: "AEROVÉL is a demonstration platform. This policy explains exactly what the demo stores — and what it deliberately never stores.",
    sections: [
      { h: "What we store", p: "Account details you provide (name, email, hashed password, optional phone/nationality/date of birth), bookings, passenger details you enter for demo reservations, saved destinations and newsletter emails. Passwords are bcrypt-hashed; sessions use signed, HTTP-only JWT cookies." },
      { h: "What we never store", p: "Full card numbers and CVV codes are validated in memory for the sandbox payment simulation and immediately discarded. Only the last four digits are kept on the payment receipt. No real payment processor is involved." },
      { h: "Demo data", p: "All flights, fares, schedules, reviews and occupancy figures are fictional sample data. Demo accounts use invented identities. QR codes on e-tickets contain only a booking reference and a non-sensitive verification hash." },
      { h: "Your control", p: "You can update your profile anytime from the dashboard, cancel eligible bookings, and remove saved destinations. Because this is a demo, data may be reset when the sample database is reseeded." },
    ],
  },
  terms: {
    title: "Terms & Conditions",
    intro: "By using AEROVÉL you agree that this is a portfolio-grade demonstration of an airline booking platform, not a real travel service.",
    sections: [
      { h: "No real travel services", p: "AEROVÉL does not sell real tickets, operate flights, or move money. Every fare, seat map, schedule and confirmation is simulated against a sample database." },
      { h: "Sandbox payments", p: "The checkout imitates a payment flow for demonstration purposes. Demo card 4242 4242 4242 4242 succeeds; cards ending 0002 decline. 'Pay at airport' creates a pending manual payment. Nothing is charged, ever." },
      { h: "Fair use", p: "Authentication endpoints are rate-limited. Attempts to abuse the demo, extract other users' data, or double-book seats concurrently are prevented by design — role-based access and transactional row locking are part of the showcase." },
      { h: "Content", p: "Photography is licensed from Pexels photographers (credited in the project README) plus generated brand artwork. Testimonials are fictional and labeled as sample content." },
    ],
  },
  cancellation: {
    title: "Cancellation & Changes",
    intro: "The demo mirrors real airline logic so the management experience feels authentic.",
    sections: [
      { h: "More than 24 hours before departure", p: "Cancel from your dashboard and the booking is cancelled immediately. Seats return to the live map and any successful demo payment is marked refunded." },
      { h: "Within 24 hours of departure", p: "A cancellation request is created for the AEROVÉL team. An administrator reviews and approves it from the admin panel — you'll see 'cancellation requested' on the booking until then." },
      { h: "Rescheduling", p: "Confirmed one-way bookings can move to another flight on the same route, keeping the same seat numbers when available and the same PNR. Fare differences are recalculated transparently (no real charge)." },
      { h: "Round trips", p: "Round-trip changes are handled by the support team in this demo, mirroring airlines that require agent assistance for multi-segment reissues." },
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(DOCS).map((doc) => ({ doc }));
}

export async function generateMetadata({ params }: { params: Promise<{ doc: string }> }): Promise<Metadata> {
  const { doc } = await params;
  return { title: DOCS[doc]?.title ?? "Legal" };
}

export default async function LegalPage({ params }: { params: Promise<{ doc: string }> }) {
  const { doc } = await params;
  const d = DOCS[doc];
  if (!d) notFound();
  return (
    <>
      <section className="bg-navy-950 pb-14 pt-36">
        <div className="container-x">
          <p className="eyebrow text-gold-300">The fine print, beautifully set</p>
          <h1 className="mt-4 font-display text-4xl text-white md:text-5xl">{d.title}</h1>
          <p className="mt-4 max-w-2xl text-[15px] text-white/65">{d.intro}</p>
        </div>
      </section>
      <section className="container-x max-w-3xl py-16">
        <div className="space-y-10">
          {d.sections.map((s, i) => (
            <Reveal key={s.h} delay={0.05 * i}>
              <h2 className="font-display text-2xl text-navy-900">{s.h}</h2>
              <p className="mt-3 text-[15px] leading-[1.9] text-navy-900/65">{s.p}</p>
            </Reveal>
          ))}
        </div>
        <div className="mt-14 flex gap-3">
          <Link href="/" className="btn btn-navy btn-sm">Back home</Link>
          <Link href="/about#contact" className="btn btn-outline btn-sm">Contact us</Link>
        </div>
      </section>
    </>
  );
}