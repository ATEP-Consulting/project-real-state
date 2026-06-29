import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { activityType } from "./enums";
import { leads } from "./leads";

// ADR-008 — calls, notes, status changes, follow-up reminders tied to a lead
export const activities = pgTable(
  "activities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    type: activityType("type").notNull(),
    body: text("body"),
    // status_change → { from, to }; other types may carry small structured extras
    meta: jsonb("meta")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    // reminders
    dueAt: timestamp("due_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("activities_lead_ix").on(t.leadId), index("activities_due_ix").on(t.dueAt)],
);

export const activityInsertSchema = createInsertSchema(activities);
export const activitySelectSchema = createSelectSchema(activities);
export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;
