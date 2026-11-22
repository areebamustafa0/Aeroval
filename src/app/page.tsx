import Hero from "@/components/home/hero";
import FlightSearchPanel from "@/components/search/flight-search";
import DestinationCollection from "@/components/home/collection";
import EditorialExperience from "@/components/home/editorial-experience";
import FeaturedFlights from "@/components/home/featured-flights";
import { NewsletterBand, type Offer } from "@/components/home/sections";
import Showcase from "@/components/home/showcase";
import Testimonials from "@/components/home/testimonials";
import { ShieldCheck, TicketCheck, Headphones, PlaneTakeoff } from "lucide-react";
import { getAirports, getDestinations, getOffers, type DestinationDTO } from "@/lib/data";
import { LOCAL_DESTINATION_IMAGES } from "@/lib/images";

export const dynamic = "force-dynamic";

const fallbackPlaces = [
  ["maldives", "Maldives", "Maldives", 599],
  ["switzerland", "Switzerland", "Switzerland", 649],
  ["paris", "Paris", "France", 449],
  ["dubai", "Dubai", "United Arab Emirates", 299],
  ["santorini", "Santorini", "Greece", 479],
  ["bali", "Bali", "Indonesia", 529],
  ["istanbul", "Istanbul", "Türkiye", 379],
  ["tokyo", "Tokyo", "Japan", 699],
  ["london", "London", "United Kingdom", 519],
  ["new-york", "New York", "United States", 749],
  ["kuala-lumpur", "Kuala Lumpur", "Malaysia", 459],
  ["rome", "Rome", "Italy", 469],
] as const;

const fallback: DestinationDTO[] = fallbackPlaces.map(([slug, name, country, startingPrice], index) => ({
  id: -1 - index,
  slug,
  name,
  country,
  region: "",
  airportCode: "",
  tagline: "Extraordinary places, curated for you.",
  description: "",
  imageUrl: LOCAL_DESTINATION_IMAGES[slug]!,
  gallery: [],
  attractions: [],
  startingPrice,
  bestTime: "",
  language: "",
  currencyName: "",
  flightTime: "",
  trending: false,
  popular: true,
  createdAt: new Date(),
}));

const promises = [
  { icon: PlaneTakeoff, title: "Effortless booking", text: "Your journey, made simple" },
  { icon: ShieldCheck, title: "Book with confidence", text: "Safe and secure, always" },
  { icon: TicketCheck, title: "Your trip in one place", text: "Manage your travels easily" },
  { icon: Headphones, title: "Here for your journey", text: "Thoughtful support, always" },
];

export default async function HomePage() {
  let airports: Awaited<ReturnType<typeof getAirports>> = [];
  let destinations: DestinationDTO[] = [];
  let offers: Offer[] = [];

  try {
    [airports, destinations, offers] = await Promise.all([getAirports(), getDestinations(), getOffers(4)]);
  } catch {
    // Keep the photography-led page available while the database warms up.
  }

  const places = destinations.length ? destinations : fallback;

  return (
    <>
      <Hero />
      <div id="search" className="aero-search-wrap container-x relative z-20 scroll-mt-24">
        <FlightSearchPanel airports={airports} variant="editorial" />
      </div>
      <div className="aero-assurances container-x" aria-label="The AEROVÉL promise">
        {promises.map(({ icon: Icon, title, text }) => (
          <div className="aero-assurance" key={title}>
            <span className="aero-assurance-icon"><Icon size={20} strokeWidth={1.5} /></span>
            <span><strong>{title}</strong><small>{text}</small></span>
          </div>
        ))}
      </div>
      <FeaturedFlights offers={offers} />
      <DestinationCollection destinations={places} />
      <EditorialExperience />
      <Showcase />
      <Testimonials />
      <NewsletterBand />
    </>
  );
}
