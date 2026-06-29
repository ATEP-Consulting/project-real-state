import { z } from "zod";

export const PROPERTY_TYPES = [
  "single_family",
  "condo",
  "townhouse",
  "multi_family",
  "villa",
  "co_op",
  "land",
  "mobile",
  "other",
] as const;

export type Bbox = [number, number, number, number];
export type Ring = [number, number][];
export type SearchParams = {
  q?: string;
  type?: (typeof PROPERTY_TYPES)[number];
  intent?: "buy" | "sell" | "rent";
  bbox?: Bbox;
  poly?: Ring;
  minPrice?: number;
  maxPrice?: number;
  minBeds?: number;
};

type Query = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const floats = (s: string) => s.split(",").map((x) => Number(x.trim()));

const TypeSchema = z.enum(PROPERTY_TYPES);
const IntentSchema = z.enum(["buy", "sell", "rent"]);
const PosInt = z.coerce.number().finite().nonnegative();

/** Tolerant boundary validator: keeps valid params, silently drops malformed ones (shared links must degrade gracefully). */
export function parseSearchParams(query: Query): SearchParams {
  const out: SearchParams = {};

  const q = first(query.q)?.trim();
  if (q) out.q = q.slice(0, 80);

  const t = TypeSchema.safeParse(first(query.type));
  if (t.success) out.type = t.data;

  const i = IntentSchema.safeParse(first(query.intent));
  if (i.success) out.intent = i.data;

  const bbox = first(query.bbox);
  if (bbox) {
    const n = floats(bbox);
    if (n.length === 4 && n.every(Number.isFinite)) {
      out.bbox = [
        Math.min(n[0], n[2]),
        Math.min(n[1], n[3]),
        Math.max(n[0], n[2]),
        Math.max(n[1], n[3]),
      ];
    }
  }

  const poly = first(query.poly);
  if (poly) {
    const n = floats(poly);
    if (n.length >= 6 && n.length % 2 === 0 && n.every(Number.isFinite)) {
      const ring: Ring = [];
      for (let k = 0; k < n.length; k += 2) ring.push([n[k], n[k + 1]]);
      out.poly = ring;
    }
  }

  const mn = PosInt.safeParse(first(query.minPrice));
  if (mn.success) out.minPrice = mn.data;
  const mx = PosInt.safeParse(first(query.maxPrice));
  if (mx.success) out.maxPrice = mx.data;
  const mb = PosInt.safeParse(first(query.minBeds));
  if (mb.success) out.minBeds = mb.data;

  return out;
}

export function serializeSearchQuery(p: SearchParams): Record<string, string> {
  const q: Record<string, string> = {};
  if (p.q) q.q = p.q;
  if (p.type) q.type = p.type;
  if (p.intent) q.intent = p.intent;
  if (p.bbox) q.bbox = p.bbox.join(",");
  if (p.poly) q.poly = p.poly.flat().join(",");
  if (p.minPrice != null) q.minPrice = String(p.minPrice);
  if (p.maxPrice != null) q.maxPrice = String(p.maxPrice);
  if (p.minBeds != null) q.minBeds = String(p.minBeds);
  return q;
}
