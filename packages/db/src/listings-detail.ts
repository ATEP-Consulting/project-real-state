import { and, eq, ne, sql } from "drizzle-orm";
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
