const PROPERTY_TYPE_LABELS: Record<string, string> = {
  single_family: "Single-family home",
  condo: "Condo",
  townhouse: "Townhouse",
  multi_family: "Multi-family",
  villa: "Villa",
  co_op: "Co-op",
  land: "Land",
  mobile: "Mobile home",
  other: "Home",
};

export function formatPrice(n: number): string {
  return `$${n.toLocaleString("en-US")}`;
}

/** Compact price for map pins: 1_447_000 → "$1.4M", 890_000 → "$890K". */
export function formatPriceShort(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

export function formatBedsLabel(beds: number | null): string | null {
  if (beds === null) return null;
  if (beds === 0) return "Studio";
  return `${beds} bd`;
}

export function formatBathsLabel(baths: string | null): string | null {
  if (baths === null) return null;
  // DB numeric(3,1) arrives as a string like "2.5" / "2.0".
  const n = Number(baths);
  if (Number.isNaN(n)) return null;
  // Number template drops a trailing ".0" → "2", keeps "2.5".
  return `${n} ba`;
}

export function formatSqftLabel(sqft: number | null): string | null {
  if (sqft === null) return null;
  return `${sqft.toLocaleString("en-US")} sqft`;
}

export function formatPropertyType(t: string): string {
  return PROPERTY_TYPE_LABELS[t] ?? "Home";
}

export type ListingCardVM = {
  slug: string;
  href: string;
  priceLabel: string;
  address: string;
  cityLine: string;
  beds: number | null;
  bedsLabel: string | null;
  bathsLabel: string | null;
  sqftLabel: string | null;
  propertyTypeLabel: string;
  photo: string | null;
  photoAlt: string;
  isNew: boolean;
};

const NEW_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Structural input for the card mapper — satisfied by both a full `Listing`
 * (home strip) and a `SearchListing` (search results), so both reuse this VM.
 */
export type ListingCardSource = {
  slug: string;
  price: number;
  bedrooms: number | null;
  bathrooms: string | null;
  sqft: number | null;
  propertyType: string;
  addressLine1: string;
  city: string;
  state: string;
  zip: string;
  photos: { url: string }[];
  createdAt: Date | string;
};

export function toListingCardVM(l: ListingCardSource): ListingCardVM {
  const propertyTypeLabel = formatPropertyType(l.propertyType);
  const createdAt = l.createdAt instanceof Date ? l.createdAt : new Date(l.createdAt);
  return {
    slug: l.slug,
    href: `/homes/${l.slug}`,
    priceLabel: formatPrice(l.price),
    address: l.addressLine1,
    cityLine: `${l.city}, ${l.state} ${l.zip}`,
    beds: l.bedrooms,
    bedsLabel: formatBedsLabel(l.bedrooms),
    bathsLabel: formatBathsLabel(l.bathrooms),
    sqftLabel: formatSqftLabel(l.sqft),
    propertyTypeLabel,
    photo: l.photos[0]?.url ?? null,
    photoAlt: `${propertyTypeLabel} at ${l.addressLine1}, ${l.city}, ${l.state}`,
    isNew: Date.now() - createdAt.getTime() < NEW_WINDOW_MS,
  };
}
