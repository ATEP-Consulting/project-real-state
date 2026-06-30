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
export type PropertyType = (typeof PROPERTY_TYPES)[number];
export type SearchParams = {
  q?: string;
  types?: PropertyType[];
  intent?: "buy" | "sell" | "rent";
  bbox?: Bbox;
  poly?: Ring;
  minPrice?: number;
  maxPrice?: number;
  minBeds?: number;
  minBaths?: number;
  waterfront?: boolean;
  pool?: boolean;
  age55?: boolean;
  noHoa?: boolean;
};

type Query = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const floats = (s: string) => s.split(",").map((x) => Number(x.trim()));

const IntentSchema = z.enum(["buy", "sell", "rent"]);
const PosInt = z.coerce.number().finite().nonnegative();

const TRUTHY = new Set(["1", "true", "yes", "on"]);
const readBool = (v: string | string[] | undefined): true | undefined =>
  TRUTHY.has((first(v) ?? "").trim().toLowerCase()) ? true : undefined;

/** Tolerant boundary validator: keeps valid params, silently drops malformed ones (shared links must degrade gracefully). */
export function parseSearchParams(query: Query): SearchParams {
  const out: SearchParams = {};

  const q = first(query.q)?.trim();
  if (q) out.q = q.slice(0, 80);

  const rawTypes = first(query.type);
  if (rawTypes) {
    const types = rawTypes
      .split(",")
      .map((s) => s.trim())
      .filter((s): s is PropertyType => (PROPERTY_TYPES as readonly string[]).includes(s));
    if (types.length) out.types = types;
  }

  const i = IntentSchema.safeParse(first(query.intent));
  if (i.success) out.intent = i.data;

  const bbox = first(query.bbox);
  if (bbox) {
    const n = floats(bbox);
    if (n.length === 4 && n.every(Number.isFinite)) {
      const [a, b, c, d] = n as Bbox;
      out.bbox = [Math.min(a, c), Math.min(b, d), Math.max(a, c), Math.max(b, d)];
    }
  }

  const poly = first(query.poly);
  if (poly) {
    const n = floats(poly);
    if (n.length >= 6 && n.length % 2 === 0 && n.every(Number.isFinite)) {
      const ring: Ring = [];
      for (let k = 0; k + 1 < n.length; k += 2) ring.push([n[k]!, n[k + 1]!]);
      out.poly = ring;
    }
  }

  const mn = PosInt.safeParse(first(query.minPrice));
  if (mn.success) out.minPrice = mn.data;
  const mx = PosInt.safeParse(first(query.maxPrice));
  if (mx.success) out.maxPrice = mx.data;
  const mb = PosInt.safeParse(first(query.minBeds));
  if (mb.success) out.minBeds = mb.data;
  const mba = PosInt.safeParse(first(query.minBaths));
  if (mba.success) out.minBaths = mba.data;

  if (readBool(query.waterfront)) out.waterfront = true;
  if (readBool(query.pool)) out.pool = true;
  if (readBool(query.age55)) out.age55 = true;
  if (readBool(query.noHoa)) out.noHoa = true;

  return out;
}

export function serializeSearchQuery(p: SearchParams): Record<string, string> {
  const q: Record<string, string> = {};
  if (p.q) q.q = p.q;
  if (p.types?.length) q.type = p.types.join(",");
  if (p.intent) q.intent = p.intent;
  if (p.bbox) q.bbox = p.bbox.join(",");
  if (p.poly) q.poly = p.poly.flat().join(",");
  if (p.minPrice != null) q.minPrice = String(p.minPrice);
  if (p.maxPrice != null) q.maxPrice = String(p.maxPrice);
  if (p.minBeds != null) q.minBeds = String(p.minBeds);
  if (p.minBaths != null) q.minBaths = String(p.minBaths);
  if (p.waterfront) q.waterfront = "1";
  if (p.pool) q.pool = "1";
  if (p.age55) q.age55 = "1";
  if (p.noHoa) q.noHoa = "1";
  return q;
}
