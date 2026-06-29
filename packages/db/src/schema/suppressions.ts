import { pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { contactChannel } from "./enums";

// ADR-011/017 — suppression-list SEAM. Modeled now; no send/suppress logic in v1.
export const suppressions = pgTable(
  "suppressions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    channel: contactChannel("channel").notNull(),
    value: text("value").notNull(), // the suppressed email / phone
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("suppressions_channel_value_uq").on(t.channel, t.value)],
);

export const suppressionInsertSchema = createInsertSchema(suppressions);
export const suppressionSelectSchema = createSelectSchema(suppressions);
export type Suppression = typeof suppressions.$inferSelect;
