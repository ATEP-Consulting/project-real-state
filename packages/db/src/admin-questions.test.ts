import { describe, expect, it } from "vitest";
import { questionUpsertSchema, nextSortOrder } from "./admin-questions";

describe("questionUpsertSchema", () => {
  it("requires the core fields and defaults flags", () => {
    const r = questionUpsertSchema.safeParse({
      intent: "buy",
      key: "timeline",
      type: "single_select",
      label: "When are you looking to buy?",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.required).toBe(false);
      expect(r.data.isActive).toBe(true);
      expect(r.data.options).toEqual([]);
    }
  });
  it("rejects missing label / bad type / bad intent", () => {
    expect(
      questionUpsertSchema.safeParse({ intent: "buy", key: "x", type: "single_select" }).success,
    ).toBe(false);
    expect(
      questionUpsertSchema.safeParse({ intent: "buy", key: "x", type: "slider", label: "L" })
        .success,
    ).toBe(false);
    expect(
      questionUpsertSchema.safeParse({ intent: "lease", key: "x", type: "text", label: "L" })
        .success,
    ).toBe(false);
  });
  it("validates option shape", () => {
    const ok = questionUpsertSchema.safeParse({
      intent: "buy",
      key: "budget",
      type: "single_select",
      label: "Budget?",
      options: [{ value: "300_500", label: "$300k–$500k" }],
    });
    expect(ok.success).toBe(true);
    const bad = questionUpsertSchema.safeParse({
      intent: "buy",
      key: "budget",
      type: "single_select",
      label: "Budget?",
      options: [{ value: "x" }],
    });
    expect(bad.success).toBe(false);
  });
});

describe("nextSortOrder", () => {
  it("is max+1, or 0 when empty", () => {
    expect(nextSortOrder([])).toBe(0);
    expect(nextSortOrder([{ sortOrder: 0 }, { sortOrder: 3 }])).toBe(4);
    expect(nextSortOrder([{ sortOrder: 5 }])).toBe(6);
  });
});
