import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { destinationImage } from "@/lib/images";
import { money, cx } from "@/lib/format";
import type { DestinationDTO } from "@/lib/data";

const spans = [
  "md:col-span-6", "md:col-span-6",
  "md:col-span-4", "md:col-span-4", "md:col-span-4",
  "md:col-span-3", "md:col-span-3", "md:col-span-3", "md:col-span-3",
  "md:col-span-4", "md:col-span-4", "md:col-span-4",
];

const order = ["maldives", "switzerland", "paris", "dubai", "santorini", "bali", "istanbul", "tokyo", "london", "new-york", "kuala-lumpur", "rome"];

/** A compact, photography-led travel-magazine collage. */
export default function DestinationCollection({ destinations, intro = true }: {
  destinations: DestinationDTO[];
  intro?: boolean;
}) {
  const places = [...destinations].sort((a, b) => {
    const ai = order.indexOf(a.slug);
    const bi = order.indexOf(b.slug);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return (
    <section className={cx("aero-collection", intro && "aero-collection-home")}>
      <div className="container-x">
        {intro && (
          <div className="aero-collection-intro">
            <p className="aero-section-kicker"><span /> THE AEROVÉL COLLECTION <span /></p>
            <h2>Where will your next <em>story</em> begin?</h2>
            <p>From faraway islands to unforgettable city lights, discover extraordinary places worth the journey.</p>
          </div>
        )}
        <div className="aero-collection-grid grid grid-cols-2 md:grid-cols-12">
          {places.map((place, index) => (
            <Link
              key={place.slug}
              href={`/destinations/${place.slug}`}
              className={cx(
                "aero-collection-tile group relative overflow-hidden bg-navy-800",
                index < 2 && "col-span-2 sm:col-span-1",
                spans[index % spans.length]
              )}
            >
              <Image
                src={destinationImage(place.slug, place.imageUrl)}
                alt={`${place.name}, ${place.country}`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 50vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
              />
              <div className="aero-collection-shade absolute inset-0" />
              <div className="aero-collection-caption absolute inset-x-0 bottom-0 z-10">
                <p>{place.country}</p>
                <h3>{place.name}</h3>
                <span>FROM {money(place.startingPrice)} <i> / DEMO FARE</i></span>
              </div>
              <span className="aero-collection-arrow absolute bottom-5 right-5 z-10 flex items-center justify-center rounded-full" aria-hidden="true">
                <ArrowUpRight size={15} />
              </span>
            </Link>
          ))}
        </div>
        {intro && (
          <div className="aero-collection-bottom">
            <span>12 DESTINATIONS. INFINITE STORIES.</span>
            <Link href="/destinations">VIEW ALL DESTINATIONS <ArrowRight size={15} /></Link>
          </div>
        )}
      </div>
    </section>
  );
}
