import { describe, expect, it } from "vitest";
import { listingInquirySchema } from "./inquiries";
import { qualificationLeadSchema } from "./qualification";
import { contactLeadSchema } from "./contact";

// ADR-020 — the marketing opt-in is OPTIONAL on every capture schema (never required)
// and, when provided, is CAPTURED (not silently stripped, so the core can record it).
describe("marketing opt-in on every capture schema", () => {
  it("is optional — parses fine without it", () => {
    expect(listingInquirySchema.safeParse({ email: "a@b.com", listingSlug: "x" }).success).toBe(
      true,
    );
    expect(qualificationLeadSchema.safeParse({ email: "a@b.com", intent: "buy" }).success).toBe(
      true,
    );
    expect(contactLeadSchema.safeParse({ email: "a@b.com", intent: "sell" }).success).toBe(true);
  });

  it("captures consentMarketing when provided", () => {
    const li = listingInquirySchema.parse({
      email: "a@b.com",
      listingSlug: "x",
      consentMarketing: true,
    });
    const q = qualificationLeadSchema.parse({
      email: "a@b.com",
      intent: "buy",
      consentMarketing: false,
    });
    const c = contactLeadSchema.parse({ email: "a@b.com", intent: "sell", consentMarketing: true });
    expect(li.consentMarketing).toBe(true);
    expect(q.consentMarketing).toBe(false);
    expect(c.consentMarketing).toBe(true);
  });
});
