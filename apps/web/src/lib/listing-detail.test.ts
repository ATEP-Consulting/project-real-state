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
  descriptionEs: null,
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

  it("emits locale-agnostic labelKeys for keyFacts (not English strings)", () => {
    const keys = vm.keyFacts.map((f) => f.labelKey);
    expect(keys).toEqual(["price", "beds", "baths", "sqft", "type", "yearBuilt", "lot"]);
    expect(vm.keyFacts.find((f) => f.labelKey === "beds")?.value).toBe("4");
  });

  it("emits featureKeys (not English strings)", () => {
    expect(vm.featureKeys).toContain("waterfront");
    expect(vm.featureKeys).not.toContain("pool");
    // hoaFeeMonthly=null → noHoa
    expect(vm.featureKeys).toContain("noHoa");
  });

  it("marks non-MLS rows so the MLS disclaimer is suppressed", () => {
    expect(vm.compliance.isMls).toBe(false);
  });

  it("emits statusKey, price-per-sqft, year, and lot for the header/cards", () => {
    expect(vm.statusKey).toBe("active");
    expect(vm.pricePerSqftLabel).toBe("$313/ft²"); // 750000 / 2400
    expect(vm.yearBuilt).toBe(2018);
    expect(vm.lotSizeSqft).toBe(8000);
  });

  it("maps off_market status to offMarket key", () => {
    const vm2 = toListingDetailVM({ ...base, status: "off_market" });
    expect(vm2.statusKey).toBe("offMarket");
  });

  it("falls back to active key for unknown status", () => {
    const vm2 = toListingDetailVM({ ...base, status: "future_unknown" });
    expect(vm2.statusKey).toBe("active");
  });

  describe("localized description (Task 19)", () => {
    const src = { ...base, description: "About this home", descriptionEs: "Sobre esta casa" };

    it("returns ES description under 'es' locale", () => {
      expect(toListingDetailVM(src, "es").description).toBe("Sobre esta casa");
    });

    it("returns EN description under 'en' locale", () => {
      expect(toListingDetailVM(src, "en").description).toBe("About this home");
    });

    it("falls back to EN when descriptionEs is null under 'es'", () => {
      expect(toListingDetailVM({ ...src, descriptionEs: null }, "es").description).toBe("About this home");
    });

    it("falls back to EN when descriptionEs is blank under 'es'", () => {
      expect(toListingDetailVM({ ...src, descriptionEs: "   " }, "es").description).toBe("About this home");
    });

    it("returns null when both description and descriptionEs are null/empty", () => {
      expect(toListingDetailVM({ ...src, description: null, descriptionEs: null }, "en").description).toBeNull();
    });

    it("defaults to EN locale when no locale arg passed (existing callers)", () => {
      expect(toListingDetailVM(src).description).toBe("About this home");
    });
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
