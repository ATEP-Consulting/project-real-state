import { describe, expect, it } from "vitest";
import { parseSearchParams, serializeSearchQuery } from "./search-params";

describe("parseSearchParams", () => {
  it("reads q (trimmed, capped) and a valid type/intent", () => {
    expect(parseSearchParams({ q: "  Coral Gables  ", type: "condo", intent: "buy" })).toEqual({
      q: "Coral Gables",
      type: "condo",
      intent: "buy",
    });
  });
  it("drops an invalid type and invalid intent", () => {
    expect(parseSearchParams({ type: "mansion", intent: "browse" })).toEqual({});
  });
  it("parses + normalizes a bbox (min/max order)", () => {
    expect(parseSearchParams({ bbox: "-81.5,28.4,-81.2,28.7" }).bbox).toEqual([
      -81.5, 28.4, -81.2, 28.7,
    ]);
    expect(parseSearchParams({ bbox: "-81.2,28.7,-81.5,28.4" }).bbox).toEqual([
      -81.5, 28.4, -81.2, 28.7,
    ]);
  });
  it("ignores a malformed bbox", () => {
    expect(parseSearchParams({ bbox: "1,2,3" }).bbox).toBeUndefined();
    expect(parseSearchParams({ bbox: "a,b,c,d" }).bbox).toBeUndefined();
  });
  it("parses a polygon ring of >=3 points", () => {
    expect(parseSearchParams({ poly: "-81.5,28.4,-81.2,28.4,-81.2,28.7" }).poly).toEqual([
      [-81.5, 28.4],
      [-81.2, 28.4],
      [-81.2, 28.7],
    ]);
  });
  it("ignores a degenerate polygon (<3 points)", () => {
    expect(parseSearchParams({ poly: "-81.5,28.4,-81.2,28.4" }).poly).toBeUndefined();
  });
  it("parses numeric filters, dropping non-numbers", () => {
    expect(parseSearchParams({ minPrice: "300000", maxPrice: "x", minBeds: "2" })).toEqual({
      minPrice: 300000,
      minBeds: 2,
    });
  });
  it("takes the first value when a param repeats", () => {
    expect(parseSearchParams({ q: ["Miami", "Tampa"] }).q).toBe("Miami");
  });
});

describe("serializeSearchQuery", () => {
  it("round-trips a full param set to a flat string map", () => {
    expect(
      serializeSearchQuery({
        q: "Miami",
        type: "condo",
        bbox: [-81.5, 28.4, -81.2, 28.7],
        minBeds: 2,
      }),
    ).toEqual({ q: "Miami", type: "condo", bbox: "-81.5,28.4,-81.2,28.7", minBeds: "2" });
  });
  it("serializes a polygon as a flat coord list", () => {
    expect(
      serializeSearchQuery({
        poly: [
          [-81.5, 28.4],
          [-81.2, 28.4],
          [-81.2, 28.7],
        ],
      }).poly,
    ).toBe("-81.5,28.4,-81.2,28.4,-81.2,28.7");
  });
});
