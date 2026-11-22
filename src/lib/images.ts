/** Central registry of licensed photography (Pexels) + generated brand assets. */
export const px = (id: number, w = 1400, h = 900) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=${w}&h=${h}`;

/** Pexels URLs with a custom slug instead of the default filename. */
export const pxNamed = (id: number, slug: string, w = 1400, h = 900) =>
  `https://images.pexels.com/photos/${id}/${slug}?auto=compress&cs=tinysrgb&fit=crop&w=${w}&h=${h}`;

export const IMG = {
  hero: "/images/hero-aerovel.svg",
  heroMobile: "/images/hero-mobile.svg",
  cabinEditorial: "/images/cabin-editorial.svg",
  destinationEditorial: "/images/destination-editorial.svg",
  icon: "/icons/icon-512.svg",
  sunsetSilhouette: px(6479834, 1600, 1000),
  goldenFlight: px(8281060, 1600, 1000),
  wingSunset: px(91217, 1800, 1000),
  wingClouds: px(10834384, 1400, 900),
  wingBlue: px(36705757, 1400, 900),
  wingSky: px(32138460, 1400, 900),
  windowClouds: px(2817479, 1600, 900),
  windowOcean: px(28628047, 1600, 1000),
  cabinBright: px(36016234, 1800, 1000),
  cabinScreens: px(18090297, 1400, 900),
  cabinSeats: px(5233240, 1400, 900),
  takeoff: px(8281070, 1800, 1000),
  landing: px(10357472, 1600, 1000),
  airportCeiling: px(14018325, 1600, 1000),
  airportSilhouette: px(16936915, 1600, 1000),
  airportCeiling2: px(36874553, 1400, 900),
};

/** Locally hosted Pexels photographs for fast, dependable destination imagery. */
export const LOCAL_DESTINATION_IMAGES: Record<string, string> = {
  maldives: "/images/places/maldives.svg",
  switzerland: "/images/places/switzerland.svg",
  dubai: "/images/places/dubai-sunset.svg",
  paris: "/images/places/paris.svg",
  istanbul: "/images/places/istanbul.svg",
  bali: "/images/places/bali.svg",
  santorini: "/images/places/santorini.svg",
  london: "/images/places/london.svg",
  tokyo: "/images/places/tokyo.svg",
  "new-york": "/images/places/new-york.svg",
  "kuala-lumpur": "/images/places/kuala-lumpur.svg",
  rome: "/images/places/rome.svg",
};

export const destinationImage = (slug: string, fallback: string) =>
  LOCAL_DESTINATION_IMAGES[slug] ?? fallback;

/* ───────────── per-destination galleries (5–6 each) ───────────── */
export const DEST_GALLERY: Record<string, string[]> = {
  maldives: [px(9080953), px(1724430), px(9080918), px(2549017), px(9080917), px(4631160)],
  switzerland: [px(37713450), px(29734980), px(5546151), px(20755844), px(37713470), px(16418182)],
  dubai: [px(19894545), px(28350360), px(1001841), px(16908868), px(1470405), px(16908858)],
  paris: [px(16823628), px(38998600), px(21528887), px(2939808), px(2574533), px(18781088)],
  istanbul: [px(17872545), px(11088144), px(39117789), px(18899392), px(32744583), px(14018325)],
  bali: [px(35428411), px(34790496), px(14025188), px(15994332), px(14025282), px(14037349)],
  santorini: [px(37844492), px(37844509), pxNamed(161815, "santorini-oia-greece-water-161815.jpeg"), px(18774888), px(37844623), px(20097585)],
  london: [px(35696241), px(30624873), px(3029390), px(1822684), px(12857252), px(39117789)],
  tokyo: [px(31418358), px(30780336), px(30933060), px(31710067), px(29518215), px(12857252)],
  "new-york": [px(8569166), px(1461370), px(35491607), px(33619969), px(7078882), px(3029390)],
  "kuala-lumpur": [px(37723021), px(415921), px(12857252), px(10490921), px(1822684), px(30933060)],
  rome: [px(33008932), px(27112031), px(18781088), px(36687114), px(29487687), px(7995539)],
};

export const DEST_IMAGES: Record<string, { main: string; alt: string }> = Object.fromEntries(
  Object.entries(DEST_GALLERY).map(([slug, imgs]) => [slug, { main: imgs[0]!, alt: imgs[1]! }])
);

export const PORTRAITS = [
  px(6497114, 400, 400),
  px(33799456, 400, 400),
  px(35490803, 400, 400),
  px(35490806, 400, 400),
];

/* ───────────── aircraft showcase ───────────── */
export const SHOWCASE = [
  { src: IMG.goldenFlight, title: "Golden hour, every hour", caption: "Chasing sunsets at 40,000 feet" },
  { src: IMG.wingBlue, title: "Above it all", caption: "The quiet calm of the cruise" },
  { src: IMG.takeoff, title: "The moment of lift", caption: "Where every story begins" },
  { src: IMG.cabinBright, title: "A cabin like no other", caption: "Space, light and considered detail" },
  { src: IMG.windowOcean, title: "Your window seat", caption: "The best view in the house" },
  { src: IMG.landing, title: "Arrivals, elevated", caption: "Touchdowns worth watching" },
];

/* ───────────── mosaic gallery — the editorial collage ───────────── */
export type Moment = { src: string; label: string; sub: string };

export const MOMENTS: Moment[] = [
  { src: DEST_GALLERY.maldives[0]!, label: "Maldives", sub: "Turquoise atolls" },
  { src: DEST_GALLERY.switzerland[1]!, label: "Switzerland", sub: "Alpine lakes" },
  { src: DEST_GALLERY.dubai[0]!, label: "Dubai", sub: "Golden skyline" },
  { src: DEST_GALLERY.paris[1]!, label: "Paris", sub: "Café mornings" },
  { src: DEST_GALLERY.santorini[1]!, label: "Santorini", sub: "White villages" },
  { src: DEST_GALLERY.bali[2]!, label: "Bali", sub: "Rice terraces" },
  { src: DEST_GALLERY.istanbul[0]!, label: "Istanbul", sub: "Two continents" },
  { src: DEST_GALLERY.rome[2]!, label: "Venice", sub: "Quiet canals" },
  { src: DEST_GALLERY.tokyo[1]!, label: "Tokyo", sub: "Neon nights" },
  { src: DEST_GALLERY["new-york"][1]!, label: "New York", sub: "Bridge views" },
  { src: DEST_GALLERY.maldives[5]!, label: "Coral reefs", sub: "Beneath the surface" },
  { src: DEST_GALLERY.switzerland[2]!, label: "Alpine railways", sub: "Through the snow" },
  { src: DEST_GALLERY.dubai[3]!, label: "Desert dunes", sub: "Endless gold" },
  { src: DEST_GALLERY.maldives[2]!, label: "Overwater villas", sub: "Living on the lagoon" },
  { src: DEST_GALLERY.bali[4]!, label: "Terraced valleys", sub: "Emerald steps" },
  { src: DEST_GALLERY.dubai[4]!, label: "Marina lights", sub: "Cities after dark" },
  { src: DEST_GALLERY.istanbul[2]!, label: "Old towns", sub: "Cobbled stories" },
  { src: DEST_GALLERY.paris[2]!, label: "Street corners", sub: "Everyday romance" },
  { src: DEST_GALLERY.tokyo[2]!, label: "Night alleys", sub: "Lantern-lit lanes" },
  { src: DEST_GALLERY.rome[5]!, label: "Turquoise coast", sub: "Cliffs and coves" },
  { src: DEST_GALLERY.maldives[3]!, label: "Palm beaches", sub: "Sand and shade" },
  { src: IMG.windowOcean, label: "Above the clouds", sub: "The window seat" },
  { src: DEST_GALLERY.switzerland[3]!, label: "Still waters", sub: "Mountain reflections" },
  { src: DEST_GALLERY["new-york"][2]!, label: "Skyline dusk", sub: "Bridges at blue hour" },
];

export const AIRPORT_MOMENTS: Moment[] = [
  { src: IMG.airportCeiling, label: "Madrid Barajas", sub: "Architecture of departure" },
  { src: IMG.airportCeiling2, label: "Mumbai", sub: "Ceilings worth looking up at" },
  { src: IMG.airportSilhouette, label: "Departures", sub: "The quiet before takeoff" },
  { src: IMG.cabinScreens, label: "On board", sub: "Entertainment at every seat" },
  { src: IMG.cabinSeats, label: "The cabin", sub: "Settling in for the journey" },
  { src: IMG.wingClouds, label: "Wing and cloud", sub: "Miles to go" },
];