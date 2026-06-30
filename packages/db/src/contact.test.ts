import { describe, expect, it } from "vitest";
import { contactLeadSchema } from "./contact";

describe("contactLeadSchema", () => {
  const base = { intent: "buy" as const, name: "Ana", message: "hi", consentEmail: true };

  it("requires at least one of email/phone", () => {
    expect(contactLeadSchema.safeParse({ ...base }).success).toBe(false);
    expect(contactLeadSchema.safeParse({ ...base, email: "a@b.com" }).success).toBe(true);
    expect(
      contactLeadSchema.safeParse({ intent: "sell", phone: "4075551234", message: "x" }).success,
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
