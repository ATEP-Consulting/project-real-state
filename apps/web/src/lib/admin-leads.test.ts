import { describe, expect, it } from "vitest";
import { parseLeadFilters } from "./admin-leads";

const NOW = new Date("2026-06-30T12:00:00.000Z");

describe("parseLeadFilters", () => {
  it("returns empty filters for an empty query", () => {
    expect(parseLeadFilters({}, NOW)).toEqual({});
  });
  it("keeps valid intent/status/source and trims q", () => {
    expect(
      parseLeadFilters(
        { intent: "buy", status: "qualified", source: "qualification_flow", q: " ana " },
        NOW,
      ),
    ).toEqual({ intent: "buy", status: "qualified", source: "qualification_flow", q: "ana" });
  });
  it("ignores invalid intent and status", () => {
    expect(parseLeadFilters({ intent: "lease", status: "archived" }, NOW)).toEqual({});
  });
  it("maps a range preset to a since cutoff", () => {
    const f = parseLeadFilters({ range: "7d" }, NOW);
    expect(f.since?.toISOString()).toBe("2026-06-23T12:00:00.000Z");
  });
  it("takes the first value when a param repeats", () => {
    expect(parseLeadFilters({ intent: ["sell", "buy"] }, NOW)).toEqual({ intent: "sell" });
  });
});
