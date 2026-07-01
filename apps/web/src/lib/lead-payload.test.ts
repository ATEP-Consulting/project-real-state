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

describe("buildLeadPayload — locale (ADR-020/D13)", () => {
  it("includes locale:'es' when passed", () => {
    const p = buildLeadPayload({ ...base, locale: "es" });
    expect(p.locale).toBe("es");
  });
  it("includes locale:'en' when passed", () => {
    const p = buildLeadPayload({ ...base, locale: "en" });
    expect(p.locale).toBe("en");
  });
  it("omits locale when not passed (defaults to undefined, server uses 'en')", () => {
    const p = buildLeadPayload(base);
    expect(p.locale).toBeUndefined();
  });
});
