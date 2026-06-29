import { describe, expect, it } from "vitest";
import { listingInsertSchema } from "./listings";

const base = {
  source: "mock",
  status: "active",
  slug: "123-main-st-orlando-fl",
  propertyType: "single_family",
  price: 450000,
  bedrooms: 3,
  bathrooms: "2.5",
  addressLine1: "123 Main St",
  city: "Orlando",
  zip: "32801",
  latitude: "28.5383",
  longitude: "-81.3792",
  geom: [-81.3792, 28.5383] as [number, number],
};

describe("listingInsertSchema", () => {
  it("accepts a valid mock listing", () => {
    const parsed = listingInsertSchema.parse(base);
    expect(parsed.source).toBe("mock");
    expect(parsed.geom).toEqual([-81.3792, 28.5383]);
  });

  it("rejects an invalid source", () => {
    expect(() => listingInsertSchema.parse({ ...base, source: "zillow" })).toThrow();
  });

  it("rejects an invalid flood zone", () => {
    expect(() => listingInsertSchema.parse({ ...base, floodZone: "ZZ" })).toThrow();
  });

  it("validates photo objects", () => {
    expect(() => listingInsertSchema.parse({ ...base, photos: [{ url: "not-a-url" }] })).toThrow();
  });
});
