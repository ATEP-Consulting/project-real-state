import { formatPrice, formatPropertyType, type ListingCardSource } from "./listing";
import { pickLocalized, type Locale } from "./i18n/config";

export type GalleryImage = { url: string; caption: string | null; alt: string };
/** @deprecated label is English-only; prefer {@link KeyFactItem} with labelKey */
export type KeyFact = { label: string; value: string };
export type KeyFactLabelKey = "price" | "beds" | "baths" | "sqft" | "type" | "yearBuilt" | "lot";
export type KeyFactItem = { labelKey: KeyFactLabelKey; value: string };
export type FeatureKey = "waterfront" | "pool" | "ageRestricted" | "noHoa";
export type StatusKey = "active" | "pending" | "sold" | "offMarket";

export type ListingDetailVM = {
  slug: string;
  href: string;
  priceLabel: string;
  price: number;
  title: string; // address line 1
  cityLine: string; // "City, ST ZIP"
  propertyType: string; // raw type (for schema.org mapping)
  propertyTypeLabel: string;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  yearBuilt: number | null;
  lotSizeSqft: number | null;
  statusKey: StatusKey;
  pricePerSqftLabel: string | null;
  description: string | null;
  gallery: GalleryImage[];
  video: string | null;
  virtualTourUrl: string | null;
  keyFacts: KeyFactItem[];
  featureKeys: FeatureKey[];
  location: { lng: number; lat: number } | null;
  status: string;
  compliance: {
    isMls: boolean;
    brokerageName: string | null;
    agentName: string | null;
    originatingMls: string | null;
  };
};

// Structural source — a `Listing` satisfies it. The ONE place MLS field-name differences are mapped.
// `photos` is widened from the card source (adds optional caption), so Omit it from the base first.
export type ListingDetailSource = Omit<ListingCardSource, "photos"> & {
  source: string;
  status: string;
  lotSizeSqft: number | null;
  yearBuilt: number | null;
  description: string | null;
  descriptionEs: string | null;
  addressLine2: string | null;
  latitude: string | null;
  longitude: string | null;
  photos: { url: string; caption?: string }[];
  videoUrl: string | null;
  virtualTourUrl: string | null;
  waterfront: boolean;
  pool: boolean;
  ageRestricted: boolean;
  hoaFeeMonthly: number | null;
  listingBrokerageName: string | null;
  listingAgentName: string | null;
  originatingMls: string | null;
};

const STATUS_KEY_MAP: Record<string, StatusKey> = {
  active: "active",
  pending: "pending",
  sold: "sold",
  off_market: "offMarket",
};

const PT_TO_SCHEMA: Record<string, string> = {
  single_family: "SingleFamilyResidence",
  condo: "Apartment",
  co_op: "Apartment",
  townhouse: "House",
  villa: "House",
  multi_family: "ApartmentComplex",
  land: "Place",
  mobile: "Residence",
  other: "Residence",
};

export function toListingDetailVM(l: ListingDetailSource, locale: Locale = "en"): ListingDetailVM {
  const propertyTypeLabel = formatPropertyType(l.propertyType);
  const bathsNum = l.bathrooms == null ? null : Number(l.bathrooms);
  const lat = l.latitude == null ? null : Number(l.latitude);
  const lng = l.longitude == null ? null : Number(l.longitude);

  const keyFacts: KeyFactItem[] = [
    { labelKey: "price", value: formatPrice(l.price) },
    { labelKey: "beds", value: l.bedrooms == null ? "—" : String(l.bedrooms) },
    { labelKey: "baths", value: bathsNum == null ? "—" : String(bathsNum) },
    { labelKey: "sqft", value: l.sqft == null ? "—" : l.sqft.toLocaleString("en-US") },
    { labelKey: "type", value: propertyTypeLabel },
    { labelKey: "yearBuilt", value: l.yearBuilt == null ? "—" : String(l.yearBuilt) },
    {
      labelKey: "lot",
      value: l.lotSizeSqft == null ? "—" : `${l.lotSizeSqft.toLocaleString("en-US")} sqft`,
    },
  ];

  const featureKeys: FeatureKey[] = [];
  if (l.waterfront) featureKeys.push("waterfront");
  if (l.pool) featureKeys.push("pool");
  if (l.ageRestricted) featureKeys.push("ageRestricted");
  if (l.hoaFeeMonthly == null || l.hoaFeeMonthly === 0) featureKeys.push("noHoa");

  const gallery: GalleryImage[] = l.photos.map((p, i) => ({
    url: p.url,
    caption: p.caption ?? null,
    alt: p.caption ?? `${propertyTypeLabel} at ${l.addressLine1}, ${l.city} — photo ${i + 1}`,
  }));

  return {
    slug: l.slug,
    href: `/homes/${l.slug}`,
    priceLabel: formatPrice(l.price),
    price: l.price,
    title: l.addressLine1,
    cityLine: `${l.city}, ${l.state} ${l.zip}`,
    propertyType: l.propertyType,
    propertyTypeLabel,
    beds: l.bedrooms,
    baths: bathsNum,
    sqft: l.sqft,
    yearBuilt: l.yearBuilt,
    lotSizeSqft: l.lotSizeSqft,
    statusKey: STATUS_KEY_MAP[l.status] ?? "active",
    pricePerSqftLabel: l.sqft && l.sqft > 0 ? `$${Math.round(l.price / l.sqft)}/ft²` : null,
    description: pickLocalized(l.description ?? "", l.descriptionEs, locale) || null,
    gallery,
    video: l.videoUrl,
    virtualTourUrl: l.virtualTourUrl,
    keyFacts,
    featureKeys,
    location:
      lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng) ? { lng, lat } : null,
    status: l.status,
    compliance: {
      isMls: l.source === "mls",
      brokerageName: l.listingBrokerageName,
      agentName: l.listingAgentName,
      originatingMls: l.originatingMls,
    },
  };
}

/** Monthly principal+interest payment (ESTIMATE). 0% → principal/months; non-positive principal → 0. */
export function monthlyMortgage(
  principal: number,
  annualRatePct: number,
  termYears: number,
): number {
  if (principal <= 0 || termYears <= 0) return 0;
  const n = termYears * 12;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return principal / n;
  const f = Math.pow(1 + r, n);
  return (principal * r * f) / (f - 1);
}

export function toListingJsonLd(vm: ListingDetailVM, canonicalUrl: string): object {
  const [city, rest] = vm.cityLine.split(",");
  const restTrim = rest?.trim() ?? "";
  const residence: Record<string, unknown> = {
    "@type": PT_TO_SCHEMA[vm.propertyType] ?? "Residence",
    name: `${vm.title}, ${city}`,
    url: canonicalUrl,
    image: vm.gallery.map((g) => g.url),
    address: {
      "@type": "PostalAddress",
      streetAddress: vm.title,
      addressLocality: city?.trim(),
      addressRegion: restTrim.split(" ")[0],
      postalCode: restTrim.split(" ")[1],
      addressCountry: "US",
    },
  };
  if (vm.beds != null) residence.numberOfRooms = vm.beds;
  if (vm.baths != null) residence.numberOfBathroomsTotal = vm.baths;
  if (vm.sqft != null)
    residence.floorSize = { "@type": "QuantitativeValue", value: vm.sqft, unitText: "SqFt" };
  if (vm.location)
    residence.geo = {
      "@type": "GeoCoordinates",
      latitude: vm.location.lat,
      longitude: vm.location.lng,
    };
  return {
    "@context": "https://schema.org",
    "@graph": [
      residence,
      {
        "@type": "Offer",
        price: vm.price,
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        url: canonicalUrl,
      },
    ],
  };
}
