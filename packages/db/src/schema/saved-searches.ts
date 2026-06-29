import { sql } from "drizzle-orm";
import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// ADR-017 — saved-search SHAPE seam for v2 (saved searches + alerts). No UI/logic in v1.
// `criteria` mirrors the structured search-filter object the search layer will consume (ADR-014 seam).
export const savedSearches = pgTable("saved_searches", {
  id: uuid("id").primaryKey().defaultRandom(),
  leadId: uuid("lead_id"), // nullable — passwordless client accounts are v2
  label: text("label"),
  criteria: jsonb("criteria")
    .$type<Record<string, unknown>>()
    .notNull()
    .default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const savedSearchInsertSchema = createInsertSchema(savedSearches);
export const savedSearchSelectSchema = createSelectSchema(savedSearches);
export type SavedSearch = typeof savedSearches.$inferSelect;
