import type { LeadStatus } from "@herrera/db";

/** Win rate = closed / (closed + lost); 0 when nothing is decided yet. */
export function winRate(counts: Record<LeadStatus, number>): number {
  const decided = counts.closed + counts.lost;
  return decided === 0 ? 0 : counts.closed / decided;
}

/** Leads still in play (everything except closed/lost). */
export function activeCount(counts: Record<LeadStatus, number>): number {
  return counts.new + counts.contacted + counts.qualified + counts.appointment + counts.offer;
}

/** Bar width as a percentage of the max value in its group. */
export function barPct(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.round((value / max) * 100);
}

export type DonutSegment = { len: number; offset: number; pct: number };

/**
 * SVG donut segments for stroke-dasharray rendering: each segment's arc length over a
 * circle of the given `circumference`, with a cumulative negative `offset` (dashoffset)
 * and an integer `pct` share for the legend.
 */
export function donutSegments(values: number[], circumference: number): DonutSegment[] {
  const total = values.reduce((a, b) => a + b, 0);
  let cumulative = 0;
  return values.map((v) => {
    const frac = total > 0 ? v / total : 0;
    const len = frac * circumference;
    // avoid -0 (it fails strict deep-equality and is meaningless for a dashoffset)
    const offset = cumulative === 0 ? 0 : -cumulative;
    const seg: DonutSegment = { len, offset, pct: Math.round(frac * 100) };
    cumulative += len;
    return seg;
  });
}
