import type { LeadFilters, LeadIntent, LeadStatus, QualificationQuestionConfig } from "@herrera/db";

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

export type FormattedAnswer = { key: string; label: string; value: string };

function optionLabel(q: QualificationQuestionConfig | undefined, value: string): string {
  return q?.options.find((o) => o.value === value)?.label ?? value;
}

/** Render stored jsonb answers as label/value pairs using the question definitions (ADR-007). */
export function formatAnswers(
  answers: Record<string, unknown>,
  questions: QualificationQuestionConfig[],
): FormattedAnswer[] {
  const byKey = new Map(questions.map((q) => [q.key, q]));
  return Object.entries(answers).map(([key, raw]) => {
    const q = byKey.get(key);
    let value: string;
    if (typeof raw === "boolean") value = raw ? "Yes" : "No";
    else if (Array.isArray(raw)) value = raw.map((v) => optionLabel(q, String(v))).join(", ");
    else value = optionLabel(q, String(raw ?? ""));
    return { key, label: q?.label ?? key, value };
  });
}

/** A reminder is overdue when it has a past due date and isn't completed. */
export function isOverdue(dueAt: string | null, completedAt: string | null, now: Date): boolean {
  if (!dueAt || completedAt) return false;
  return new Date(dueAt).getTime() < now.getTime();
}
