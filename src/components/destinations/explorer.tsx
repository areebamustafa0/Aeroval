"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { EmptyState } from "@/components/ui";
import DestinationCollection from "@/components/home/collection";
import { cx } from "@/lib/format";
import type { DestinationDTO } from "@/lib/data";

const regions = ["All", "Asia", "Europe", "Middle East", "Islands", "Americas"];

export default function Explorer({ destinations }: { destinations: DestinationDTO[] }) {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("All");
  const filtered = useMemo(() => destinations.filter((destination) => {
    const matchesSearch = `${destination.name} ${destination.country} ${destination.tagline}`.toLowerCase().includes(query.toLowerCase().trim());
    return matchesSearch && (region === "All" || destination.region === region);
  }), [destinations, query, region]);

  return (
    <div id="gallery" className="scroll-mt-24">
      <div className="container-x aero-explore-intro">
        <p className="aero-breadcrumb">HOME <span>/</span> DESTINATIONS</p>
        <p className="aero-section-kicker"><span /> PLACES THAT MOVE YOU <span /></p>
        <h2>Beautiful places. <em>Endless possibilities.</em></h2>
        <p>From turquoise shores and alpine escapes to cities filled with stories, explore a collection of places chosen to inspire your next journey.</p>
        <div className="aero-explore-filters">
          <label className="aero-destination-search">
            <Search size={16} />
            <span className="sr-only">Search destinations</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search a destination or country" />
          </label>
          <div className="aero-region-filters scrollbar-hide" aria-label="Filter by region">
            <SlidersHorizontal size={15} className="shrink-0 text-gold-600" />
            {regions.map((item) => (
              <button key={item} type="button" aria-pressed={region === item} onClick={() => setRegion(item)}
                className={cx("aero-region-pill", region === item && "is-active")}>{item}</button>
            ))}
          </div>
        </div>
      </div>
      {filtered.length ? (
        <DestinationCollection destinations={filtered} intro={false} />
      ) : (
        <div className="container-x pb-20"><EmptyState title="No destinations found" sub="Try another search or region to discover more of the world." /></div>
      )}
    </div>
  );
}
