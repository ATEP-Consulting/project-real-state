import type { FeatureCollection, Point } from "geojson";
import { formatPriceShort } from "./listing";
import type { Bbox } from "./search-params";

export type ListingMapPoint = { slug: string; lng: number; lat: number; priceLabel: string };

export function toMapPoint(s: {
  slug: string;
  price: number;
  lng: number | null;
  lat: number | null;
}): ListingMapPoint | null {
  if (s.lng == null || s.lat == null) return null;
  return { slug: s.slug, lng: s.lng, lat: s.lat, priceLabel: formatPriceShort(s.price) };
}

export function pointsToGeoJSON(points: ListingMapPoint[]): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: points.map((p) => ({
      type: "Feature",
      id: p.slug,
      properties: { slug: p.slug, priceLabel: p.priceLabel },
      geometry: { type: "Point", coordinates: [p.lng, p.lat] },
    })),
  };
}

export function boundsFromPoints(points: ListingMapPoint[]): Bbox | null {
  if (points.length === 0) return null;
  let minLng = Infinity,
    minLat = Infinity,
    maxLng = -Infinity,
    maxLat = -Infinity;
  for (const p of points) {
    minLng = Math.min(minLng, p.lng);
    minLat = Math.min(minLat, p.lat);
    maxLng = Math.max(maxLng, p.lng);
    maxLat = Math.max(maxLat, p.lat);
  }
  return [minLng, minLat, maxLng, maxLat];
}

export function bboxCenter(b: Bbox): [number, number] {
  return [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2];
}
