import { z } from "zod";
import { getDb } from "./client";
import { consentRecords, type NewConsentRecord } from "./schema/consent";
import { leads } from "./schema/leads";
import type { Attribution } from "./schema/json";
import { MARKETING_WORDING_EN } from "./consent-wording";

export type LeadIntent = "buy" | "sell" | "rent";

/**
 * The one phone rule for every capture schema. Accepts the client's normalized
 * "+<dial><digits>" AND the legacy bare-digit shape (stale cached pages must
 * never lose a lead to a 400) — only rejects strings that can't be a phone at
 * all (letters etc.). Deliberately loose; no per-country validation (ADR-007).
 */
export const phoneSchema = z
  .string()
  .trim()
  .min(7)
  .max(40)
  .regex(/^\+?[\d\s().-]+$/, "Not a valid phone number.");

/**
 * A public capture must carry transactional consent for at least one channel the submitter
 * actually provided (ADR-007/011). Used as the Zod refine on every capture schema so a
 * consent-less POST is rejected at the boundary — defense in depth behind the disabled
 * submit button, never the only gate.
 */
export function hasTransactionalConsent(d: {
  email?: string | null;
  phone?: string | null;
  consentEmail?: boolean;
  consentPhone?: boolean;
}): boolean {
  return Boolean((d.email && d.consentEmail) || (d.phone && d.consentPhone));
}

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
  // ADR-020 — optional marketing opt-in (email-scoped). When an email is present we ALWAYS
  // record a marketing row: granted = true if opted in, false otherwise (auditable, never omitted).
  consentMarketing?: boolean;
  marketingWording?: string;
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
  // Transactional / contact consent (required per channel provided).
  if (input.email && input.consentEmail)
    consents.push({
      leadId,
      channel: "email",
      purpose: "transactional",
      granted: true,
      wording: input.consentWording,
      source: input.source,
    });
  if (input.phone && input.consentPhone)
    consents.push({
      leadId,
      channel: "phone",
      purpose: "transactional",
      granted: true,
      wording: input.consentWording,
      source: input.source,
    });
  // Marketing opt-in (ADR-020) — email-scoped; always recorded when an email is present,
  // granted = true only if the (optional, unchecked-by-default) box was ticked.
  if (input.email)
    consents.push({
      leadId,
      channel: "email",
      purpose: "marketing",
      granted: input.consentMarketing === true,
      wording: input.marketingWording ?? MARKETING_WORDING_EN,
      source: input.source,
    });
  if (consents.length) await db.insert(consentRecords).values(consents);

  // D8 SEAM (ADR-009): trigger Nilyan's instant email/WhatsApp alert + daily digest +
  // the lead's single transactional auto-response here. Not in D7.
  return { leadId };
}
