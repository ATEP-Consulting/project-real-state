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

/** Median of a numeric set, or null when empty (used for speed-to-first-contact). */
export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}

/**
 * The consecutive pipeline stages with the largest head-count drop — i.e. where leads
 * are thinning out fastest right now. Null when no stage has fewer than the one before it.
 */
export function biggestDropoff(
  counts: Record<LeadStatus, number>,
  order: readonly LeadStatus[],
): { from: LeadStatus; to: LeadStatus; drop: number } | null {
  let best: { from: LeadStatus; to: LeadStatus; drop: number } | null = null;
  for (let i = 0; i < order.length - 1; i++) {
    const from = order[i]!;
    const to = order[i + 1]!;
    const drop = counts[from] - counts[to];
    if (drop > 0 && (!best || drop > best.drop)) best = { from, to, drop };
  }
  return best;
}
