import { z } from "zod";
import { attributionSchema } from "./schema/json";
import { createLeadWithConsent, MARKETING_WORDING } from "./leads-create";

export const listingInquirySchema = z
  .object({
    listingSlug: z.string().min(1).max(120),
    requestType: z.enum(["info", "tour"]).default("info"),
    name: z.string().trim().min(1).max(120).optional(),
    email: z.string().email().optional(),
    phone: z.string().trim().min(7).max(40).optional(),
    message: z.string().trim().max(2000).optional(),
    preferredDate: z.string().trim().max(40).optional(),
    consentEmail: z.boolean().optional(),
    consentPhone: z.boolean().optional(),
    consentMarketing: z.boolean().optional(),
    attribution: attributionSchema.optional(),
  })
  .refine((d) => Boolean(d.email) || Boolean(d.phone), {
    message: "Provide an email or phone (at least one).",
    path: ["email"],
  });

export type ListingInquiry = z.infer<typeof listingInquirySchema>;

const CONSENT_WORDING =
  "I agree to be contacted by Herrera about this property using the details I provided. Message/data rates may apply.";

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
    consentWording: CONSENT_WORDING,
    marketingWording: MARKETING_WORDING,
  });
}
