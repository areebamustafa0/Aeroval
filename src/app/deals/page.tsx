import PageHero from "@/components/site/page-hero";
import { type Offer } from "@/components/home/sections";
import FeaturedFlights from "@/components/home/featured-flights";
import FlightSearchPanel from "@/components/search/flight-search";
import { getAirports, getOffers } from "@/lib/data";
import { IMG } from "@/lib/images";

export const dynamic = "force-dynamic";
export const metadata = { title: "Flight Deals" } as const;

export default async function DealsPage() {
  let airports: Awaited<ReturnType<typeof getAirports>> = [];
  let offers: Offer[] = [];
  try {
    [airports, offers] = await Promise.all([getAirports(), getOffers(8)]);
  } catch { /* database warming up */ }

  return (
    <>
      <PageHero
        img={IMG.takeoff}
        alt="Aircraft lifting off into an evening sky"
        eyebrow="Flight deals"
        title="Exceptional fares for"
        accent="extraordinary places."
        sub="Sample promotional fares from our demo inventory. Search any route below — prices and seat counts come straight from the database."
        height="md"
      />
      <div className="bg-navy-950 pb-16">
        <div className="container-x relative z-20 -mt-24">
          <FlightSearchPanel airports={airports} variant="hero" />
        </div>
      </div>
      <FeaturedFlights offers={offers} />
    </>
  );
}
