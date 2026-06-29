import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { contentStatus, contentType } from "./enums";

// ADR-008/015/018 — admin-editable area/neighborhood/guide pages, localized EN/ES (English default)
export const content = pgTable(
  "content",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: contentType("type").notNull(),
    status: contentStatus("status").notNull().default("draft"),
    slug: text("slug").notNull(),

    // area/neighborhood mapping for /areas/[city]/[neighborhood]
    city: text("city"),
    neighborhood: text("neighborhood"),

    // localized fields (EN default + ES)
    title: text("title").notNull(),
    titleEs: text("title_es"),
    excerpt: text("excerpt"),
    excerptEs: text("excerpt_es"),
    body: text("body"),
    bodyEs: text("body_es"),
    heroImageUrl: text("hero_image_url"),

    // SEO (ADR-015)
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),

    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("content_type_slug_uq").on(t.type, t.slug),
    index("content_status_ix").on(t.status),
  ],
);

export const contentInsertSchema = createInsertSchema(content);
export const contentSelectSchema = createSelectSchema(content);
export type Content = typeof content.$inferSelect;
export type NewContent = typeof content.$inferInsert;
