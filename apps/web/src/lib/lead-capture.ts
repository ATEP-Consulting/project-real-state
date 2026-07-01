import type { QualificationQuestionConfig } from "@herrera/db";

export type Intent = "buy" | "sell" | "rent";
export type Answers = Record<string, unknown>;
export type LeadSource = "qualification_flow" | "favorites";

export type Step =
  { kind: "question"; question: QualificationQuestionConfig } | { kind: "contact" };

/** The flow's screens: one per question, then the contact step. */
export function buildSteps(questions: QualificationQuestionConfig[]): Step[] {
  return [
    ...questions.map((question): Step => ({ kind: "question", question })),
    { kind: "contact" },
  ];
}

/** Has this question been answered? (false/0/"" handled per type.) */
export function isAnswered(q: QualificationQuestionConfig, answers: Answers): boolean {
  const v = answers[q.key];
  if (q.type === "multi_select") return Array.isArray(v) && v.length > 0;
  if (q.type === "boolean") return typeof v === "boolean";
  if (q.type === "number") return typeof v === "number" && !Number.isNaN(v);
  return v !== undefined && v !== null && String(v).trim() !== "";
}

/** Can the user move past this step? Optional questions and the contact step never block. */
export function canAdvance(step: Step, answers: Answers): boolean {
  if (step.kind === "contact") return true;
  if (!step.question.required) return true;
  return isAnswered(step.question, answers);
}

export function progressPct(stepIndex: number, totalSteps: number): number {
  if (totalSteps <= 0) return 0;
  return Math.round((stepIndex / totalSteps) * 100);
}

export type ContactInput = {
  name?: string;
  email?: string;
  phone?: string;
  consent: boolean;
  marketing?: boolean; // ADR-020 — optional marketing opt-in (unchecked by default)
};

/** Client mirror of the D4 contact rule. Returns an error message, or null when valid. */
export function validateContact(c: ContactInput): string | null {
  const email = (c.email ?? "").trim();
  const phone = (c.phone ?? "").trim();
  if (!email && !phone) return "Please add an email or a phone so Nilyan can reach you.";
  if (!c.consent) return "Please agree to be contacted.";
  return null;
}

export type LeadPayload = {
  intent: Intent;
  answers: Answers;
  name?: string;
  email?: string;
  phone?: string;
  consentEmail: boolean;
  consentPhone: boolean;
  consentMarketing: boolean;
  attribution: { landingPath: string };
  source?: LeadSource;
  viewedListingIds?: string[];
};

/** Shape the POST /api/leads body. Consent is granted per channel the user actually provided. */
export function buildLeadPayload(args: {
  intent: Intent;
  answers: Answers;
  contact: ContactInput;
  landingPath: string;
  source?: LeadSource;
  viewedListingIds?: string[];
}): LeadPayload {
  const email = (args.contact.email ?? "").trim();
  const phone = (args.contact.phone ?? "").trim();
  const name = (args.contact.name ?? "").trim();
  return {
    intent: args.intent,
    answers: args.answers,
    name: name || undefined,
    email: email || undefined,
    phone: phone || undefined,
    consentEmail: Boolean(email),
    consentPhone: Boolean(phone),
    consentMarketing: Boolean(args.contact.marketing),
    attribution: { landingPath: args.landingPath },
    ...(args.source ? { source: args.source } : {}),
    ...(args.viewedListingIds && args.viewedListingIds.length
      ? { viewedListingIds: args.viewedListingIds }
      : {}),
  };
}
