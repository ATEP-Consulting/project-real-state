import { z } from "zod";
import { attributionSchema } from "./schema/json";
import { createLeadWithConsent, hasTransactionalConsent, phoneSchema } from "./leads-create";
import { inquiryConsentWording, marketingConsentWording } from "./consent-wording";

export const listingInquirySchema = z
  .object({
    listingSlug: z.string().min(1).max(120),
    requestType: z.enum(["info", "tour"]).default("info"),
    name: z.string().trim().min(1).max(120).optional(),
    email: z.string().email().optional(),
    phone: phoneSchema.optional(),
    message: z.string().trim().max(2000).optional(),
    preferredDate: z.string().trim().max(40).optional(),
    consentEmail: z.boolean().optional(),
    consentPhone: z.boolean().optional(),
    consentMarketing: z.boolean().optional(),
    attribution: attributionSchema.optional(),
    // ADR-020 / D13 — locale at submission time, used to store locale-correct consent wording.
    locale: z.enum(["en", "es"]).optional().default("en"),
  })
  .refine((d) => Boolean(d.email) || Boolean(d.phone), {
    message: "Provide an email or phone (at least one).",
    path: ["email"],
  })
  .refine(hasTransactionalConsent, {
    message: "Consent to be contacted is required.",
    path: ["consentEmail"],
  });

export type ListingInquiry = z.infer<typeof listingInquirySchema>;

/** Create a lead + per-channel consent records from a per-listing inquiry (ADR-007/011). */
export async function createListingInquiry(input: ListingInquiry): Promise<{ leadId: string }> {
  return createLeadWithConsent({
    intent: "buy",
    name: input.name ?? null,
    email: input.email ?? null,
    phone: input.phone ?? null,
    answers: {
      requestType: input.requestType,
      message: input.message ?? null,
      preferredDate: input.preferredDate ?? null,
      listingSlug: input.listingSlug,
    },
    source: "listing_inquiry",
    attribution: input.attribution,
    viewedListingIds: [input.listingSlug],
    consentEmail: input.email ? input.consentEmail : false,
    consentPhone: input.phone ? input.consentPhone : false,
    consentMarketing: input.consentMarketing,
    consentWording: inquiryConsentWording(input.locale),
    marketingWording: marketingConsentWording(input.locale),
  });
}
