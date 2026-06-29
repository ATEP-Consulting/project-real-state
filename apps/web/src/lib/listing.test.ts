import { describe, expect, it } from "vitest";
import type { Listing } from "@herrera/db";
import {
  formatPrice,
  formatBedsLabel,
  formatBathsLabel,
  formatSqftLabel,
  formatPropertyType,
  toListingCardVM,
} from "./listing";

function makeListing(over: Partial<Listing> = {}): Listing {
  return {
    slug: "1842-brickell-ave-miami",
    price: 1250000,
    bedrooms: 3,
    bathrooms: "2.5",
    sqft: 1840,
    propertyType: "condo",
    addressLine1: "1842 Brickell Ave",
    city: "Miami",
    state: "FL",
    zip: "33129",
    photos: [{ url: "https://images.unsplash.com/photo-1.jpg", caption: "Front" }],
    createdAt: new Date(),
    ...over,
  } as unknown as Listing;
}

describe("formatPrice", () => {
  it("formats whole USD with grouping and no decimals", () => {
    expect(formatPrice(1250000)).toBe("$1,250,000");
    expect(formatPrice(0)).toBe("$0");
    expect(formatPrice(950)).toBe("$950");
  });
});

describe("formatBedsLabel", () => {
  it("labels bed counts and handles null", () => {
    expect(formatBedsLabel(3)).toBe("3 bd");
    expect(formatBedsLabel(0)).toBe("Studio");
    expect(formatBedsLabel(null)).toBeNull();
  });
});

describe("formatBathsLabel", () => {
  it("trims trailing .0 and labels, handles null", () => {
    expect(formatBathsLabel("2.5")).toBe("2.5 ba");
    expect(formatBathsLabel("2.0")).toBe("2 ba");
    expect(formatBathsLabel(null)).toBeNull();
  });
});

describe("formatSqftLabel", () => {
  it("groups thousands and labels, handles null", () => {
    expect(formatSqftLabel(1840)).toBe("1,840 sqft");
    expect(formatSqftLabel(null)).toBeNull();
  });
});

describe("formatPropertyType", () => {
  it("humanizes known enum values and falls back to Home", () => {
    expect(formatPropertyType("single_family")).toBe("Single-family home");
    expect(formatPropertyType("condo")).toBe("Condo");
    expect(formatPropertyType("townhouse")).toBe("Townhouse");
    expect(formatPropertyType("something_new")).toBe("Home");
  });
});

describe("toListingCardVM", () => {
  it("maps a full listing to a serializable card view-model", () => {
    const vm = toListingCardVM(makeListing());
    expect(vm).toEqual({
      slug: "1842-brickell-ave-miami",
      href: "/homes/1842-brickell-ave-miami",
      priceLabel: "$1,250,000",
      address: "1842 Brickell Ave",
      cityLine: "Miami, FL 33129",
      beds: 3,
      bedsLabel: "3 bd",
      bathsLabel: "2.5 ba",
      sqftLabel: "1,840 sqft",
      propertyTypeLabel: "Condo",
      photo: "https://images.unsplash.com/photo-1.jpg",
      photoAlt: "Condo at 1842 Brickell Ave, Miami, FL",
      isNew: true,
    });
  });

  it("flags recent listings as new and old ones as not", () => {
    expect(toListingCardVM(makeListing({ createdAt: new Date() })).isNew).toBe(true);
    expect(toListingCardVM(makeListing({ createdAt: new Date("2000-01-01") })).isNew).toBe(false);
  });

  it("handles missing beds/baths/sqft/photos gracefully", () => {
    const vm = toListingCardVM(
      makeListing({ bedrooms: null, bathrooms: null, sqft: null, photos: [] }),
    );
    expect(vm.beds).toBeNull();
    expect(vm.bedsLabel).toBeNull();
    expect(vm.bathsLabel).toBeNull();
    expect(vm.sqftLabel).toBeNull();
    expect(vm.photo).toBeNull();
  });
});
