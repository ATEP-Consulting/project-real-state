import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "./client";
import { content, type Content } from "./schema/content";
import { slugify, uniqueSlug } from "./slug";

// ADR-015 — admin editor for the guides/blog (content type='guide'). Body is Markdown,
// rendered (sanitized: no raw HTML) on /guides/[slug]. Admin-only (F4).
export const guideUpsertSchema = z.object({
  title: z.string().trim().min(1).max(200),
  slug: z.string().trim().max(120).optional(),
  excerpt: z.string().trim().max(500).nullish(),
  body: z.string().max(20000).nullish(),
  heroImageUrl: z.string().trim().max(500).nullish(),
  metaTitle: z.string().trim().max(200).nullish(),
  metaDescription: z.string().trim().max(500).nullish(),
  status: z.enum(["draft", "published"]).default("draft"),
});
export type GuideUpsert = z.infer<typeof guideUpsertSchema>;

export type AdminGuideRow = {
  id: string;
  slug: string;
  title: string;
  status: string;
  updatedAt: string;
};

/** ALL guides (incl. drafts), newest-updated first — the editor list. */
export async function listAdminGuides(): Promise<AdminGuideRow[]> {
  const rows = await getDb()
    .select({
      id: content.id,
      slug: content.slug,
      title: content.title,
      status: content.status,
      updatedAt: content.updatedAt,
    })
    .from(content)
    .where(eq(content.type, "guide"))
    .orderBy(desc(content.updatedAt));
  return rows.map((r) => ({ ...r, updatedAt: r.updatedAt.toISOString() }));
}

export async function getAdminGuide(id: string): Promise<Content | null> {
  const rows = await getDb()
    .select()
    .from(content)
    .where(and(eq(content.id, id), eq(content.type, "guide")))
    .limit(1);
  return rows[0] ?? null;
}

async function guideSlugs(): Promise<string[]> {
  const rows = await getDb()
    .select({ slug: content.slug })
    .from(content)
    .where(eq(content.type, "guide"));
  return rows.map((r) => r.slug);
}

export async function createGuide(input: GuideUpsert): Promise<{ id: string }> {
  const db = getDb();
  const base = slugify(input.slug || input.title) || "guide";
  const slug = uniqueSlug(base, await guideSlugs());
  const inserted = await db
    .insert(content)
    .values({
      type: "guide",
      status: input.status,
      slug,
      title: input.title,
      excerpt: input.excerpt ?? null,
      body: input.body ?? null,
      heroImageUrl: input.heroImageUrl ?? null,
      metaTitle: input.metaTitle ?? null,
      metaDescription: input.metaDescription ?? null,
      publishedAt: input.status === "published" ? new Date() : null,
    })
    .returning({ id: content.id });
  return { id: inserted[0]!.id };
}

export async function updateGuide(id: string, input: GuideUpsert): Promise<void> {
  const db = getDb();
  const current = await getAdminGuide(id);
  if (!current) return;
  // publish stamps publishedAt once (keep the original when already published); unpublish clears it.
  const publishedAt = input.status === "published" ? (current.publishedAt ?? new Date()) : null;
  await db
    .update(content)
    .set({
      status: input.status,
      slug: input.slug ? slugify(input.slug) : current.slug,
      title: input.title,
      excerpt: input.excerpt ?? null,
      body: input.body ?? null,
      heroImageUrl: input.heroImageUrl ?? null,
      metaTitle: input.metaTitle ?? null,
      metaDescription: input.metaDescription ?? null,
      publishedAt,
      updatedAt: new Date(),
    })
    .where(and(eq(content.id, id), eq(content.type, "guide")));
}

export async function setGuidePublished(id: string, published: boolean): Promise<void> {
  const db = getDb();
  const current = await getAdminGuide(id);
  if (!current) return;
  await db
    .update(content)
    .set({
      status: published ? "published" : "draft",
      publishedAt: published ? (current.publishedAt ?? new Date()) : null,
      updatedAt: new Date(),
    })
    .where(and(eq(content.id, id), eq(content.type, "guide")));
}

export async function deleteGuide(id: string): Promise<void> {
  await getDb()
    .delete(content)
    .where(and(eq(content.id, id), eq(content.type, "guide")));
}
