import { sql } from "drizzle-orm";
import { check, index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { leadIntent, leadStatus } from "./enums";
import {
  attributionSchema,
  qualificationAnswersSchema,
  type Attribution,
  type QualificationAnswers,
} from "./json";

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    intent: leadIntent("intent").notNull(),
    status: leadStatus("status").notNull().default("new"),

    // contact — at least one of email/phone (CHECK below + zod refinement)
    name: text("name"),
    email: text("email"),
    phone: text("phone"),

    // qualification + attribution (ADR-007)
    answers: jsonb("answers")
      .$type<QualificationAnswers>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    source: text("source"),
    attribution: jsonb("attribution").$type<Attribution>(),
    viewedListingIds: jsonb("viewed_listing_ids")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("leads_contact_present", sql`${t.email} is not null or ${t.phone} is not null`),
    index("leads_status_ix").on(t.status),
    index("leads_intent_ix").on(t.intent),
  ],
);

export const leadInsertSchema = createInsertSchema(leads, {
  email: z.string().email().optional(),
  phone: z.string().min(7).optional(),
  answers: qualificationAnswersSchema.optional(),
  attribution: attributionSchema.optional(),
  viewedListingIds: z.array(z.string().uuid()).optional(),
}).refine((d) => Boolean(d.email) || Boolean(d.phone), {
  message: "A lead requires an email or phone (at least one).",
  path: ["email"],
});
export const leadSelectSchema = createSelectSchema(leads);

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
