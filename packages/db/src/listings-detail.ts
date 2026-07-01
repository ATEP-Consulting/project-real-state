import { and, eq, inArray, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "./client";
import { listings, type Listing } from "./schema/listings";

/** One listing by its public slug (any visibility/status — the page decides what to render). */
export async function getListingBySlug(slug: string): Promise<Listing | null> {
  const rows = await getDb().select().from(listings).where(eq(listings.slug, slug)).limit(1);
  return rows[0] ?? null;
}

/** Up to `limit` public+active listings in the same city, nearest in price, excluding `slug`. */
export async function getSimilarListings(opts: {
  slug: string;
  city: string;
  price: number;
  limit?: number;
}): Promise<Listing[]> {
  return getDb()
    .select()
    .from(listings)
    .where(
      and(
        eq(listings.status, "active"),
        eq(listings.visibility, "public"),
        eq(listings.city, opts.city),
        ne(listings.slug, opts.slug),
      ),
    )
    .orderBy(sql`abs(${listings.price} - ${opts.price})`)
    .limit(opts.limit ?? 4);
}

/** Slugs to pre-render at build (public + active). Off-market/private-link render on demand. */
export async function getPublishedListingSlugs(): Promise<string[]> {
  const rows = await getDb()
    .select({ slug: listings.slug })
    .from(listings)
    .where(and(eq(listings.status, "active"), eq(listings.visibility, "public")));
  return rows.map((r) => r.slug);
}

/** Public+active listings for a set of slugs (D9 favorites). Order is NOT guaranteed —
 * the client re-orders to its saved order. Empty input short-circuits to no query. */
export async function getListingsBySlugs(slugs: string[]): Promise<Listing[]> {
  if (slugs.length === 0) return [];
  return getDb()
    .select()
    .from(listings)
    .where(
      and(
        eq(listings.status, "active"),
        eq(listings.visibility, "public"),
        inArray(listings.slug, slugs),
      ),
    );
}

/** Request body for POST /api/listings/by-slugs — bounded so a tampered client can't ask for the world. */
export const listingsBySlugsInputSchema = z.object({
  slugs: z.array(z.string().min(1).max(160)).max(100).default([]),
});
