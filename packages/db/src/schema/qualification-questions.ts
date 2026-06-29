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
import { leadIntent, questionType } from "./enums";
import { questionOptionSchema, type QuestionOption } from "./json";

// ADR-007 — admin-editable questions per intent (Nilyan configures); answers keyed by `key`
export const qualificationQuestions = pgTable(
  "qualification_questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    intent: leadIntent("intent").notNull(),
    key: text("key").notNull(), // stable key referenced by leads.answers
    sortOrder: integer("sort_order").notNull().default(0),
    type: questionType("type").notNull(),
    label: text("label").notNull(),
    labelEs: text("label_es"),
    options: jsonb("options")
      .$type<QuestionOption[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    required: boolean("required").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("questions_intent_key_uq").on(t.intent, t.key),
    index("questions_intent_order_ix").on(t.intent, t.sortOrder),
  ],
);

export const questionInsertSchema = createInsertSchema(qualificationQuestions, {
  options: z.array(questionOptionSchema).optional(),
});
export const questionSelectSchema = createSelectSchema(qualificationQuestions);
export type QualificationQuestion = typeof qualificationQuestions.$inferSelect;
export type NewQualificationQuestion = typeof qualificationQuestions.$inferInsert;
