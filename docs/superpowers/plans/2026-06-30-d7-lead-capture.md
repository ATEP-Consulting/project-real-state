# D7 — Buy/Sell/Rent Lead-Capture Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A typeform-style Buy/Sell/Rent lead-capture flow — one question per screen, branched by intent, questions read from the admin-configurable `qualification_questions` table, contact captured last (phone and/or email, at least one) — that on submit creates a lead + jsonb answers + per-channel consent by reusing (generalizing) D4's lead machinery.

**Architecture:** One shared flow engine (`LeadCaptureFlow`) hosted two ways: (1) as a global **overlay** opened from any CTA via a React context provider (`openCapture(intent)`), and (2) inline on the ISR **landing routes** `/buy` `/sell` `/rent`. The backend extracts a shared `createLeadWithConsent` core from D4's `createListingInquiry` (no duplication, D8 notification seam lives there once), adds a `qualificationLeadSchema` + `createQualificationLead` wrapper and a `getQualificationQuestions(intent)` resolver (mirrors `getSearchFilters`). The public `POST /api/leads` route branches on payload shape; a new `GET /api/questions?intent=` feeds the overlay. All capture logic that can be pure is extracted to `lib/lead-capture.ts` and TDD'd.

**Tech Stack:** Next 15.5 Pages Router + React 19, TypeScript strict, Drizzle + Zod (`@herrera/db`), framer-motion (reduced-motion-aware), CSS Modules + design tokens, Vitest.

## Global Constraints

- **Stack:** Next.js **Pages Router only** (no App Router / RSC / `"use client"`); React 19; TS strict (`noUncheckedIndexedAccess` on). Client-only libs via `next/dynamic {ssr:false}` (not needed here).
- **Styling:** CSS Modules + CSS custom properties from `apps/web/src/styles/tokens.css`. **No Tailwind. No new colors.** Reuse existing primitives (`Button`, `Container`, etc.). No restyling of shipped components.
- **Motion:** framer-motion, **always** `prefers-reduced-motion`-aware (use `useReducedMotion()`; reduced ⇒ instant, no slide/fade). Mirror `Reveal`/`PageTransition`.
- **Contact rule (non-negotiable, ADR-007/011):** name + **phone and/or email — at least one required, NEVER force both.** Validated with Zod on the server and in the client before any network call. Same rule as D4's `InquiryForm`.
- **Questions are READ-ONLY here:** loaded from `qualification_questions` (admin editor is D11). Never hardcode the question set in the UI.
- **Consent:** capture **per channel** and store a `consent_records` row for each provided+consented channel (ADR-011).
- **No duplication:** generalize D4's `createListingInquiry` lead+consent machinery; do not copy it.
- **D8 seam:** leave a single one-line comment where Nilyan's email/WhatsApp alert + digest + the lead auto-response will fire (ADR-009). No notification code in D7.
- **Demo-resilient data fetching:** ISR pages must keep building without `DATABASE_URL` (try/catch → empty fallback, like `pages/index.tsx`).
- **Branch / cadence:** all work on `feat/d7-lead-capture` off `main`; **one commit per task**; gates green each commit. **Do not merge, do not deploy** — stop for review.
- **Gates (run before each commit):** `pnpm format:check` · `pnpm lint` · `pnpm typecheck` (packages) · `pnpm test` · and for web changes `pnpm --filter @herrera/web build` (the only hermetic web typecheck). **Never run `next build` while `pnpm dev` is live** (corrupts the shared `.next`); `rm -rf apps/web/.next` before a build, fresh `next dev` before headless checks.

---

## File Structure

**`packages/db` (new):**
- `src/leads-create.ts` — shared `createLeadWithConsent` core (lead insert + consent insert + the single D8 seam).
- `src/qualification.ts` — `qualificationLeadSchema`, `createQualificationLead`, `getQualificationQuestions(intent)` + `QualificationQuestionConfig`.
- `src/qualification.test.ts` — schema tests (TDD).

**`packages/db` (modified):**
- `src/inquiries.ts` — refactor `createListingInquiry` to call `createLeadWithConsent` (behavior unchanged).
- `src/seed/questions.ts` — add the buy `also_selling` default question.
- `src/index.ts` — export the new symbols + `QualificationQuestionConfig` type.

**`apps/web` (new):**
- `src/pages/api/questions.ts` — `GET /api/questions?intent=` → active question config.
- `src/lib/lead-capture.ts` — pure flow logic (steps, gating, progress, contact validation, payload mapping).
- `src/lib/lead-capture.test.ts` — TDD for the above.
- `src/components/lead/LeadCaptureFlow.tsx` + `.module.css` — the typeform engine (the shared inner UI).
- `src/components/lead/LeadCaptureProvider.tsx` + `.module.css` — context + overlay chrome (`openCapture`).
- `src/components/lead/LeadLanding.tsx` + `.module.css` — landing shell that hosts the flow on a route.
- `src/pages/buy.tsx`, `src/pages/sell.tsx`, `src/pages/rent.tsx` — ISR landing routes.

**`apps/web` (modified):**
- `src/pages/api/leads.ts` — branch inquiry vs qualification payload.
- `src/pages/_app.tsx` — mount `LeadCaptureProvider`.
- `src/components/home/CaptureInvite.tsx` — CTAs call `openCapture` (buy; sell with address prefilled = the "what's my home worth?" thin variant).

**Out of scope (note as follow-ups):** the standalone `/home-value` page (D7 routes its CTA into the sell flow instead); D8 notifications; D11 admin question editor; D13 ES rendering (config carries `labelEs` through as a seam, UI renders EN).

---

## Task 1: DB — generalized lead/consent core + qualification backend

**Files:**
- Create: `packages/db/src/leads-create.ts`
- Create: `packages/db/src/qualification.ts`
- Create: `packages/db/src/qualification.test.ts`
- Modify: `packages/db/src/inquiries.ts`
- Modify: `packages/db/src/seed/questions.ts`
- Modify: `packages/db/src/index.ts`

**Interfaces:**
- Consumes: `getDb`, `leads`, `consentRecords`/`NewConsentRecord`, `qualificationQuestions`/`QualificationQuestion`, `attributionSchema`, `qualificationAnswersSchema`, `Attribution`.
- Produces:
  - `createLeadWithConsent(input: CreateLeadInput): Promise<{ leadId: string }>`
  - `qualificationLeadSchema` (Zod) + `type QualificationLead`
  - `createQualificationLead(input: QualificationLead): Promise<{ leadId: string }>`
  - `getQualificationQuestions(intent: "buy"|"sell"|"rent"): Promise<QualificationQuestionConfig[]>`
  - `type QualificationQuestionConfig = Pick<QualificationQuestion, "key"|"type"|"label"|"labelEs"|"options"|"required">`

- [ ] **Step 1: Write the failing schema test**

Create `packages/db/src/qualification.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { qualificationLeadSchema } from "./qualification";

describe("qualificationLeadSchema", () => {
  it("accepts a buy lead with just an email", () => {
    const r = qualificationLeadSchema.safeParse({
      intent: "buy",
      answers: { timeline: "0_3" },
      email: "a@b.com",
      consentEmail: true,
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.answers.timeline).toBe("0_3");
  });
  it("accepts a sell lead with just a phone and defaults answers to {}", () => {
    const r = qualificationLeadSchema.safeParse({ intent: "sell", phone: "3055550148" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.answers).toEqual({});
  });
  it("accepts a rent lead", () => {
    expect(
      qualificationLeadSchema.safeParse({ intent: "rent", email: "a@b.com" }).success,
    ).toBe(true);
  });
  it("rejects neither email nor phone", () => {
    expect(qualificationLeadSchema.safeParse({ intent: "buy", answers: {} }).success).toBe(false);
  });
  it("rejects an unknown intent and a bad email", () => {
    expect(qualificationLeadSchema.safeParse({ intent: "lease", email: "a@b.com" }).success).toBe(
      false,
    );
    expect(qualificationLeadSchema.safeParse({ intent: "buy", email: "nope" }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run packages/db/src/qualification.test.ts`
Expected: FAIL — `Failed to resolve import "./qualification"`.

- [ ] **Step 3: Create the shared lead/consent core**

Create `packages/db/src/leads-create.ts`:

```ts
import { getDb } from "./client";
import { consentRecords, type NewConsentRecord } from "./schema/consent";
import { leads } from "./schema/leads";
import type { Attribution } from "./schema/json";

export type LeadIntent = "buy" | "sell" | "rent";

export type CreateLeadInput = {
  intent: LeadIntent;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  answers: Record<string, unknown>;
  source: string;
  attribution?: Attribution;
  viewedListingIds?: string[];
  consentEmail?: boolean;
  consentPhone?: boolean;
  consentWording: string;
};

/**
 * Shared: insert a lead + per-channel consent records (ADR-007/011).
 * THE one place lead creation happens — both the per-listing inquiry (D4) and the
 * Buy/Sell/Rent qualification flow (D7) funnel through here.
 */
export async function createLeadWithConsent(input: CreateLeadInput): Promise<{ leadId: string }> {
  const db = getDb();
  const inserted = await db
    .insert(leads)
    .values({
      intent: input.intent,
      name: input.name ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      answers: input.answers,
      source: input.source,
      attribution: input.attribution,
      viewedListingIds: input.viewedListingIds ?? [],
    })
    .returning({ id: leads.id });
  const leadId = inserted[0]!.id;

  const consents: NewConsentRecord[] = [];
  if (input.email && input.consentEmail)
    consents.push({
      leadId,
      channel: "email",
      granted: true,
      wording: input.consentWording,
      source: input.source,
    });
  if (input.phone && input.consentPhone)
    consents.push({
      leadId,
      channel: "phone",
      granted: true,
      wording: input.consentWording,
      source: input.source,
    });
  if (consents.length) await db.insert(consentRecords).values(consents);

  // D8 SEAM (ADR-009): trigger Nilyan's instant email/WhatsApp alert + daily digest +
  // the lead's single transactional auto-response here. Not in D7.
  return { leadId };
}
```

- [ ] **Step 4: Create the qualification module (schema + create + resolver)**

Create `packages/db/src/qualification.ts`:

```ts
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "./client";
import { createLeadWithConsent } from "./leads-create";
import { attributionSchema, qualificationAnswersSchema } from "./schema/json";
import {
  qualificationQuestions,
  type QualificationQuestion,
} from "./schema/qualification-questions";

// ADR-007 — the Buy/Sell/Rent capture payload. Contact phone and/or email (at least one).
export const qualificationLeadSchema = z
  .object({
    intent: z.enum(["buy", "sell", "rent"]),
    answers: qualificationAnswersSchema.default({}),
    name: z.string().trim().min(1).max(120).optional(),
    email: z.string().email().optional(),
    phone: z.string().trim().min(7).max(40).optional(),
    consentEmail: z.boolean().optional(),
    consentPhone: z.boolean().optional(),
    attribution: attributionSchema.optional(),
    viewedListingIds: z.array(z.string()).optional(),
  })
  .refine((d) => Boolean(d.email) || Boolean(d.phone), {
    message: "Provide an email or phone (at least one).",
    path: ["email"],
  });

export type QualificationLead = z.infer<typeof qualificationLeadSchema>;

const CONSENT_WORDING =
  "I agree to be contacted by Herrera about my real estate needs using the details I provided. Message/data rates may apply.";

/** Create a lead (intent = branch) + per-channel consent from the Buy/Sell/Rent flow (ADR-007/011). */
export async function createQualificationLead(
  input: QualificationLead,
): Promise<{ leadId: string }> {
  return createLeadWithConsent({
    intent: input.intent,
    name: input.name ?? null,
    email: input.email ?? null,
    phone: input.phone ?? null,
    answers: input.answers,
    source: "qualification_flow",
    attribution: input.attribution,
    viewedListingIds: input.viewedListingIds ?? [],
    consentEmail: input.email ? input.consentEmail : false,
    consentPhone: input.phone ? input.consentPhone : false,
    consentWording: CONSENT_WORDING,
  });
}

// JSON-safe projection (no timestamps) — the shape handed to the flow.
export type QualificationQuestionConfig = Pick<
  QualificationQuestion,
  "key" | "type" | "label" | "labelEs" | "options" | "required"
>;

/** Active questions for an intent, in display order. Admin-editable in D11; READ-only here. */
export async function getQualificationQuestions(
  intent: "buy" | "sell" | "rent",
): Promise<QualificationQuestionConfig[]> {
  return getDb()
    .select({
      key: qualificationQuestions.key,
      type: qualificationQuestions.type,
      label: qualificationQuestions.label,
      labelEs: qualificationQuestions.labelEs,
      options: qualificationQuestions.options,
      required: qualificationQuestions.required,
    })
    .from(qualificationQuestions)
    .where(
      and(eq(qualificationQuestions.intent, intent), eq(qualificationQuestions.isActive, true)),
    )
    .orderBy(asc(qualificationQuestions.sortOrder));
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm exec vitest run packages/db/src/qualification.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 6: Refactor `createListingInquiry` to use the shared core (no behavior change)**

In `packages/db/src/inquiries.ts`, replace the body (keep `listingInquirySchema`, `ListingInquiry`, and `CONSENT_WORDING` exactly as-is). Delete the now-unused `getDb`/`consentRecords`/`leads`/`NewConsentRecord` imports and add the core import:

```ts
import { z } from "zod";
import { attributionSchema } from "./schema/json";
import { createLeadWithConsent } from "./leads-create";

// listingInquirySchema + type ListingInquiry + CONSENT_WORDING: UNCHANGED (leave them in place)

/** Create a lead + per-channel consent records from a per-listing inquiry (ADR-007/011). */
export async function createListingInquiry(input: ListingInquiry): Promise<{ leadId: string }> {
  return createLeadWithConsent({
    intent: "buy",
    name: input.name ?? null,
    email: input.email ?? null,
    phone: input.phone ?? null,
    answers: {
      requestType: input.requestType,
      message: input.message ?? null,
      preferredDate: input.preferredDate ?? null,
      listingSlug: input.listingSlug,
    },
    source: "listing_inquiry",
    attribution: input.attribution,
    viewedListingIds: [input.listingSlug],
    consentEmail: input.email ? input.consentEmail : false,
    consentPhone: input.phone ? input.consentPhone : false,
    consentWording: CONSENT_WORDING,
  });
}
```

- [ ] **Step 7: Add the buy `also_selling` default question to the seed**

In `packages/db/src/seed/questions.ts`, inside the `QUESTIONS` array, add this object immediately after the buy `preapproved` question (before the `beds` question) — it's the Carolina "do you also need to sell?" default the brief names:

```ts
  {
    intent: "buy",
    key: "also_selling",
    sortOrder: 5,
    type: "single_select",
    required: false,
    label: "Do you also need to sell a home?",
    labelEs: "¿También necesitas vender una propiedad?",
    options: [
      { value: "yes", label: "Yes", labelEs: "Sí" },
      { value: "no", label: "No", labelEs: "No" },
      { value: "unsure", label: "Not sure", labelEs: "No estoy seguro" },
    ],
  },
```

Then bump the buy `beds` question's `sortOrder` from `4` to `6` so order stays stable (timeline 1, budget 2, preapproved 3, also_selling 5, beds 6 — gaps are fine).

- [ ] **Step 8: Export the new symbols**

In `packages/db/src/index.ts`, add after the existing `inquiries` export line:

```ts
export {
  qualificationLeadSchema,
  createQualificationLead,
  getQualificationQuestions,
  type QualificationLead,
  type QualificationQuestionConfig,
} from "./qualification";
export { createLeadWithConsent, type CreateLeadInput, type LeadIntent } from "./leads-create";
```

- [ ] **Step 9: Re-seed Neon and verify the new question landed**

Run (root `.env.local` must hold `DATABASE_URL`):

```bash
pnpm db:seed
```

Expected: the runner prints a summary; `qualification_questions` count goes from 10 → 11. Verify quickly:

```bash
pnpm db:studio
```

Confirm the buy intent now has a `also_selling` row (or trust the count). (Seed is idempotent — it deletes+re-inserts questions.)

- [ ] **Step 10: Run gates and commit**

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test
git add packages/db
git commit -m "feat(db): generalize lead/consent core + qualification capture backend (D7)"
```

Expected: all gates green; `qualification.test.ts` + existing `inquiries.test.ts` pass.

---

## Task 2: API — questions GET + leads POST qualification branch

**Files:**
- Create: `apps/web/src/pages/api/questions.ts`
- Modify: `apps/web/src/pages/api/leads.ts`

**Interfaces:**
- Consumes: `getQualificationQuestions`, `qualificationLeadSchema`, `createQualificationLead`, `listingInquirySchema`, `createListingInquiry` (all from `@herrera/db`).
- Produces: `GET /api/questions?intent=buy|sell|rent` → `{ questions: QualificationQuestionConfig[] }`; `POST /api/leads` now also accepts a qualification payload.

- [ ] **Step 1: Create the questions API route**

Create `apps/web/src/pages/api/questions.ts`:

```ts
import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { getQualificationQuestions } from "@herrera/db";

const intentSchema = z.enum(["buy", "sell", "rent"]);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const parsed = intentSchema.safeParse(req.query.intent);
  if (!parsed.success) {
    res.status(400).json({ error: "Unknown intent" });
    return;
  }
  try {
    const questions = await getQualificationQuestions(parsed.data);
    res.status(200).json({ questions });
  } catch (e) {
    console.error("[api/questions] failed:", (e as Error).message);
    res.status(500).json({ error: "Could not load questions" });
  }
}
```

- [ ] **Step 2: Branch the leads route on payload shape**

Replace `apps/web/src/pages/api/leads.ts` with (a per-listing inquiry carries `listingSlug`; the qualification flow does not):

```ts
import type { NextApiRequest, NextApiResponse } from "next";
import {
  createListingInquiry,
  createQualificationLead,
  listingInquirySchema,
  qualificationLeadSchema,
} from "@herrera/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body: unknown = req.body;
  const isInquiry =
    typeof body === "object" && body !== null && typeof (body as { listingSlug?: unknown }).listingSlug === "string";

  if (isInquiry) {
    const parsed = listingInquirySchema.safeParse(body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid inquiry", issues: parsed.error.flatten() });
      return;
    }
    try {
      const { leadId } = await createListingInquiry(parsed.data);
      res.status(201).json({ ok: true, leadId });
    } catch (e) {
      console.error("[api/leads] inquiry failed:", (e as Error).message);
      res.status(500).json({ error: "Could not submit inquiry" });
    }
    return;
  }

  const parsed = qualificationLeadSchema.safeParse(body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid lead", issues: parsed.error.flatten() });
    return;
  }
  try {
    const { leadId } = await createQualificationLead(parsed.data);
    res.status(201).json({ ok: true, leadId });
  } catch (e) {
    console.error("[api/leads] qualification failed:", (e as Error).message);
    res.status(500).json({ error: "Could not submit lead" });
  }
}
```

- [ ] **Step 3: Build (web typecheck) and smoke-test both routes**

```bash
rm -rf apps/web/.next
pnpm --filter @herrera/web build
```

Expected: build succeeds (types clean). Then, with `pnpm dev` running and `apps/web/.env.local` holding `DATABASE_URL` + `PREVIEW_BASIC_AUTH`, warm + smoke-test (use `-u demo:<pass>` from `apps/web/.env.local`):

```bash
curl -s -u demo:PASS "http://localhost:3000/api/questions?intent=buy" | head -c 400
curl -s -u demo:PASS -X POST "http://localhost:3000/api/leads" \
  -H 'content-type: application/json' \
  -d '{"intent":"buy","answers":{"timeline":"0_3"},"email":"plan-test@example.com","consentEmail":true}'
```

Expected: questions returns a `questions` array including `also_selling`; the POST returns `{"ok":true,"leadId":"…"}` (201).

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/pages/api
git commit -m "feat(api): GET /api/questions + qualification branch on POST /api/leads (D7)"
```

---

## Task 3: Web lib — pure lead-capture logic (TDD)

**Files:**
- Create: `apps/web/src/lib/lead-capture.ts`
- Create: `apps/web/src/lib/lead-capture.test.ts`

**Interfaces:**
- Consumes: `QualificationQuestionConfig` (type-only, from `@herrera/db`).
- Produces: `type Intent`, `type Answers`, `type Step`, `buildSteps`, `isAnswered`, `canAdvance`, `progressPct`, `type ContactInput`, `validateContact`, `type LeadPayload`, `buildLeadPayload`.

- [ ] **Step 1: Write the failing tests**

Create `apps/web/src/lib/lead-capture.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { QualificationQuestionConfig } from "@herrera/db";
import {
  buildLeadPayload,
  buildSteps,
  canAdvance,
  isAnswered,
  progressPct,
  validateContact,
} from "./lead-capture";

const sel: QualificationQuestionConfig = {
  key: "timeline",
  type: "single_select",
  label: "When?",
  labelEs: null,
  options: [{ value: "0_3", label: "0–3 months" }],
  required: true,
};
const optionalText: QualificationQuestionConfig = {
  key: "note",
  type: "text",
  label: "Note",
  labelEs: null,
  options: [],
  required: false,
};

describe("buildSteps", () => {
  it("appends a contact step after the questions", () => {
    const steps = buildSteps([sel, optionalText]);
    expect(steps).toHaveLength(3);
    expect(steps[2]).toEqual({ kind: "contact" });
    expect(steps[0]).toEqual({ kind: "question", question: sel });
  });
});

describe("isAnswered", () => {
  it("is false for an empty select, true once chosen", () => {
    expect(isAnswered(sel, {})).toBe(false);
    expect(isAnswered(sel, { timeline: "0_3" })).toBe(true);
  });
  it("treats a boolean answer of false as answered", () => {
    const q: QualificationQuestionConfig = { ...sel, key: "pets", type: "boolean", options: [] };
    expect(isAnswered(q, { pets: false })).toBe(true);
    expect(isAnswered(q, {})).toBe(false);
  });
  it("treats 0 as an answered number", () => {
    const q: QualificationQuestionConfig = { ...sel, key: "beds", type: "number", options: [] };
    expect(isAnswered(q, { beds: 0 })).toBe(true);
  });
});

describe("canAdvance", () => {
  it("blocks an unanswered required question but allows an optional one", () => {
    expect(canAdvance({ kind: "question", question: sel }, {})).toBe(false);
    expect(canAdvance({ kind: "question", question: optionalText }, {})).toBe(true);
  });
  it("always allows the contact step", () => {
    expect(canAdvance({ kind: "contact" }, {})).toBe(true);
  });
});

describe("progressPct", () => {
  it("maps step index over total steps", () => {
    expect(progressPct(0, 4)).toBe(0);
    expect(progressPct(2, 4)).toBe(50);
    expect(progressPct(4, 4)).toBe(100);
    expect(progressPct(1, 0)).toBe(0);
  });
});

describe("validateContact", () => {
  it("requires at least one channel", () => {
    expect(validateContact({ consent: true })).toMatch(/email or a phone/);
  });
  it("requires consent", () => {
    expect(validateContact({ email: "a@b.com", consent: false })).toMatch(/agree/);
  });
  it("passes with one channel + consent", () => {
    expect(validateContact({ phone: "3055550148", consent: true })).toBeNull();
  });
});

describe("buildLeadPayload", () => {
  it("maps consent flags from the provided channels and trims blanks to undefined", () => {
    const p = buildLeadPayload({
      intent: "sell",
      answers: { address: "1 Main St" },
      contact: { name: "  Ana ", email: " a@b.com ", phone: "", consent: true },
      landingPath: "/sell",
    });
    expect(p).toEqual({
      intent: "sell",
      answers: { address: "1 Main St" },
      name: "Ana",
      email: "a@b.com",
      phone: undefined,
      consentEmail: true,
      consentPhone: false,
      attribution: { landingPath: "/sell" },
    });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm exec vitest run apps/web/src/lib/lead-capture.test.ts`
Expected: FAIL — `Failed to resolve import "./lead-capture"`.

- [ ] **Step 3: Implement the pure logic**

Create `apps/web/src/lib/lead-capture.ts`:

```ts
import type { QualificationQuestionConfig } from "@herrera/db";

export type Intent = "buy" | "sell" | "rent";
export type Answers = Record<string, unknown>;

export type Step =
  | { kind: "question"; question: QualificationQuestionConfig }
  | { kind: "contact" };

/** The flow's screens: one per question, then the contact step. */
export function buildSteps(questions: QualificationQuestionConfig[]): Step[] {
  return [
    ...questions.map((question): Step => ({ kind: "question", question })),
    { kind: "contact" },
  ];
}

/** Has this question been answered? (false/0/"" handled per type.) */
export function isAnswered(q: QualificationQuestionConfig, answers: Answers): boolean {
  const v = answers[q.key];
  if (q.type === "multi_select") return Array.isArray(v) && v.length > 0;
  if (q.type === "boolean") return typeof v === "boolean";
  if (q.type === "number") return typeof v === "number" && !Number.isNaN(v);
  return v !== undefined && v !== null && String(v).trim() !== "";
}

/** Can the user move past this step? Optional questions and the contact step never block. */
export function canAdvance(step: Step, answers: Answers): boolean {
  if (step.kind === "contact") return true;
  if (!step.question.required) return true;
  return isAnswered(step.question, answers);
}

export function progressPct(stepIndex: number, totalSteps: number): number {
  if (totalSteps <= 0) return 0;
  return Math.round((stepIndex / totalSteps) * 100);
}

export type ContactInput = { name?: string; email?: string; phone?: string; consent: boolean };

/** Client mirror of the D4 contact rule. Returns an error message, or null when valid. */
export function validateContact(c: ContactInput): string | null {
  const email = (c.email ?? "").trim();
  const phone = (c.phone ?? "").trim();
  if (!email && !phone) return "Please add an email or a phone so Nilyan can reach you.";
  if (!c.consent) return "Please agree to be contacted.";
  return null;
}

export type LeadPayload = {
  intent: Intent;
  answers: Answers;
  name?: string;
  email?: string;
  phone?: string;
  consentEmail: boolean;
  consentPhone: boolean;
  attribution: { landingPath: string };
};

/** Shape the POST /api/leads body. Consent is granted per channel the user actually provided. */
export function buildLeadPayload(args: {
  intent: Intent;
  answers: Answers;
  contact: ContactInput;
  landingPath: string;
}): LeadPayload {
  const email = (args.contact.email ?? "").trim();
  const phone = (args.contact.phone ?? "").trim();
  const name = (args.contact.name ?? "").trim();
  return {
    intent: args.intent,
    answers: args.answers,
    name: name || undefined,
    email: email || undefined,
    phone: phone || undefined,
    consentEmail: Boolean(email),
    consentPhone: Boolean(phone),
    attribution: { landingPath: args.landingPath },
  };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm exec vitest run apps/web/src/lib/lead-capture.test.ts`
Expected: PASS (all describe blocks green).

- [ ] **Step 5: Run gates and commit**

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test
git add apps/web/src/lib/lead-capture.ts apps/web/src/lib/lead-capture.test.ts
git commit -m "feat(web): pure lead-capture flow logic (steps, gating, payload) (D7)"
```

---

## Task 4: LeadCaptureFlow — the typeform engine

**Files:**
- Create: `apps/web/src/components/lead/LeadCaptureFlow.tsx`
- Create: `apps/web/src/components/lead/LeadCaptureFlow.module.css`

**Interfaces:**
- Consumes: `Intent`, `Answers`, `buildSteps`, `canAdvance`, `progressPct`, `validateContact`, `buildLeadPayload` (`@/lib/lead-capture`); `QualificationQuestionConfig` (`@herrera/db`); `Button`; `DURATION`, `EASE` (`@/theme/motion`); `REALTOR` (`@/data/realtor`).
- Produces: `function LeadCaptureFlow(props: { intent: Intent; questions: QualificationQuestionConfig[]; initialAnswers?: Answers; landingPath: string; onClose?: () => void }): JSX.Element`. (`onClose`, when present, renders a "Close" affordance — used by the overlay; the landing page omits it.)

- [ ] **Step 1: Implement the flow component**

Create `apps/web/src/components/lead/LeadCaptureFlow.tsx`:

```tsx
import { useMemo, useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { QualificationQuestionConfig } from "@herrera/db";
import { Button } from "@/components/ui/Button";
import { REALTOR } from "@/data/realtor";
import { DURATION, EASE } from "@/theme/motion";
import {
  buildLeadPayload,
  buildSteps,
  canAdvance,
  progressPct,
  validateContact,
  type Answers,
  type ContactInput,
  type Intent,
  type Step,
} from "@/lib/lead-capture";
import styles from "./LeadCaptureFlow.module.css";

const TEL = `tel:${REALTOR.phone.replace(/[^\d+]/g, "")}`;
const HEADLINE: Record<Intent, string> = {
  buy: "Let's find your home",
  sell: "Let's value your home",
  rent: "Let's find your rental",
};
type Status = "idle" | "submitting" | "done" | "error";

function QuestionControl({
  q,
  value,
  onChange,
  onCommit,
}: {
  q: QualificationQuestionConfig;
  value: unknown;
  onChange: (v: unknown) => void;
  onCommit: () => void; // advance (used by auto-advancing controls)
}) {
  if (q.type === "single_select" || q.type === "multi_select") {
    const multi = q.type === "multi_select";
    const selected: string[] = multi ? (Array.isArray(value) ? (value as string[]) : []) : [];
    return (
      <div className={styles.options}>
        {q.options.map((o) => {
          const active = multi ? selected.includes(o.value) : value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              className={`${styles.option} ${active ? styles.optionActive : ""}`}
              aria-pressed={active}
              onClick={() => {
                if (multi) {
                  onChange(
                    active ? selected.filter((v) => v !== o.value) : [...selected, o.value],
                  );
                } else {
                  onChange(o.value);
                  onCommit(); // typeform: selecting a single choice advances
                }
              }}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    );
  }
  if (q.type === "boolean") {
    return (
      <div className={styles.options}>
        {[
          { v: true, label: "Yes" },
          { v: false, label: "No" },
        ].map((o) => (
          <button
            key={o.label}
            type="button"
            className={`${styles.option} ${value === o.v ? styles.optionActive : ""}`}
            aria-pressed={value === o.v}
            onClick={() => {
              onChange(o.v);
              onCommit();
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
    );
  }
  if (q.type === "number") {
    return (
      <input
        className={styles.input}
        type="number"
        inputMode="numeric"
        autoFocus
        value={value === undefined || value === null ? "" : String(value)}
        onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
      />
    );
  }
  // text / range (range falls back to free text in v1) — single free-text input
  return (
    <input
      className={styles.input}
      type="text"
      autoFocus
      value={value === undefined || value === null ? "" : String(value)}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function LeadCaptureFlow({
  intent,
  questions,
  initialAnswers = {},
  landingPath,
  onClose,
}: {
  intent: Intent;
  questions: QualificationQuestionConfig[];
  initialAnswers?: Answers;
  landingPath: string;
  onClose?: () => void;
}) {
  const reduce = useReducedMotion();
  const steps = useMemo<Step[]>(() => buildSteps(questions), [questions]);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [contact, setContact] = useState<ContactInput>({ consent: false });
  const [status, setStatus] = useState<Status>("idle");
  const [err, setErr] = useState<string | null>(null);

  const step = steps[i]!;
  const isLast = step.kind === "contact";
  const setAnswer = (key: string, v: unknown) => setAnswers((a) => ({ ...a, [key]: v }));

  function next() {
    setErr(null);
    if (!canAdvance(step, answers)) {
      setErr("Please answer to continue.");
      return;
    }
    setI((n) => Math.min(n + 1, steps.length - 1));
  }
  function back() {
    setErr(null);
    setI((n) => Math.max(n - 1, 0));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const v = validateContact(contact);
    if (v) {
      setErr(v);
      return;
    }
    setStatus("submitting");
    setErr(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(buildLeadPayload({ intent, answers, contact, landingPath })),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("done");
    } catch {
      setStatus("error");
      setErr("Something went wrong. Please try again or call us.");
    }
  }

  if (status === "done") {
    return (
      <div className={styles.panel}>
        {onClose && (
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
            ×
          </button>
        )}
        <div className={styles.done}>
          <h2 className={styles.doneTitle}>Thanks — we&rsquo;ll be in touch shortly.</h2>
          <p className={styles.doneSub}>
            Nilyan personally follows up on every request. Prefer to talk now?
          </p>
          <a className={styles.call} href={TEL}>
            Call · {REALTOR.phone}
          </a>
        </div>
      </div>
    );
  }

  const anim = reduce
    ? {}
    : {
        initial: { opacity: 0, x: 24 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -24 },
        transition: { duration: DURATION.base, ease: EASE },
      };

  return (
    <div className={styles.panel}>
      {onClose && (
        <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
          ×
        </button>
      )}
      <div className={styles.progressTrack} aria-hidden="true">
        <div className={styles.progressBar} style={{ width: `${progressPct(i, steps.length)}%` }} />
      </div>
      <p className={styles.stepCount}>
        {HEADLINE[intent]} · step {i + 1} of {steps.length}
      </p>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={i} className={styles.stepBody} {...anim}>
          {step.kind === "question" ? (
            <>
              <h2 className={styles.q}>
                {step.question.label}
                {step.question.required && <span className={styles.req}> *</span>}
              </h2>
              <QuestionControl
                q={step.question}
                value={answers[step.question.key]}
                onChange={(v) => setAnswer(step.question.kind === undefined ? "" : "", v)}
                onCommit={next}
              />
            </>
          ) : (
            <form className={styles.contact} onSubmit={submit} noValidate>
              <h2 className={styles.q}>How should Nilyan reach you?</h2>
              <input
                className={styles.input}
                placeholder="Your name"
                autoComplete="name"
                value={contact.name ?? ""}
                onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))}
              />
              <input
                className={styles.input}
                type="email"
                placeholder="Email"
                autoComplete="email"
                value={contact.email ?? ""}
                onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
              />
              <input
                className={styles.input}
                type="tel"
                placeholder="Phone"
                autoComplete="tel"
                value={contact.phone ?? ""}
                onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
              />
              <label className={styles.consent}>
                <input
                  type="checkbox"
                  checked={contact.consent}
                  onChange={(e) => setContact((c) => ({ ...c, consent: e.target.checked }))}
                />
                <span>
                  I agree to be contacted by Herrera about my real estate needs using the details I
                  provided.
                </span>
              </label>
              <p className={styles.fine}>
                No obligation — phone <em>or</em> email is enough; you don&rsquo;t need both.
              </p>
            </form>
          )}
        </motion.div>
      </AnimatePresence>

      {err && (
        <p className={styles.err} role="alert">
          {err}
        </p>
      )}

      <div className={styles.nav}>
        <button
          type="button"
          className={styles.back}
          onClick={back}
          disabled={i === 0 || status === "submitting"}
        >
          ← Back
        </button>
        {isLast ? (
          <Button type="button" size="lg" disabled={status === "submitting"} onClick={submit}>
            {status === "submitting" ? "Sending…" : "Send to Nilyan"}
          </Button>
        ) : (
          <Button type="button" size="lg" onClick={next}>
            Next →
          </Button>
        )}
      </div>
    </div>
  );
}
```

> **NOTE — fix the `onChange` key bug while implementing:** the `QuestionControl` `onChange` must write to `step.question.key`. Write it as:
> ```tsx
> onChange={(v) => setAnswer(step.question.key, v)}
> ```
> (The placeholder `step.question.kind === undefined ? "" : ""` above is intentionally wrong so the implementer wires the real key — `step` is narrowed to the `question` branch here, so `step.question.key` is valid.)

- [ ] **Step 2: Implement the styles (tokens only)**

Create `apps/web/src/components/lead/LeadCaptureFlow.module.css` using existing token variables (inspect `apps/web/src/styles/tokens.css` for exact names — e.g. `--color-forest`, `--color-bronze`, `--color-cream`, `--color-ink`, `--radius-*`, `--space-*`, `--font-serif`, `--shadow-*`; match what D4's `InquiryForm.module.css` and `Button.module.css` already use). The flow must read as the same system — no new palette. Key rules:

```css
.panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-5, 1.25rem);
  width: 100%;
  max-width: 34rem;
  margin: 0 auto;
  padding: clamp(1.25rem, 4vw, 2rem);
  position: relative;
}
.close {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 2.25rem;
  height: 2.25rem;
  border: none;
  background: transparent;
  font-size: 1.75rem;
  line-height: 1;
  cursor: pointer;
  color: var(--color-ink, #1c1c1c);
  border-radius: 999px;
}
.close:hover {
  background: rgba(0, 0, 0, 0.06);
}
.progressTrack {
  height: 4px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.08);
  overflow: hidden;
}
.progressBar {
  height: 100%;
  background: var(--color-bronze, #9a6a3a);
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
@media (prefers-reduced-motion: reduce) {
  .progressBar {
    transition: none;
  }
}
.stepCount {
  font-size: 0.8rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-muted, #6b6b6b);
  margin: 0;
}
.stepBody {
  min-height: 16rem;
}
.q {
  font-family: var(--font-serif, serif);
  font-size: clamp(1.4rem, 4vw, 2rem);
  line-height: 1.15;
  margin: 0 0 1.25rem;
  color: var(--color-ink, #1c1c1c);
}
.req {
  color: var(--color-bronze, #9a6a3a);
}
.options {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}
.option {
  text-align: left;
  padding: 1rem 1.125rem;
  border: 1px solid rgba(0, 0, 0, 0.14);
  border-radius: var(--radius-md, 12px);
  background: #fff;
  font-size: 1rem;
  cursor: pointer;
  transition:
    border-color 0.15s,
    background 0.15s,
    transform 0.15s;
}
.option:hover {
  border-color: var(--color-bronze, #9a6a3a);
}
.optionActive {
  border-color: var(--color-bronze, #9a6a3a);
  background: var(--color-cream, #f6f1ea);
}
@media (prefers-reduced-motion: reduce) {
  .option {
    transition: none;
  }
}
.input {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 1px solid rgba(0, 0, 0, 0.16);
  border-radius: var(--radius-md, 12px);
  font-size: 1rem;
  margin-bottom: 0.75rem;
  background: #fff;
}
.input:focus-visible {
  outline: 2px solid var(--color-bronze, #9a6a3a);
  outline-offset: 1px;
}
.contact {
  display: flex;
  flex-direction: column;
}
.consent {
  display: flex;
  gap: 0.625rem;
  align-items: flex-start;
  font-size: 0.85rem;
  color: var(--color-muted, #555);
  margin: 0.25rem 0 0.5rem;
}
.fine {
  font-size: 0.8rem;
  color: var(--color-muted, #6b6b6b);
  margin: 0;
}
.err {
  color: #b3261e;
  font-size: 0.9rem;
  margin: 0;
}
.nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}
.back {
  border: none;
  background: transparent;
  font-size: 0.95rem;
  cursor: pointer;
  color: var(--color-ink, #1c1c1c);
  padding: 0.5rem 0.25rem;
}
.back:disabled {
  opacity: 0;
  pointer-events: none;
}
.done {
  text-align: center;
  padding: 2rem 0;
}
.doneTitle {
  font-family: var(--font-serif, serif);
  font-size: 1.6rem;
  margin: 0 0 0.5rem;
}
.doneSub {
  color: var(--color-muted, #555);
  margin: 0 0 1.25rem;
}
.call {
  display: inline-block;
  font-weight: 600;
  color: var(--color-forest, #0b1816);
  text-decoration: underline;
}
```

- [ ] **Step 3: Build (web typecheck)**

```bash
rm -rf apps/web/.next
pnpm --filter @herrera/web build
```

Expected: build succeeds; the corrected `onChange={(v) => setAnswer(step.question.key, v)}` type-checks (`step` narrowed to the question branch). If the build fails on the intentional placeholder, you forgot Step 1's NOTE — fix the key.

- [ ] **Step 4: Run gates and commit**

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test
git add apps/web/src/components/lead/LeadCaptureFlow.tsx apps/web/src/components/lead/LeadCaptureFlow.module.css
git commit -m "feat(web): LeadCaptureFlow typeform engine (reduced-motion aware) (D7)"
```

---

## Task 5: LeadCaptureProvider — global overlay launcher

**Files:**
- Create: `apps/web/src/components/lead/LeadCaptureProvider.tsx`
- Create: `apps/web/src/components/lead/LeadCaptureProvider.module.css`
- Modify: `apps/web/src/pages/_app.tsx`

**Interfaces:**
- Consumes: `LeadCaptureFlow`; `Intent`, `Answers` (`@/lib/lead-capture`); `QualificationQuestionConfig` (`@herrera/db`); `DURATION`, `EASE`.
- Produces: `function LeadCaptureProvider(props: { children: ReactNode }): JSX.Element`; `function useLeadCapture(): { openCapture: (intent: Intent, opts?: { initialAnswers?: Answers }) => void }`.

- [ ] **Step 1: Implement the provider + overlay**

Create `apps/web/src/components/lead/LeadCaptureProvider.tsx`:

```tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { QualificationQuestionConfig } from "@herrera/db";
import { DURATION, EASE } from "@/theme/motion";
import { LeadCaptureFlow } from "./LeadCaptureFlow";
import type { Answers, Intent } from "@/lib/lead-capture";
import styles from "./LeadCaptureProvider.module.css";

type Ctx = { openCapture: (intent: Intent, opts?: { initialAnswers?: Answers }) => void };
const LeadCaptureContext = createContext<Ctx | null>(null);

export function useLeadCapture(): Ctx {
  const ctx = useContext(LeadCaptureContext);
  if (!ctx) throw new Error("useLeadCapture must be used inside <LeadCaptureProvider>");
  return ctx;
}

type Loaded =
  | { state: "loading" }
  | { state: "error" }
  | { state: "ready"; questions: QualificationQuestionConfig[] };

export function LeadCaptureProvider({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  const [intent, setIntent] = useState<Intent | null>(null);
  const [initialAnswers, setInitialAnswers] = useState<Answers>({});
  const [loaded, setLoaded] = useState<Loaded>({ state: "loading" });

  const openCapture = useCallback<Ctx["openCapture"]>((i, opts) => {
    setIntent(i);
    setInitialAnswers(opts?.initialAnswers ?? {});
    setLoaded({ state: "loading" });
  }, []);
  const close = useCallback(() => setIntent(null), []);

  // Fetch the question set for the chosen intent when the overlay opens.
  useEffect(() => {
    if (!intent) return;
    let alive = true;
    fetch(`/api/questions?intent=${intent}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { questions: QualificationQuestionConfig[] }) => {
        if (alive) setLoaded({ state: "ready", questions: d.questions });
      })
      .catch(() => {
        if (alive) setLoaded({ state: "error" });
      });
    return () => {
      alive = false;
    };
  }, [intent]);

  // Esc to close + lock body scroll while open.
  useEffect(() => {
    if (!intent) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [intent, close]);

  const value = useMemo<Ctx>(() => ({ openCapture }), [openCapture]);

  const overlayAnim = reduce
    ? {}
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: DURATION.fast, ease: EASE },
      };
  const sheetAnim = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 24 },
        transition: { duration: DURATION.base, ease: EASE },
      };

  return (
    <LeadCaptureContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {intent && (
          <motion.div
            className={styles.backdrop}
            onClick={close}
            role="dialog"
            aria-modal="true"
            aria-label="Lead capture"
            {...overlayAnim}
          >
            <motion.div
              className={styles.sheet}
              onClick={(e) => e.stopPropagation()}
              {...sheetAnim}
            >
              {loaded.state === "loading" && <p className={styles.note}>Loading…</p>}
              {loaded.state === "error" && (
                <div className={styles.note}>
                  <p>We couldn&rsquo;t load the form. Please try again.</p>
                  <button type="button" className={styles.retry} onClick={() => openCapture(intent)}>
                    Retry
                  </button>
                </div>
              )}
              {loaded.state === "ready" && (
                <LeadCaptureFlow
                  intent={intent}
                  questions={loaded.questions}
                  initialAnswers={initialAnswers}
                  landingPath={`/${intent}`}
                  onClose={close}
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </LeadCaptureContext.Provider>
  );
}
```

- [ ] **Step 2: Implement the overlay styles**

Create `apps/web/src/components/lead/LeadCaptureProvider.module.css`:

```css
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(11, 24, 22, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  overflow-y: auto;
}
.sheet {
  background: #fff;
  border-radius: var(--radius-lg, 18px);
  width: 100%;
  max-width: 38rem;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.28);
  margin: auto;
}
.note {
  padding: 3rem 2rem;
  text-align: center;
  color: var(--color-muted, #555);
}
.retry {
  margin-top: 0.75rem;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 999px;
  padding: 0.5rem 1.25rem;
  background: #fff;
  cursor: pointer;
}
/* On small screens the sheet becomes a full-height bottom-anchored panel. */
@media (max-width: 640px) {
  .backdrop {
    padding: 0;
    align-items: stretch;
  }
  .sheet {
    border-radius: 0;
    max-width: none;
    min-height: 100%;
  }
}
```

- [ ] **Step 3: Mount the provider in `_app.tsx`**

In `apps/web/src/pages/_app.tsx`, import the provider and wrap the page tree (keep `DemoBanner` outside so it sits above the overlay backdrop is fine either way; wrap `PageTransition`):

```tsx
import { LeadCaptureProvider } from "@/components/lead/LeadCaptureProvider";
```

Change the body to:

```tsx
      <LeadCaptureProvider>
        <PageTransition>
          <Component {...pageProps} />
        </PageTransition>
      </LeadCaptureProvider>
      {isDemo && <DemoBanner />}
```

- [ ] **Step 4: Build (web typecheck)**

```bash
rm -rf apps/web/.next
pnpm --filter @herrera/web build
```

Expected: build succeeds.

- [ ] **Step 5: Run gates and commit**

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test
git add apps/web/src/components/lead/LeadCaptureProvider.tsx apps/web/src/components/lead/LeadCaptureProvider.module.css apps/web/src/pages/_app.tsx
git commit -m "feat(web): global lead-capture overlay provider (openCapture) (D7)"
```

---

## Task 6: Landing routes `/buy` `/sell` `/rent`

**Files:**
- Create: `apps/web/src/components/lead/LeadLanding.tsx`
- Create: `apps/web/src/components/lead/LeadLanding.module.css`
- Create: `apps/web/src/pages/buy.tsx`
- Create: `apps/web/src/pages/sell.tsx`
- Create: `apps/web/src/pages/rent.tsx`

**Interfaces:**
- Consumes: `getQualificationQuestions` (`@herrera/db`); `QualificationQuestionConfig`; `LeadCaptureFlow`; `SiteLayout`; `Container`; `Intent`.
- Produces: `function LeadLanding(props: { intent: Intent; questions: QualificationQuestionConfig[] }): JSX.Element`; three ISR pages.

- [ ] **Step 1: Implement the shared landing shell**

Create `apps/web/src/components/lead/LeadLanding.tsx`:

```tsx
import Head from "next/head";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Container } from "@/components/ui/Container";
import { LeadCaptureFlow } from "./LeadCaptureFlow";
import type { Intent } from "@/lib/lead-capture";
import type { QualificationQuestionConfig } from "@herrera/db";
import styles from "./LeadLanding.module.css";

const COPY: Record<Intent, { title: string; lede: string; eyebrow: string }> = {
  buy: {
    eyebrow: "Buy",
    title: "Find your place in Florida",
    lede: "A few quick questions and Nilyan curates homes that fit — often before they hit the market.",
  },
  sell: {
    eyebrow: "Sell",
    title: "What's your home worth?",
    lede: "Tell us about your property and get a free, no-obligation valuation from a licensed local realtor.",
  },
  rent: {
    eyebrow: "Rent",
    title: "Find your next rental",
    lede: "Share what you need and Nilyan sends rentals that match your timeline and budget.",
  },
};

export function LeadLanding({
  intent,
  questions,
}: {
  intent: Intent;
  questions: QualificationQuestionConfig[];
}) {
  const c = COPY[intent];
  return (
    <SiteLayout>
      <Head>
        <title>{`${c.title} · Herrera`}</title>
        <meta name="description" content={c.lede} />
      </Head>
      <section className={styles.section}>
        <Container>
          <div className={styles.grid}>
            <div className={styles.intro}>
              <p className={styles.eyebrow}>{c.eyebrow}</p>
              <h1 className={styles.title}>{c.title}</h1>
              <p className={styles.lede}>{c.lede}</p>
            </div>
            <div className={styles.flowCard}>
              <LeadCaptureFlow intent={intent} questions={questions} landingPath={`/${intent}`} />
            </div>
          </div>
        </Container>
      </section>
    </SiteLayout>
  );
}
```

- [ ] **Step 2: Implement the landing styles**

Create `apps/web/src/components/lead/LeadLanding.module.css`:

```css
.section {
  padding: clamp(2rem, 6vw, 5rem) 0;
  background: var(--color-cream, #f6f1ea);
  min-height: calc(100dvh - var(--header-h, 76px));
}
.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: clamp(1.5rem, 4vw, 3rem);
  align-items: start;
}
@media (min-width: 880px) {
  .grid {
    grid-template-columns: 1fr 1.1fr;
  }
  .intro {
    position: sticky;
    top: calc(var(--header-h, 76px) + 2rem);
  }
}
.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.8rem;
  color: var(--color-bronze, #9a6a3a);
  margin: 0 0 0.75rem;
}
.title {
  font-family: var(--font-serif, serif);
  font-size: clamp(2rem, 6vw, 3.25rem);
  line-height: 1.05;
  margin: 0 0 1rem;
  color: var(--color-forest, #0b1816);
}
.lede {
  font-size: 1.05rem;
  color: var(--color-muted, #4a4a4a);
  max-width: 30ch;
}
.flowCard {
  background: #fff;
  border-radius: var(--radius-lg, 18px);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.1);
}
```

- [ ] **Step 3: Create the three ISR pages**

Create `apps/web/src/pages/buy.tsx`:

```tsx
import type { GetStaticProps } from "next";
import { getQualificationQuestions, type QualificationQuestionConfig } from "@herrera/db";
import { LeadLanding } from "@/components/lead/LeadLanding";

type Props = { questions: QualificationQuestionConfig[] };

export const getStaticProps: GetStaticProps<Props> = async () => {
  let questions: QualificationQuestionConfig[] = [];
  try {
    questions = await getQualificationQuestions("buy");
  } catch (err) {
    console.warn("[buy] questions unavailable:", (err as Error).message);
  }
  return { props: { questions }, revalidate: 300 };
};

export default function BuyPage({ questions }: Props) {
  return <LeadLanding intent="buy" questions={questions} />;
}
```

Create `apps/web/src/pages/sell.tsx` and `apps/web/src/pages/rent.tsx` identically, replacing both `"buy"` literals and the component `intent` with `"sell"` / `"rent"` (and renaming the component to `SellPage` / `RentPage`).

- [ ] **Step 4: Build + headless verify the routes render and submit**

```bash
rm -rf apps/web/.next
pnpm --filter @herrera/web build
```

Then with a fresh `pnpm dev` (warm `/api/leads` with one curl first — the on-demand compile of the route can exceed 1.5s on the first POST), drive headless Chrome (playwright-core, pass `httpCredentials` for the `PREVIEW_BASIC_AUTH` gate):
- `/buy` renders the landing + first question ("When are you looking to buy?").
- Click an option → advances; step count increments; progress bar widens.
- Reach the contact step → enter only an email + check consent → "Send to Nilyan" → "Thanks — we'll be in touch shortly."
- `/sell` first question is "What is the property address?"; `/rent` first is "When do you need to move in?".

Expected: all pass; a new `leads` row + `consent_records` row are created (spot-check via `pnpm db:studio`).

- [ ] **Step 5: Run gates and commit**

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test
git add apps/web/src/components/lead/LeadLanding.tsx apps/web/src/components/lead/LeadLanding.module.css apps/web/src/pages/buy.tsx apps/web/src/pages/sell.tsx apps/web/src/pages/rent.tsx
git commit -m "feat(web): /buy /sell /rent landing routes hosting the capture flow (D7)"
```

---

## Task 7: Wire the home CTAs (hero + CaptureInvite) to the overlay

**Files:**
- Modify: `apps/web/src/components/home/Hero.tsx`
- Modify: `apps/web/src/components/home/Hero.module.css`
- Modify: `apps/web/src/components/home/CaptureInvite.tsx`

**Interfaces:**
- Consumes: `useLeadCapture` (`@/components/lead/LeadCaptureProvider`).

> **Decision (confirmed at approval — capture-prominent hero):** lead capture is the home hero's **primary** call-to-action (clients' explicit #1-priority request). The hero **leads with three prominent "I want to Buy / Sell / Rent" buttons** (small bronze "I want to" label over a large serif verb, on solid cream cards with a soft shadow) that open the branched overlay via `openCapture(intent)`. The existing **search card stays in the hero but becomes secondary**, below an "Or explore listings yourself" divider — it still works exactly as now (it's the signature `/search` entry; `HeroSearch` is **functionally untouched**). Hierarchy is created by order (capture first), the high-contrast solid serif-verb buttons, and the secondary divider framing. These are bespoke light-on-dark controls styled in `Hero.module.css` (like the existing `drawLink`/`scrollCue`), not the `Button` primitive (which is built for light surfaces). Recorded in ADR-019 (addendum), `docs/visual-direction.md` §hero, and `docs/pages.md`.

- [ ] **Step 1: Restructure the hero — capture buttons primary, search secondary**

Edit `apps/web/src/components/home/Hero.tsx`. Add the hook import (keep the existing `Link`, `Container`, `HeroSearch`, `styles` imports):

```tsx
import { useLeadCapture } from "@/components/lead/LeadCaptureProvider";
```

Add a capture list constant beside `HERO_IMAGE`:

```tsx
const CAPTURE: { intent: "buy" | "sell" | "rent"; verb: string }[] = [
  { intent: "buy", verb: "Buy" },
  { intent: "sell", verb: "Sell" },
  { intent: "rent", verb: "Rent" },
];
```

Inside `Hero()`, read the hook near the top (the component is already client-interactive via `scrollDown`, so context is fine):

```tsx
  const { openCapture } = useLeadCapture();
```

Replace the inner content (eyebrow/title/lede stay; the capture block goes **above** the search, the search becomes secondary under a divider). The new `.inner` body:

```tsx
        <div className={styles.inner}>
          <p className={styles.eyebrow}>Florida · Licensed Realtor®</p>
          <h1 className={styles.title}>Find your place in Florida.</h1>
          <p className={styles.lede}>
            Curated properties across Miami, Coral Gables, Naples and the entire coast. Buy, sell or
            rent with close, expert guidance.
          </p>

          {/* PRIMARY — lead capture (the hero's #1 action) */}
          <div className={styles.capture}>
            {CAPTURE.map((c) => (
              <button
                key={c.intent}
                type="button"
                className={styles.captureBtn}
                onClick={() => openCapture(c.intent)}
              >
                <span className={styles.captureSmall}>I want to</span>
                <span className={styles.captureVerb}>{c.verb}</span>
              </button>
            ))}
          </div>

          {/* SECONDARY — explore listings yourself (the signature /search) */}
          <div className={styles.exploreDivider}>
            <span>Or explore listings yourself</span>
          </div>
          <HeroSearch />
          <Link href="/search" className={styles.drawLink}>
            or draw your area on the map →
          </Link>
        </div>
```

- [ ] **Step 2: Style the capture-led hero (tokens, light-on-dark)**

Append to `apps/web/src/components/home/Hero.module.css`. Use the existing token variables already used in this file (`--font-sans`, `--font-serif`, `--dur-fast`, `--ease-standard`) plus the brand tokens (`--color-cream`, `--color-forest`, `--color-bronze` — confirm exact names in `apps/web/src/styles/tokens.css`):

```css
/* PRIMARY capture buttons — the hero's lead action */
.capture {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 34px;
}
.captureBtn {
  appearance: none;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  min-width: 188px;
  padding: 16px 30px;
  border: none;
  border-radius: 16px;
  background: var(--color-cream, #f5efe6);
  cursor: pointer;
  text-align: left;
  box-shadow: 0 12px 32px rgba(11, 24, 22, 0.3);
  transition:
    transform var(--dur-fast) var(--ease-standard),
    box-shadow var(--dur-fast) var(--ease-standard);
}
.captureBtn:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 44px rgba(11, 24, 22, 0.38);
}
.captureBtn:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 3px;
}
.captureSmall {
  font-family: var(--font-sans), system-ui, sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-bronze, #9a6a3a);
}
.captureVerb {
  font-family: var(--font-serif), Georgia, serif;
  font-size: 27px;
  font-weight: 500;
  line-height: 1.04;
  color: var(--color-forest, #15302c);
}
@media (prefers-reduced-motion: reduce) {
  .captureBtn {
    transition: none;
  }
  .captureBtn:hover {
    transform: none;
  }
}

/* SECONDARY — "or explore yourself" divider above the search card */
.exploreDivider {
  display: flex;
  align-items: center;
  gap: 14px;
  max-width: 540px;
  margin: 36px auto 18px;
  color: rgba(255, 255, 255, 0.8);
  font-family: var(--font-sans), system-ui, sans-serif;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.04em;
}
.exploreDivider::before,
.exploreDivider::after {
  content: "";
  flex: 1;
  height: 1px;
  background: rgba(255, 255, 255, 0.28);
}

@media (max-width: 768px) {
  .capture {
    flex-direction: column;
  }
  .captureBtn {
    width: 100%;
    min-width: 0;
    align-items: center;
    text-align: center;
  }
}
```

- [ ] **Step 3: Launch the overlay from CaptureInvite**

Rewrite `apps/web/src/components/home/CaptureInvite.tsx` so the Buy card opens the buy overlay and the Sell valuation form opens the **sell** overlay with the typed address pre-filled as the `address` answer (the seeded sell branch's first question is `address` — this is the "what's my home worth?" thin variant; it removes the old `/home-value` 404 hop). Keep all existing copy and `styles` classes; only swap the actions:

```tsx
import { useState, type FormEvent } from "react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
import { useLeadCapture } from "@/components/lead/LeadCaptureProvider";
import styles from "./CaptureInvite.module.css";

export function CaptureInvite() {
  const { openCapture } = useLeadCapture();
  const [address, setAddress] = useState("");

  function onValuation(e: FormEvent) {
    e.preventDefault();
    const a = address.trim();
    openCapture("sell", a ? { initialAnswers: { address: a } } : undefined);
  }

  return (
    <section className={styles.section}>
      <Container>
        <Reveal>
          <div className={styles.grid}>
            <div className={styles.buy}>
              <p className={styles.eyebrow}>Buy</p>
              <h2 className={styles.title}>Find your next home</h2>
              <p className={styles.text}>
                Tell us what you&apos;re looking for and we&apos;ll send a curated selection before
                it hits the market.
              </p>
              <Button variant="secondary" size="lg" onClick={() => openCapture("buy")}>
                Start my search
              </Button>
            </div>

            <div className={styles.sell}>
              <p className={styles.eyebrowLight}>Sell</p>
              <h2 className={styles.titleLight}>What&apos;s your home worth?</h2>
              <p className={styles.textLight}>
                Get a free, no-obligation valuation based on real sales in your neighborhood.
              </p>
              <form className={styles.valForm} onSubmit={onValuation}>
                <input
                  className={styles.valInput}
                  type="text"
                  aria-label="Your property address"
                  placeholder="Your property address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
                <button type="submit" className={styles.valBtn}>
                  Get a free valuation
                </button>
              </form>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
```

(`Link`/`useRouter` imports are now unused — remove them; lint will flag otherwise.)

- [ ] **Step 4: Verify the nav/footer links resolve**

No code change needed — the nav/footer Buy/Sell/Rent links (`apps/web/src/lib/nav.ts`) now point to the real `/buy /sell /rent` pages from Task 6. Confirm in headless: clicking the header "Buy" navigates to `/buy` (no 404), and the home "Start my search" opens the overlay (no navigation).

- [ ] **Step 5: Build + headless end-to-end verify**

```bash
rm -rf apps/web/.next
pnpm --filter @herrera/web build
```

Fresh `pnpm dev` (warm `/api/leads` first), then headless Chrome:
1. Home hero → the primary **"I want to Buy"** button (visually leading, **above** the search card) → buy overlay opens; Esc closes; backdrop click closes ("I want to Sell" / "I want to Rent" open their branches). The search card still renders below the "Or explore listings yourself" divider and routes to `/search` exactly as before.
2. Home → "Start my search" (CaptureInvite) → buy overlay opens.
3. Home → type an address → "Get a free valuation" → **sell** overlay opens already past the address question (first visible question is "When do you want to sell?"), and the submitted lead's `answers.address` equals the typed value.
4. Header "Buy" → navigates to `/buy` (renders the landing flow, not a 404).
5. Reduced-motion (`prefers-reduced-motion: reduce`): hero capture buttons, overlay open, and step changes are instant (no slide/fade); flow still fully usable.
6. Mobile viewport (375px): hero capture row stacks; overlay is a full-height sheet; options are large tap targets; flow completes.

- [ ] **Step 6: Run gates and commit**

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test
git add apps/web/src/components/home/Hero.tsx apps/web/src/components/home/Hero.module.css apps/web/src/components/home/CaptureInvite.tsx
git commit -m "feat(web): hero + home CTAs launch the capture overlay (sell = home-value variant) (D7)"
```

---

## Task 8: Final verification + memory update

**Files:** none (verification + docs/memory only).

- [ ] **Step 1: Full gate run**

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && rm -rf apps/web/.next && pnpm --filter @herrera/web build
```

Expected: every gate green; build clean.

- [ ] **Step 2: Compliance + quality spot-check (subagents)**

Dispatch `security-compliance-auditor` (per-channel consent stored for each provided channel; at-least-one-contact enforced server + client; no steering — questions are facts/logistics; no consumer outbound) and `ui-quality-gate` (keyboard focus through the flow, dialog semantics/Esc, contrast, reduced-motion, mobile sheet, no token drift) over the D7 diff. Fix any blocking findings (re-commit into the relevant task).

- [ ] **Step 3: Manual review handoff**

Leave the branch `feat/d7-lead-capture` un-merged. Summarize for the user: entry points wired (home overlay + `/buy /sell /rent` routes + nav/footer), the sell/home-value variant, the D8 seam location, and the `/home-value` standalone page deferred as a follow-up. **Do not merge or deploy.**

- [ ] **Step 4: Update project memory**

After the user reviews and approves merge, update `herrera-status.md`: D7 done & merged, the generalized `createLeadWithConsent` core, the `/api/questions` route, the capture overlay + landing routes, and that `/home-value` standalone remains a follow-up. Then note NEXT = D5 Florida cost panel.

---

## Self-Review

**Spec coverage:**
- Typeform one-question-per-screen, smooth transitions, progress indicator, back/next → Task 4 (`LeadCaptureFlow`, progress bar, AnimatePresence, Back/Next). ✓
- Branched by intent (distinct set per branch) → questions fetched per `intent`; seeded buy/sell/rent sets. ✓
- Questions from `qualification_questions` (read-only, not hardcoded) → `getQualificationQuestions` (Task 1) feeds API + pages. ✓
- Carolina defaults incl. timeline / financing / "also selling?" → seed already has timeline + `preapproved`; Task 1 Step 7 adds `also_selling`. ✓
- Contact last; phone and/or email, at least one, never both → contact step is the final step; `validateContact` + `qualificationLeadSchema` refine (Tasks 1, 3, 4). ✓
- On submit: lead (intent=branch) + jsonb answers + per-channel consent, by generalizing `createListingInquiry` → `createLeadWithConsent` core (Task 1). ✓
- Entry points: home hero Buy/Sell/Rent + `/buy /sell /rent` routes → **confirmed at approval (capture-prominent hero):** the hero **leads** with prominent "I want to Buy/Sell/Rent" capture buttons (Task 7 Steps 1–2), search demoted to a secondary "explore yourself" card below; plus CaptureInvite overlay launches + nav/footer routes (Tasks 6, 7). Recorded in ADR-019 addendum + visual-direction + pages.md. ✓
- Notifications = D8 seam (one line) → single comment in `createLeadWithConsent`. ✓
- Mobile-first + reduced-motion → `useReducedMotion` everywhere + mobile full-height sheet (Tasks 4, 5). ✓
- Tokens only, reuse `Button` etc., no restyling → CSS modules + tokens, reuse `Button`/`Container`/`SiteLayout`. ✓
- "What's my home worth?" magnet = thin sell variant → CaptureInvite valuation opens sell overlay with address prefilled (Task 7). ✓
- Separate from D4 per-listing inquiry → D4 untouched except the internal refactor (same behavior). ✓

**Placeholder scan:** the one deliberate placeholder is the `QuestionControl` `onChange` in Task 4 Step 1, flagged by an explicit NOTE telling the implementer to write `setAnswer(step.question.key, v)`. All other steps carry complete code.

**Type consistency:** `QualificationQuestionConfig` (`Pick<… "key"|"type"|"label"|"labelEs"|"options"|"required">`) is produced in Task 1 and consumed identically in Tasks 2–6. `Intent`/`Answers`/`Step`/`ContactInput`/`LeadPayload` defined in Task 3 and used in Tasks 4–7. `buildLeadPayload` output keys match `qualificationLeadSchema` fields (`intent`, `answers`, `name`, `email`, `phone`, `consentEmail`, `consentPhone`, `attribution`). `createLeadWithConsent` `CreateLeadInput` consumed by both `createListingInquiry` and `createQualificationLead`. ✓
</content>
</invoke>
