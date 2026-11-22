import type { Metadata } from "next";
import Explorer from "@/components/destinations/explorer";
import PageHero from "@/components/site/page-hero";
import { getDestinations } from "@/lib/data";
import { IMG } from "@/lib/images";
import { ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Explore Destinations" };

export default async function DestinationsPage() {
  let destinations: Awaited<ReturnType<typeof getDestinations>> = [];
  try { destinations = await getDestinations(); } catch { /* database warming up */ }

  return (
    <>
      <PageHero
        img={IMG.destinationEditorial}
        alt="A tropical island surrounded by the turquoise Indian Ocean"
        eyebrow="THE AEROVÉL COLLECTION"
        title="A world of wonders"
        accent="awaits you."
        sub="Find the places that stay with you long after you return. Your next extraordinary story begins here."
        height="md"
      >
        <a href="#gallery" className="aero-explore-link">EXPLORE THE COLLECTION <span><ArrowRight size={15} /></span></a>
      </PageHero>
      <Explorer destinations={destinations} />
    </>
  );
}
