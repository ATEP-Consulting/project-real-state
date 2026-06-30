import { describe, expect, it } from "vitest";
import { activityCreateSchema, leadStatusUpdateSchema } from "./admin-leads";

describe("leadStatusUpdateSchema", () => {
  it("accepts a valid stage", () => {
    expect(leadStatusUpdateSchema.safeParse({ status: "qualified" }).success).toBe(true);
  });
  it("rejects an unknown stage", () => {
    expect(leadStatusUpdateSchema.safeParse({ status: "archived" }).success).toBe(false);
  });
});

describe("activityCreateSchema", () => {
  it("accepts a note with a body", () => {
    expect(activityCreateSchema.safeParse({ type: "note", body: "Called, left vm" }).success).toBe(
      true,
    );
  });
  it("accepts a call with a body", () => {
    expect(activityCreateSchema.safeParse({ type: "call", body: "Spoke 10m" }).success).toBe(true);
  });
  it("rejects a note with no body", () => {
    expect(activityCreateSchema.safeParse({ type: "note" }).success).toBe(false);
  });
  it("requires a dueAt for reminders", () => {
    expect(activityCreateSchema.safeParse({ type: "reminder", body: "Call back" }).success).toBe(
      false,
    );
    expect(
      activityCreateSchema.safeParse({ type: "reminder", dueAt: "2026-07-05T15:00:00.000Z" })
        .success,
    ).toBe(true);
  });
  it("rejects an unknown activity type", () => {
    expect(activityCreateSchema.safeParse({ type: "status_change", body: "x" }).success).toBe(
      false,
    );
  });
});
