import { describe, expect, it } from "vitest";
import { qualificationLeadSchema } from "./qualification";

describe("qualificationLeadSchema", () => {
  it("accepts a buy lead with just an email", () => {
    const r = qualificationLeadSchema.safeParse({
      intent: "buy",
      answers: { timeline: "0_3" },
      email: "a@b.com",
      consentEmail: true,
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.answers.timeline).toBe("0_3");
  });
  it("accepts a sell lead with just a phone and defaults answers to {}", () => {
    const r = qualificationLeadSchema.safeParse({ intent: "sell", phone: "3055550148" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.answers).toEqual({});
  });
  it("accepts a rent lead", () => {
    expect(qualificationLeadSchema.safeParse({ intent: "rent", email: "a@b.com" }).success).toBe(
      true,
    );
  });
  it("rejects neither email nor phone", () => {
    expect(qualificationLeadSchema.safeParse({ intent: "buy", answers: {} }).success).toBe(false);
  });
  it("rejects an unknown intent and a bad email", () => {
    expect(qualificationLeadSchema.safeParse({ intent: "lease", email: "a@b.com" }).success).toBe(
      false,
    );
    expect(qualificationLeadSchema.safeParse({ intent: "buy", email: "nope" }).success).toBe(false);
  });
});
