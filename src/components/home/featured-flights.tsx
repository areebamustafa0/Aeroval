import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Luggage, Plane, Sparkles } from "lucide-react";
import { fmtDate, fmtDur, money } from "@/lib/format";
import type { DestinationDTO, FlightDTO } from "@/lib/data";

export type FeaturedOffer = { flight: FlightDTO | null; destination: DestinationDTO };

/** Actual upcoming, bookable demo flights with destination photography. */
export default function FeaturedFlights({ offers }: { offers: FeaturedOffer[] }) {
  const available = offers.filter((offer): offer is { flight: FlightDTO; destination: DestinationDTO } => Boolean(offer.flight));

  return (
    <section className="featured-flights" id="flight-offers">
      <div className="container-x">
        <div className="featured-heading">
          <div>
            <p className="featured-kicker"><Sparkles size={13} /> A LITTLE INSPIRATION FOR YOUR NEXT TRIP</p>
            <h2>Wonderful places. <em>Wonderful fares.</em></h2>
            <p>Let your next adventure begin with a flight worth looking forward to.</p>
          </div>
          <Link href="/flights" className="featured-view-all">VIEW ALL FLIGHTS <ArrowRight size={15} /></Link>
        </div>
        {available.length ? (
          <div className="featured-flight-grid">
            {available.map(({ flight, destination }, index) => (
              <article className="featured-flight-card group" key={flight.id}>
                <div className="featured-flight-image">
                  <Image
                    src={index === 0 && destination.slug === "maldives" ? "/images/flight-islands.svg" : destination.imageUrl}
                    alt={`${destination.name}, ${destination.country}`}
                    fill
                    sizes="(max-width: 640px) 85vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="featured-flight-image-shade" />
                  <span className="featured-flight-tag">{flight.stops === 0 ? "NON-STOP" : `${flight.stops} STOP${flight.stops > 1 ? "S" : ""}`} · DEMO FARE</span>
                  <div className="featured-flight-place"><span>{destination.country}</span><h3>{destination.name}</h3></div>
                </div>
                <div className="featured-flight-body">
                  <div className="featured-flight-route">
                    <div><strong>{flight.origin.code}</strong><span>{flight.origin.city}</span></div>
                    <div className="featured-flight-line"><span /><Plane size={15} /><span /></div>
                    <div className="text-right"><strong>{flight.destination.code}</strong><span>{flight.destination.city}</span></div>
                  </div>
                  <div className="featured-flight-meta">
                    <span><CalendarDays size={13} /> {fmtDate(flight.departureAt)}</span>
                    <span>{fmtDur(flight.durationMinutes)}</span>
                  </div>
                  <div className="featured-flight-airline"><span className="featured-airline-dot" /> {flight.airline.name} · {flight.flightNumber} <span className="featured-seats">{flight.seatsLeft} seats</span></div>
                  <div className="featured-flight-bottom">
                    <div><span>FROM</span><strong>{money(flight.price)}</strong><small> / guest</small></div>
                    <Link href={`/book/${flight.id}?pax=1&cabin=economy`} aria-label={`View ${flight.origin.city} to ${flight.destination.city} flight ${flight.flightNumber}`}>
                      VIEW FLIGHT <ArrowRight size={14} />
                    </Link>
                  </div>
                  <p className="featured-baggage"><Luggage size={12} /> Checked baggage included · Economy</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="featured-empty">
            <Plane size={20} />
            <span>No upcoming demo fares are available right now. Search the schedule for your next journey.</span>
            <Link href="/flights">SEARCH FLIGHTS <ArrowRight size={14} /></Link>
          </div>
        )}
        <p className="featured-disclaimer">Fictional demo flights and fares. No real airline inventory or payments.</p>
      </div>
    </section>
  );
}
