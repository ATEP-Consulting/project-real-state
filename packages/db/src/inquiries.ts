import { z } from "zod";
import { getDb } from "./client";
import { consentRecords, type NewConsentRecord } from "./schema/consent";
import { leads } from "./schema/leads";
import { attributionSchema } from "./schema/json";

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
  const db = getDb();
  const inserted = await db
    .insert(leads)
    .values({
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
    })
    .returning({ id: leads.id });
  const leadId = inserted[0]!.id;

  const consents: NewConsentRecord[] = [];
  if (input.email && input.consentEmail)
    consents.push({
      leadId,
      channel: "email",
      granted: true,
      wording: CONSENT_WORDING,
      source: "listing_inquiry",
    });
  if (input.phone && input.consentPhone)
    consents.push({
      leadId,
      channel: "phone",
      granted: true,
      wording: CONSENT_WORDING,
      source: "listing_inquiry",
    });
  if (consents.length) await db.insert(consentRecords).values(consents);

  // D8 SEAM (ADR-009): trigger Nilyan's instant email/WhatsApp alert + daily digest here. Not in D4.
  return { leadId };
}
