import { describe, expect, it } from "vitest";
import { listingInquirySchema } from "./inquiries";
import { qualificationLeadSchema } from "./qualification";
import { contactLeadSchema } from "./contact";
import { hasTransactionalConsent, phoneSchema } from "./leads-create";

describe("phoneSchema", () => {
  it("accepts the client's normalized E.164 shape", () => {
    expect(phoneSchema.safeParse("+13055550148").success).toBe(true);
    expect(phoneSchema.safeParse("+34612345678").success).toBe(true);
  });
  it("accepts the legacy bare/formatted shapes (stale cached pages keep working)", () => {
    expect(phoneSchema.safeParse("3055550148").success).toBe(true);
    expect(phoneSchema.safeParse("(305) 555-0148").success).toBe(true);
  });
  it("rejects strings that cannot be a phone", () => {
    expect(phoneSchema.safeParse("call me maybe").success).toBe(false);
    expect(phoneSchema.safeParse("a@b.com").success).toBe(false);
    expect(phoneSchema.safeParse("12345").success).toBe(false); // too short
  });
});

describe("hasTransactionalConsent", () => {
  it("is true only when a provided channel carries its consent", () => {
    expect(hasTransactionalConsent({ email: "a@b.com", consentEmail: true })).toBe(true);
    expect(hasTransactionalConsent({ phone: "3055550148", consentPhone: true })).toBe(true);
  });
  it("is false when a channel is provided without consent", () => {
    expect(hasTransactionalConsent({ email: "a@b.com" })).toBe(false);
    expect(hasTransactionalConsent({ phone: "3055550148" })).toBe(false);
  });
  it("is false when consent is granted for a channel that wasn't provided", () => {
    expect(hasTransactionalConsent({ email: "a@b.com", consentPhone: true })).toBe(false);
    expect(hasTransactionalConsent({})).toBe(false);
  });
});

// ADR-020 — the marketing opt-in is OPTIONAL on every capture schema (never required)
// and, when provided, is CAPTURED (not silently stripped, so the core can record it).
describe("marketing opt-in on every capture schema", () => {
  it("is optional — parses fine without it", () => {
    expect(
      listingInquirySchema.safeParse({ email: "a@b.com", listingSlug: "x", consentEmail: true })
        .success,
    ).toBe(true);
    expect(
      qualificationLeadSchema.safeParse({ email: "a@b.com", intent: "buy", consentEmail: true })
        .success,
    ).toBe(true);
    expect(
      contactLeadSchema.safeParse({ email: "a@b.com", intent: "sell", consentEmail: true }).success,
    ).toBe(true);
  });

  it("captures consentMarketing when provided", () => {
    const li = listingInquirySchema.parse({
      email: "a@b.com",
      listingSlug: "x",
      consentEmail: true,
      consentMarketing: true,
    });
    const q = qualificationLeadSchema.parse({
      email: "a@b.com",
      intent: "buy",
      consentEmail: true,
      consentMarketing: false,
    });
    const c = contactLeadSchema.parse({
      email: "a@b.com",
      intent: "sell",
      consentEmail: true,
      consentMarketing: true,
    });
    expect(li.consentMarketing).toBe(true);
    expect(q.consentMarketing).toBe(false);
    expect(c.consentMarketing).toBe(true);
  });
});
