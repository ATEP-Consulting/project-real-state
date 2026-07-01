import { describe, expect, it } from "vitest";
import { buildLeadPayload } from "./lead-capture";

const base = {
  intent: "buy" as const,
  answers: {},
  contact: { email: "a@b.com", consent: true },
  landingPath: "/favorites",
};

describe("buildLeadPayload — source + viewedListingIds (D9)", () => {
  it("includes source and viewedListingIds when provided", () => {
    const p = buildLeadPayload({ ...base, source: "favorites", viewedListingIds: ["x", "y"] });
    expect(p.source).toBe("favorites");
    expect(p.viewedListingIds).toEqual(["x", "y"]);
  });

  it("omits them when not provided (unchanged for the normal flow)", () => {
    const p = buildLeadPayload({ intent: "buy", answers: {}, contact: { email: "a@b.com", consent: true }, landingPath: "/buy" });
    expect(p.source).toBeUndefined();
    expect(p.viewedListingIds).toBeUndefined();
  });

  it("omits viewedListingIds when given an empty array", () => {
    const p = buildLeadPayload({ ...base, viewedListingIds: [] });
    expect(p.viewedListingIds).toBeUndefined();
  });
});
