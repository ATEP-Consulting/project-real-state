import { describe, expect, it } from "vitest";
import { qualificationLeadSchema } from "./qualification";
import { listingsBySlugsInputSchema } from "./listings-detail";

describe("qualificationLeadSchema — source allowlist (D9)", () => {
  it("accepts source='favorites' with viewedListingIds", () => {
    const parsed = qualificationLeadSchema.parse({
      intent: "buy",
      email: "a@b.com",
      source: "favorites",
      viewedListingIds: ["123-main-st", "9-ocean-dr"],
    });
    expect(parsed.source).toBe("favorites");
    expect(parsed.viewedListingIds).toEqual(["123-main-st", "9-ocean-dr"]);
  });

  it("accepts source='qualification_flow'", () => {
    expect(
      qualificationLeadSchema.parse({ intent: "buy", email: "a@b.com", source: "qualification_flow" })
        .source,
    ).toBe("qualification_flow");
  });

  it("parses fine with no source (stays optional)", () => {
    expect(qualificationLeadSchema.safeParse({ intent: "buy", email: "a@b.com" }).success).toBe(true);
  });

  it("rejects an arbitrary source string", () => {
    expect(
      qualificationLeadSchema.safeParse({ intent: "buy", email: "a@b.com", source: "zillow" }).success,
    ).toBe(false);
  });
});

describe("listingsBySlugsInputSchema (D9)", () => {
  it("accepts a valid slug array", () => {
    expect(listingsBySlugsInputSchema.parse({ slugs: ["a", "b"] }).slugs).toEqual(["a", "b"]);
  });
  it("defaults to an empty array when omitted", () => {
    expect(listingsBySlugsInputSchema.parse({}).slugs).toEqual([]);
  });
  it("rejects more than 100 slugs", () => {
    const many = Array.from({ length: 101 }, (_, i) => `s${i}`);
    expect(listingsBySlugsInputSchema.safeParse({ slugs: many }).success).toBe(false);
  });
  it("rejects non-string entries", () => {
    expect(listingsBySlugsInputSchema.safeParse({ slugs: [1, 2] }).success).toBe(false);
  });
});
