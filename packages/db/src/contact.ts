import { z } from "zod";
import { createLeadWithConsent, hasTransactionalConsent, phoneSchema } from "./leads-create";
import { contactFormConsentWording, marketingConsentWording } from "./consent-wording";

// General contact form — a lead-capture surface (ADR-007/011). Funnels through the
// shared lead core so per-channel consent + the D8 notification seam apply uniformly.
export const contactLeadSchema = z
  .object({
    intent: z.enum(["buy", "sell", "rent"]),
    name: z.string().trim().max(120).optional(),
    email: z.string().trim().email().optional(),
    phone: phoneSchema.optional(),
    message: z.string().trim().max(2000).optional(),
    consentEmail: z.boolean().optional(),
    consentPhone: z.boolean().optional(),
    consentMarketing: z.boolean().optional(),
    // ADR-020 / D13 — locale at submission time, used to store locale-correct consent wording.
    locale: z.enum(["en", "es"]).optional().default("en"),
  })
  .refine((d) => Boolean(d.email) || Boolean(d.phone), {
    message: "Provide an email or a phone (at least one).",
    path: ["email"],
  })
  .refine(hasTransactionalConsent, {
    message: "Consent to be contacted is required.",
    path: ["consentEmail"],
  });

export type ContactLead = z.infer<typeof contactLeadSchema>;

/** Create a lead from the general contact form (source `contact_form`). */
export async function createContactLead(input: ContactLead): Promise<{ leadId: string }> {
  return createLeadWithConsent({
    intent: input.intent,
    name: input.name ?? null,
    email: input.email ?? null,
    phone: input.phone ?? null,
    answers: input.message ? { message: input.message } : {},
    source: "contact_form",
    consentEmail: input.consentEmail,
    consentPhone: input.consentPhone,
    consentMarketing: input.consentMarketing,
    consentWording: contactFormConsentWording(input.locale),
    marketingWording: marketingConsentWording(input.locale),
  });
}
