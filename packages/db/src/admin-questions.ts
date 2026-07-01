import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "./client";
import { questionOptionSchema } from "./schema/json";
import {
  qualificationQuestions,
  type QualificationQuestion,
} from "./schema/qualification-questions";

// ADR-007 — admin editor for the Buy/Sell/Rent qualification questions (the public flow
// reads the ACTIVE ones live via getQualificationQuestions). Admin-only (F4).
export const questionUpsertSchema = z.object({
  intent: z.enum(["buy", "sell", "rent"]),
  key: z
    .string()
    .trim()
    .min(1)
    .max(60)
    .regex(/^[a-z0-9_]+$/, "Use lowercase letters, numbers and underscores"),
  type: z.enum(["single_select", "multi_select", "text", "number", "boolean", "range"]),
  label: z.string().trim().min(1).max(200),
  labelEs: z.string().trim().max(200).nullish(),
  options: z.array(questionOptionSchema).default([]),
  required: z.boolean().default(false),
  isActive: z.boolean().default(true),
});
export type QuestionUpsert = z.infer<typeof questionUpsertSchema>;

/** Next append position for a fresh question (max sortOrder + 1, or 0 when empty). */
export function nextSortOrder(existing: { sortOrder: number }[]): number {
  return existing.length ? Math.max(...existing.map((r) => r.sortOrder)) + 1 : 0;
}

/** ALL questions for an intent (incl. inactive), in display order — the editor list. */
export async function getAdminQuestions(
  intent: "buy" | "sell" | "rent",
): Promise<QualificationQuestion[]> {
  return getDb()
    .select()
    .from(qualificationQuestions)
    .where(eq(qualificationQuestions.intent, intent))
    .orderBy(asc(qualificationQuestions.sortOrder));
}

export async function createQuestion(input: QuestionUpsert): Promise<{ id: string }> {
  const db = getDb();
  const existing = await db
    .select({ sortOrder: qualificationQuestions.sortOrder })
    .from(qualificationQuestions)
    .where(eq(qualificationQuestions.intent, input.intent));
  const inserted = await db
    .insert(qualificationQuestions)
    .values({ ...input, sortOrder: nextSortOrder(existing) })
    .returning({ id: qualificationQuestions.id });
  return { id: inserted[0]!.id };
}

export async function updateQuestion(id: string, input: QuestionUpsert): Promise<void> {
  await getDb()
    .update(qualificationQuestions)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(qualificationQuestions.id, id));
}

export async function deleteQuestion(id: string): Promise<void> {
  await getDb().delete(qualificationQuestions).where(eq(qualificationQuestions.id, id));
}

export async function setQuestionActive(id: string, isActive: boolean): Promise<void> {
  await getDb()
    .update(qualificationQuestions)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(qualificationQuestions.id, id));
}

/** Persist a new order: `sortOrder = index` for each id within its intent. */
export async function reorderQuestions(
  intent: "buy" | "sell" | "rent",
  orderedIds: string[],
): Promise<void> {
  const db = getDb();
  for (let i = 0; i < orderedIds.length; i++) {
    await db
      .update(qualificationQuestions)
      .set({ sortOrder: i, updatedAt: new Date() })
      .where(
        and(
          eq(qualificationQuestions.id, orderedIds[i]!),
          eq(qualificationQuestions.intent, intent),
        ),
      );
  }
}
