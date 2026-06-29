import { describe, expect, it } from "vitest";
import { activityInsertSchema } from "../schema/activities";
import { consentInsertSchema } from "../schema/consent";
import { leadInsertSchema } from "../schema/leads";
import { generateLeads } from "./leads";
import { generateListings } from "./listings";
import { makeRng } from "./prng";

const DUMMY_LEAD_ID = "00000000-0000-0000-0000-000000000000";

describe("generateLeads", () => {
  const listings = generateListings(makeRng(20260629));
  const { leads, activities, consents } = generateLeads(makeRng(42), listings);

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

  it("covers multiple pipeline statuses (CRM looks alive)", () => {
    expect(new Set(leads.map((l) => l.status)).size).toBeGreaterThanOrEqual(4);
  });
});
