import type { LeadFilters, LeadIntent, LeadStatus } from "@herrera/db";

const INTENTS = ["buy", "sell", "rent"];
const STATUSES = ["new", "contacted", "qualified", "appointment", "offer", "closed", "lost"];
const RANGE_DAYS: Record<string, number> = { "24h": 1, "7d": 7, "30d": 30 };

export const RANGE_OPTIONS = [
  { value: "", label: "Any time" },
  { value: "24h", label: "Last 24h" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
];

type Query = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Parse an admin inbox query string into typed lead filters. `now` is injected for testability. */
export function parseLeadFilters(query: Query, now: Date): LeadFilters {
  const f: LeadFilters = {};
  const intent = first(query.intent);
  if (intent && INTENTS.includes(intent)) f.intent = intent as LeadIntent;
  const status = first(query.status);
  if (status && STATUSES.includes(status)) f.status = status as LeadStatus;
  const source = first(query.source);
  if (source) f.source = source;
  const q = first(query.q)?.trim();
  if (q) f.q = q;
  const days = RANGE_DAYS[first(query.range) ?? ""];
  if (days) f.since = new Date(now.getTime() - days * 86400000);
  return f;
}

/** ISO → "30 Jun 2026" (locale-stable for SSR). */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
