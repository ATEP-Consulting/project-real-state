import type { Listing } from "@herrera/db";

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
};

export function toListingCardVM(l: Listing): ListingCardVM {
  const propertyTypeLabel = formatPropertyType(l.propertyType);
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
  };
}
