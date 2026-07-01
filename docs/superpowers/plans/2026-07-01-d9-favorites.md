# D9 — Favorites as a Lead-Capture Hook · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn login-less, browser-stored favorites into a lead-capture surface: a heart on every listing card + the detail page saves to `localStorage`; the first save opens a lean contact-only capture that creates a real lead via `createLeadWithConsent` (`source='favorites'`, with the saved slugs), and a `/favorites` page renders the shortlist fresh from the DB.

**Architecture:** A single `FavoritesProvider` (React context, `localStorage`-backed, SSR-safe, cross-tab synced) owns the saved-slug list and the once-per-browser capture trigger. It nests inside the existing `LeadCaptureProvider` so it can reuse `openCapture` — extended with a `contactOnly` mode that skips the qualification questions and stamps `source`/`viewedListingIds`. `/favorites` is client-rendered: it reads slugs and fetches current cards from a new read-only `POST /api/listings/by-slugs` that returns **public-only** listings. No new tables, no migration, no auth.

**Tech Stack:** Next.js Pages Router, TypeScript (strict), React 18, Drizzle ORM + PostgreSQL/PostGIS, Zod, Vitest, framer-motion (existing), CSS Modules + committed design tokens.

## Global Constraints

- **Pages Router only** — no App Router, no server components, no `"use client"`.
- **No public accounts / no auth for visitors** (login-less ADR). Favorites are **per-browser, not per-person** — the accepted v1 limitation. **Future enhancement:** real cross-device favorites via **Phase 2 passwordless accounts**; this design defers to that and adds no auth now.
- **Reuse the lead core + consent — do not duplicate.** All lead creation goes through `createLeadWithConsent` (packages/db/src/leads-create.ts) via `createQualificationLead`. Marketing opt-in (ADR-020) rides the existing flow.
- **No DB migration.** `leads.source` is free-form text; `leads.viewed_listing_ids` (jsonb `string[]`) already exists. Favorited slugs go in `viewedListingIds`.
- **IDX / Fair-Housing:** `/favorites` and `POST /api/listings/by-slugs` must show **only public listings** — filter `status='active' AND visibility='public'` (drops off-market / private-link / registered).
- **Design tokens** from `apps/web/src/styles/tokens.css` (`--color-bronze #A9794A`, `--color-forest #15302C`, `--color-paper`, `--color-ink`, `--color-stone`, `--color-border`, `--color-surface`, `--radius-*`, `--shadow-*`, `--dur-fast`/`--dur-base`, `--ease-standard`). Never ship generic theme.
- **Quality floor:** mobile-first, keyboard focus, `aria-pressed` on toggles, and **honor `prefers-reduced-motion`**.
- **Package manager pnpm.** Verify with `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` (all from repo root).
- **Branch:** all work on `feat/d9-favorites` off `main`. **One commit per task.** Do not merge or deploy.

## Refinements locked with the user

1. **Save-then-prompt ordering** — the heart flips to *saved ✓* **first**; the popup opens `~450ms` later so it never feels like it hijacks the save. The favorite persists whether or not the visitor submits the capture.
2. **Dynamic copy** — the first-save popup says **"this home"** (singular); the `/favorites` nudge says **"these homes"** when more than one is saved (and "this home" when exactly one).
3. **Trigger** — popup on the **first save only**, once per browser (dismiss = never re-nag), suppressed after the visitor submits.

## File Structure

**Create:**
- `apps/web/src/lib/favorites-store.ts` — pure state module: parse/serialize/toggle/prune + `shouldPromptCapture`. No DOM. (Task 1)
- `apps/web/src/lib/favorites-store.test.ts` — unit tests. (Task 1)
- `apps/web/src/lib/favorites.ts` — `favoritesCaptureCopy(count)` copy helper. (Task 1)
- `apps/web/src/lib/favorites.test.ts` — unit tests. (Task 1)
- `apps/web/src/lib/lead-payload.test.ts` — `buildLeadPayload` source/viewedListingIds tests. (Task 2)
- `packages/db/src/favorites-lead.test.ts` — schema tests (`qualificationLeadSchema` source allowlist, `listingsBySlugsInputSchema`). (Tasks 2 & 7)
- `apps/web/src/components/favorites/FavoritesProvider.tsx` — context + `useFavorites`. (Task 4)
- `apps/web/src/components/favorites/FavoriteButton.tsx` + `.module.css` — the heart control (card + bar variants). (Task 5)
- `apps/web/src/components/favorites/FavoritesNavButton.tsx` + `.module.css` — header heart + count badge. (Task 6)
- `apps/web/src/components/favorites/FavoritesNudge.tsx` + `.module.css` — persistent, dismissible capture nudge on `/favorites`. (Task 8)
- `apps/web/src/pages/api/listings/by-slugs.ts` — read-only public-listings-by-slug endpoint. (Task 7)
- `apps/web/src/pages/favorites.tsx` + `Favorites.module.css` — the shortlist page. (Task 8)

**Modify:**
- `packages/db/src/qualification.ts` — `qualificationLeadSchema` gains `source`; `createQualificationLead` passes it through. (Task 2)
- `apps/web/src/lib/lead-capture.ts` — `LeadSource`, `CaptureOpts`/`CaptureCopy` types; `LeadPayload` + `buildLeadPayload` gain `source`/`viewedListingIds`. (Task 2 + Task 3)
- `packages/db/src/listings-detail.ts` — add `getListingsBySlugs` + `listingsBySlugsInputSchema`. (Task 7)
- `packages/db/src/index.ts` — export the two new symbols. (Task 7)
- `apps/web/src/components/lead/LeadCaptureProvider.tsx` — `openCapture` accepts `CaptureOpts`; skip the questions fetch in `contactOnly` mode; pass new props to the flow. (Task 3)
- `apps/web/src/components/lead/LeadCaptureFlow.tsx` — accept `source`/`viewedListingIds`/`copy`/`onSubmitted`; contact-only heading + lede; call `onSubmitted` on success. (Task 3)
- `apps/web/src/components/lead/LeadCaptureFlow.module.css` — add `.lede`. (Task 3)
- `apps/web/src/pages/_app.tsx` — wrap `<Component>` in `<FavoritesProvider>` (inside `LeadCaptureProvider`). (Task 4)
- `apps/web/src/components/ui/ListingCard.tsx` — render `<FavoriteButton>` instead of the presentational heart. (Task 5)
- `apps/web/src/components/ui/ListingCard.module.css` — remove the now-unused `.fav`/`.fav:hover`. (Task 5)
- `apps/web/src/components/listing/ListingTopBar.tsx` — take a `slug` prop; replace the presentational Save with `<FavoriteButton variant="bar">`. (Task 5)
- `apps/web/src/pages/homes/[slug].tsx` — pass `slug={vm.slug}` to `<ListingTopBar>`. (Task 5)
- `apps/web/src/components/layout/Header.tsx` — render `<FavoritesNavButton>` in desktop actions + mobile nav. (Task 6)
- `apps/web/src/lib/nav.ts` — add "Saved homes" → `/favorites` to the footer "Explore" group. (Task 6)

---

### Task 1: Favorites store (pure logic) + capture copy

Pure, framework-free logic first — it carries the localStorage shape, the toggle/dedupe/cap rules, the once-per-browser prompt predicate, and the singular/plural copy. No React, no DOM.

**Files:**
- Create: `apps/web/src/lib/favorites-store.ts`
- Create: `apps/web/src/lib/favorites-store.test.ts`
- Create: `apps/web/src/lib/favorites.ts`
- Create: `apps/web/src/lib/favorites.test.ts`

**Interfaces:**
- Produces: `FavoritesState = { slugs: string[]; promptSeen: boolean; captured: boolean }`, `EMPTY_FAVORITES`, `FAVORITES_KEY`, `MAX_FAVORITES`, `parseFavorites(raw)`, `serializeFavorites(s)`, `isFavorite(s, slug)`, `addFavorite(s, slug)`, `removeFavorite(s, slug)`, `toggleFavorite(s, slug) → { state, added }`, `markPromptSeen(s)`, `markCaptured(s)`, `shouldPromptCapture({ added, promptSeen, captured })`, `pruneFavorites(s, liveSlugs)`, and `favoritesCaptureCopy(count) → { headline, sub }`.

- [ ] **Step 1: Write the failing tests**

Create `apps/web/src/lib/favorites-store.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  addFavorite,
  EMPTY_FAVORITES,
  MAX_FAVORITES,
  markCaptured,
  markPromptSeen,
  parseFavorites,
  pruneFavorites,
  removeFavorite,
  serializeFavorites,
  shouldPromptCapture,
  toggleFavorite,
} from "./favorites-store";

describe("favorites-store", () => {
  it("parses an empty/malformed blob to EMPTY", () => {
    expect(parseFavorites(null)).toEqual(EMPTY_FAVORITES);
    expect(parseFavorites("not json")).toEqual(EMPTY_FAVORITES);
    expect(parseFavorites('{"slugs":"nope"}').slugs).toEqual([]);
  });

  it("round-trips a valid state and coerces flags", () => {
    const s = { slugs: ["a", "b"], promptSeen: true, captured: false };
    expect(parseFavorites(serializeFavorites(s))).toEqual(s);
    expect(parseFavorites('{"slugs":["a"],"promptSeen":1}').promptSeen).toBe(false);
  });

  it("adds to the front, dedupes, and caps at MAX_FAVORITES", () => {
    const once = addFavorite(EMPTY_FAVORITES, "a");
    expect(once.slugs).toEqual(["a"]);
    expect(addFavorite(once, "a").slugs).toEqual(["a"]); // dedupe
    expect(addFavorite(once, "b").slugs).toEqual(["b", "a"]); // newest first
    const many = { ...EMPTY_FAVORITES, slugs: Array.from({ length: MAX_FAVORITES }, (_, i) => `s${i}`) };
    expect(addFavorite(many, "new").slugs).toHaveLength(MAX_FAVORITES);
    expect(addFavorite(many, "new").slugs[0]).toBe("new");
  });

  it("toggles and reports whether it was an add", () => {
    const add = toggleFavorite(EMPTY_FAVORITES, "a");
    expect(add.added).toBe(true);
    expect(add.state.slugs).toEqual(["a"]);
    const remove = toggleFavorite(add.state, "a");
    expect(remove.added).toBe(false);
    expect(remove.state.slugs).toEqual([]);
  });

  it("removeFavorite drops the slug", () => {
    const s = { ...EMPTY_FAVORITES, slugs: ["a", "b"] };
    expect(removeFavorite(s, "a").slugs).toEqual(["b"]);
  });

  it("shouldPromptCapture only fires on the first add, never after seen/captured", () => {
    expect(shouldPromptCapture({ added: true, promptSeen: false, captured: false })).toBe(true);
    expect(shouldPromptCapture({ added: false, promptSeen: false, captured: false })).toBe(false);
    expect(shouldPromptCapture({ added: true, promptSeen: true, captured: false })).toBe(false);
    expect(shouldPromptCapture({ added: true, promptSeen: false, captured: true })).toBe(false);
  });

  it("markPromptSeen / markCaptured set their flags", () => {
    expect(markPromptSeen(EMPTY_FAVORITES).promptSeen).toBe(true);
    expect(markCaptured(EMPTY_FAVORITES).captured).toBe(true);
  });

  it("pruneFavorites keeps only live slugs", () => {
    const s = { ...EMPTY_FAVORITES, slugs: ["a", "b", "c"] };
    expect(pruneFavorites(s, ["a", "c"]).slugs).toEqual(["a", "c"]);
    expect(pruneFavorites(s, ["a", "b", "c"])).toBe(s); // unchanged ⇒ same reference
  });
});
```

Create `apps/web/src/lib/favorites.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { favoritesCaptureCopy } from "./favorites";

describe("favoritesCaptureCopy", () => {
  it("uses the singular for 0 or 1 saved home", () => {
    expect(favoritesCaptureCopy(0).sub).toContain("this home");
    expect(favoritesCaptureCopy(1).sub).toContain("this home");
  });
  it("uses the plural for 2+ saved homes", () => {
    expect(favoritesCaptureCopy(2).sub).toContain("these homes");
    expect(favoritesCaptureCopy(9).sub).toContain("these homes");
  });
});
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `pnpm test -- favorites`
Expected: FAIL — `Cannot find module './favorites-store'` / `'./favorites'`.

> If Vitest reports **0 test files matched**, the root config isn't globbing `apps/web`. Open the root `vitest.config.ts` (or `vitest.workspace.ts`) and confirm its `test.include` covers `apps/web/src/**/*.test.ts`; add it if missing. The rest of this plan's web-side tests depend on this.

- [ ] **Step 3: Implement `favorites-store.ts`**

Create `apps/web/src/lib/favorites-store.ts`:

```ts
// Login-less, browser-stored favorites (D9). Per-BROWSER, not per-person — the accepted
// v1 limitation; Phase 2 passwordless accounts add real cross-device sync. Pure module:
// no DOM/localStorage here so it unit-tests cleanly. FavoritesProvider owns the I/O.

export const FAVORITES_KEY = "herrera:favorites:v1";
export const MAX_FAVORITES = 100;

export type FavoritesState = {
  slugs: string[]; // most-recently-saved first
  promptSeen: boolean; // the first-save capture popup has fired once (never re-nag)
  captured: boolean; // the visitor submitted the favorites lead (hide the nudge)
};

export const EMPTY_FAVORITES: FavoritesState = { slugs: [], promptSeen: false, captured: false };

/** Tolerant parse of the persisted blob — any malformed value falls back to empty. */
export function parseFavorites(raw: string | null): FavoritesState {
  if (!raw) return EMPTY_FAVORITES;
  try {
    const v = JSON.parse(raw) as Partial<FavoritesState>;
    const slugs = Array.isArray(v.slugs)
      ? v.slugs.filter((s): s is string => typeof s === "string").slice(0, MAX_FAVORITES)
      : [];
    return { slugs, promptSeen: v.promptSeen === true, captured: v.captured === true };
  } catch {
    return EMPTY_FAVORITES;
  }
}

export function serializeFavorites(s: FavoritesState): string {
  return JSON.stringify(s);
}

export function isFavorite(s: FavoritesState, slug: string): boolean {
  return s.slugs.includes(slug);
}

/** Add to the front (most-recent first), dedupe, cap at MAX_FAVORITES. */
export function addFavorite(s: FavoritesState, slug: string): FavoritesState {
  if (s.slugs.includes(slug)) return s;
  return { ...s, slugs: [slug, ...s.slugs].slice(0, MAX_FAVORITES) };
}

export function removeFavorite(s: FavoritesState, slug: string): FavoritesState {
  if (!s.slugs.includes(slug)) return s;
  return { ...s, slugs: s.slugs.filter((x) => x !== slug) };
}

/** Toggle; report whether this was an add (drives the first-save prompt). */
export function toggleFavorite(
  s: FavoritesState,
  slug: string,
): { state: FavoritesState; added: boolean } {
  if (s.slugs.includes(slug)) return { state: removeFavorite(s, slug), added: false };
  return { state: addFavorite(s, slug), added: true };
}

export function markPromptSeen(s: FavoritesState): FavoritesState {
  return s.promptSeen ? s : { ...s, promptSeen: true };
}

export function markCaptured(s: FavoritesState): FavoritesState {
  return s.captured ? s : { ...s, captured: true };
}

/** Fire the capture popup once, on the first save, and never again (or after capture). */
export function shouldPromptCapture(args: {
  added: boolean;
  promptSeen: boolean;
  captured: boolean;
}): boolean {
  return args.added && !args.promptSeen && !args.captured;
}

/** Drop slugs the DB no longer returns as public (off-market/deleted) — keeps storage clean. */
export function pruneFavorites(s: FavoritesState, liveSlugs: string[]): FavoritesState {
  const live = new Set(liveSlugs);
  const slugs = s.slugs.filter((x) => live.has(x));
  return slugs.length === s.slugs.length ? s : { ...s, slugs };
}
```

- [ ] **Step 4: Implement `favorites.ts`**

Create `apps/web/src/lib/favorites.ts`:

```ts
// Copy for the favorites capture (popup on first save, and the /favorites nudge). Singular
// on the first save ("this home"); plural once several are saved ("these homes"). See D9 plan.
export function favoritesCaptureCopy(count: number): { headline: string; sub: string } {
  const noun = count <= 1 ? "this home" : "these homes";
  return {
    headline: "Get alerts on your saved homes",
    sub: `Want Nilyan to alert you about ${noun} — price drops and new listings like them? Leave your details and she'll take it from here.`,
  };
}
```

- [ ] **Step 5: Run the tests to confirm they pass**

Run: `pnpm test -- favorites`
Expected: PASS (all cases above). Confirm the reported test count increased.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/favorites-store.ts apps/web/src/lib/favorites-store.test.ts \
        apps/web/src/lib/favorites.ts apps/web/src/lib/favorites.test.ts
git commit -m "feat(favorites): pure favorites store + capture copy helper"
```

---

### Task 2: Thread `source` + `viewedListingIds` through the lead core

The lead core already accepts `source` and `viewedListingIds`; the qualification path just hardcodes `source='qualification_flow'` and the client payload never sends them. Add an allowlisted `source` to the schema, pass it through, and let `buildLeadPayload` carry both. No DB migration.

**Files:**
- Modify: `packages/db/src/qualification.ts:12-28` (schema) and `:36-54` (`createQualificationLead`)
- Modify: `apps/web/src/lib/lead-capture.ts:3` (types), `:55-65` (`LeadPayload`), `:68-88` (`buildLeadPayload`)
- Create: `packages/db/src/favorites-lead.test.ts`
- Create: `apps/web/src/lib/lead-payload.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `LeadSource = "qualification_flow" | "favorites"` (client, in `lead-capture.ts`); `qualificationLeadSchema` accepts optional `source` from the same allowlist; `buildLeadPayload(args)` accepts optional `source` and `viewedListingIds` and includes them in the returned `LeadPayload` when present. Task 3 relies on `buildLeadPayload` carrying these; Task 5/8's capture calls rely on `source: "favorites"` being accepted server-side.

- [ ] **Step 1: Write the failing schema tests**

Create `packages/db/src/favorites-lead.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { qualificationLeadSchema } from "./qualification";

describe("qualificationLeadSchema — source allowlist (D9)", () => {
  it("accepts source='favorites' with viewedListingIds", () => {
    const parsed = qualificationLeadSchema.parse({
      intent: "buy",
      email: "a@b.com",
      source: "favorites",
      viewedListingIds: ["123-main-st", "9-ocean-dr"],
    });
    expect(parsed.source).toBe("favorites");
    expect(parsed.viewedListingIds).toEqual(["123-main-st", "9-ocean-dr"]);
  });

  it("accepts source='qualification_flow'", () => {
    expect(
      qualificationLeadSchema.parse({ intent: "buy", email: "a@b.com", source: "qualification_flow" })
        .source,
    ).toBe("qualification_flow");
  });

  it("parses fine with no source (stays optional)", () => {
    expect(qualificationLeadSchema.safeParse({ intent: "buy", email: "a@b.com" }).success).toBe(true);
  });

  it("rejects an arbitrary source string", () => {
    expect(
      qualificationLeadSchema.safeParse({ intent: "buy", email: "a@b.com", source: "zillow" }).success,
    ).toBe(false);
  });
});
```

Create `apps/web/src/lib/lead-payload.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildLeadPayload } from "./lead-capture";

const base = {
  intent: "buy" as const,
  answers: {},
  contact: { email: "a@b.com", consent: true },
  landingPath: "/favorites",
};

describe("buildLeadPayload — source + viewedListingIds (D9)", () => {
  it("includes source and viewedListingIds when provided", () => {
    const p = buildLeadPayload({ ...base, source: "favorites", viewedListingIds: ["x", "y"] });
    expect(p.source).toBe("favorites");
    expect(p.viewedListingIds).toEqual(["x", "y"]);
  });

  it("omits them when not provided (unchanged for the normal flow)", () => {
    const p = buildLeadPayload({ intent: "buy", answers: {}, contact: { email: "a@b.com", consent: true }, landingPath: "/buy" });
    expect(p.source).toBeUndefined();
    expect(p.viewedListingIds).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `pnpm test -- favorites-lead lead-payload`
Expected: FAIL — schema rejects `source` (unknown key is stripped, so `parsed.source` is `undefined` not `"favorites"`), and `buildLeadPayload` has no `source` param.

- [ ] **Step 3: Add `source` to the qualification schema + pass it through**

In `packages/db/src/qualification.ts`, add the `source` field to the object (right after `viewedListingIds`):

```ts
    attribution: attributionSchema.optional(),
    viewedListingIds: z.array(z.string()).optional(),
    // ADR-007 + D9 — capture source, allowlisted so the client can only pick a known value.
    source: z.enum(["qualification_flow", "favorites"]).optional(),
```

Then in `createQualificationLead`, replace the hardcoded source:

```ts
    source: input.source ?? "qualification_flow",
```

- [ ] **Step 4: Extend the client payload types + builder**

In `apps/web/src/lib/lead-capture.ts`, add the `LeadSource` type near the top (after `export type Answers`):

```ts
export type LeadSource = "qualification_flow" | "favorites";
```

Extend `LeadPayload` (add two optional fields):

```ts
export type LeadPayload = {
  intent: Intent;
  answers: Answers;
  name?: string;
  email?: string;
  phone?: string;
  consentEmail: boolean;
  consentPhone: boolean;
  consentMarketing: boolean;
  attribution: { landingPath: string };
  source?: LeadSource;
  viewedListingIds?: string[];
};
```

Extend `buildLeadPayload` — add the two optional args and include them only when present:

```ts
export function buildLeadPayload(args: {
  intent: Intent;
  answers: Answers;
  contact: ContactInput;
  landingPath: string;
  source?: LeadSource;
  viewedListingIds?: string[];
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
    consentMarketing: Boolean(args.contact.marketing),
    attribution: { landingPath: args.landingPath },
    ...(args.source ? { source: args.source } : {}),
    ...(args.viewedListingIds && args.viewedListingIds.length
      ? { viewedListingIds: args.viewedListingIds }
      : {}),
  };
}
```

- [ ] **Step 5: Run the tests to confirm they pass + typecheck**

Run: `pnpm test -- favorites-lead lead-payload`
Expected: PASS.
Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add packages/db/src/qualification.ts packages/db/src/favorites-lead.test.ts \
        apps/web/src/lib/lead-capture.ts apps/web/src/lib/lead-payload.test.ts
git commit -m "feat(leads): allowlist 'favorites' source + carry source/viewedListingIds through the payload"
```

---

### Task 3: Contact-only mode for the capture overlay

Extend the existing overlay so it can open a lean **contact-only** capture (no qualification questions), stamped with a `source`, `viewedListingIds`, and favorites-specific copy, and notify the caller on successful submit. This is the machinery the favorites trigger drives — build it before wiring the provider (Task 4).

**Files:**
- Modify: `apps/web/src/lib/lead-capture.ts` (add `CaptureCopy` + `CaptureOpts` types)
- Modify: `apps/web/src/components/lead/LeadCaptureProvider.tsx`
- Modify: `apps/web/src/components/lead/LeadCaptureFlow.tsx`
- Modify: `apps/web/src/components/lead/LeadCaptureFlow.module.css`

**Interfaces:**
- Consumes: `LeadSource`, `buildLeadPayload` (Task 2).
- Produces: `CaptureCopy = { headline: string; sub: string }`; `CaptureOpts = { initialAnswers?, source?, viewedListingIds?, contactOnly?, copy?, onSubmitted? }`; `useLeadCapture().openCapture(intent, opts?: CaptureOpts)`. Task 4 calls `openCapture("buy", { contactOnly: true, source: "favorites", viewedListingIds, copy, onSubmitted })`.

- [ ] **Step 1: Add the option types**

In `apps/web/src/lib/lead-capture.ts`, append:

```ts
export type CaptureCopy = { headline: string; sub: string };

// Options for opening the capture overlay. Without them it's the classic Buy/Sell/Rent
// typeform; with `contactOnly` it skips the questions and goes straight to contact (D9 favorites).
export type CaptureOpts = {
  initialAnswers?: Answers;
  source?: LeadSource;
  viewedListingIds?: string[];
  contactOnly?: boolean;
  copy?: CaptureCopy;
  onSubmitted?: () => void;
};
```

- [ ] **Step 2: Extend the provider's `openCapture` + skip the fetch in contact-only mode**

In `apps/web/src/components/lead/LeadCaptureProvider.tsx`:

Update the imports from `@/lib/lead-capture`:

```ts
import type { Answers, CaptureOpts, Intent } from "@/lib/lead-capture";
```

Change the context type:

```ts
type Ctx = { openCapture: (intent: Intent, opts?: CaptureOpts) => void };
```

Add state for the options (next to `initialAnswers`):

```ts
  const [captureOpts, setCaptureOpts] = useState<CaptureOpts>({});
```

Replace `openCapture`:

```ts
  const openCapture = useCallback<Ctx["openCapture"]>((i, opts = {}) => {
    setIntent(i);
    setInitialAnswers(opts.initialAnswers ?? {});
    setCaptureOpts(opts);
    // Contact-only skips the /api/questions round-trip entirely — go straight to ready.
    setLoaded(opts.contactOnly ? { state: "ready", questions: [] } : { state: "loading" });
  }, []);
```

Guard the fetch effect so it doesn't run in contact-only mode. Make exactly two edits to the existing `useEffect` that fetches `/api/questions`:

1. Change its first line from `if (!intent) return;` to:

```ts
    if (!intent || captureOpts.contactOnly) return;
```

2. Change its dependency array from `[intent]` to:

```ts
  }, [intent, captureOpts.contactOnly]);
```

(The rest of the effect body — the `fetch`, the `.then`/`.catch`, and the `alive` cleanup — is unchanged.)

Pass the new props to the flow (replace the existing `<LeadCaptureFlow .../>`):

```tsx
              {loaded.state === "ready" && (
                <LeadCaptureFlow
                  intent={intent}
                  questions={loaded.questions}
                  initialAnswers={initialAnswers}
                  landingPath={captureOpts.source === "favorites" ? "/favorites" : `/${intent}`}
                  source={captureOpts.source}
                  viewedListingIds={captureOpts.viewedListingIds}
                  copy={captureOpts.copy}
                  onSubmitted={captureOpts.onSubmitted}
                  onClose={close}
                />
              )}
```

- [ ] **Step 3: Extend the flow — carry source/viewedListingIds, favorites copy, success callback**

In `apps/web/src/components/lead/LeadCaptureFlow.tsx`:

Add to the imports from `@/lib/lead-capture`: `type CaptureCopy`, `type LeadSource`.

Extend the component props:

```tsx
export function LeadCaptureFlow({
  intent,
  questions,
  initialAnswers = {},
  landingPath,
  source,
  viewedListingIds,
  copy,
  onSubmitted,
  onClose,
}: {
  intent: Intent;
  questions: QualificationQuestionConfig[];
  initialAnswers?: Answers;
  landingPath: string;
  source?: LeadSource;
  viewedListingIds?: string[];
  copy?: CaptureCopy;
  onSubmitted?: () => void;
  onClose?: () => void;
}) {
```

Add a `contactOnly` derived flag right after `const step = steps[i]!;`:

```tsx
  const contactOnly = steps.length === 1 && step.kind === "contact";
```

In `submit()`, pass `source`/`viewedListingIds` to the payload and fire `onSubmitted` on success:

```ts
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          buildLeadPayload({ intent, answers, contact, landingPath, source, viewedListingIds }),
        ),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("done");
      onSubmitted?.();
```

Hide the progress bar + step counter in contact-only mode — wrap them:

```tsx
      {!contactOnly && (
        <>
          <div className={styles.progressTrack} aria-hidden="true">
            <div
              className={styles.progressBar}
              style={{ width: `${progressPct(i, steps.length)}%` }}
            />
          </div>
          <p className={styles.stepCount}>
            {HEADLINE[intent]} · step {i + 1} of {steps.length}
          </p>
        </>
      )}
```

In the contact `<form>`, swap the hardcoded heading for the copy-aware version and add the lede (replace the `<h2 className={styles.q}>How should Nilyan reach you?</h2>` line):

```tsx
              <h2 className={styles.q}>{copy ? copy.headline : "How should Nilyan reach you?"}</h2>
              {copy && <p className={styles.lede}>{copy.sub}</p>}
```

- [ ] **Step 4: Add the `.lede` style**

In `apps/web/src/components/lead/LeadCaptureFlow.module.css`, add:

```css
.lede {
  margin: 6px 0 14px;
  font-size: 15px;
  line-height: 1.5;
  color: var(--color-stone);
}
```

- [ ] **Step 5: Verify it compiles**

Run: `pnpm typecheck`
Expected: no errors. (No unit test — this is overlay UI; it's exercised end-to-end after Task 4.)

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/lead-capture.ts apps/web/src/components/lead/LeadCaptureProvider.tsx \
        apps/web/src/components/lead/LeadCaptureFlow.tsx apps/web/src/components/lead/LeadCaptureFlow.module.css
git commit -m "feat(lead-capture): contact-only overlay mode with source, viewed listings + custom copy"
```

---

### Task 4: FavoritesProvider + useFavorites (mount, sync, first-save trigger)

The context that owns the saved-slug list, persists to `localStorage`, syncs across tabs, and fires the once-per-browser capture on the first save — **after** the heart paints (Refinement 1).

**Files:**
- Create: `apps/web/src/components/favorites/FavoritesProvider.tsx`
- Modify: `apps/web/src/pages/_app.tsx`

**Interfaces:**
- Consumes: the favorites-store functions (Task 1); `favoritesCaptureCopy` (Task 1); `useLeadCapture().openCapture` with `CaptureOpts` (Task 3).
- Produces: `useFavorites() → { slugs, count, ready, captured, isFavorite(slug), toggle(slug), remove(slug), prune(liveSlugs), openFavoritesCapture() }`. Tasks 5, 6, 8 consume this.

- [ ] **Step 1: Implement the provider**

Create `apps/web/src/components/favorites/FavoritesProvider.tsx`:

```tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLeadCapture } from "@/components/lead/LeadCaptureProvider";
import { favoritesCaptureCopy } from "@/lib/favorites";
import {
  EMPTY_FAVORITES,
  FAVORITES_KEY,
  isFavorite as isFav,
  markCaptured,
  markPromptSeen,
  parseFavorites,
  pruneFavorites,
  removeFavorite,
  serializeFavorites,
  shouldPromptCapture,
  toggleFavorite,
  type FavoritesState,
} from "@/lib/favorites-store";

// Let the heart render "saved ✓" before the capture popup opens, so it never feels like the
// popup hijacks the save (D9 Refinement 1).
const PROMPT_DELAY_MS = 450;

type Ctx = {
  slugs: string[];
  count: number;
  ready: boolean; // true after localStorage hydration (SSR renders empty)
  captured: boolean;
  isFavorite: (slug: string) => boolean;
  toggle: (slug: string) => void;
  remove: (slug: string) => void;
  prune: (liveSlugs: string[]) => void;
  openFavoritesCapture: () => void;
};

const FavoritesContext = createContext<Ctx | null>(null);

export function useFavorites(): Ctx {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used inside <FavoritesProvider>");
  return ctx;
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { openCapture } = useLeadCapture();
  const [state, setState] = useState<FavoritesState>(EMPTY_FAVORITES);
  const [ready, setReady] = useState(false);
  const stateRef = useRef(state);

  // Write-through: update memory, the ref (so event handlers read the latest), and storage.
  const commit = useCallback((next: FavoritesState) => {
    stateRef.current = next;
    setState(next);
    try {
      window.localStorage.setItem(FAVORITES_KEY, serializeFavorites(next));
    } catch {
      /* private mode / storage disabled — favorites are best-effort */
    }
  }, []);

  // Hydrate AFTER mount (SSR + first client render stay empty ⇒ no hydration mismatch).
  useEffect(() => {
    const initial = parseFavorites(window.localStorage.getItem(FAVORITES_KEY));
    stateRef.current = initial;
    setState(initial);
    setReady(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key !== FAVORITES_KEY) return;
      const next = parseFavorites(e.newValue);
      stateRef.current = next;
      setState(next); // cross-tab sync (does NOT re-fire the capture)
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const markCapturedNow = useCallback(() => commit(markCaptured(stateRef.current)), [commit]);

  const openFavoritesCapture = useCallback(() => {
    const s = stateRef.current;
    openCapture("buy", {
      contactOnly: true,
      source: "favorites",
      viewedListingIds: s.slugs,
      copy: favoritesCaptureCopy(s.slugs.length),
      onSubmitted: markCapturedNow,
    });
  }, [openCapture, markCapturedNow]);

  const toggle = useCallback(
    (slug: string) => {
      const prev = stateRef.current;
      const { state: base, added } = toggleFavorite(prev, slug);
      const doPrompt = shouldPromptCapture({
        added,
        promptSeen: prev.promptSeen,
        captured: prev.captured,
      });
      const next = doPrompt ? markPromptSeen(base) : base;
      commit(next); // heart flips to saved NOW
      if (doPrompt) {
        window.setTimeout(() => {
          openCapture("buy", {
            contactOnly: true,
            source: "favorites",
            viewedListingIds: next.slugs,
            copy: favoritesCaptureCopy(1), // first save ⇒ "this home"
            onSubmitted: markCapturedNow,
          });
        }, PROMPT_DELAY_MS);
      }
    },
    [commit, openCapture, markCapturedNow],
  );

  const remove = useCallback((slug: string) => commit(removeFavorite(stateRef.current, slug)), [commit]);
  const prune = useCallback((live: string[]) => commit(pruneFavorites(stateRef.current, live)), [commit]);

  const value = useMemo<Ctx>(
    () => ({
      slugs: state.slugs,
      count: state.slugs.length,
      ready,
      captured: state.captured,
      isFavorite: (slug) => isFav(state, slug),
      toggle,
      remove,
      prune,
      openFavoritesCapture,
    }),
    [state, ready, toggle, remove, prune, openFavoritesCapture],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}
```

- [ ] **Step 2: Mount it in `_app.tsx` (inside LeadCaptureProvider)**

In `apps/web/src/pages/_app.tsx`, add the import:

```tsx
import { FavoritesProvider } from "@/components/favorites/FavoritesProvider";
```

Wrap `<Component>` — it must be **inside** `LeadCaptureProvider` (it calls `useLeadCapture`):

```tsx
      <LeadCaptureProvider>
        <FavoritesProvider>
          <Component {...pageProps} />
        </FavoritesProvider>
      </LeadCaptureProvider>
```

- [ ] **Step 3: Verify it compiles**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 4: Manual browser check (per the "verify client bugs in a real browser" rule)**

Run `pnpm dev`. In the browser console on any page:

```js
localStorage.getItem("herrera:favorites:v1")
```

There's no visible control yet (Task 5 adds it), so drive the context via a temporary check: confirm the app builds and renders with no console errors and no hydration warning. (Full interaction is verified at the end of Task 5.)

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/favorites/FavoritesProvider.tsx apps/web/src/pages/_app.tsx
git commit -m "feat(favorites): FavoritesProvider — localStorage state, cross-tab sync, first-save capture trigger"
```

---

### Task 5: FavoriteButton + wire the card & detail-page hearts

One heart component, two variants, driven by `useFavorites`. Replace the two presentational stubs.

**Files:**
- Create: `apps/web/src/components/favorites/FavoriteButton.tsx`
- Create: `apps/web/src/components/favorites/FavoriteButton.module.css`
- Modify: `apps/web/src/components/ui/ListingCard.tsx`
- Modify: `apps/web/src/components/ui/ListingCard.module.css`
- Modify: `apps/web/src/components/listing/ListingTopBar.tsx`
- Modify: `apps/web/src/pages/homes/[slug].tsx`

**Interfaces:**
- Consumes: `useFavorites` (Task 4).
- Produces: `<FavoriteButton slug={string} variant?: "card" | "bar" />`.

- [ ] **Step 1: Implement FavoriteButton**

Create `apps/web/src/components/favorites/FavoriteButton.tsx`:

```tsx
import type { MouseEvent } from "react";
import { useFavorites } from "./FavoritesProvider";
import styles from "./FavoriteButton.module.css";

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M12 20.7 4.6 13a4.6 4.6 0 0 1 6.5-6.5l.9.9.9-.9A4.6 4.6 0 1 1 19.4 13L12 20.7Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function FavoriteButton({
  slug,
  variant = "card",
}: {
  slug: string;
  variant?: "card" | "bar";
}) {
  const { isFavorite, toggle } = useFavorites();
  const saved = isFavorite(slug);
  const onClick = (e: MouseEvent) => {
    e.preventDefault(); // the card is a <Link> — don't navigate
    e.stopPropagation();
    toggle(slug);
  };
  const label = saved ? "Remove from saved homes" : "Save this home";

  if (variant === "bar") {
    return (
      <button
        type="button"
        className={`${styles.bar} ${saved ? styles.barSaved : ""}`}
        aria-pressed={saved}
        aria-label={label}
        onClick={onClick}
      >
        <Heart filled={saved} /> {saved ? "Saved" : "Save"}
      </button>
    );
  }
  return (
    <button
      type="button"
      className={`${styles.card} ${saved ? styles.cardSaved : ""}`}
      aria-pressed={saved}
      aria-label={label}
      onClick={onClick}
    >
      <Heart filled={saved} />
    </button>
  );
}
```

- [ ] **Step 2: Style it (both variants, reduced-motion)**

Create `apps/web/src/components/favorites/FavoriteButton.module.css`:

```css
/* card variant — the circular heart overlaid top-right on a listing photo
   (moved here from ListingCard.module.css .fav, plus a saved state). */
.card {
  position: absolute;
  right: 12px;
  top: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  color: var(--color-ink-soft);
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(11, 24, 22, 0.18);
  transition:
    color var(--dur-fast) var(--ease-standard),
    background-color var(--dur-fast) var(--ease-standard),
    transform var(--dur-fast) var(--ease-standard);
}
.card:hover {
  color: var(--color-bronze);
  background: #fff;
}
.cardSaved {
  color: var(--color-bronze);
  background: #fff;
}
.card:active {
  transform: scale(0.9);
}

/* bar variant — the "Save / Saved" pill in the listing detail top bar. Mirrors the
   existing .action look; saved state goes bronze. */
.bar {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-ink);
  font-family: var(--font-sans), system-ui, sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition:
    color var(--dur-fast) var(--ease-standard),
    border-color var(--dur-fast) var(--ease-standard);
}
.bar:hover {
  color: var(--color-bronze);
  border-color: var(--color-bronze);
}
.barSaved {
  color: var(--color-bronze);
  border-color: var(--color-bronze);
}

@media (prefers-reduced-motion: reduce) {
  .card,
  .bar {
    transition: none;
  }
  .card:active {
    transform: none;
  }
}
```

> Check `--color-ink-soft` exists in `apps/web/src/styles/tokens.css` (the current `.fav` uses it). If it doesn't, use `var(--color-stone)`.

- [ ] **Step 3: Wire ListingCard**

In `apps/web/src/components/ui/ListingCard.tsx`: remove the `HeartIcon` function, the `onFav` handler, and the `import type { MouseEvent }` line; add `import { FavoriteButton } from "@/components/favorites/FavoriteButton";`. Replace the presentational button:

```tsx
        {listing.isNew && <span className={styles.badge}>NEW</span>}
        <FavoriteButton slug={listing.slug} />
```

In `apps/web/src/components/ui/ListingCard.module.css`, delete the `.fav` and `.fav:hover` rules (now owned by `FavoriteButton.module.css`).

- [ ] **Step 4: Wire the detail-page Save**

In `apps/web/src/components/listing/ListingTopBar.tsx`: add a `slug` prop, drop the `saved` state + the presentational Save button, and render the bar variant. Result:

```tsx
import { useState } from "react";
import Link from "next/link";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";
import styles from "./ListingTopBar.module.css";

export function ListingTopBar({ title, slug }: { title: string; slug: string }) {
  const [copied, setCopied] = useState(false);

  async function onShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* user dismissed / unsupported — no-op */
    }
  }

  return (
    <div className={styles.bar}>
      <Link href="/search" className={styles.back}>
        <span aria-hidden>‹</span> Back to results
      </Link>
      <span className={styles.crumb}>{title}</span>
      <div className={styles.actions}>
        <button type="button" className={styles.action} onClick={onShare}>
          {copied ? "Link copied" : "Share"}
        </button>
        <FavoriteButton slug={slug} variant="bar" />
      </div>
    </div>
  );
}
```

In `apps/web/src/pages/homes/[slug].tsx`, pass the slug (find the `<ListingTopBar` usage, ~line 89):

```tsx
        <ListingTopBar title={vm.title} slug={vm.slug} />
```

> Match the existing `title` prop expression already used there; only add `slug={vm.slug}`.

- [ ] **Step 5: Verify — typecheck + browser**

Run: `pnpm typecheck` — expected: no errors.
Run `pnpm dev` and check in a real browser (Chromium):
1. On `/search` and `/` (featured), click a card's heart — it does **not** navigate, flips to a filled bronze heart, and `~450ms` later the contact-only popup opens headlined "Get alerts on your saved homes" / "…about **this home**…".
2. Dismiss the popup (× or Esc). The heart stays saved. Save a second card — **no** popup this time.
3. Reload the page — saved hearts persist. Open a saved listing's detail page — its top-bar Save shows **Saved**; the same card's heart elsewhere is filled (shared state).
4. Submit the popup with an email + consent → "Thanks — we'll be in touch shortly."

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/favorites/FavoriteButton.tsx apps/web/src/components/favorites/FavoriteButton.module.css \
        apps/web/src/components/ui/ListingCard.tsx apps/web/src/components/ui/ListingCard.module.css \
        apps/web/src/components/listing/ListingTopBar.tsx apps/web/src/pages/homes/[slug].tsx
git commit -m "feat(favorites): real heart control on listing cards + detail page"
```

---

### Task 6: Header heart + live count badge

A heart in the header that links to `/favorites` and shows the saved count.

**Files:**
- Create: `apps/web/src/components/favorites/FavoritesNavButton.tsx`
- Create: `apps/web/src/components/favorites/FavoritesNavButton.module.css`
- Modify: `apps/web/src/components/layout/Header.tsx`
- Modify: `apps/web/src/lib/nav.ts`

**Interfaces:**
- Consumes: `useFavorites` (Task 4).
- Produces: `<FavoritesNavButton />`.

- [ ] **Step 1: Implement the nav button**

Create `apps/web/src/components/favorites/FavoritesNavButton.tsx`:

```tsx
import Link from "next/link";
import { useFavorites } from "@/components/favorites/FavoritesProvider";
import styles from "./FavoritesNavButton.module.css";

export function FavoritesNavButton() {
  const { count, ready } = useFavorites();
  const showCount = ready && count > 0;
  return (
    <Link
      href="/favorites"
      className={styles.link}
      aria-label={showCount ? `Saved homes (${count})` : "Saved homes"}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          d="M12 20.7 4.6 13a4.6 4.6 0 0 1 6.5-6.5l.9.9.9-.9A4.6 4.6 0 1 1 19.4 13L12 20.7Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
      </svg>
      {showCount && <span className={styles.badge}>{count}</span>}
    </Link>
  );
}
```

- [ ] **Step 2: Style it**

Create `apps/web/src/components/favorites/FavoritesNavButton.module.css`:

```css
.link {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  color: inherit; /* inherits the header's over-hero white / scrolled-forest state */
  border-radius: 50%;
  transition: color var(--dur-fast) var(--ease-standard);
}
.link:hover {
  color: var(--color-bronze);
}
.badge {
  position: absolute;
  top: -2px;
  right: -2px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bronze);
  color: #fff;
  font-family: var(--font-sans), system-ui, sans-serif;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  border-radius: 9999px;
}
```

- [ ] **Step 3: Place it in the Header (desktop + mobile)**

In `apps/web/src/components/layout/Header.tsx`, add the import:

```tsx
import { FavoritesNavButton } from "@/components/favorites/FavoritesNavButton";
```

In the desktop `.actions` block, add it before `<LangToggle />`:

```tsx
          <div className={styles.actions}>
            <FavoritesNavButton />
            <LangToggle />
```

In the mobile nav (`#mobile-nav`), add a text link before the phone link:

```tsx
          <Link href="/favorites" className={styles.mobileLink} onClick={() => setOpen(false)}>
            Saved homes
          </Link>
```

- [ ] **Step 4: Add the footer link**

In `apps/web/src/lib/nav.ts`, add to the "Explore" group's `items`:

```ts
      { label: "Saved homes", href: "/favorites" },
```

- [ ] **Step 5: Verify — typecheck + browser**

Run: `pnpm typecheck` — no errors.
Browser: the header heart shows no badge at 0; saving a listing bumps the badge live; clicking it routes to `/favorites`; it's keyboard-focusable and legible both transparent-over-hero (home) and solid (scrolled / inner pages).

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/favorites/FavoritesNavButton.tsx apps/web/src/components/favorites/FavoritesNavButton.module.css \
        apps/web/src/components/layout/Header.tsx apps/web/src/lib/nav.ts
git commit -m "feat(favorites): header heart with live saved-count badge"
```

---

### Task 7: `getListingsBySlugs` + `POST /api/listings/by-slugs`

Read-only endpoint that returns **public** listing cards for a set of slugs, so `/favorites` always renders fresh DB data (price drops etc.).

**Files:**
- Modify: `packages/db/src/listings-detail.ts`
- Modify: `packages/db/src/index.ts`
- Create: `apps/web/src/pages/api/listings/by-slugs.ts`
- Modify: `packages/db/src/favorites-lead.test.ts` (add the input-schema cases)

**Interfaces:**
- Consumes: `toListingCardVM` (`apps/web/src/lib/listing.ts`).
- Produces: `getListingsBySlugs(slugs: string[]): Promise<Listing[]>` (public+active only); `listingsBySlugsInputSchema` (`{ slugs: string[] }`, ≤100); `POST /api/listings/by-slugs` → `{ listings: ListingCardVM[] }`. Task 8 consumes the endpoint.

- [ ] **Step 1: Write the failing schema tests**

Append to `packages/db/src/favorites-lead.test.ts`:

```ts
import { listingsBySlugsInputSchema } from "./listings-detail";

describe("listingsBySlugsInputSchema (D9)", () => {
  it("accepts a valid slug array", () => {
    expect(listingsBySlugsInputSchema.parse({ slugs: ["a", "b"] }).slugs).toEqual(["a", "b"]);
  });
  it("defaults to an empty array when omitted", () => {
    expect(listingsBySlugsInputSchema.parse({}).slugs).toEqual([]);
  });
  it("rejects more than 100 slugs", () => {
    const many = Array.from({ length: 101 }, (_, i) => `s${i}`);
    expect(listingsBySlugsInputSchema.safeParse({ slugs: many }).success).toBe(false);
  });
  it("rejects non-string entries", () => {
    expect(listingsBySlugsInputSchema.safeParse({ slugs: [1, 2] }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run to confirm they fail**

Run: `pnpm test -- favorites-lead`
Expected: FAIL — `listingsBySlugsInputSchema` not exported.

- [ ] **Step 3: Add the query + schema**

In `packages/db/src/listings-detail.ts`: ensure the imports include `inArray` and `z`. The top of the file currently imports from `drizzle-orm` (e.g. `and, eq, ne, sql`) — add `inArray`. Add `import { z } from "zod";` if not present. Then append:

```ts
/** Public+active listings for a set of slugs (D9 favorites). Order is NOT guaranteed —
 * the client re-orders to its saved order. Empty input short-circuits to no query. */
export async function getListingsBySlugs(slugs: string[]): Promise<Listing[]> {
  if (slugs.length === 0) return [];
  return getDb()
    .select()
    .from(listings)
    .where(
      and(
        eq(listings.status, "active"),
        eq(listings.visibility, "public"),
        inArray(listings.slug, slugs),
      ),
    );
}

/** Request body for POST /api/listings/by-slugs — bounded so a tampered client can't ask for the world. */
export const listingsBySlugsInputSchema = z.object({
  slugs: z.array(z.string().min(1).max(160)).max(100).default([]),
});
```

- [ ] **Step 4: Export from the package barrel**

In `packages/db/src/index.ts`, add `getListingsBySlugs` and `listingsBySlugsInputSchema` to the existing export from `./listings-detail` (match the file's export style — e.g. `export { getListingBySlug, getSimilarListings, getPublishedListingSlugs, getListingsBySlugs, listingsBySlugsInputSchema } from "./listings-detail";`).

- [ ] **Step 5: Create the API route**

Create `apps/web/src/pages/api/listings/by-slugs.ts`:

```ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getListingsBySlugs, listingsBySlugsInputSchema } from "@herrera/db";
import { toListingCardVM } from "@/lib/listing";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const parsed = listingsBySlugsInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", issues: parsed.error.flatten() });
    return;
  }
  try {
    const rows = await getListingsBySlugs(parsed.data.slugs);
    res.status(200).json({ listings: rows.map(toListingCardVM) });
  } catch (e) {
    console.error("[api/listings/by-slugs] failed:", (e as Error).message);
    res.status(500).json({ error: "Could not load saved homes" });
  }
}
```

- [ ] **Step 6: Run tests + typecheck**

Run: `pnpm test -- favorites-lead` — expected: PASS.
Run: `pnpm typecheck` — no errors.

- [ ] **Step 7: Manual endpoint check (dev + DB)**

With `pnpm dev` running and a real seeded slug (grab one from `/search`):

```bash
curl -s -X POST http://localhost:3000/api/listings/by-slugs \
  -H 'content-type: application/json' \
  -d '{"slugs":["PASTE-A-REAL-SLUG"]}' | head -c 400
```

Expected: `{"listings":[{"slug":"…","priceLabel":"$…", …}]}`. Confirm a **non-public** slug (an off-market/manual private listing from `/admin/listings`, if available) returns **no** row.

- [ ] **Step 8: Commit**

```bash
git add packages/db/src/listings-detail.ts packages/db/src/index.ts \
        packages/db/src/favorites-lead.test.ts apps/web/src/pages/api/listings/by-slugs.ts
git commit -m "feat(listings): public-only getListingsBySlugs + /api/listings/by-slugs"
```

---

### Task 8: `/favorites` page + persistent capture nudge

The shortlist view: reads slugs, fetches fresh public cards, renders them in saved order, prunes dead slugs, shows an empty state, and carries a dismissible capture nudge with plural-aware copy.

**Files:**
- Create: `apps/web/src/components/favorites/FavoritesNudge.tsx`
- Create: `apps/web/src/components/favorites/FavoritesNudge.module.css`
- Create: `apps/web/src/pages/favorites.tsx`
- Create: `apps/web/src/pages/Favorites.module.css`

**Interfaces:**
- Consumes: `useFavorites` (Task 4); `POST /api/listings/by-slugs` (Task 7); `ListingCard`, `SiteLayout`, `Seo`, `Container`, `Eyebrow`, `Skeleton` (existing).
- Produces: the `/favorites` route.

- [ ] **Step 1: Implement the nudge (dismissible, opens the capture)**

Create `apps/web/src/components/favorites/FavoritesNudge.tsx`:

```tsx
import { useState } from "react";
import { Container } from "@/components/ui/Container";
import { useFavorites } from "@/components/favorites/FavoritesProvider";
import styles from "./FavoritesNudge.module.css";

export function FavoritesNudge() {
  const { count, captured, openFavoritesCapture } = useFavorites();
  const [dismissed, setDismissed] = useState(false);
  if (captured || dismissed || count === 0) return null;
  const noun = count <= 1 ? "this home" : "these homes";
  return (
    <section className={styles.section}>
      <Container>
        <div className={styles.panel}>
          <button
            type="button"
            className={styles.dismiss}
            aria-label="Dismiss"
            onClick={() => setDismissed(true)}
          >
            ×
          </button>
          <div className={styles.body}>
            <h2 className={styles.title}>Want Nilyan to keep an eye on {noun}?</h2>
            <p className={styles.text}>
              Leave your details and she&rsquo;ll alert you to price drops and new listings like{" "}
              {noun} — no account needed.
            </p>
          </div>
          <button type="button" className={styles.cta} onClick={openFavoritesCapture}>
            Get alerts
          </button>
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 2: Style the nudge (forest panel)**

Create `apps/web/src/components/favorites/FavoritesNudge.module.css`:

```css
.section {
  padding: 8px 0 4px;
}
.panel {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 18px;
  justify-content: space-between;
  background: var(--color-forest);
  color: var(--color-paper);
  border-radius: var(--radius-md);
  padding: 22px 24px;
  box-shadow: var(--shadow-card);
}
.body {
  flex: 1 1 320px;
}
.title {
  font-family: var(--font-serif), Georgia, serif;
  font-size: 21px;
  line-height: 1.15;
  margin: 0;
}
.text {
  margin: 6px 0 0;
  font-size: 14px;
  line-height: 1.5;
  color: rgba(243, 239, 231, 0.82);
}
.cta {
  flex: 0 0 auto;
  background: var(--color-bronze);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  padding: 12px 22px;
  font-family: var(--font-sans), system-ui, sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color var(--dur-fast) var(--ease-standard);
}
.cta:hover {
  background: var(--color-bronze-dark);
}
.dismiss {
  position: absolute;
  top: 8px;
  right: 12px;
  background: transparent;
  border: none;
  color: rgba(243, 239, 231, 0.7);
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
}
.dismiss:hover {
  color: #fff;
}
@media (prefers-reduced-motion: reduce) {
  .cta {
    transition: none;
  }
}
```

- [ ] **Step 3: Implement the page**

Create `apps/web/src/pages/favorites.tsx`:

```tsx
import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { Seo } from "@/components/seo/Seo";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Skeleton } from "@/components/ui/Skeleton";
import { ListingCard } from "@/components/ui/ListingCard";
import { FavoritesNudge } from "@/components/favorites/FavoritesNudge";
import { useFavorites } from "@/components/favorites/FavoritesProvider";
import type { ListingCardVM } from "@/lib/listing";
import styles from "./Favorites.module.css";

export default function FavoritesPage() {
  const { slugs, count, ready, prune } = useFavorites();
  // null = loading, [] = none (empty state), else the fetched cards in saved order.
  const [listings, setListings] = useState<ListingCardVM[] | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (slugs.length === 0) {
      setListings([]);
      return;
    }
    let alive = true;
    setListings(null);
    fetch("/api/listings/by-slugs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slugs }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { listings: ListingCardVM[] }) => {
        if (!alive) return;
        // Preserve the visitor's most-recent-first order; drop slugs the DB no longer returns.
        const bySlug = new Map(d.listings.map((l) => [l.slug, l]));
        const ordered = slugs
          .map((s) => bySlug.get(s))
          .filter((l): l is ListingCardVM => Boolean(l));
        setListings(ordered);
        if (d.listings.length !== slugs.length) prune(d.listings.map((l) => l.slug));
      })
      .catch(() => {
        if (alive) setListings([]);
      });
    return () => {
      alive = false;
    };
  }, [ready, slugs, prune]);

  return (
    <SiteLayout>
      <Head>
        {/* A personal shortlist — keep it out of the index regardless of demo mode. */}
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <Seo
        title="Saved homes · Nilyan Herrera"
        description="The Florida homes you've saved. Login-less — saved on this device."
        path="/favorites"
      />
      <section className={styles.head}>
        <Container>
          <Eyebrow>Your shortlist</Eyebrow>
          <h1 className={styles.title}>Saved homes</h1>
          <p className={styles.sub}>
            Saved on this device{count > 0 ? ` · ${count} ${count === 1 ? "home" : "homes"}` : ""}. No
            account needed.
          </p>
        </Container>
      </section>

      <FavoritesNudge />

      <section className={styles.body}>
        <Container>
          {listings === null ? (
            <div className={styles.grid}>
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className={styles.cardSkeleton} />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>No saved homes yet</p>
              <p className={styles.emptyText}>Tap the heart on any listing to save it here.</p>
              <Link href="/search" className={styles.emptyCta}>
                Browse listings →
              </Link>
            </div>
          ) : (
            <div className={styles.grid}>
              {listings.map((l) => (
                <ListingCard key={l.slug} listing={l} />
              ))}
            </div>
          )}
        </Container>
      </section>
    </SiteLayout>
  );
}
```

> Confirm the `Skeleton` import path/prop (`className`) against `apps/web/src/components/ui/Skeleton.tsx`. If it takes no `className`, wrap each in a `<div className={styles.cardSkeleton}>`.

- [ ] **Step 4: Style the page**

Create `apps/web/src/pages/Favorites.module.css`:

```css
.head {
  padding: 120px 0 8px; /* clears the fixed header */
}
.title {
  font-family: var(--font-serif), Georgia, serif;
  font-size: clamp(30px, 5vw, 44px);
  line-height: 1.05;
  margin: 10px 0 0;
}
.sub {
  margin: 10px 0 0;
  font-size: 15px;
  color: var(--color-stone);
}
.body {
  padding: 20px 0 96px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}
.cardSkeleton {
  aspect-ratio: 4 / 3;
  border-radius: var(--radius-md);
}
.empty {
  text-align: center;
  padding: 56px 0 72px;
}
.emptyTitle {
  font-family: var(--font-serif), Georgia, serif;
  font-size: 22px;
  margin: 0;
}
.emptyText {
  margin: 8px 0 0;
  font-size: 15px;
  color: var(--color-stone);
}
.emptyCta {
  display: inline-block;
  margin-top: 18px;
  color: var(--color-bronze);
  font-weight: 600;
  font-size: 15px;
}
```

> `.head` top padding assumes the site's fixed header height. Compare to another `SiteLayout` page that starts with content under the header (not a hero) and match its top offset.

- [ ] **Step 5: Verify — typecheck + browser**

Run: `pnpm typecheck` — no errors.
Browser:
1. Visit `/favorites` with nothing saved → empty state + "Browse listings →".
2. Save 2–3 listings, return to `/favorites` → cards render (most-recent first), header badge matches, the forest nudge reads "…keep an eye on **these homes**?"; with exactly one saved it reads "**this home**".
3. Click "Get alerts" → the contact-only capture opens with all saved slugs; submit → nudge disappears (captured) and stays gone on reload.
4. Unsave a card elsewhere → it's gone from `/favorites` on return.
5. Reduced-motion (OS setting) → no transitions; layout intact on a 375px viewport.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/favorites/FavoritesNudge.tsx apps/web/src/components/favorites/FavoritesNudge.module.css \
        apps/web/src/pages/favorites.tsx apps/web/src/pages/Favorites.module.css
git commit -m "feat(favorites): /favorites shortlist page + dismissible capture nudge"
```

---

### Task 9: Full verification + review gates

No new feature code — prove the slice is green end-to-end and route it through the review agents. Also confirm Nilyan actually sees the saved homes in the CRM.

**Files:** none (verification only).

- [ ] **Step 1: Full suite green**

Run each and confirm clean:
```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```
Expected: typecheck/lint clean; the full test count is **higher** than before D9 (Task 1/2/7 added cases); `next build` completes with `/favorites` and `/api/listings/by-slugs` in the route list.

- [ ] **Step 2: CRM context check (the payoff for Nilyan)**

With `pnpm dev`: submit a favorites capture (email + a couple of saved homes), then open `/admin/leads` → the new lead. Confirm: source shows **favorites**, and the saved slugs appear in the lead detail's **viewed listings** panel (D10). If that panel only renders for inquiries, add the favorited slugs to it (the data is already stored in `viewed_listing_ids`) — a minimal read-only addition, still within D9's "Nilyan sees the context" goal. Also confirm a `consent_records` marketing row (`purpose='marketing'`) was written when the marketing box was ticked (D11 behavior, unchanged).

- [ ] **Step 3: Review agents**

Dispatch (read-only, findings only), then address anything they raise:
- `ui-quality-gate` — a11y (heart `aria-pressed`, focus, badge contrast), reduced-motion, mobile list, token drift on the new surfaces.
- `code-reviewer` — correctness, ADR adherence, v1/v2 boundary (no auth introduced), DRY reuse of the lead core.
- `security-compliance-auditor` — consent recorded via the core, `/api/listings/by-slugs` leaks no non-public listings, no PII in `localStorage` (only slugs + two booleans), demo-safety.

- [ ] **Step 4: Stop for local review**

Leave the branch `feat/d9-favorites` in place (9 commits). **Do not merge or deploy** — the user reviews locally first.

---

## Deferred / out of scope (recorded)

- **Real cross-device favorites** — via **Phase 2 passwordless client accounts**. This plan is the login-less bridge; nothing here blocks that upgrade (the lead + consent seams are already the ones accounts would reuse).
- **Notifications to Nilyan on a favorites lead** — the **D8** seam. This routes through the same `createLeadWithConsent`, so D8 lights it up with no favorites-specific work.
- **Saved-search alerts / price-drop emails to the visitor** — Phase 2 (needs accounts + the outbound/suppression machinery). The nudge only *promises* alerts by capturing the lead; Nilyan works it manually in v1.

## Self-review checklist (run after writing all tasks)

- [ ] Every spec point maps to a task: heart on cards (T5) + detail (T5); localStorage persistence (T1/T4); per-browser limitation recorded (Global Constraints + Deferred); `/favorites` view (T8); first-save capture moment (T4) via the existing overlay (T3); lead through `createLeadWithConsent` with `source='favorites'` + saved slugs in `viewedListingIds` (T2); lands in D10 CRM + marketing opt-in (T2 + T9); D8 notifications as seam (Deferred); no accounts/auth (Global Constraints); reuse card + overlay + consent (T3/T5); tokens/mobile/reduced-motion (T5/T6/T8); save-then-prompt ordering (T4); singular/plural copy (T1/T8).
- [ ] No placeholders — every code step shows real code; every command shows expected output.
- [ ] Type consistency — `FavoritesState`, `CaptureOpts`, `LeadSource`, `getListingsBySlugs`, `favoritesCaptureCopy` names match across the tasks that define and consume them.
