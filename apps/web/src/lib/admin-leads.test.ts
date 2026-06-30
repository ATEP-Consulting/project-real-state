import { describe, expect, it } from "vitest";
import type { QualificationQuestionConfig } from "@herrera/db";
import { formatAnswers, isOverdue, parseLeadFilters } from "./admin-leads";

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

const QS: QualificationQuestionConfig[] = [
  {
    key: "timeline",
    type: "single_select",
    label: "When are you looking to buy?",
    labelEs: null,
    options: [{ value: "0_3", label: "0–3 months" }],
    required: true,
  },
  {
    key: "preapproved",
    type: "boolean",
    label: "Pre-approved?",
    labelEs: null,
    options: [],
    required: false,
  },
];

describe("formatAnswers", () => {
  it("maps select values to option labels and booleans to Yes/No", () => {
    expect(formatAnswers({ timeline: "0_3", preapproved: true }, QS)).toEqual([
      { key: "timeline", label: "When are you looking to buy?", value: "0–3 months" },
      { key: "preapproved", label: "Pre-approved?", value: "Yes" },
    ]);
  });
  it("falls back to the raw key + value for an unknown question", () => {
    expect(formatAnswers({ mystery: "x" }, QS)).toEqual([
      { key: "mystery", label: "mystery", value: "x" },
    ]);
  });
});

describe("isOverdue", () => {
  const now = new Date("2026-06-30T12:00:00.000Z");
  it("is true for a past, uncompleted reminder", () => {
    expect(isOverdue("2026-06-29T12:00:00.000Z", null, now)).toBe(true);
  });
  it("is false when completed or in the future or null", () => {
    expect(isOverdue("2026-06-29T12:00:00.000Z", "2026-06-29T13:00:00.000Z", now)).toBe(false);
    expect(isOverdue("2026-07-05T12:00:00.000Z", null, now)).toBe(false);
    expect(isOverdue(null, null, now)).toBe(false);
  });
});
