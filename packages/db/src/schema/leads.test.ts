import { describe, expect, it } from "vitest";
import { leadInsertSchema } from "./leads";

const base = { intent: "buy" as const };

describe("leadInsertSchema (ADR-007: phone and/or email, at least one)", () => {
  it("accepts a lead with only an email", () => {
    expect(() => leadInsertSchema.parse({ ...base, email: "a@b.com" })).not.toThrow();
  });

  it("accepts a lead with only a phone", () => {
    expect(() => leadInsertSchema.parse({ ...base, phone: "+13055551234" })).not.toThrow();
  });

  it("rejects a lead with neither phone nor email", () => {
    expect(() => leadInsertSchema.parse({ ...base })).toThrow(/email or phone/i);
  });

  it("rejects an invalid email", () => {
    expect(() => leadInsertSchema.parse({ ...base, email: "nope" })).toThrow();
  });
});
