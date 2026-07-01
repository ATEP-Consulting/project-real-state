import { describe, expect, it } from "vitest";
import { contactLeadSchema } from "./contact";

describe("contactLeadSchema", () => {
  const base = { intent: "buy" as const, name: "Ana", message: "hi", consentEmail: true };

  it("requires at least one of email/phone", () => {
    expect(contactLeadSchema.safeParse({ ...base }).success).toBe(false);
    expect(contactLeadSchema.safeParse({ ...base, email: "a@b.com" }).success).toBe(true);
    expect(
      contactLeadSchema.safeParse({
        intent: "sell",
        phone: "4075551234",
        message: "x",
        consentPhone: true,
      }).success,
    ).toBe(true);
  });

  it("requires consent for the provided channel", () => {
    // Channel present but no consent → rejected.
    expect(contactLeadSchema.safeParse({ intent: "buy", email: "a@b.com" }).success).toBe(false);
    expect(contactLeadSchema.safeParse({ intent: "buy", phone: "4075551234" }).success).toBe(false);
    // Consent must match a provided channel: consent on a channel that wasn't given → rejected.
    expect(
      contactLeadSchema.safeParse({ intent: "buy", email: "a@b.com", consentPhone: true }).success,
    ).toBe(false);
    // Provided channel + its consent → accepted.
    expect(
      contactLeadSchema.safeParse({ intent: "buy", email: "a@b.com", consentEmail: true }).success,
    ).toBe(true);
    expect(
      contactLeadSchema.safeParse({ intent: "buy", phone: "4075551234", consentPhone: true })
        .success,
    ).toBe(true);
  });

  it("requires a valid intent", () => {
    expect(contactLeadSchema.safeParse({ email: "a@b.com", message: "x" }).success).toBe(false);
    expect(
      contactLeadSchema.safeParse({ intent: "lease", email: "a@b.com", message: "x" }).success,
    ).toBe(false);
  });

  it("rejects a malformed email", () => {
    expect(contactLeadSchema.safeParse({ intent: "rent", email: "nope" }).success).toBe(false);
  });
});
