import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "./client";
import { createLeadWithConsent } from "./leads-create";
import { attributionSchema, qualificationAnswersSchema } from "./schema/json";
import {
  qualificationQuestions,
  type QualificationQuestion,
} from "./schema/qualification-questions";

// ADR-007 — the Buy/Sell/Rent capture payload. Contact phone and/or email (at least one).
export const qualificationLeadSchema = z
  .object({
    intent: z.enum(["buy", "sell", "rent"]),
    answers: qualificationAnswersSchema.default({}),
    name: z.string().trim().min(1).max(120).optional(),
    email: z.string().email().optional(),
    phone: z.string().trim().min(7).max(40).optional(),
    consentEmail: z.boolean().optional(),
    consentPhone: z.boolean().optional(),
    attribution: attributionSchema.optional(),
    viewedListingIds: z.array(z.string()).optional(),
  })
  .refine((d) => Boolean(d.email) || Boolean(d.phone), {
    message: "Provide an email or phone (at least one).",
    path: ["email"],
  });

export type QualificationLead = z.infer<typeof qualificationLeadSchema>;

const CONSENT_WORDING =
  "I agree to be contacted by Herrera about my real estate needs using the details I provided. Message/data rates may apply.";

/** Create a lead (intent = branch) + per-channel consent from the Buy/Sell/Rent flow (ADR-007/011). */
export async function createQualificationLead(
  input: QualificationLead,
): Promise<{ leadId: string }> {
  return createLeadWithConsent({
    intent: input.intent,
    name: input.name ?? null,
    email: input.email ?? null,
    phone: input.phone ?? null,
    answers: input.answers,
    source: "qualification_flow",
    attribution: input.attribution,
    viewedListingIds: input.viewedListingIds ?? [],
    consentEmail: input.email ? input.consentEmail : false,
    consentPhone: input.phone ? input.consentPhone : false,
    consentWording: CONSENT_WORDING,
  });
}

// JSON-safe projection (no timestamps) — the shape handed to the flow.
export type QualificationQuestionConfig = Pick<
  QualificationQuestion,
  "key" | "type" | "label" | "labelEs" | "options" | "required"
>;

/** Active questions for an intent, in display order. Admin-editable in D11; READ-only here. */
export async function getQualificationQuestions(
  intent: "buy" | "sell" | "rent",
): Promise<QualificationQuestionConfig[]> {
  return getDb()
    .select({
      key: qualificationQuestions.key,
      type: qualificationQuestions.type,
      label: qualificationQuestions.label,
      labelEs: qualificationQuestions.labelEs,
      options: qualificationQuestions.options,
      required: qualificationQuestions.required,
    })
    .from(qualificationQuestions)
    .where(
      and(eq(qualificationQuestions.intent, intent), eq(qualificationQuestions.isActive, true)),
    )
    .orderBy(asc(qualificationQuestions.sortOrder));
}
