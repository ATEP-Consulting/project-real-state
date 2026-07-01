import { describe, expect, it } from "vitest";
import { qualificationLeadSchema } from "./qualification";

describe("qualificationLeadSchema — source allowlist (D9)", () => {
  it("accepts source='favorites' with viewedListingIds", () => {
    const parsed = qualificationLeadSchema.parse({
      intent: "buy",
      email: "a@b.com",
      source: "favorites",
      viewedListingIds: ["123-main-st", "9-ocean-dr"],
    });
    expect(parsed.source).toBe("favorites");
    expect(parsed.viewedListingIds).toEqual(["123-main-st", "9-ocean-dr"]);
  });

  it("accepts source='qualification_flow'", () => {
    expect(
      qualificationLeadSchema.parse({ intent: "buy", email: "a@b.com", source: "qualification_flow" })
        .source,
    ).toBe("qualification_flow");
  });

  it("parses fine with no source (stays optional)", () => {
    expect(qualificationLeadSchema.safeParse({ intent: "buy", email: "a@b.com" }).success).toBe(true);
  });

  it("rejects an arbitrary source string", () => {
    expect(
      qualificationLeadSchema.safeParse({ intent: "buy", email: "a@b.com", source: "zillow" }).success,
    ).toBe(false);
  });
});
