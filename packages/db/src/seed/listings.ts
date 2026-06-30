import type { FloodZone } from "../schema/json";
import type { NewListing } from "../schema/listings";
import { buildDescription } from "./descriptions";
import { computeEstimates } from "./estimates";
import { PLACES, jitterCoord, type Place } from "./geo";
import { photoUrls } from "./photos";
import { type Rng } from "./prng";

// geom carried as a [lng,lat] tuple here (Zod-valid); the runner converts it to ST_SetSRID.
export type SeedListing = NewListing & { geom: [number, number] };

const PROPERTY_TYPES = ["single_family", "condo", "townhouse", "villa"] as const;
const STREETS = [
  "Oak St",
  "Lakeview Dr",
  "Magnolia Ave",
  "Heron Ct",
  "Cypress Ln",
  "Palmetto Way",
  "Maple Ter",
  "Sago Blvd",
  "Live Oak Trl",
  "Bayshore Rd",
];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function slug6(rng: Rng): string {
  return Math.floor(rng.next() * 1e6).toString(36);
}

function priceFor(tier: 1 | 2 | 3, rng: Rng): number {
  const ranges = { 1: [250000, 480000], 2: [400000, 780000], 3: [650000, 1450000] } as const;
  const [min, max] = ranges[tier];
  return Math.round(rng.int(min, max) / 1000) * 1000;
}

function floodFor(waterfront: boolean, rng: Rng): FloodZone {
  if (waterfront) return rng.chance(0.6) ? "AE" : "A";
  return rng.chance(0.12) ? "AE" : "X";
}

function buildOne(place: Place, index: number, rng: Rng, source: "mock" | "manual"): SeedListing {
  const propertyType = rng.pick(PROPERTY_TYPES);
  const waterfront = rng.chance(place.waterChance);
  const floodZone = floodFor(waterfront, rng);
  const price = priceFor(place.priceTier, rng);
  const beds = rng.int(2, propertyType === "condo" ? 3 : 5);
  const baths = rng.pick([2, 2, 2.5, 3, 3.5]);
  const sqft = rng.int(1100, propertyType === "condo" ? 1900 : 3800);
  const yearBuilt = rng.int(1985, 2024);
  const slug = `${slugify(place.neighborhood)}-${slug6(rng)}-${index}`;
  const estimates = computeEstimates(price, floodZone);

  const hoaFeeMonthly =
    propertyType === "condo" || propertyType === "townhouse"
      ? rng.int(220, 560)
      : place.community === "hoa"
        ? rng.int(60, 220)
        : place.community === "planned_cdd"
          ? rng.int(80, 200)
          : 0;
  const cddFeeAnnual =
    place.community === "planned_cdd" && rng.chance(0.8) ? rng.int(900, 2400) : 0;

  // searchable features (D3 filters). `waterfront` is already drawn above.
  const pool = rng.chance(propertyType === "condo" ? 0.15 : 0.45);
  const ageRestricted = rng.chance(0.1); // a few 55+ communities

  const [lng, lat] = jitterCoord(place, rng);

  return {
    source,
    status: source === "manual" ? "off_market" : "active",
    visibility: "public",
    slug,
    propertyType,
    price,
    bedrooms: beds,
    bathrooms: String(baths),
    sqft,
    lotSizeSqft: propertyType === "condo" ? null : rng.int(4000, 14000),
    yearBuilt,
    description: buildDescription(rng, {
      beds,
      baths,
      sqft,
      neighborhood: place.neighborhood,
      yearBuilt,
    }),
    addressLine1: `${rng.int(100, 9899)} ${rng.pick(STREETS)}`,
    city: place.city,
    state: "FL",
    zip: place.zip,
    county: place.county,
    latitude: lat.toFixed(6),
    longitude: lng.toFixed(6),
    geom: [lng, lat],
    floodZone,
    hoaFeeMonthly: hoaFeeMonthly || null,
    cddFeeAnnual: cddFeeAnnual || null,
    waterfront,
    pool,
    ageRestricted,
    ...estimates,
    photos: photoUrls(slug, rng.int(4, 7)),
    // A deterministic ~18% / ~25% of mock rows carry media so the demo exercises video + 3D tour.
    // Public sample embeds — replaced with real per-listing media when the MLS feed arrives.
    videoUrl:
      source === "mock" && rng.chance(0.18) ? "https://www.youtube.com/embed/aqz-KE-bpKQ" : null,
    virtualTourUrl:
      source === "mock" && rng.chance(0.25)
        ? "https://my.matterport.com/show/?m=SxQL3iGyvQk"
        : null,
  };
}

export function generateListings(rng: Rng): SeedListing[] {
  const out: SeedListing[] = [];
  const total = 120;
  const weightSum = PLACES.reduce((s, p) => s + p.weight, 0);
  let i = 0;
  for (const place of PLACES) {
    const n = Math.max(1, Math.round((place.weight / weightSum) * total));
    for (let k = 0; k < n && out.length < total; k++) out.push(buildOne(place, i++, rng, "mock"));
  }
  while (out.length < total) out.push(buildOne(PLACES[0]!, i++, rng, "mock"));
  return out.slice(0, total);
}

export function generateOffMarket(rng: Rng): SeedListing[] {
  const visibilities = ["private_link", "registered", "public"] as const;
  return [PLACES[4]!, PLACES[0]!, PLACES[8]!, PLACES[2]!].map((place, idx) => {
    const l = buildOne(place, 900 + idx, rng, "manual");
    return { ...l, slug: `om-${l.slug}`, visibility: visibilities[idx % visibilities.length]! };
  });
}
