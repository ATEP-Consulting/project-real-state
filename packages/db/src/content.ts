import { and, desc, eq } from "drizzle-orm";
import { getDb } from "./client";
import { content } from "./schema/content";

export type GuideSummary = {
  slug: string;
  title: string;
  excerpt: string | null;
  heroImageUrl: string | null;
  publishedAt: string | null;
};
export type GuideDetail = GuideSummary & {
  body: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
};

/** Published guides, newest first (drives /guides + sitemap). */
export async function getPublishedGuides(): Promise<GuideSummary[]> {
  const db = getDb();
  const rows = await db
    .select({
      slug: content.slug,
      title: content.title,
      excerpt: content.excerpt,
      heroImageUrl: content.heroImageUrl,
      publishedAt: content.publishedAt,
    })
    .from(content)
    .where(and(eq(content.type, "guide"), eq(content.status, "published")))
    .orderBy(desc(content.publishedAt));
  return rows.map((r) => ({
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt,
    heroImageUrl: r.heroImageUrl,
    publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
  }));
}

/** A single published guide by slug, or null. */
export async function getGuideBySlug(slug: string): Promise<GuideDetail | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(content)
    .where(and(eq(content.type, "guide"), eq(content.status, "published"), eq(content.slug, slug)))
    .limit(1);
  const g = rows[0];
  if (!g) return null;
  return {
    slug: g.slug,
    title: g.title,
    excerpt: g.excerpt,
    heroImageUrl: g.heroImageUrl,
    publishedAt: g.publishedAt ? g.publishedAt.toISOString() : null,
    body: g.body,
    metaTitle: g.metaTitle,
    metaDescription: g.metaDescription,
  };
}
