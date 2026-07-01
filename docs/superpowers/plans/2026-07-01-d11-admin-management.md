# D11 — Admin management editors + marketing opt-in Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (inline) — task-by-task, TDD where it applies, one commit per task. Steps use `- [ ]`.

**Goal:** Give Nilyan three admin-only management editors (qualification questions, off-market listings, guides/blog) and add the optional marketing opt-in to all four capture forms — all behind the existing F4 `requireAdmin` gate, reusing existing tables/seams, no new auth.

**Architecture:** Read/write DB helpers in `@herrera/db` (one module per feature), gated JSON API routes under `/api/admin/*` (all via `withAdminApi`), and admin pages under `/admin/*` reusing `AdminLayout`/`StatusBadge` and a shared admin-form CSS. The marketing opt-in adds a `purpose` discriminator to `consent_records` and routes through the single `createLeadWithConsent` core so all four forms behave identically.

**Tech Stack:** Next 15 Pages Router, Drizzle (neon-http; raw `db.execute(sql)` → `.rows`; PostGIS geom via `ST_SetSRID(ST_MakePoint(lng,lat),4326)`), drizzle-kit migrations, Zod at all boundaries, CSS Modules + tokens, Vitest. Branch: `feat/d11-admin-management` off `main`.

## Global Constraints
- **Admin-only:** every page uses `requireAdmin` (SSR guard); every API route uses `withAdminApi`. No new auth, no public accounts.
- **Reuse:** `AdminLayout` + `StatusBadge` (D10), the corrected design tokens, the `withAdminApi` route pattern, the `createLeadWithConsent` core.
- **Manual listings only:** the off-market editor writes/edits **`source='manual'`** rows only. **Never** hand-edit `source='mls'` or `mock` rows (CLAUDE.md; MLS rows are worker-owned).
- **Marketing opt-in — HARD RULE (ADR-020/011):** optional (form submits without it), **unchecked by default (never pre-ticked)**, separately worded (*"I'd like to receive news and new listings by email"*). It is **email-scoped**; every submission **that carries an email** writes a marketing `consent_records` row — `granted=true` if ticked, **`granted=false` if unticked** (never omitted, never default-true). The existing per-channel **contact consent stays required and unchanged**. Route it through `createLeadWithConsent`.
- **Schema migration:** D11 adds `consent_purpose` enum + `consent_records.purpose` column (`NOT NULL DEFAULT 'transactional'`). Generate with `pnpm db:generate`, apply to Neon with `pnpm db:migrate`. The `NOT NULL DEFAULT 'transactional'` **backfills existing rows automatically** to `transactional` (confirm in the migration; no separate backfill script needed). Re-seed after (`pnpm db:seed`).
- **Web typecheck** via `pnpm --filter @herrera/web typecheck` (a dev server may be live on :3000 — do NOT run `next build` against the shared `.next`). Gates: `format:check`, `lint`, `typecheck`, web-typecheck, `test`. Stage only D11 files per commit. **Do NOT merge or deploy** — stop after the last task for Pablo's local review.
- **NOT in scope (deferred):** analytics (needs real data), area/neighborhood content editing (deferred D12 Phase A), email campaigns (Phase 2, ADR-020), the MLS worker (Phase 3).

## File structure
- **Marketing:** `packages/db/src/schema/enums.ts` (+`consentPurpose`), `packages/db/src/schema/consent.ts` (+`purpose` col), generated migration in `packages/db/drizzle/`; `packages/db/src/leads-create.ts` (+marketing row); `packages/db/src/inquiries.ts` + `qualification.ts` + `contact.ts` (+`consentMarketing`); forms `apps/web/src/components/listing/InquiryForm.tsx`, `apps/web/src/components/lead/LeadCaptureFlow.tsx`, `apps/web/src/components/home/ContactSection.tsx`, `apps/web/src/pages/contact.tsx` + a shared `MARKETING_CONSENT_LABEL` const.
- **Questions:** `packages/db/src/admin-questions.ts` (+test), API `apps/web/src/pages/api/admin/questions/index.ts` + `[id].ts` + `reorder.ts`, page `apps/web/src/pages/admin/questions/index.tsx` (+`.module.css`).
- **Off-market:** `packages/db/src/admin-listings.ts` (+test), API `apps/web/src/pages/api/admin/listings/index.ts` + `[id].ts`, pages `apps/web/src/pages/admin/listings/index.tsx` + `new.tsx` + `[id].tsx` (+`.module.css`).
- **Guides:** `packages/db/src/admin-content.ts` (+test), API `apps/web/src/pages/api/admin/content/index.ts` + `[id].ts`, pages `apps/web/src/pages/admin/content/index.tsx` + `new.tsx` + `[id].tsx` (+`.module.css`); guide **body is Markdown**, rendered on `apps/web/src/pages/guides/[slug].tsx` via **`react-markdown`** (safe-by-default — raw HTML NOT enabled, so no injection).
- **Shared:** `apps/web/src/components/admin/AdminLayout.tsx` (nav +3 links), `apps/web/src/components/admin/AdminForm.module.css` (shared inputs/buttons/table), `apps/web/src/lib/slug.ts` (reuse `slugify` from D12).

---

## Phase 1 — Marketing opt-in

### Task 1: `consent_records.purpose` migration + core + schemas

**Files:**
- Modify: `packages/db/src/schema/enums.ts`, `packages/db/src/schema/consent.ts`
- Create: generated migration `packages/db/drizzle/0002_*.sql`
- Modify: `packages/db/src/leads-create.ts`, `packages/db/src/inquiries.ts`, `packages/db/src/qualification.ts`, `packages/db/src/contact.ts`
- Test: `packages/db/src/leads-create.test.ts` (new)

**Interfaces — Produces:** `consentPurpose` enum; `CreateLeadInput.consentMarketing?: boolean` + `CreateLeadInput.marketingWording: string`; the three input schemas gain `consentMarketing: z.boolean().optional()`.

- [ ] **Step 1 (enum + column):**
```ts
// enums.ts
export const consentPurpose = pgEnum("consent_purpose", ["transactional", "marketing"]);
// consent.ts — import consentPurpose; add after `channel`:
purpose: consentPurpose("purpose").notNull().default("transactional"),
```
- [ ] **Step 2:** `pnpm db:generate` → a `0002_*.sql` with `CREATE TYPE consent_purpose ...` + `ALTER TABLE consent_records ADD COLUMN purpose ... NOT NULL DEFAULT 'transactional'`. Read the SQL; confirm the `DEFAULT 'transactional'` (which backfills existing rows). `pnpm typecheck`.
- [ ] **Step 3 (failing test)** — `leads-create.test.ts`: the three schemas accept `consentMarketing` and stay valid without it.
```ts
import { describe, expect, it } from "vitest";
import { listingInquirySchema } from "./inquiries";
import { qualificationLeadSchema } from "./qualification";
import { contactLeadSchema } from "./contact";
describe("marketing opt-in is optional on every capture schema", () => {
  it("parses with and without consentMarketing", () => {
    const base = { email: "a@b.com" };
    for (const s of [
      listingInquirySchema.safeParse({ ...base, listingSlug: "x" }),
      listingInquirySchema.safeParse({ ...base, listingSlug: "x", consentMarketing: true }),
      qualificationLeadSchema.safeParse({ ...base, intent: "buy" }),
      qualificationLeadSchema.safeParse({ ...base, intent: "buy", consentMarketing: false }),
      contactLeadSchema.safeParse({ ...base, intent: "sell", consentMarketing: true }),
    ]) expect(s.success).toBe(true);
  });
});
```
- [ ] **Step 4:** run `pnpm vitest run packages/db/src/leads-create.test.ts` → FAIL (schemas lack the field).
- [ ] **Step 5 (core):** in `leads-create.ts` add to `CreateLeadInput`: `consentMarketing?: boolean;` and `marketingWording: string;`. After the transactional consent rows are pushed (they get `purpose: "transactional"`), append the marketing row **when an email is present**:
```ts
if (input.email)
  consents.push({
    leadId, channel: "email", purpose: "marketing",
    granted: input.consentMarketing === true,
    wording: input.marketingWording, source: input.source,
  });
```
  (Give the existing two contact rows an explicit `purpose: "transactional"`.)
- [ ] **Step 6 (schemas + creates):** add `consentMarketing: z.boolean().optional()` to `listingInquirySchema`, `qualificationLeadSchema`, `contactLeadSchema`; in each create fn pass `consentMarketing: input.consentMarketing` and `marketingWording: MARKETING_WORDING` where
  `const MARKETING_WORDING = "I'd like to receive news and new listings from Herrera by email.";`
  (define once in `leads-create.ts` and export, or per-file identical const).
- [ ] **Step 7:** run the test → PASS; `pnpm typecheck`.
- [ ] **Step 8:** apply the migration to Neon: `pnpm db:migrate`; then `pnpm db:seed` (re-seed). Verify no error.
- [ ] **Step 9: commit** — `feat(db): marketing consent purpose + opt-in through the lead core (D11)`.

---

### Task 2: marketing checkbox on the four capture forms

**Files (modify):** `apps/web/src/components/listing/InquiryForm.tsx` (listing inquiry), `apps/web/src/components/lead/LeadCaptureFlow.tsx` (Buy/Sell/Rent + the sell/valuation variant — the contact step), `apps/web/src/components/home/ContactSection.tsx` + `apps/web/src/pages/contact.tsx` (contact). Add a shared label const in `apps/web/src/lib/consent.ts` (new): `export const MARKETING_CONSENT_LABEL = "I'd like to receive news and new listings by email (optional).";`

**Interfaces — Consumes:** the schemas' new `consentMarketing` field (Task 1).

- [ ] **Step 1:** create `apps/web/src/lib/consent.ts` with `MARKETING_CONSENT_LABEL`.
- [ ] **Step 2:** in each form add **one unchecked-by-default checkbox** (its own state, e.g. `const [marketing, setMarketing] = useState(false)`), rendered **below** the existing required-consent control, labelled `MARKETING_CONSENT_LABEL`, and include `consentMarketing: marketing` in the POST body. For `contact.tsx` (already controlled) add `consentMarketing: marketing`. For `ContactSection.tsx` (FormData) add `name="marketing"` + `consentMarketing: fd.get("marketing") === "on"`. Do **not** gate submit on it.
- [ ] **Step 3:** `pnpm --filter @herrera/web typecheck`; lint. (Headless submit verified in Task 9.)
- [ ] **Step 4: commit** — `feat(web): optional marketing opt-in checkbox on all four capture forms (D11)`.

---

## Phase 2 — Qualification-questions editor

### Task 3: questions admin backend (`admin-questions.ts`)

**Files:** Create `packages/db/src/admin-questions.ts` + `packages/db/src/admin-questions.test.ts`; modify `packages/db/src/index.ts` (barrel).

**Interfaces — Produces:**
- `getAdminQuestions(intent): Promise<QualificationQuestion[]>` — ALL rows for an intent (incl. inactive), by `sortOrder`.
- `questionUpsertSchema` (zod: `intent`, `key`, `type`, `label`, `labelEs?`, `options?`, `required?`, `isActive?`), `createQuestion(input)`, `updateQuestion(id, input)`, `deleteQuestion(id)`, `setQuestionActive(id, active)`, `reorderQuestions(intent, orderedIds: string[])` (writes `sortOrder = index`).
- `nextSortOrder(existing: {sortOrder:number}[]): number` (pure).

- [ ] **Step 1 (failing test):** `admin-questions.test.ts` — `questionUpsertSchema` requires `intent`+`key`+`type`+`label`, defaults `required=false`/`isActive=true`, validates option shape; `nextSortOrder([])===0`, `nextSortOrder([{sortOrder:0},{sortOrder:3}])===4`.
```ts
import { describe, expect, it } from "vitest";
import { questionUpsertSchema, nextSortOrder } from "./admin-questions";
describe("questionUpsertSchema", () => {
  it("requires the core fields and defaults flags", () => {
    const r = questionUpsertSchema.safeParse({ intent: "buy", key: "timeline", type: "single_select", label: "When?" });
    expect(r.success).toBe(true);
    if (r.success) { expect(r.data.required).toBe(false); expect(r.data.isActive).toBe(true); }
    expect(questionUpsertSchema.safeParse({ intent: "buy", key: "x" }).success).toBe(false);
  });
});
describe("nextSortOrder", () => {
  it("is max+1, or 0 when empty", () => {
    expect(nextSortOrder([])).toBe(0);
    expect(nextSortOrder([{ sortOrder: 0 }, { sortOrder: 3 }])).toBe(4);
  });
});
```
- [ ] **Step 2:** run → FAIL.
- [ ] **Step 3 (implement):** `questionUpsertSchema` (mirror `questionInsertSchema` fields with `label` required, `options: z.array(questionOptionSchema).default([])`, `required`/`isActive` `.default(...)`); `nextSortOrder = (rows) => rows.length ? Math.max(...rows.map(r=>r.sortOrder))+1 : 0`; the CRUD via drizzle (`getAdminQuestions` select all by intent asc sortOrder; `createQuestion` inserts with `sortOrder: nextSortOrder(existing)`; `updateQuestion`/`deleteQuestion`/`setQuestionActive` by id; `reorderQuestions` loops `update ... set sortOrder=i where id=orderedIds[i]`, `updatedAt: new Date()`). Export from barrel.
- [ ] **Step 4:** run → PASS; `pnpm typecheck`.
- [ ] **Step 5: commit** — `feat(db): admin qualification-questions CRUD + reorder (D11)`.

---

### Task 4: questions API + `/admin/questions` page + nav

**Files:** Create `apps/web/src/pages/api/admin/questions/index.ts` (POST create), `.../questions/[id].ts` (PATCH update / DELETE / POST toggle-active via `?action=`), `.../questions/reorder.ts` (POST); create `apps/web/src/pages/admin/questions/index.tsx` + `Questions.module.css`; create `apps/web/src/components/admin/AdminForm.module.css`; modify `apps/web/src/components/admin/AdminLayout.tsx` (add nav link **Questions** `/admin/questions`).

**Interfaces — Consumes:** `getAdminQuestions`, `questionUpsertSchema`, `createQuestion`, `updateQuestion`, `deleteQuestion`, `setQuestionActive`, `reorderQuestions` (Task 3); `withAdminApi`, `requireAdmin`.

- [ ] **Step 1 (API):** each route via `withAdminApi` following the D10 pattern (method guard, `safeParse`, mutation, 200/400/405/500). `index.ts` POST → `createQuestion(questionUpsertSchema.parse(body))`; `[id].ts` PATCH → `updateQuestion`, DELETE → `deleteQuestion`, and a `?action=toggle` POST → `setQuestionActive`; `reorder.ts` POST `{ intent, orderedIds }` → `reorderQuestions`.
- [ ] **Step 2 (page):** `/admin/questions` — SSR `requireAdmin` + `getAdminQuestions` for all three intents (or an intent tab via `?intent=`, default buy). Renders per-intent lists (label, type, required/active badges via `StatusBadge`-style chips), **↑/↓ reorder** buttons (call `reorder`), **activate/deactivate** toggle, **edit** (inline or a form panel: label/labelEs/type/options editor/required/active), **add**, **delete** (confirm). After any mutation, `router.replace(router.asPath)`. Reuse `AdminForm.module.css`.
- [ ] **Step 3:** `pnpm --filter @herrera/web typecheck`; lint.
- [ ] **Step 4: commit** — `feat(web): /admin/questions editor (CRUD, reorder, activate) (D11)`.

---

## Phase 3 — Off-market listings management

### Task 5: off-market backend (`admin-listings.ts`)

**Files:** Create `packages/db/src/admin-listings.ts` + `packages/db/src/admin-listings.test.ts`; modify barrel.

**Interfaces — Produces:**
- `listManualListings(): Promise<AdminListingRow[]>` (`source='manual'`, newest first: slug/title-ish/price/city/visibility/status).
- `getManualListing(id): Promise<Listing | null>` (only `source='manual'`).
- `manualListingSchema` (zod: propertyType, price, addressLine1, city, `state` default "FL", zip, bedrooms?, bathrooms?, sqft?, yearBuilt?, description?, visibility (`public|registered|private_link`) default `private_link`, status (`active|pending|sold|off_market`) default `off_market`, latitude?, longitude?, photos? url[]).
- `createManualListing(input)` (slug = `slugify(addressLine1+"-"+city)` + uniqueness suffix; `source:'manual'`; geom via raw `ST_SetSRID(ST_MakePoint(lng,lat),4326)` **only if** lat+lng given, else null), `updateManualListing(id, input)`, `deleteManualListing(id)` (guarded to `source='manual'`).
- `uniqueSlug(base, existing: string[]): string` (pure: `base`, else `base-2`, `base-3`…).

- [ ] **Step 1 (failing test):** `admin-listings.test.ts` — `manualListingSchema` requires propertyType/price/addressLine1/city/zip, defaults `state='FL'`/`visibility='private_link'`/`status='off_market'`, rejects a bad visibility; `uniqueSlug("a",[])==="a"`, `uniqueSlug("a",["a","a-2"])==="a-3"`.
```ts
import { describe, expect, it } from "vitest";
import { manualListingSchema, uniqueSlug } from "./admin-listings";
describe("manualListingSchema", () => {
  it("requires core fields and defaults", () => {
    const r = manualListingSchema.safeParse({ propertyType: "condo", price: 500000, addressLine1: "1 A St", city: "Miami", zip: "33101" });
    expect(r.success).toBe(true);
    if (r.success) { expect(r.data.state).toBe("FL"); expect(r.data.visibility).toBe("private_link"); expect(r.data.status).toBe("off_market"); }
    expect(manualListingSchema.safeParse({ propertyType: "condo", price: 1, addressLine1: "x", city: "c", zip: "1", visibility: "nope" }).success).toBe(false);
  });
});
describe("uniqueSlug", () => {
  it("suffixes collisions", () => {
    expect(uniqueSlug("a", [])).toBe("a");
    expect(uniqueSlug("a", ["a", "a-2"])).toBe("a-3");
  });
});
```
- [ ] **Step 2:** run → FAIL.
- [ ] **Step 3 (implement):** the schema + `uniqueSlug` (loop `base`, `base-2`…), the CRUD (all scoped to `source='manual'`; `createManualListing` computes slug from `slugify` (reuse `../../apps`? NO — add a local `slugify` in db or duplicate the tiny fn; put a shared `slugify` in `packages/db/src/slug.ts` and have D12's web `lib/slug.ts` stay as-is, OR inline). Use raw `db.execute(sql)` for insert when geom is set. Export from barrel.
- [ ] **Step 4:** run → PASS; `pnpm typecheck`.
- [ ] **Step 5: commit** — `feat(db): admin off-market (manual) listing CRUD + visibility (D11)`.

---

### Task 6: off-market API + `/admin/listings` pages + nav

**Files:** Create `apps/web/src/pages/api/admin/listings/index.ts` (POST) + `[id].ts` (PATCH/DELETE); create `apps/web/src/pages/admin/listings/index.tsx` (list) + `new.tsx` (create form) + `[id].tsx` (edit form) + `Listings.module.css`; modify `AdminLayout.tsx` (nav link **Listings** `/admin/listings`).

**Interfaces — Consumes:** `listManualListings`, `getManualListing`, `manualListingSchema`, `createManualListing`, `updateManualListing`, `deleteManualListing`.

- [ ] **Step 1 (API):** `index.ts` POST → `createManualListing(manualListingSchema.parse(body))`; `[id].ts` PATCH → `updateManualListing`, DELETE → `deleteManualListing`. All `withAdminApi`.
- [ ] **Step 2 (list page):** `/admin/listings` — SSR `listManualListings`; table (address, price, city, **visibility** + **status** chips) with edit links + "New listing" button + delete. A note explains manual/off-market only.
- [ ] **Step 3 (forms):** `new.tsx` + `[id].tsx` share a form (address/city/zip, price, propertyType `<Select>`, beds/baths/sqft/year, description, **visibility** `<Select>` public/registered/private_link with a one-line explainer of each, status `<Select>`, optional lat/lng, optional photo URLs) → POST/PATCH to the API, then redirect to `/admin/listings`. `[id].tsx` SSR `getManualListing` (null → 404).
- [ ] **Step 4:** `pnpm --filter @herrera/web typecheck`; lint.
- [ ] **Step 5: commit** — `feat(web): /admin/listings off-market management + visibility toggle (D11)`.

---

## Phase 4 — Guides / blog editor

### Task 7: guides admin backend (`admin-content.ts`)

**Files:** Create `packages/db/src/admin-content.ts` + `packages/db/src/admin-content.test.ts`; modify barrel.

**Interfaces — Produces:**
- `listAdminGuides(): Promise<AdminGuideRow[]>` (ALL `type='guide'` incl. draft: slug/title/status/updatedAt).
- `getAdminGuide(id): Promise<Content | null>`.
- `guideUpsertSchema` (zod: title, slug?, excerpt?, body?, heroImageUrl?, metaTitle?, metaDescription?, status `draft|published` default `draft`).
- `createGuide(input)` (type `guide`; slug = provided or `slugify(title)` + uniqueness; `publishedAt` set when `status==='published'`), `updateGuide(id, input)` (set `publishedAt` on first publish; null it on unpublish), `setGuidePublished(id, published)`, `deleteGuide(id)`.

- [ ] **Step 1 (failing test):** `admin-content.test.ts` — `guideUpsertSchema` requires `title`, defaults `status='draft'`, accepts optional slug/body; a bad status is rejected.
```ts
import { describe, expect, it } from "vitest";
import { guideUpsertSchema } from "./admin-content";
describe("guideUpsertSchema", () => {
  it("requires a title and defaults to draft", () => {
    const r = guideUpsertSchema.safeParse({ title: "My guide" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.status).toBe("draft");
    expect(guideUpsertSchema.safeParse({ title: "x", status: "live" }).success).toBe(false);
    expect(guideUpsertSchema.safeParse({}).success).toBe(false);
  });
});
```
- [ ] **Step 2:** run → FAIL.
- [ ] **Step 3 (implement):** schema + CRUD (all scoped `type='guide'`; publish sets `publishedAt = new Date()` if not already set, unpublish sets `publishedAt = null` + `status='draft'`; slug via shared `slugify` + `uniqueSlug`). Export from barrel.
- [ ] **Step 4:** run → PASS; `pnpm typecheck`.
- [ ] **Step 5: commit** — `feat(db): admin guides content CRUD + publish/unpublish (D11)`.

---

### Task 8: guides API + `/admin/content` pages + nav

**Files:** Create `apps/web/src/pages/api/admin/content/index.ts` (POST) + `[id].ts` (PATCH/DELETE); create `apps/web/src/pages/admin/content/index.tsx` (list) + `new.tsx` + `[id].tsx` + `Content.module.css`; modify `AdminLayout.tsx` (nav link **Guides** `/admin/content`).

**Interfaces — Consumes:** `listAdminGuides`, `getAdminGuide`, `guideUpsertSchema`, `createGuide`, `updateGuide`, `setGuidePublished`, `deleteGuide`.

- [ ] **Step 1 (API):** `index.ts` POST → `createGuide`; `[id].ts` PATCH → `updateGuide`, DELETE → `deleteGuide`; a `?action=publish|unpublish` POST → `setGuidePublished`. All `withAdminApi`.
- [ ] **Step 2 (list page):** `/admin/content` — SSR `listAdminGuides`; table (title, slug, **status** chip draft/published, updated) + edit links + "New guide" + publish/unpublish toggle + delete + a "View" link to `/guides/[slug]` for published.
- [ ] **Step 3 (forms):** `new.tsx` + `[id].tsx` share a form (title, slug (optional; hint auto from title), excerpt, hero image URL, meta title/description, **body = Markdown `<textarea>`** with a hint *"Markdown: `## heading`, `**bold**`, `- list`"*, status) → POST/PATCH, redirect to `/admin/content`. Body stays a plain markdown string in `content.body` (the D12 seeded guides are already valid markdown prose).
- [ ] **Step 4 (render markdown on the public guide):** `pnpm --filter @herrera/web add react-markdown`. In `apps/web/src/pages/guides/[slug].tsx` replace the current `body.split(/\n\n+/) → <p>` block with `<ReactMarkdown>{guide.body ?? ""}</ReactMarkdown>` inside the `.body` container. **Do NOT** add `rehype-raw` / `allowDangerousHtml` — react-markdown ignores raw HTML by default, so authored content can't inject markup (sanitized by construction; no `dangerouslySetInnerHTML`). Adjust `.body` CSS so react-markdown's `h2/ul/ol/li/strong/a/p` render on-brand (the existing `.body p` rule stays; add `h2/ul/li` rules).
- [ ] **Step 5:** `pnpm --filter @herrera/web typecheck`; lint; quick headless check that a seeded guide with `## `/`**` renders formatted (also re-checked in Task 9).
- [ ] **Step 6: commit** — `feat(web): /admin/content guides editor (Markdown body, CRUD, publish/unpublish) (D11)`.

---

## Phase 5 — Verify

### Task 9: headless verification + final gates

- [ ] **Step 1:** full gates — `format:check`, `lint`, `typecheck`, web-typecheck, `test`.
- [ ] **Step 2:** headless (Chrome, gate `demo:secret123` + admin login): **Questions** — add a question, reorder it, deactivate it, confirm the public Buy flow (`GET /api/questions?intent=buy`) reflects active/order; delete it. **Off-market** — create a `private_link` manual listing, confirm it renders at `/homes/[slug]` but is **absent from `/search`** and the sitemap; flip to `public`; delete. **Guides** — create a draft (absent from `/guides`), publish (appears + in sitemap), unpublish, delete. **Marketing** — submit `/contact` with the box **unticked** then **ticked**; confirm two leads each got a `purpose='marketing'` consent row with `granted=false` then `granted=true` (query the DB or a small check), and the required contact consent still recorded. No page overflow @1440/@390 on the new admin pages. Re-seed afterwards to clean demo state.
- [ ] **Step 3:** update memory (D11 done on the branch, deferrals intact). STOP — do NOT merge/deploy; await Pablo's review.

## Deferred / documented follow-ups
- **Visual WYSIWYG editor for guides/blog** — a planned future enhancement for non-technical ease
  (rich toolbar, inline formatting). **Deferred out of D11** to keep it scoped and to choose the editor
  library + HTML-sanitization strategy carefully on its own. **Markdown is the interim** authoring
  format; a future WYSIWYG can **emit markdown**, so the `content.body` format and this editor are not
  thrown away — the WYSIWYG builds on top. (Also recorded in the memory/status doc.)
- Analytics, area/neighborhood content editing (D12 Phase A), email campaigns (Phase 2, ADR-020), and
  the MLS worker (Phase 3) remain out of scope (per Global Constraints).

## Self-Review
- **Coverage:** questions editor (T3–T4) ✓; off-market CRUD + 3-state visibility (T5–T6) ✓; guides editor (T7–T8) ✓; marketing opt-in on 4 forms + `purpose` migration + backfill-via-default + core routing (T1–T2) ✓; deferrals recorded (Global Constraints) ✓.
- **Types:** `consentMarketing`/`marketingWording` defined T1, consumed T2; each editor's schema+helpers defined in its backend task and consumed by its API/page task; `slugify`/`uniqueSlug` shared (T5 introduces the db-side `slug`, reused T7).
- **No placeholders.** Migration is generated + applied + re-seeded; the `NOT NULL DEFAULT 'transactional'` backfills existing consent rows (called out explicitly).
- **Manual-only guard** on every listing write (T5), **admin-only** on every route/page (Global Constraints), **marketing opt-in optional/unchecked/granted=false-when-unticked** (T1–T2, per ADR-020/011).
