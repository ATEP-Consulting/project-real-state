import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { searchFilterControl } from "./enums";
import { questionOptionSchema, type QuestionOption } from "./json";

// ADR-007/012 (D3) — the admin-configurable SET of filters exposed on /search. `key` binds to a
// code-side registry (param parsing + PostGIS predicate, injection-safe). This row drives only
// PRESENTATION: which filters show, order, labels, options, bar-vs-"More filters", active. Nilyan
// edits these in /admin in D11; intentionally limited (lead-gen — ADR-007/012).
export const searchFilters = pgTable(
  "search_filters",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    key: text("key").notNull(), // stable code key (price, beds, baths, propertyType, waterfront, pool, age55, noHoa)
    control: searchFilterControl("control").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    label: text("label").notNull(),
    labelEs: text("label_es"),
    options: jsonb("options")
      .$type<QuestionOption[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    advanced: boolean("advanced").notNull().default(false), // true → "More filters" panel
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("search_filters_key_uq").on(t.key),
    index("search_filters_order_ix").on(t.sortOrder),
  ],
);

export const searchFilterInsertSchema = createInsertSchema(searchFilters, {
  options: z.array(questionOptionSchema).optional(),
});
export const searchFilterSelectSchema = createSelectSchema(searchFilters);
export type SearchFilter = typeof searchFilters.$inferSelect;
export type NewSearchFilter = typeof searchFilters.$inferInsert;
