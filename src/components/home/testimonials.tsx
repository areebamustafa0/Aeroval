"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Star } from "lucide-react";

const reviews = [
  { name: "Amara Okafor", location: "Lagos, Nigeria", image: "/images/people/amara.svg", quote: "From the very first search, the whole experience felt beautifully considered. It made me fall in love with the journey before I had even left home." },
  { name: "Daniel Reyes", location: "Madrid, Spain", image: "/images/people/daniel.svg", quote: "Every detail felt effortless — from finding the perfect flight to choosing my seat. A truly lovely way to start an adventure." },
  { name: "Henrik Larsen", location: "Copenhagen, Denmark", image: "/images/people/henrik.svg", quote: "Travel should feel exciting, not complicated. This made planning my next journey feel just as special as the trip itself." },
];

export default function Testimonials() {
  const [index, setIndex] = useState(0);
  const review = reviews[index]!;
  const move = (direction: number) => setIndex((current) => (current + direction + reviews.length) % reviews.length);

  return (
    <section className="aero-testimonials">
      <div className="container-x">
        <div className="aero-testimonials-heading">
          <p className="aero-section-kicker"><span /> TRAVELER STORIES <span /></p>
          <h2>Words from <em>the journey.</em></h2>
          <p>Little moments, lasting memories. Fictional stories created for this demo.</p>
        </div>
        <div className="aero-testimonials-layout">
          <div className="aero-testimonials-photo aero-testimonials-photo-left">
            <Image src="/images/places/maldives-villas.svg" alt="Overwater villas in the Maldives" fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" />
            <span>THE MALDIVES</span>
          </div>
          <div className="aero-testimonials-quote" aria-live="polite">
            <div className="aero-quote-mark">“</div>
            <div className="aero-stars" aria-label="5 out of 5 stars">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={13} fill="currentColor" />)}</div>
            <blockquote>{review.quote}</blockquote>
            <div className="aero-reviewer">
              <Image src={review.image} alt="" width={46} height={46} className="rounded-full object-cover" />
              <span><strong>{review.name}</strong><small>{review.location}</small></span>
            </div>
            <div className="aero-review-controls">
              <button type="button" onClick={() => move(-1)} aria-label="Previous story"><ArrowLeft size={15} /></button>
              <span>{String(index + 1).padStart(2, "0")} / {String(reviews.length).padStart(2, "0")}</span>
              <button type="button" onClick={() => move(1)} aria-label="Next story"><ArrowRight size={15} /></button>
            </div>
          </div>
          <div className="aero-testimonials-photo aero-testimonials-photo-right">
            <Image src="/images/places/alpine-lake.svg" alt="A peaceful lake beneath the Swiss Alps" fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" />
            <span>THE SWISS ALPS</span>
          </div>
        </div>
      </div>
    </section>
  );
}
