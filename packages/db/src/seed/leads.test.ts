import { describe, expect, it } from "vitest";
import { activityInsertSchema } from "../schema/activities";
import { consentInsertSchema } from "../schema/consent";
import { leadInsertSchema } from "../schema/leads";
import { generateLeads } from "./leads";
import { generateListings } from "./listings";
import { makeRng } from "./prng";

const DUMMY_LEAD_ID = "00000000-0000-0000-0000-000000000000";
const NOW = new Date("2026-06-30T12:00:00.000Z");

describe("generateLeads", () => {
  const listings = generateListings(makeRng(20260629));
  const { leads, activities, consents } = generateLeads(makeRng(42), listings, NOW);

  it("creates several leads, each with phone and/or email", () => {
    expect(leads.length).toBeGreaterThanOrEqual(8);
    for (const l of leads) expect(Boolean(l.email) || Boolean(l.phone)).toBe(true);
  });

  it("every lead validates against leadInsertSchema", () => {
    for (const l of leads) expect(() => leadInsertSchema.parse(l)).not.toThrow();
  });

  it("activities + consents validate (with a lead id attached)", () => {
    for (const a of activities)
      expect(() => activityInsertSchema.parse({ ...a.row, leadId: DUMMY_LEAD_ID })).not.toThrow();
    for (const c of consents)
      expect(() => consentInsertSchema.parse({ ...c.row, leadId: DUMMY_LEAD_ID })).not.toThrow();
  });

  it("covers multiple pipeline statuses incl. closed + lost + 3 uncontacted", () => {
    const by = (s: string) => leads.filter((l) => l.status === s).length;
    expect(new Set(leads.map((l) => l.status)).size).toBeGreaterThanOrEqual(4);
    expect(by("new")).toBe(3);
    expect(by("closed")).toBe(1);
    expect(by("lost")).toBe(1);
  });

  it("stamps every lead with a past createdAt", () => {
    for (const l of leads) {
      expect(l.createdAt).toBeInstanceOf(Date);
      expect((l.createdAt as Date).getTime()).toBeLessThanOrEqual(NOW.getTime());
    }
  });

  it("has at least one hot uncontacted lead (viewed >= 3 homes)", () => {
    const hot = leads.filter(
      (l) => l.status === "new" && (l.viewedListingIds as string[]).length >= 3,
    );
    expect(hot.length).toBeGreaterThanOrEqual(1);
  });

  it("seeds overdue and near-future reminders for the action panel", () => {
    const reminders = activities
      .map((a) => a.row)
      .filter((r) => r.type === "reminder" && r.dueAt && !r.completedAt);
    const overdue = reminders.filter((r) => (r.dueAt as Date).getTime() < NOW.getTime());
    const soon = reminders.filter((r) => {
      const t = (r.dueAt as Date).getTime();
      return t > NOW.getTime() && t <= NOW.getTime() + 24 * 3_600_000;
    });
    expect(overdue.length).toBeGreaterThanOrEqual(1);
    expect(soon.length).toBeGreaterThanOrEqual(1);
  });

  it("logs a first-contact call at/after creation for contacted+ leads", () => {
    const calls = activities.filter((a) => a.row.type === "call");
    expect(calls.length).toBeGreaterThanOrEqual(1);
    for (const c of calls) {
      const lead = leads[c.leadIndex]!;
      expect((c.row.createdAt as Date).getTime()).toBeGreaterThanOrEqual(
        (lead.createdAt as Date).getTime(),
      );
    }
  });
});
