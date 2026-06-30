import { describe, expect, it } from "vitest";
import { monthlyMortgage, toListingDetailVM, toListingJsonLd } from "./listing-detail";

const base = {
  slug: "winter-park-abc-1",
  source: "mock" as const,
  status: "active" as const,
  price: 750000,
  propertyType: "single_family",
  bedrooms: 4,
  bathrooms: "2.5",
  sqft: 2400,
  lotSizeSqft: 8000,
  yearBuilt: 2018,
  description: "A bright home near the park.",
  addressLine1: "123 Oak St",
  addressLine2: null,
  city: "Winter Park",
  state: "FL",
  zip: "32789",
  latitude: "28.59",
  longitude: "-81.35",
  photos: [{ url: "https://x/1.jpg", caption: "Front" }, { url: "https://x/2.jpg" }],
  videoUrl: null,
  virtualTourUrl: "https://tour/abc",
  waterfront: true,
  pool: false,
  ageRestricted: false,
  hoaFeeMonthly: null,
  listingBrokerageName: null,
  listingAgentName: null,
  originatingMls: null,
  createdAt: new Date(),
};

describe("toListingDetailVM", () => {
  const vm = toListingDetailVM(base);
  it("maps headline facts + media", () => {
    expect(vm.priceLabel).toBe("$750,000");
    expect(vm.gallery).toHaveLength(2);
    expect(vm.gallery[0]).toMatchObject({ url: "https://x/1.jpg", caption: "Front" });
    expect(vm.virtualTourUrl).toBe("https://tour/abc");
    expect(vm.video).toBeNull();
    expect(vm.location).toEqual({ lng: -81.35, lat: 28.59 });
  });
  it("builds a key-facts strip", () => {
    const labels = vm.keyFacts.map((f) => f.label);
    expect(labels).toEqual(["Price", "Beds", "Baths", "Sqft", "Type", "Year built", "Lot"]);
    expect(vm.keyFacts.find((f) => f.label === "Beds")?.value).toBe("4");
  });
  it("derives a features list from booleans", () => {
    expect(vm.features).toContain("Waterfront");
    expect(vm.features).not.toContain("Private pool");
  });
  it("marks non-MLS rows so the MLS disclaimer is suppressed", () => {
    expect(vm.compliance.isMls).toBe(false);
  });
  it("exposes status, price-per-sqft, year, and lot for the header/cards", () => {
    expect(vm.statusLabel).toBe("For sale");
    expect(vm.pricePerSqftLabel).toBe("$313/ft²"); // 750000 / 2400
    expect(vm.yearBuilt).toBe(2018);
    expect(vm.lotSizeSqft).toBe(8000);
  });
});

describe("monthlyMortgage", () => {
  it("amortizes a normal loan", () => {
    // 600000 @ 6.5% / 30y ≈ 3792.0
    expect(Math.round(monthlyMortgage(600000, 6.5, 30))).toBe(3792);
  });
  it("handles a 0% rate as principal / months", () => {
    expect(monthlyMortgage(360000, 0, 30)).toBe(1000);
  });
  it("returns 0 for a non-positive principal", () => {
    expect(monthlyMortgage(0, 6, 30)).toBe(0);
    expect(monthlyMortgage(-5, 6, 30)).toBe(0);
  });
});

describe("toListingJsonLd", () => {
  it("emits a residence node + an offer with the price", () => {
    const ld = toListingJsonLd(
      toListingDetailVM(base),
      "https://h.com/homes/winter-park-abc-1",
    ) as {
      "@graph": { "@type": string; price?: number; priceCurrency?: string }[];
    };
    const offer = ld["@graph"].find((n) => n["@type"] === "Offer");
    expect(offer?.price).toBe(750000);
    expect(offer?.priceCurrency).toBe("USD");
    expect(ld["@graph"].some((n) => n["@type"] === "SingleFamilyResidence")).toBe(true);
  });
});
