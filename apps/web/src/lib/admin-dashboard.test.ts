import { describe, expect, it } from "vitest";
import type { LeadStatus } from "@herrera/db";
import {
  activeCount,
  barPct,
  biggestDropoff,
  donutSegments,
  median,
  winRate,
} from "./admin-dashboard";

// Mirrors StatusBadge.STATUS_ORDER without importing the component (CSS) into a logic test.
const STATUS_ORDER = [
  "new",
  "contacted",
  "qualified",
  "appointment",
  "offer",
  "closed",
] as const satisfies readonly LeadStatus[];

const counts = (p: Partial<Record<LeadStatus, number>>): Record<LeadStatus, number> => ({
  new: 0,
  contacted: 0,
  qualified: 0,
  appointment: 0,
  offer: 0,
  closed: 0,
  lost: 0,
  ...p,
});

describe("winRate", () => {
  it("is 0 when nothing is decided", () => {
    expect(winRate(counts({ new: 5 }))).toBe(0);
  });
  it("is closed / (closed + lost)", () => {
    expect(winRate(counts({ closed: 3, lost: 1 }))).toBe(0.75);
  });
});

describe("activeCount", () => {
  it("sums the non-terminal stages", () => {
    expect(
      activeCount(
        counts({
          new: 1,
          contacted: 2,
          qualified: 1,
          appointment: 1,
          offer: 1,
          closed: 9,
          lost: 9,
        }),
      ),
    ).toBe(6);
  });
});

describe("barPct", () => {
  it("scales value over max, 0 when max is 0", () => {
    expect(barPct(2, 4)).toBe(50);
    expect(barPct(4, 4)).toBe(100);
    expect(barPct(1, 0)).toBe(0);
  });
});

describe("median", () => {
  it("is null for an empty set", () => {
    expect(median([])).toBeNull();
  });
  it("is the middle value for an odd count", () => {
    expect(median([3, 1, 2])).toBe(2);
  });
  it("averages the two middles for an even count", () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });
});

describe("biggestDropoff", () => {
  it("finds the largest stage-to-stage decrease", () => {
    expect(biggestDropoff(counts({ new: 5, contacted: 1 }), STATUS_ORDER)).toEqual({
      from: "new",
      to: "contacted",
      drop: 4,
    });
  });
  it("is null when no stage decreases", () => {
    expect(
      biggestDropoff(
        counts({ new: 2, contacted: 2, qualified: 2, appointment: 2, offer: 2, closed: 2 }),
        STATUS_ORDER,
      ),
    ).toBeNull();
    expect(biggestDropoff(counts({}), STATUS_ORDER)).toBeNull();
  });
});

describe("donutSegments", () => {
  it("splits the circumference by share, offset cumulatively", () => {
    expect(donutSegments([3, 1], 100)).toEqual([
      { len: 75, offset: 0, pct: 75 },
      { len: 25, offset: -75, pct: 25 },
    ]);
  });
  it("is all-zero for an empty total", () => {
    expect(donutSegments([0, 0], 100)).toEqual([
      { len: 0, offset: 0, pct: 0 },
      { len: 0, offset: 0, pct: 0 },
    ]);
  });
});
