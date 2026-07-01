import { describe, expect, it } from "vitest";
import { guideUpsertSchema } from "./admin-content";

describe("guideUpsertSchema", () => {
  it("requires a title and defaults to draft", () => {
    const r = guideUpsertSchema.safeParse({ title: "My guide" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.status).toBe("draft");
  });
  it("accepts optional slug / body / status=published", () => {
    const r = guideUpsertSchema.safeParse({
      title: "My guide",
      slug: "my-guide",
      body: "## Hello\n\nSome **markdown**.",
      status: "published",
    });
    expect(r.success).toBe(true);
  });
  it("rejects an empty payload or a bad status", () => {
    expect(guideUpsertSchema.safeParse({}).success).toBe(false);
    expect(guideUpsertSchema.safeParse({ title: "x", status: "live" }).success).toBe(false);
  });
});
