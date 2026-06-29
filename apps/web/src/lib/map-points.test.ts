import { describe, expect, it } from "vitest";
import { formatPriceShort } from "./listing";
import { toMapPoint, pointsToGeoJSON, boundsFromPoints, bboxCenter } from "./map-points";

describe("formatPriceShort", () => {
  it("abbreviates millions and thousands", () => {
    expect(formatPriceShort(1_447_000)).toBe("$1.4M");
    expect(formatPriceShort(2_000_000)).toBe("$2M");
    expect(formatPriceShort(890_000)).toBe("$890K");
    expect(formatPriceShort(950)).toBe("$950");
  });
});

describe("toMapPoint", () => {
  it("maps a row with coords", () => {
    expect(toMapPoint({ slug: "a", price: 1_447_000, lng: -81.3, lat: 28.5 })).toEqual({
      slug: "a",
      lng: -81.3,
      lat: 28.5,
      priceLabel: "$1.4M",
    });
  });
  it("returns null when coords are missing", () => {
    expect(toMapPoint({ slug: "a", price: 1, lng: null, lat: 28.5 })).toBeNull();
  });
});

describe("boundsFromPoints / bboxCenter", () => {
  it("computes a bounding box and its center", () => {
    const pts = [
      { slug: "a", lng: -81.5, lat: 28.4, priceLabel: "" },
      { slug: "b", lng: -81.2, lat: 28.7, priceLabel: "" },
    ];
    expect(boundsFromPoints(pts)).toEqual([-81.5, 28.4, -81.2, 28.7]);
    const center = bboxCenter([-81.5, 28.4, -81.2, 28.7]);
    expect(center[0]).toBeCloseTo(-81.35, 10);
    expect(center[1]).toBeCloseTo(28.55, 10);
  });
  it("returns null for no points", () => {
    expect(boundsFromPoints([])).toBeNull();
  });
});

describe("pointsToGeoJSON", () => {
  it("builds a FeatureCollection with slug ids", () => {
    const fc = pointsToGeoJSON([{ slug: "a", lng: -81.3, lat: 28.5, priceLabel: "$1.4M" }]);
    expect(fc.type).toBe("FeatureCollection");
    expect(fc.features[0]).toMatchObject({
      id: "a",
      properties: { slug: "a", priceLabel: "$1.4M" },
      geometry: { type: "Point", coordinates: [-81.3, 28.5] },
    });
  });
});
