import { desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "./client";
import { listings, type Listing } from "./schema/listings";
import { slugify, uniqueSlug } from "./slug";

// ADR-005/008 — admin CRUD for Nilyan's OWN off-market (manual) listings ONLY. MLS/mock
// rows are worker-owned and never hand-edited: every read/write here is scoped to source='manual'.
export const manualListingSchema = z.object({
  propertyType: z.enum([
    "single_family",
    "condo",
    "townhouse",
    "multi_family",
    "villa",
    "co_op",
    "land",
    "mobile",
    "other",
  ]),
  price: z.number().int().positive(),
  addressLine1: z.string().trim().min(1).max(200),
  addressLine2: z.string().trim().max(200).nullish(),
  city: z.string().trim().min(1).max(120),
  state: z.string().trim().min(2).max(2).default("FL"),
  zip: z.string().trim().min(1).max(12),
  bedrooms: z.number().int().nonnegative().nullish(),
  bathrooms: z.number().nonnegative().nullish(),
  sqft: z.number().int().positive().nullish(),
  yearBuilt: z.number().int().min(1800).max(2100).nullish(),
  description: z.string().trim().max(5000).nullish(),
  descriptionEs: z.string().trim().max(5000).nullish(),
  visibility: z.enum(["public", "registered", "private_link"]).default("private_link"),
  status: z.enum(["active", "pending", "sold", "off_market"]).default("off_market"),
  latitude: z.number().min(-90).max(90).nullish(),
  longitude: z.number().min(-180).max(180).nullish(),
  photos: z.array(z.string().url()).default([]),
});
export type ManualListing = z.infer<typeof manualListingSchema>;

export type AdminListingRow = {
  id: string;
  slug: string;
  address: string;
  city: string;
  price: number;
  visibility: string;
  status: string;
  propertyType: string;
};

/** All manual (off-market) listings, newest first — the admin list. */
export async function listManualListings(): Promise<AdminListingRow[]> {
  const rows = await getDb()
    .select({
      id: listings.id,
      slug: listings.slug,
      address: listings.addressLine1,
      city: listings.city,
      price: listings.price,
      visibility: listings.visibility,
      status: listings.status,
      propertyType: listings.propertyType,
    })
    .from(listings)
    .where(eq(listings.source, "manual"))
    .orderBy(desc(listings.createdAt));
  return rows;
}

/** A single manual listing (only source='manual'), or null. */
export async function getManualListing(id: string): Promise<Listing | null> {
  const rows = await getDb()
    .select()
    .from(listings)
    .where(sql`${listings.id} = ${id} AND ${listings.source} = 'manual'`)
    .limit(1);
  return rows[0] ?? null;
}

function toValues(input: ManualListing) {
  return {
    propertyType: input.propertyType,
    price: input.price,
    addressLine1: input.addressLine1,
    addressLine2: input.addressLine2 ?? null,
    city: input.city,
    state: input.state,
    zip: input.zip,
    bedrooms: input.bedrooms ?? null,
    bathrooms: input.bathrooms != null ? String(input.bathrooms) : null,
    sqft: input.sqft ?? null,
    yearBuilt: input.yearBuilt ?? null,
    description: input.description ?? null,
    descriptionEs: input.descriptionEs ?? null,
    visibility: input.visibility,
    status: input.status,
    latitude: input.latitude != null ? String(input.latitude) : null,
    longitude: input.longitude != null ? String(input.longitude) : null,
    photos: input.photos.map((url) => ({ url })),
  };
}

/** Set/clear the PostGIS point (raw SQL so the SRID is correct — see herrera-conventions). */
async function syncGeom(
  id: string,
  lat: number | null | undefined,
  lng: number | null | undefined,
) {
  const db = getDb();
  if (lat != null && lng != null) {
    await db.execute(
      sql`UPDATE listings SET geom = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326) WHERE id = ${id}`,
    );
  } else {
    await db.execute(sql`UPDATE listings SET geom = NULL WHERE id = ${id}`);
  }
}

export async function createManualListing(input: ManualListing): Promise<{ id: string }> {
  const db = getDb();
  const taken = await db.select({ slug: listings.slug }).from(listings);
  const slug = uniqueSlug(
    slugify(`${input.addressLine1}-${input.city}`) || "listing",
    taken.map((r) => r.slug),
  );
  const inserted = await db
    .insert(listings)
    .values({ ...toValues(input), source: "manual", slug })
    .returning({ id: listings.id });
  const id = inserted[0]!.id;
  await syncGeom(id, input.latitude, input.longitude);
  return { id };
}

export async function updateManualListing(id: string, input: ManualListing): Promise<void> {
  const db = getDb();
  await db
    .update(listings)
    .set({ ...toValues(input), updatedAt: new Date() })
    .where(sql`${listings.id} = ${id} AND ${listings.source} = 'manual'`);
  await syncGeom(id, input.latitude, input.longitude);
}

export async function deleteManualListing(id: string): Promise<void> {
  await getDb()
    .delete(listings)
    .where(sql`${listings.id} = ${id} AND ${listings.source} = 'manual'`);
}
