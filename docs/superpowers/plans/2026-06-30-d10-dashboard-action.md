# D10 — Action-First Admin Dashboard + Source Labels — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (inline) — task-by-task, TDD, commit per task. Steps use `- [ ]`.

**Goal:** Replace the admin dashboard's vanity charts with an action-first panel (who to call now + overdue/today follow-ups + speed-to-lead), and humanize the raw `source` keys across the admin.

**Architecture:** All read-only, derived from existing `leads` + `activities` tables — **no schema change**. New query helpers in `@herrera/db` (`admin-leads.ts`), pure formatting/analytics in `apps/web/src/lib` (TDD), a rewritten `pages/admin/index.tsx`, and an enriched deterministic seed so the demo looks alive (`createdAt` spread, first-contact timestamps, real reminder `dueAt`s).

**Tech Stack:** Next 15 Pages Router, Drizzle (neon-http: `db.execute(sql)` → use `.rows`), CSS Modules + tokens, Vitest. Admin copy stays **English** (EN default; `/es` is D13).

## Global Constraints
- No new tables, no new auth — reuse `requireAdmin` SSR guard.
- Admin is utilitarian-but-on-brand: forest/bronze/sand tokens only, no Tailwind.
- Web typecheck via `pnpm --filter @herrera/web typecheck` (dev server is live on :3000 — do **not** run `next build` against the shared `.next`).
- Drizzle neon-http raw queries: read `res.rows`.
- Seed stays deterministic (`makeRng`); timestamps are relative to a `now` passed in.
- Re-seed required (`pnpm db:seed`, root `.env.local` has `DATABASE_URL`). Re-seed resets data (expected).

---

### Task 1: Humanize `source` (SOURCE_LABEL + formatSource)

**Files:**
- Create: `apps/web/src/lib/source-label.ts`
- Create: `apps/web/src/lib/source-label.test.ts`
- Modify: `apps/web/src/pages/admin/leads/index.tsx` (filter option ~136, table cell ~211)
- Modify: `apps/web/src/pages/admin/leads/[id].tsx` (meta line ~60)

**Produces:** `formatSource(source: string | null): string`, `SOURCE_LABEL: Record<string,string>`.

- [ ] Test (`source-label.test.ts`): known keys → labels; unknown `"zillow_ads"` → `"Zillow ads"`; `null`/`""` → `"—"`.
- [ ] Implement:
```ts
export const SOURCE_LABEL: Record<string, string> = {
  qualification_flow: "Buy/Sell/Rent form",
  listing_inquiry: "Listing inquiry",
};
export function formatSource(source: string | null): string {
  if (!source) return "—";
  return (
    SOURCE_LABEL[source] ??
    source.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}
```
- [ ] Apply at the 3 render sites: inbox `<option>` text → `{formatSource(s)}`; inbox table cell → `{formatSource(l.source)}`; detail meta → `source {formatSource(lead.source)}`.
- [ ] `pnpm test`, `pnpm --filter @herrera/web typecheck`. Commit.

---

### Task 2: Pure dashboard logic (median, biggestDropoff, relativeAge); drop donut logic

**Files:**
- Modify: `apps/web/src/lib/admin-dashboard.ts`
- Modify: `apps/web/src/lib/admin-dashboard.test.ts` (remove `donutSegments` block; add new)
- Modify: `apps/web/src/lib/admin-leads.ts` (add `relativeAge`)
- Modify: `apps/web/src/lib/admin-leads.test.ts` (add `relativeAge`)

**Produces:**
- `median(values: number[]): number | null`
- `biggestDropoff(counts: Record<LeadStatus,number>, order: readonly LeadStatus[]): { from: LeadStatus; to: LeadStatus; drop: number } | null`
- `relativeAge(iso: string, now: Date): string`
- Remove `donutSegments` + `DonutSegment` (donut is gone; nothing else uses them).

- [ ] Tests (admin-dashboard.test.ts):
  - `median([])` → null; `median([3,1,2])` → 2; `median([1,2,3,4])` → 2.5.
  - `biggestDropoff` with new:5, contacted:1 (rest 0) over STATUS_ORDER → `{from:"new",to:"contacted",drop:4}`; all-equal → null; empty/monotonic-up → null.
- [ ] Test (admin-leads.test.ts): `relativeAge` with fixed now → "just now" (<60m? use <1h → "just now"), "3h ago", "2d ago".
- [ ] Implement:
```ts
export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}
export function biggestDropoff(
  counts: Record<LeadStatus, number>,
  order: readonly LeadStatus[],
): { from: LeadStatus; to: LeadStatus; drop: number } | null {
  let best: { from: LeadStatus; to: LeadStatus; drop: number } | null = null;
  for (let i = 0; i < order.length - 1; i++) {
    const from = order[i]!, to = order[i + 1]!;
    const drop = counts[from] - counts[to];
    if (drop > 0 && (!best || drop > best.drop)) best = { from, to, drop };
  }
  return best;
}
```
```ts
// admin-leads.ts — relative age of a PAST timestamp ("3h ago", "2d ago")
export function relativeAge(iso: string, now: Date): string {
  const ms = now.getTime() - new Date(iso).getTime();
  const h = Math.floor(ms / 3_600_000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
```
- [ ] Remove `donutSegments`/`DonutSegment` from admin-dashboard.ts + the `describe("donutSegments")` block.
- [ ] `pnpm test`, web typecheck. Commit.

---

### Task 3: Backend dashboard helpers + extend getDashboardData

**Files:**
- Modify: `packages/db/src/admin-leads.ts`
- Modify: `packages/db/src/index.ts` (barrel: add new types, drop `getLeadsBySource`/`LeadSourceCount`)

**Produces (exported from `@herrera/db`):**
- `getUncontactedLeads(limit: number): Promise<LeadListItem[]>` — `status='new'`, oldest first.
- `type ReminderItem = { activityId; leadId; leadName: string|null; body: string|null; dueAt: string }`
- `getDueReminders(before: Date): Promise<ReminderItem[]>` — open reminders (`type='reminder'`, `completedAt` null, `dueAt` not null, `dueAt <= before`), asc, join lead name, limit 20.
- `getSpeedToFirstContactHours(): Promise<number[]>` — per contacted lead, hours from `createdAt` → first `call` activity (median computed in the page via pure `median`).
- `getNewLeadsBetween(start: Date, end: Date): Promise<number>`
- Extended `DashboardData` (drop `bySource`/`LeadSourceCount`/`getLeadsBySource`):
```ts
export type DashboardData = {
  counts: Record<LeadStatus, number>;
  total: number;
  newThisWeek: number;
  newPrevWeek: number;
  uncontacted: LeadListItem[];
  reminders: ReminderItem[];
  speedHours: number[];
  mostViewed: MostViewedListing[];
};
```

- [ ] `getUncontactedLeads`: reuse the `listLeads` select shape with `eq(leads.status,'new')`, `orderBy(asc(leads.createdAt))`, `.limit(limit)`; map to `LeadListItem` (viewedCount from `viewedListingIds.length`).
- [ ] `getDueReminders(before)`: drizzle `select({...}).from(activities).innerJoin(leads, eq(activities.leadId, leads.id)).where(and(eq(activities.type,'reminder'), isNull(activities.completedAt), isNotNull(activities.dueAt), lte(activities.dueAt, before))).orderBy(asc(activities.dueAt)).limit(20)`; map dueAt→ISO.
- [ ] `getSpeedToFirstContactHours`: raw SQL (use `res.rows`):
```sql
SELECT EXTRACT(EPOCH FROM (fc.first_call - l.created_at)) / 3600.0 AS hours
FROM leads l
JOIN (SELECT lead_id, min(created_at) AS first_call
      FROM activities WHERE type = 'call' GROUP BY lead_id) fc
  ON fc.lead_id = l.id
WHERE fc.first_call >= l.created_at
```
  return `rows.map(r => Number(r.hours))`.
- [ ] `getNewLeadsBetween(start,end)`: `count(*)` where `createdAt >= start AND createdAt < end`.
- [ ] `getDashboardData()`: compute `now = new Date()`, `weekAgo`, `twoWeeksAgo`, `endOfToday` (now with 23:59:59.999); `Promise.all` of getPipelineCounts, getUncontactedLeads(6), getDueReminders(endOfToday), getSpeedToFirstContactHours, getMostViewedListings(5), getNewLeadsBetween(weekAgo,now), getNewLeadsBetween(twoWeeksAgo,weekAgo). Drop getLeadsBySource. total = sum(counts).
- [ ] Remove `getLeadsBySource` + `LeadSourceCount` + `bySource`; update barrel exports (add `getUncontactedLeads`, `getDueReminders`, `getSpeedToFirstContactHours`, `getNewLeadsBetween`, `type ReminderItem`).
- [ ] Root `pnpm typecheck`. Commit.

---

### Task 4: Enrich the seed (alive demo data)

**Files:**
- Modify: `packages/db/src/seed/leads.ts` (signature `generateLeads(rng, listings, now: Date)`; curated statuses, `createdAt` spread, call timestamps, reminder `dueAt`s, one hot uncontacted lead)
- Modify: `packages/db/src/seed/runner.ts` (pass `new Date()`)
- Create: `packages/db/src/seed/leads.test.ts`

**Design (12 leads, deterministic shape; timestamps relative to `now`):**
- Curated `STATUS_PLAN` (guarantees a demo-worthy spread incl. closed+lost for a real win rate): `["new","new","new","contacted","contacted","contacted","qualified","qualified","appointment","offer","closed","lost"]`.
- `createdAt = now - HOURS_AGO[i]*3600_000` with `HOURS_AGO = [2,7,26,50,74,120,170,240,360,170,300,420]` (3 new are recent: 2h/7h/26h).
- Lead 0 (new) is the **hot** lead: `viewed = 4 distinct slugs`; others `rng.int(0,3)`.
- First activity (`note` "Lead captured…") `createdAt = lead.createdAt`.
- For non-`new` leads add a `call` with `createdAt = lead.createdAt + DELAY_H[i]*3600_000`, `DELAY_H` mixed fast/slow (e.g. `0.5,1,3,18,2,30,1.5,...`) so median speed ≈ 2–3h.
- Reminders (`type:'reminder'`) with real `dueAt`:
  - appointment lead → "Confirm showing time", `dueAt = todayAt(now, +3h)` (today bucket).
  - offer lead → "Follow up on offer", `dueAt = now - 1d` (overdue).
  - a contacted lead → "Call back re: financing", `dueAt = now - 2d` (overdue).
  - a qualified lead → "Send shortlist", `dueAt = todayAt(now, +1h)` (today).
  - one completed reminder (`completedAt = now - 1d`, `dueAt = now - 2d`) so history exists.
  - one future reminder (`dueAt = now + 3d`) — lives on the lead, off-dashboard.
- Helper `hoursFrom(now, h)` / `todayAt(now, addHours)` inline.

- [ ] Test (`leads.test.ts`): given `generateLeads(makeRng(42), listings, FIXED_NOW)`:
  - every lead has `createdAt` set and ≤ now;
  - statuses match `STATUS_PLAN` counts (new=3, closed=1, lost=1);
  - reminders include ≥1 with `dueAt < now` (overdue) and ≥1 same-day-as-now future (today);
  - at least one `status='new'` lead has `viewedListingIds.length >= 3`.
- [ ] Implement; update runner to `generateLeads(makeRng(42), market, new Date())`.
- [ ] `pnpm test`, `pnpm typecheck`. Commit.
- [ ] Re-seed: `pnpm db:seed` → verify counts (12 leads, activities incl. reminders).

---

### Task 5: Rewrite the dashboard page + CSS

**Files:**
- Modify: `apps/web/src/pages/admin/index.tsx` (full rewrite of the body; remove SourceDonut/SOURCE_COLORS/DONUT_C)
- Modify: `apps/web/src/pages/admin/Dashboard.module.css`

**Layout:** KPI strip (4) → "Today" hero card (3 lists) → bottom row (Pipeline | Most-viewed). Uses `relativeAge`, `isOverdue`, `formatTime`, `median`, `biggestDropoff`, `StatusBadge kind="intent"`, `formatDate`.

- KPI strip: **New this week** (`data.newThisWeek`, trend `data.newThisWeek - data.newPrevWeek` → ▲+n/▼−n/=) · **Uncontacted** (`data.counts.new`, red accent if >0) · **⚡ Speed to first contact** (`median(data.speedHours)` → `"1.4h"` or "—"; green if <1, amber if >24) · **Win rate** (`winRate(data.counts)`).
- "Today" card → 3 columns:
  - 🔴 **Uncontacted** (`data.uncontacted`): row = name link + intent badge + `relativeAge` + 🔥 if `viewedCount>=3` + `tel:`/`mailto:` quick links. Empty → "All caught up 🎉".
  - 🟠 **Overdue** = `data.reminders.filter(r => isOverdue(r.dueAt, null, now))`: lead link + body + `relativeAge(dueAt)` (red) + **Mark done** (POST `/api/admin/activities/{id}/complete`, then `router.replace`). Empty → "Nothing overdue".
  - 🟡 **Today** = reminders not overdue (dueAt ≥ now, same day): lead link + body + `formatTime(dueAt)`. Empty → "Nothing due today".
  - Mark-done handler mirrors `[id].tsx`'s `complete()`.
- Bottom: **Pipeline** = current per-stage bars over `STATUS_ORDER` (reuse existing funnel markup/styles) + lost footnote; if `biggestDropoff(counts, STATUS_ORDER)` → caption "Biggest gap: {From} → {To}". **Most-viewed** = unchanged list.
- `formatTime(iso)` inline: `new Date(iso).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})`.
- CSS: KPI accent classes (`kpiDanger`, `kpiGood`, `kpiWarn`), `today` grid (`grid-template-columns: repeat(3,1fr)`, stack <820px), action-row styles (name, meta, quick-action chips, mark-done button), keep funnel/viewed styles. Replace donut styles. Responsive + reduced-motion safe (no new motion).

- [ ] Rewrite page; update CSS. `pnpm --filter @herrera/web typecheck`. Commit.

---

### Task 6: Verify headless (logged in) + final gates

- [ ] Format/lint/typecheck/web-typecheck/test green.
- [ ] Headless (Chrome, gate `demo:secret123` + admin `nilyan@herrera.example`/`Herrera-Dev-2026`): `/admin` at 1440 + 390 — KPIs render (speed shows a number), "Today" shows uncontacted + ≥1 overdue + ≥1 today, Mark-done completes a reminder, no page overflow at either width; `source` reads humanized in `/admin/leads` + a lead detail. Screenshot.
- [ ] Update memory. Commit (already per-task).

## Self-Review
- **Coverage:** source labels (T1) ✓, action panel + speed + trend + pipeline gap (T2/T3/T5) ✓, alive seed (T4) ✓, donut dropped (T2/T3/T5) ✓, no schema change ✓.
- **Types:** `DashboardData` fields used in T5 all defined in T3; `ReminderItem.dueAt` is ISO string; `median` consumes `speedHours: number[]`.
- **No placeholders.** Re-seed wipes data (expected, noted).
