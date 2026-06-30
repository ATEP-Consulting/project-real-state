import { describe, expect, it } from "vitest";
import type { LeadStatus } from "@herrera/db";
import { activeCount, barPct, donutSegments, winRate } from "./admin-dashboard";

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
