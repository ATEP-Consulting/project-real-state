import { boolean, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { contactChannel } from "./enums";
import { leads } from "./leads";

// ADR-011 — immutable per-channel consent record (what was agreed, when, the wording shown, source)
export const consentRecords = pgTable(
  "consent_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    channel: contactChannel("channel").notNull(),
    granted: boolean("granted").notNull(),
    wording: text("wording").notNull(),
    source: text("source"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("consent_lead_ix").on(t.leadId)],
);

export const consentInsertSchema = createInsertSchema(consentRecords);
export const consentSelectSchema = createSelectSchema(consentRecords);
export type ConsentRecord = typeof consentRecords.$inferSelect;
export type NewConsentRecord = typeof consentRecords.$inferInsert;
