import { describe, expect, it } from "vitest";
import { listingInsertSchema } from "../schema/listings";
import { generateListings, generateOffMarket } from "./listings";
import { makeRng } from "./prng";

describe("generateListings", () => {
  const listings = generateListings(makeRng(20260629));

  it("produces 120 market listings, all source='mock'", () => {
    expect(listings.length).toBe(120);
    expect(listings.every((l) => l.source === "mock")).toBe(true);
  });

  it("every listing validates against listingInsertSchema", () => {
    for (const l of listings) expect(() => listingInsertSchema.parse(l)).not.toThrow();
  });

  it("coordinates are clustered in central Florida", () => {
    for (const l of listings) {
      const [lng, lat] = l.geom;
      expect(lat).toBeGreaterThan(27.8);
      expect(lat).toBeLessThan(29.0);
      expect(lng).toBeGreaterThan(-82.1);
      expect(lng).toBeLessThan(-80.9);
    }
  });

  it("has no steering language in descriptions (Fair Housing)", () => {
    const banned =
      /\b(family-friendly|families|safe neighborhood|great for|perfect for|professionals|kid)\b/i;
    for (const l of listings) expect(banned.test(l.description ?? "")).toBe(false);
  });

  it("is deterministic (same seed → same slugs)", () => {
    const again = generateListings(makeRng(20260629));
    expect(again.map((l) => l.slug)).toEqual(listings.map((l) => l.slug));
  });
});

describe("generateOffMarket", () => {
  it("produces manual off-market listings with varied visibility", () => {
    const off = generateOffMarket(makeRng(7));
    expect(off.length).toBeGreaterThanOrEqual(3);
    expect(off.every((l) => l.source === "manual" && l.status === "off_market")).toBe(true);
    expect(new Set(off.map((l) => l.visibility)).size).toBeGreaterThanOrEqual(2);
  });
});
