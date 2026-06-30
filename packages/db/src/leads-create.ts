import { getDb } from "./client";
import { consentRecords, type NewConsentRecord } from "./schema/consent";
import { leads } from "./schema/leads";
import type { Attribution } from "./schema/json";

export type LeadIntent = "buy" | "sell" | "rent";

export type CreateLeadInput = {
  intent: LeadIntent;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  answers: Record<string, unknown>;
  source: string;
  attribution?: Attribution;
  viewedListingIds?: string[];
  consentEmail?: boolean;
  consentPhone?: boolean;
  consentWording: string;
};

/**
 * Shared: insert a lead + per-channel consent records (ADR-007/011).
 * THE one place lead creation happens — both the per-listing inquiry (D4) and the
 * Buy/Sell/Rent qualification flow (D7) funnel through here.
 */
export async function createLeadWithConsent(input: CreateLeadInput): Promise<{ leadId: string }> {
  const db = getDb();
  const inserted = await db
    .insert(leads)
    .values({
      intent: input.intent,
      name: input.name ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      answers: input.answers,
      source: input.source,
      attribution: input.attribution,
      viewedListingIds: input.viewedListingIds ?? [],
    })
    .returning({ id: leads.id });
  const leadId = inserted[0]!.id;

  const consents: NewConsentRecord[] = [];
  if (input.email && input.consentEmail)
    consents.push({
      leadId,
      channel: "email",
      granted: true,
      wording: input.consentWording,
      source: input.source,
    });
  if (input.phone && input.consentPhone)
    consents.push({
      leadId,
      channel: "phone",
      granted: true,
      wording: input.consentWording,
      source: input.source,
    });
  if (consents.length) await db.insert(consentRecords).values(consents);

  // D8 SEAM (ADR-009): trigger Nilyan's instant email/WhatsApp alert + daily digest +
  // the lead's single transactional auto-response here. Not in D7.
  return { leadId };
}
