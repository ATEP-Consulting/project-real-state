import { sql, type SQL } from "drizzle-orm";
import { getDb } from "./client";
import type { Listing } from "./schema/listings";

export type SearchListing = Pick<
  Listing,
  | "slug"
  | "price"
  | "bedrooms"
  | "bathrooms"
  | "sqft"
  | "propertyType"
  | "addressLine1"
  | "city"
  | "state"
  | "zip"
  | "photos"
  | "createdAt"
> & { lng: number | null; lat: number | null };

export type SearchListingParams = {
  bbox?: [number, number, number, number]; // minLng,minLat,maxLng,maxLat
  poly?: [number, number][]; // ring of [lng,lat]
  q?: string;
  types?: string[]; // property_type IN (...)
  minPrice?: number;
  maxPrice?: number;
  minBeds?: number;
  minBaths?: number;
  waterfront?: boolean;
  pool?: boolean;
  age55?: boolean;
  noHoa?: boolean;
  limit?: number;
};

/**
 * Public+active listings matching the spatial + attribute filters (ADR-012/006).
 * Raw PostGIS SQL (parameter-bound). Returns rows (camelCase-aliased so they map to ListingCardVM)
 * with lng/lat, plus the total matching count (window count, ignores LIMIT).
 */
export async function searchListings(
  p: SearchListingParams,
): Promise<{ rows: SearchListing[]; total: number }> {
  const limit = Math.min(Math.max(p.limit ?? 300, 1), 500);
  const conds: SQL[] = [
    sql`l.status = 'active'`,
    sql`l.visibility = 'public'`,
    sql`l.geom IS NOT NULL`,
  ];

  if (p.bbox) {
    const [w, s, e, n] = p.bbox;
    conds.push(sql`l.geom && ST_MakeEnvelope(${w}, ${s}, ${e}, ${n}, 4326)`);
  }
  if (p.poly && p.poly.length >= 3) {
    // Build a closed WKT ring from validated numbers (numbers only → injection-safe).
    const ring = [...p.poly, p.poly[0]!];
    const wkt = `POLYGON((${ring.map(([lng, lat]) => `${lng} ${lat}`).join(", ")}))`;
    conds.push(sql`ST_Intersects(l.geom, ST_SetSRID(ST_GeomFromText(${wkt}), 4326))`);
  }
  if (p.q) {
    const like = `%${p.q}%`;
    conds.push(sql`(l.city ILIKE ${like} OR l.address_line1 ILIKE ${like} OR l.zip ILIKE ${like})`);
  }
  if (p.types && p.types.length)
    conds.push(
      sql`l.property_type IN (${sql.join(
        p.types.map((t) => sql`${t}`),
        sql`, `,
      )})`,
    );
  if (p.minPrice != null) conds.push(sql`l.price >= ${p.minPrice}`);
  if (p.maxPrice != null) conds.push(sql`l.price <= ${p.maxPrice}`);
  if (p.minBeds != null) conds.push(sql`l.bedrooms >= ${p.minBeds}`);
  if (p.minBaths != null) conds.push(sql`l.bathrooms >= ${p.minBaths}`);
  if (p.waterfront) conds.push(sql`l.waterfront = true`);
  if (p.pool) conds.push(sql`l.pool = true`);
  if (p.age55) conds.push(sql`l.age_restricted = true`);
  if (p.noHoa) conds.push(sql`(l.hoa_fee_monthly IS NULL OR l.hoa_fee_monthly = 0)`);

  const where = sql.join(conds, sql` AND `);
  const result = (await getDb().execute(sql`
    SELECT l.slug, l.price, l.bedrooms, l.bathrooms, l.sqft,
           l.property_type AS "propertyType", l.address_line1 AS "addressLine1",
           l.city, l.state, l.zip, l.photos, l.created_at AS "createdAt",
           ST_X(l.geom) AS lng, ST_Y(l.geom) AS lat,
           count(*) OVER ()::int AS total
    FROM listings l
    WHERE ${where}
    ORDER BY l.price DESC
    LIMIT ${limit}
  `)) as unknown as
    { rows: (SearchListing & { total: number })[] } | (SearchListing & { total: number })[];

  const raw = Array.isArray(result) ? result : result.rows;
  const total = raw[0]?.total ?? 0;
  // Drop the window-count column from each row; keep only the SearchListing shape.
  const rows: SearchListing[] = raw.map((r) => ({
    slug: r.slug,
    price: r.price,
    bedrooms: r.bedrooms,
    bathrooms: r.bathrooms,
    sqft: r.sqft,
    propertyType: r.propertyType,
    addressLine1: r.addressLine1,
    city: r.city,
    state: r.state,
    zip: r.zip,
    photos: r.photos,
    createdAt: r.createdAt,
    lng: r.lng,
    lat: r.lat,
  }));
  return { rows, total };
}
