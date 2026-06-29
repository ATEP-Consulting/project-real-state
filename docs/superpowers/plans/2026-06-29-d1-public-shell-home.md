# D1 — Public Shell (Header/Nav/Footer) + Home Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the F3 placeholder home with the real **public shell** (scroll-aware Header/Nav + compliant Footer) and the **Home page** (hero with location search + Buy/Sell/Rent, featured-listings strip from our DB, a map-search preview band, explore-by-area, a capture invitation, and trust/bio + testimonials), faithful to the Claude Design system and mobile-first.

**Architecture:** A `SiteLayout` (Header + `<main>` + Footer) wraps public pages. The Header is sticky and scroll-aware (transparent white-text over the hero → solid forest-text + shadow on scroll), with a mobile menu and a presentational EN/ES chip. The Home page is **ISR** (`getStaticProps` + `revalidate`): it reads featured listings from our own Postgres via a new `getFeaturedListings()` query, maps each row to a JSON-serializable view-model with pure tested helpers, and renders six bespoke sections composed from the F3 primitives (`Container`, `Button`, `Eyebrow`) and motion utilities (`Reveal`). No new design tokens — everything references the committed `tokens.css`.

**Tech Stack:** Next.js 15 (Pages Router) + React 19 + TypeScript strict · CSS Modules + CSS custom properties (no Tailwind) · framer-motion (`Reveal`, `PageTransition` — already wired) · Drizzle + Neon (`@herrera/db`) · Vitest (pure-function unit tests, node env) · plain `<img>` for photos (next/image upgrade is D14).

## Global Constraints

- **ADR-016 / `docs/visual-direction.md` is the visual source of truth.** Reference tokens from `apps/web/src/styles/tokens.css` via `var(--...)`. Do **not** invent colors/type/spacing/shadows/radii. Spectral (serif headings, sentence-case, untracked) + Hanken Grotesk (sans UI); uppercase **tracked** only for eyebrows/labels/wordmark. Green-tinted soft shadows; crisp 2–3px radii.
- **ADR-001:** Pages Router only. **No App Router, no React Server Components, no `"use client"`.** (framer-motion is fine — Pages Router is client-hydrated.)
- **Styling = CSS Modules + tokens (no Tailwind, no clsx).** className composition via template literals, matching the F3 primitives (`` `${styles.a} ${styles.b}` ``).
- **Reuse F3, do not reinvent:** primitives `Container`, `Button`, `Eyebrow` (`@/components/ui/*`); motion `Reveal`, `PageTransition`, `@/theme/motion`; do **not** modify these primitives. Leave the stub `@/components/Layout.tsx` (still used by `styleguide`/admin) untouched — add a new `SiteLayout` for public pages.
- **Mobile-first, quality floor (every screen):** responsive (mobile menu + stacking layouts), visible keyboard focus (already global), `prefers-reduced-motion` honored (use `Reveal`, never raw animations).
- **Compliance (ADR-011):** Footer carries **Equal Housing Opportunity** notice + mark, broker/Realtor® attribution, and legal links. **Fair Housing — no steering:** all marketing/area/testimonial copy must be about places and service, never about the protected-class makeup of residents. The per-listing MLS/IDX disclaimer is D4 (not here).
- **Demo posture (ADR-003):** `noindex` + the global `DemoBanner` are already wired in `_app.tsx`; do not duplicate. Sample data must read as sample (Footer notes "sample data — demo").
- **Data:** Home is **ISR** — `getStaticProps` + `revalidate: 300`. Featured listings come from our own DB (`status='active' AND visibility='public'`, **not** filtered by `source`, so MLS rows later appear identically). `getStaticProps` must be **resilient**: on DB error return `featured: []` so the gate `build` stays green without `DATABASE_URL`.
- **Gates (every task):** `pnpm format` then `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm --filter @herrera/web build` — all green. One commit per task, on branch `feat/d1-public-shell-home`.
- **Adapt to installed versions** (next 15.1, react 19, framer-motion 11.15, drizzle, eslint 9 flat) — never downgrade to match this plan.

## Decisions in this plan (confirm at review)

1. **Un-built route links → real hrefs, 404 until their task.** Nav/footer/CTAs point at their final routes (`/search`, `/buy`, `/sell`, `/rent`, `/areas`, `/guides`, `/about`, `/contact`, legal). Routes not yet built 404 (expected mid-build). The Home page is the D1 deliverable. *Alternative: add thin "coming soon" stubs for every target so nothing 404s — rejected as throwaway work that overlaps later tasks.* **Exception:** `/about` (decision 2).
2. **`/about` page is included as an OPTIONAL final task (Task 9).** `docs/pages.md` assigns `/about` to D1, and it reuses the Home's bio + testimonials content modules, so it's cheap. The BUILD_PLAYBOOK D1 prompt says "home page" only — so Task 9 is **separable**: drop it if you want D1 strictly = shell + home.
3. **EN/ES toggle = presentational chip** (EN active, ES inert with a "coming in D13" title). Full i18n (next locales, `/es/...`) is **D13**; `next.config` has no locales yet. Keeps the header faithful without pulling D13 scope in.
4. **React/Next ESLint plugins = OPTIONAL Task 1.** `next.config.mjs` notes "the Next ESLint plugin lands in D1." Wiring `eslint-plugin-react-hooks` + `@next/eslint-plugin-next` into the flat preset is the right time (real components land now) but is separable tooling — drop Task 1 if you'd rather keep D1 purely product and defer lint plugins.
5. **Listing photos via plain `<img loading="lazy">`** with CSS aspect-ratio crop (host-agnostic; seed photos are `images.unsplash.com`). next/image optimization + image CDN is **explicitly D14** ("image CDN, fast loads"). Avoids next/image remote-host config and keeps `build` DB-free.
6. **SEO scope = baseline only.** Home gets `<title>` + meta description + canonical. Rich structured data (RealEstateAgent/Organization JSON-LD, hreflang, sitemap) is deferred to D12/D14 per ADR-015 (the demo is `noindex` anyway). The `seo-schema` skill applies and will be used when SEO is built out.
7. **Hero search is presentational entry, not live search.** The hero form routes to `/search?q=<query>` (D2 reads it); Buy/Sell/Rent link to `/buy|/sell|/rent` (D7 capture). No live results/map in D1 (that's D2). The map-preview band is a static visual teaser linking to `/search`.
8. **Featured query lives in `@herrera/db`** (next to `countListings`), returning `Listing[]`; `Listing` is re-exported from the package root for the web app. Keeps drizzle-orm out of `apps/web` deps.

## File Structure

```
packages/db/src/
  client.ts                         # MODIFY: add getFeaturedListings(limit)
  index.ts                          # MODIFY: export getFeaturedListings + Listing type

apps/web/src/
  lib/
    listing.ts                      # CREATE: pure formatters + toListingCardVM + ListingCardVM type
    listing.test.ts                 # CREATE: vitest unit tests (TDD)
    nav.ts                          # CREATE: PRIMARY_NAV + FOOTER_NAV (shared IA)
  data/
    realtor.ts                      # CREATE: Nilyan bio/credentials (sample) — shared by Trust + /about
    testimonials.ts                 # CREATE: our-own sample testimonials (FH-clean)
    areas.ts                        # CREATE: curated explore-by-area cities
  components/
    layout/
      useScrolled.ts                # CREATE: SSR-safe scroll hook
      Header.tsx + Header.module.css        # CREATE
      Footer.tsx + Footer.module.css        # CREATE
      EqualHousingLogo.tsx                  # CREATE: inline SVG mark
      SiteLayout.tsx                        # CREATE: Header + main + Footer
    ui/
      ListingCard.tsx + ListingCard.module.css   # CREATE: reusable card (reused in D2/D4)
    home/
      Hero.tsx + Hero.module.css
      FeaturedListings.tsx + FeaturedListings.module.css
      MapPreview.tsx + MapPreview.module.css
      ExploreAreas.tsx + ExploreAreas.module.css
      CaptureInvite.tsx + CaptureInvite.module.css
      Trust.tsx + Trust.module.css
  pages/
    index.tsx                       # REWRITE: real Home (ISR getStaticProps + sections)
    about.tsx                       # CREATE (OPTIONAL, Task 9)

packages/config/eslint/base.mjs     # MODIFY (OPTIONAL, Task 1): React/Next plugins
```

---

### Task 1 (OPTIONAL — confirm): Wire React + Next ESLint into the flat preset

**Files:**
- Modify: `packages/config/package.json` (add plugin deps)
- Modify: `packages/config/eslint/base.mjs`

**Interfaces:**
- Produces: lint coverage of hooks rules + Next rules for `apps/web/**/*.{ts,tsx}`. No code interface.

> Skip this task entirely if decision 4 is declined. If kept, do it first so all D1 components are linted by react-hooks rules.

- [ ] **Step 1: Add plugin deps**

In `packages/config/package.json` `dependencies`, add (floors — install latest matching):

```json
    "@next/eslint-plugin-next": "^15.1.0",
    "eslint-plugin-react": "^7.37.0",
    "eslint-plugin-react-hooks": "^5.1.0"
```

Run: `pnpm install`
Expected: plugins installed under `@herrera/config`.

- [ ] **Step 2: Extend the flat config**

Rewrite `packages/config/eslint/base.mjs`:

```js
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import nextPlugin from "@next/eslint-plugin-next";

/** Shared flat ESLint config for all Herrera workspaces (TS base, Prettier-compatible). */
export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/.next/**",
      "**/node_modules/**",
      "**/*.config.*",
      "**/next-env.d.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // React + hooks + Next rules, scoped to the web app's components/pages.
  {
    files: ["apps/web/**/*.{ts,tsx}"],
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooks,
      "@next/next": nextPlugin,
    },
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: "detect" } },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      // Pages Router + automatic JSX runtime — no React-in-scope / prop-types needs.
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
    },
  },
  eslintConfigPrettier,
);
```

> If an installed plugin exposes a different flat-config shape (e.g. `reactHooks.configs["recommended-latest"]`), adapt to the installed export — do not downgrade.

- [ ] **Step 3: Verify**

Run: `pnpm lint`
Expected: exit 0 (no source yet violates the new rules; the F3 components already follow hooks rules).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore(config): wire React + Next ESLint plugins into the flat preset

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Pure listing helpers + view-model (TDD)

**Files:**
- Create: `apps/web/src/lib/listing.ts`
- Test: `apps/web/src/lib/listing.test.ts`

**Interfaces:**
- Consumes: `Listing` type from `@herrera/db` (re-exported in Task 3 — for the test, define a local minimal fixture typed as `Partial<Listing>` cast, see Step 1; the mapper signature uses `Listing`). To avoid a Task-3 dependency for the test, the helper imports `import type { Listing } from "@herrera/db"` and the test builds a fixture object literal asserted `as unknown as Listing`.
- Produces:
  - `formatPrice(n: number): string`
  - `formatBedsLabel(beds: number | null): string | null`
  - `formatBathsLabel(baths: string | null): string | null` (DB `numeric` → string)
  - `formatSqftLabel(sqft: number | null): string | null`
  - `formatPropertyType(t: string): string`
  - `type ListingCardVM`
  - `toListingCardVM(l: Listing): ListingCardVM`

> Re-exporting `Listing` from `@herrera/db` happens in Task 3. If executing Task 2 first, that import resolves once Task 3 lands; the **test** does not need it (it builds a literal). If `tsc`/lint runs before Task 3, temporarily import the type from the deep path `@herrera/db/dist/...`? No — instead, **do Task 3 Step 1–2 (the re-export) before Task 2's verify**, or run Tasks in the order 3→2. For a clean linear order this plan lists Task 3's re-export as a prerequisite of Task 2's typecheck; the executor may swap their order. (Recommended: do Task 3 first, then Task 2.)

- [ ] **Step 1: Write the failing tests**

`apps/web/src/lib/listing.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { Listing } from "@herrera/db";
import {
  formatPrice,
  formatBedsLabel,
  formatBathsLabel,
  formatSqftLabel,
  formatPropertyType,
  toListingCardVM,
} from "./listing";

function makeListing(over: Partial<Listing> = {}): Listing {
  return {
    slug: "1842-brickell-ave-miami",
    price: 1250000,
    bedrooms: 3,
    bathrooms: "2.5",
    sqft: 1840,
    propertyType: "condo",
    addressLine1: "1842 Brickell Ave",
    city: "Miami",
    state: "FL",
    zip: "33129",
    photos: [{ url: "https://images.unsplash.com/photo-1.jpg", caption: "Front" }],
    ...over,
  } as unknown as Listing;
}

describe("formatPrice", () => {
  it("formats whole USD with grouping and no decimals", () => {
    expect(formatPrice(1250000)).toBe("$1,250,000");
    expect(formatPrice(0)).toBe("$0");
    expect(formatPrice(950)).toBe("$950");
  });
});

describe("formatBedsLabel", () => {
  it("labels bed counts and handles null", () => {
    expect(formatBedsLabel(3)).toBe("3 bd");
    expect(formatBedsLabel(0)).toBe("Studio");
    expect(formatBedsLabel(null)).toBeNull();
  });
});

describe("formatBathsLabel", () => {
  it("trims trailing .0 and labels, handles null", () => {
    expect(formatBathsLabel("2.5")).toBe("2.5 ba");
    expect(formatBathsLabel("2.0")).toBe("2 ba");
    expect(formatBathsLabel(null)).toBeNull();
  });
});

describe("formatSqftLabel", () => {
  it("groups thousands and labels, handles null", () => {
    expect(formatSqftLabel(1840)).toBe("1,840 sqft");
    expect(formatSqftLabel(null)).toBeNull();
  });
});

describe("formatPropertyType", () => {
  it("humanizes known enum values and falls back to Home", () => {
    expect(formatPropertyType("single_family")).toBe("Single-family home");
    expect(formatPropertyType("condo")).toBe("Condo");
    expect(formatPropertyType("townhouse")).toBe("Townhouse");
    expect(formatPropertyType("something_new")).toBe("Home");
  });
});

describe("toListingCardVM", () => {
  it("maps a full listing to a serializable card view-model", () => {
    const vm = toListingCardVM(makeListing());
    expect(vm).toEqual({
      slug: "1842-brickell-ave-miami",
      href: "/homes/1842-brickell-ave-miami",
      priceLabel: "$1,250,000",
      address: "1842 Brickell Ave",
      cityLine: "Miami, FL 33129",
      beds: 3,
      bedsLabel: "3 bd",
      bathsLabel: "2.5 ba",
      sqftLabel: "1,840 sqft",
      propertyTypeLabel: "Condo",
      photo: "https://images.unsplash.com/photo-1.jpg",
      photoAlt: "Condo at 1842 Brickell Ave, Miami, FL",
    });
  });

  it("handles missing beds/baths/sqft/photos gracefully", () => {
    const vm = toListingCardVM(
      makeListing({ bedrooms: null, bathrooms: null, sqft: null, photos: [] }),
    );
    expect(vm.beds).toBeNull();
    expect(vm.bedsLabel).toBeNull();
    expect(vm.bathsLabel).toBeNull();
    expect(vm.sqftLabel).toBeNull();
    expect(vm.photo).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- listing`
Expected: FAIL — `Cannot find module './listing'` (file not created yet).

- [ ] **Step 3: Implement `listing.ts`**

`apps/web/src/lib/listing.ts`:

```ts
import type { Listing } from "@herrera/db";

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  single_family: "Single-family home",
  condo: "Condo",
  townhouse: "Townhouse",
  multi_family: "Multi-family",
  villa: "Villa",
  co_op: "Co-op",
  land: "Land",
  mobile: "Mobile home",
  other: "Home",
};

export function formatPrice(n: number): string {
  return `$${n.toLocaleString("en-US")}`;
}

export function formatBedsLabel(beds: number | null): string | null {
  if (beds === null) return null;
  if (beds === 0) return "Studio";
  return `${beds} bd`;
}

export function formatBathsLabel(baths: string | null): string | null {
  if (baths === null) return null;
  // DB numeric(3,1) arrives as a string like "2.5" / "2.0".
  const n = Number(baths);
  if (Number.isNaN(n)) return null;
  const trimmed = Number.isInteger(n) ? String(n) : String(n);
  return `${trimmed} ba`;
}

export function formatSqftLabel(sqft: number | null): string | null {
  if (sqft === null) return null;
  return `${sqft.toLocaleString("en-US")} sqft`;
}

export function formatPropertyType(t: string): string {
  return PROPERTY_TYPE_LABELS[t] ?? "Home";
}

export type ListingCardVM = {
  slug: string;
  href: string;
  priceLabel: string;
  address: string;
  cityLine: string;
  beds: number | null;
  bedsLabel: string | null;
  bathsLabel: string | null;
  sqftLabel: string | null;
  propertyTypeLabel: string;
  photo: string | null;
  photoAlt: string;
};

export function toListingCardVM(l: Listing): ListingCardVM {
  const propertyTypeLabel = formatPropertyType(l.propertyType);
  return {
    slug: l.slug,
    href: `/homes/${l.slug}`,
    priceLabel: formatPrice(l.price),
    address: l.addressLine1,
    cityLine: `${l.city}, ${l.state} ${l.zip}`,
    beds: l.bedrooms,
    bedsLabel: formatBedsLabel(l.bedrooms),
    bathsLabel: formatBathsLabel(l.bathrooms),
    sqftLabel: formatSqftLabel(l.sqft),
    propertyTypeLabel,
    photo: l.photos[0]?.url ?? null,
    photoAlt: `${propertyTypeLabel} at ${l.addressLine1}, ${l.city}, ${l.state}`,
  };
}
```

> `formatBathsLabel`'s `trimmed` line is intentionally simple: `Number("2.0") === 2` → `String(2) === "2"`; `Number("2.5") === 2.5` → `"2.5"`. The `Number.isInteger` branch documents intent.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test -- listing`
Expected: PASS (all cases). If the `Listing` import is unresolved because Task 3 hasn't run, do Task 3 Steps 1–2 first, then re-run.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/listing.ts apps/web/src/lib/listing.test.ts
git commit -m "feat(web): add pure listing formatters + card view-model (TDD)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Featured-listings query + `Listing` re-export

**Files:**
- Modify: `packages/db/src/client.ts`
- Modify: `packages/db/src/index.ts`

**Interfaces:**
- Consumes: existing `getDb()` and the in-scope `schema` namespace in `client.ts` (used by `createDb`).
- Produces:
  - `getFeaturedListings(limit?: number): Promise<Listing[]>`
  - root re-exports: `getFeaturedListings`, `type Listing`

- [ ] **Step 1: Add the query to `client.ts`**

At the top of `packages/db/src/client.ts`, ensure these drizzle imports exist (merge into existing `drizzle-orm` import lines; `sql` is already imported for `countListings`):

```ts
import { and, desc, eq, sql } from "drizzle-orm";
import type { Listing } from "./schema/listings";
```

Add, after `countListings`:

```ts
/**
 * Featured listings for the public home strip (ADR-005/006).
 * Public + active only; NOT filtered by `source`, so MLS rows later appear identically.
 * Highest-priced first for a curated, premium-feeling strip.
 */
export async function getFeaturedListings(limit = 6): Promise<Listing[]> {
  return getDb()
    .select()
    .from(schema.listings)
    .where(and(eq(schema.listings.status, "active"), eq(schema.listings.visibility, "public")))
    .orderBy(desc(schema.listings.price))
    .limit(limit);
}
```

> If `client.ts` imports the schema as a named/default rather than `* as schema`, reference it the same way the existing `createDb` does (the agent map confirms `drizzle(neon(url), { schema })`, so `schema.listings` is valid). Adapt the identifier if the file uses a different name.

- [ ] **Step 2: Re-export from the package root**

In `packages/db/src/index.ts`, update the client re-export and add the `Listing` type:

```ts
export * as schema from "./schema/index";
export { getDb, countListings, getFeaturedListings, type DB } from "./client";
export type { Listing } from "./schema/listings";
```

- [ ] **Step 3: Verify**

Run: `pnpm --filter @herrera/db typecheck` (or `pnpm typecheck`)
Expected: exit 0 — the query typechecks against the drizzle schema.

Run: `pnpm test -- listing`
Expected: PASS — the `import type { Listing } from "@herrera/db"` in `lib/listing.ts` and the test now resolves.

- [ ] **Step 4: Commit**

```bash
git add packages/db/src/client.ts packages/db/src/index.ts
git commit -m "feat(db): getFeaturedListings(limit) query + Listing root re-export

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: ListingCard component (reusable)

**Files:**
- Create: `apps/web/src/components/ui/ListingCard.tsx`
- Create: `apps/web/src/components/ui/ListingCard.module.css`

**Interfaces:**
- Consumes: `ListingCardVM` (Task 2).
- Produces: `<ListingCard listing={vm} />` — used by the featured strip (and reusable in D2 results / D4 similar-listings).

- [ ] **Step 1: Component**

`apps/web/src/components/ui/ListingCard.tsx`:

```tsx
import Link from "next/link";
import type { ListingCardVM } from "@/lib/listing";
import styles from "./ListingCard.module.css";

export function ListingCard({ listing }: { listing: ListingCardVM }) {
  const meta = [listing.bedsLabel, listing.bathsLabel, listing.sqftLabel].filter(Boolean);
  return (
    <Link href={listing.href} className={styles.card}>
      <div className={styles.media}>
        {listing.photo ? (
          // next/image upgrade is D14 (image CDN). Plain <img> is host-agnostic.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={listing.photo} alt={listing.photoAlt} className={styles.img} loading="lazy" />
        ) : (
          <div className={styles.placeholder} aria-hidden="true" />
        )}
        <span className={styles.type}>{listing.propertyTypeLabel}</span>
      </div>
      <div className={styles.body}>
        <p className={styles.price}>{listing.priceLabel}</p>
        <p className={styles.address}>{listing.address}</p>
        <p className={styles.city}>{listing.cityLine}</p>
        {meta.length > 0 && (
          <ul className={styles.meta}>
            {meta.map((m) => (
              <li key={m} className={styles.metaItem}>
                {m}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Link>
  );
}
```

> The `eslint-disable-next-line @next/next/no-img-element` is only needed if Task 1 enabled the Next plugin; harmless otherwise.

- [ ] **Step 2: Styles**

`apps/web/src/components/ui/ListingCard.module.css`:

```css
.card {
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-card);
  color: var(--color-ink);
  transition:
    transform var(--dur-base) var(--ease-standard),
    box-shadow var(--dur-base) var(--ease-standard);
}
.card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-card-hover);
}

.media {
  position: relative;
  aspect-ratio: 4 / 3;
  background: var(--color-sand-200);
}
.img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--color-sand-100), var(--color-sand-200));
}
.type {
  position: absolute;
  left: 12px;
  bottom: 12px;
  padding: 5px 10px;
  font-family: var(--font-sans), system-ui, sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #fff;
  background: rgba(11, 24, 22, 0.55);
  border-radius: var(--radius-xs);
  backdrop-filter: blur(2px);
}

.body {
  padding: 16px 18px 18px;
}
.price {
  font-family: var(--font-serif), Georgia, serif;
  font-size: 22px;
  line-height: 1.1;
  margin: 0;
}
.address {
  margin: 6px 0 0;
  font-size: 14.5px;
  font-weight: 500;
  color: var(--color-ink-soft);
}
.city {
  margin: 2px 0 0;
  font-size: 13px;
  color: var(--color-stone);
}
.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  list-style: none;
  margin: 12px 0 0;
  padding: 12px 0 0;
  border-top: 1px solid var(--color-border);
}
.metaItem {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-stone);
}
.metaItem + .metaItem {
  position: relative;
  padding-left: 14px;
}
.metaItem + .metaItem::before {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--color-stone-faint);
  transform: translateY(-50%);
}
```

- [ ] **Step 3: Verify**

Run: `pnpm format && pnpm format:check && pnpm lint && pnpm typecheck`
Expected: all green (component not yet rendered anywhere; this verifies it compiles).

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/ui/ListingCard.tsx apps/web/src/components/ui/ListingCard.module.css
git commit -m "feat(web): add reusable ListingCard (price-forward, aspect-ratio crop)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Header — scroll-aware nav + mobile menu + shared IA

**Files:**
- Create: `apps/web/src/lib/nav.ts`
- Create: `apps/web/src/components/layout/useScrolled.ts`
- Create: `apps/web/src/components/layout/Header.tsx` + `Header.module.css`

**Interfaces:**
- Consumes: `Container` (F3).
- Produces:
  - `PRIMARY_NAV`, `FOOTER_NAV` (shared IA, consumed by Header + Footer)
  - `useScrolled(threshold?: number): boolean`
  - `<Header transparentOverHero?: boolean />`

- [ ] **Step 1: Shared navigation IA**

`apps/web/src/lib/nav.ts`:

```ts
export type NavItem = { label: string; href: string };

export const PRIMARY_NAV: readonly NavItem[] = [
  { label: "Buy", href: "/buy" },
  { label: "Sell", href: "/sell" },
  { label: "Rent", href: "/rent" },
  { label: "Search", href: "/search" },
  { label: "Areas", href: "/areas" },
  { label: "Guides", href: "/guides" },
  { label: "About", href: "/about" },
];

export const FOOTER_NAV: readonly { heading: string; items: readonly NavItem[] }[] = [
  {
    heading: "Explore",
    items: [
      { label: "Search homes", href: "/search" },
      { label: "Areas", href: "/areas" },
      { label: "Guides", href: "/guides" },
      { label: "Favorites", href: "/favorites" },
    ],
  },
  {
    heading: "Work with Nilyan",
    items: [
      { label: "Buy", href: "/buy" },
      { label: "Sell", href: "/sell" },
      { label: "Rent", href: "/rent" },
      { label: "What's my home worth?", href: "/home-value" },
    ],
  },
  {
    heading: "Company",
    items: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    heading: "Legal",
    items: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Accessibility", href: "/accessibility" },
    ],
  },
];
```

- [ ] **Step 2: Scroll hook**

`apps/web/src/components/layout/useScrolled.ts`:

```ts
import { useEffect, useState } from "react";

/** True once the page has scrolled past `threshold` px. SSR-safe (starts false). */
export function useScrolled(threshold = 0): boolean {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return scrolled;
}
```

- [ ] **Step 3: Header component**

`apps/web/src/components/layout/Header.tsx`:

```tsx
import Link from "next/link";
import { useState } from "react";
import { Container } from "@/components/ui/Container";
import { PRIMARY_NAV } from "@/lib/nav";
import { useScrolled } from "./useScrolled";
import styles from "./Header.module.css";

export function Header({ transparentOverHero = false }: { transparentOverHero?: boolean }) {
  const scrolled = useScrolled(24);
  const [open, setOpen] = useState(false);
  const solid = !transparentOverHero || scrolled;

  return (
    <header className={`${styles.header} ${solid ? styles.solid : styles.overlay}`}>
      <Container>
        <div className={styles.bar}>
          <Link href="/" className={styles.wordmark} aria-label="Herrera — home">
            HERRERA
          </Link>

          <nav className={styles.nav} aria-label="Primary">
            {PRIMARY_NAV.map((item) => (
              <Link key={item.href} href={item.href} className={styles.navLink}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className={styles.actions}>
            <span className={styles.lang} title="Español — coming in D13">
              <span className={styles.langActive}>EN</span>
              <span className={styles.langSep}>·</span>
              <span className={styles.langMuted}>ES</span>
            </span>
            <Link href="/contact" className={styles.cta}>
              Contact
            </Link>
            <button
              type="button"
              className={styles.menuBtn}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
            >
              <span className={`${styles.bars} ${open ? styles.barsOpen : ""}`} aria-hidden="true" />
            </button>
          </div>
        </div>
      </Container>

      {open && (
        <nav id="mobile-nav" className={styles.mobileNav} aria-label="Primary">
          {[...PRIMARY_NAV, { label: "Contact", href: "/contact" }].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={styles.mobileLink}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
```

- [ ] **Step 4: Header styles**

`apps/web/src/components/layout/Header.module.css`:

```css
.header {
  position: sticky;
  top: 0;
  z-index: 50;
  transition:
    background-color var(--dur-base) var(--ease-standard),
    box-shadow var(--dur-base) var(--ease-standard),
    border-color var(--dur-base) var(--ease-standard),
    color var(--dur-base) var(--ease-standard);
}

.overlay {
  background: transparent;
  color: #fff;
  border-bottom: 1px solid transparent;
}
.solid {
  background: var(--color-surface);
  color: var(--color-forest);
  border-bottom: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}

.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  height: 72px;
}

.wordmark {
  font-family: var(--font-serif), Georgia, serif;
  font-size: 22px;
  font-weight: 500;
  letter-spacing: 0.16em;
  color: inherit;
}

.nav {
  display: flex;
  align-items: center;
  gap: 26px;
  margin-left: auto;
}
.navLink {
  font-family: var(--font-sans), system-ui, sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: inherit;
  opacity: 0.92;
  transition: opacity var(--dur-fast) var(--ease-standard);
}
.navLink:hover {
  opacity: 1;
}

.actions {
  display: flex;
  align-items: center;
  gap: 16px;
}
.lang {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  cursor: default;
  color: inherit;
}
.langActive {
  opacity: 1;
}
.langSep {
  opacity: 0.5;
  margin: 0 4px;
}
.langMuted {
  opacity: 0.5;
}

.cta {
  font-family: var(--font-sans), system-ui, sans-serif;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
  padding: 9px 18px;
  border-radius: var(--radius-pill);
  border: 1px solid currentColor;
  color: inherit;
  transition:
    background-color var(--dur-base) var(--ease-standard),
    color var(--dur-base) var(--ease-standard);
}
.solid .cta {
  background: var(--color-bronze);
  border-color: var(--color-bronze);
  color: #fff;
  box-shadow: var(--shadow-bronze);
}
.solid .cta:hover {
  background: var(--color-bronze-dark);
  border-color: var(--color-bronze-dark);
}
.overlay .cta:hover {
  background: rgba(255, 255, 255, 0.14);
}

.menuBtn {
  display: none;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid currentColor;
  border-radius: var(--radius-sm);
  color: inherit;
  cursor: pointer;
}
.bars,
.bars::before,
.bars::after {
  display: block;
  width: 18px;
  height: 2px;
  background: currentColor;
  transition: transform var(--dur-base) var(--ease-standard);
}
.bars {
  position: relative;
}
.bars::before,
.bars::after {
  content: "";
  position: absolute;
  left: 0;
}
.bars::before {
  top: -6px;
}
.bars::after {
  top: 6px;
}

.mobileNav {
  display: none;
}

@media (max-width: 900px) {
  .nav,
  .lang,
  .cta {
    display: none;
  }
  .menuBtn {
    display: inline-flex;
  }
  .mobileNav {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 8px 0 16px;
    background: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
    box-shadow: var(--shadow-card);
  }
  .mobileLink {
    padding: 12px var(--gutter);
    font-family: var(--font-sans), system-ui, sans-serif;
    font-size: 16px;
    font-weight: 500;
    color: var(--color-ink);
  }
  .mobileLink:hover {
    background: var(--color-sand-100);
  }
}

@media (max-width: 768px) {
  .mobileLink {
    padding-inline: 20px;
  }
}
```

> Note: when `transparentOverHero` is true but the mobile menu opens at the top (not scrolled), the menu panel itself is solid (above), so links are readable regardless of header variant.

- [ ] **Step 5: Verify**

Run: `pnpm format && pnpm format:check && pnpm lint && pnpm typecheck`
Expected: all green.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/nav.ts apps/web/src/components/layout/useScrolled.ts apps/web/src/components/layout/Header.tsx apps/web/src/components/layout/Header.module.css
git commit -m "feat(web): scroll-aware Header (nav IA, mobile menu, EN/ES chip)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Footer (compliance) + EqualHousingLogo + SiteLayout

**Files:**
- Create: `apps/web/src/components/layout/EqualHousingLogo.tsx`
- Create: `apps/web/src/components/layout/Footer.tsx` + `Footer.module.css`
- Create: `apps/web/src/components/layout/SiteLayout.tsx`

**Interfaces:**
- Consumes: `Container` (F3), `FOOTER_NAV` (Task 5), `Header`/`Footer`.
- Produces:
  - `<EqualHousingLogo />` (inline SVG)
  - `<Footer />`
  - `<SiteLayout transparentHeader?: boolean>{children}</SiteLayout>`

- [ ] **Step 1: Equal Housing mark (inline SVG, asset-free)**

`apps/web/src/components/layout/EqualHousingLogo.tsx`:

```tsx
/** Equal Housing Opportunity mark — simplified house + equals, inline so we ship no binary asset. */
export function EqualHousingLogo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label="Equal Housing Opportunity"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M24 7 6 21h5v18h26V21h5L24 7Z"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <rect x="18" y="26" width="12" height="3" fill="currentColor" />
      <rect x="18" y="32" width="12" height="3" fill="currentColor" />
    </svg>
  );
}
```

- [ ] **Step 2: Footer component**

`apps/web/src/components/layout/Footer.tsx`:

```tsx
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { FOOTER_NAV } from "@/lib/nav";
import { REALTOR } from "@/data/realtor";
import { EqualHousingLogo } from "./EqualHousingLogo";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <Container>
        <div className={styles.top}>
          <div className={styles.brand}>
            <span className={styles.wordmark}>HERRERA</span>
            <p className={styles.tagline}>{REALTOR.bioShort}</p>
            <p className={styles.contact}>
              <a href={`mailto:${REALTOR.email}`}>{REALTOR.email}</a>
              <span aria-hidden="true"> · </span>
              <a href={`tel:${REALTOR.phone.replace(/[^+\d]/g, "")}`}>{REALTOR.phone}</a>
            </p>
          </div>

          <nav className={styles.cols} aria-label="Footer">
            {FOOTER_NAV.map((col) => (
              <div key={col.heading} className={styles.col}>
                <h2 className={styles.colHeading}>{col.heading}</h2>
                <ul className={styles.colList}>
                  {col.items.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} className={styles.colLink}>
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className={styles.legal}>
          <div className={styles.eho}>
            <EqualHousingLogo />
            <span>Equal Housing Opportunity</span>
          </div>
          <div className={styles.legalText}>
            <p>
              {REALTOR.name}, {REALTOR.title} · {REALTOR.license}
            </p>
            <p className={styles.sample}>
              Sample data — demonstration site. Listings, figures, and reviews shown are illustrative.
            </p>
            <p>© {REALTOR.copyrightYear} Herrera. All rights reserved.</p>
          </div>
        </div>
      </Container>
    </footer>
  );
}
```

> `REALTOR.copyrightYear` is a literal constant in `data/realtor.ts` (Task 7 Step 1) — **not** `new Date()` (keeps the build deterministic and avoids hydration drift). If Task 7 hasn't run yet, create `data/realtor.ts` now (it's defined in Task 7 Step 1); for a clean order, Task 7's `realtor.ts` is a prerequisite of this Footer — see the note below.

- [ ] **Step 3: Footer styles**

`apps/web/src/components/layout/Footer.module.css`:

```css
.footer {
  background: var(--color-forest);
  color: rgba(255, 255, 255, 0.82);
  padding-block: 56px 32px;
  margin-top: 0;
}

.top {
  display: grid;
  grid-template-columns: 1.2fr 2fr;
  gap: 48px;
  padding-bottom: 40px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.wordmark {
  font-family: var(--font-serif), Georgia, serif;
  font-size: 22px;
  font-weight: 500;
  letter-spacing: 0.16em;
  color: #fff;
}
.tagline {
  margin: 14px 0 0;
  max-width: 320px;
  font-size: 14.5px;
  line-height: 1.6;
}
.contact {
  margin: 14px 0 0;
  font-size: 14px;
}
.contact a {
  color: var(--color-bronze-light);
}

.cols {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 28px;
}
.colHeading {
  font-family: var(--font-sans), system-ui, sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.55);
  margin: 0 0 14px;
}
.colList {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.colLink {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.82);
  transition: color var(--dur-fast) var(--ease-standard);
}
.colLink:hover {
  color: #fff;
}

.legal {
  display: flex;
  align-items: flex-start;
  gap: 18px;
  padding-top: 28px;
}
.eho {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  flex-shrink: 0;
}
.legalText {
  font-size: 12.5px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.6);
}
.legalText p {
  margin: 0 0 4px;
}
.sample {
  color: var(--color-bronze-light);
}

@media (max-width: 900px) {
  .top {
    grid-template-columns: 1fr;
    gap: 32px;
  }
  .cols {
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
  }
}
@media (max-width: 560px) {
  .legal {
    flex-direction: column;
    gap: 12px;
  }
}
```

- [ ] **Step 4: SiteLayout**

`apps/web/src/components/layout/SiteLayout.tsx`:

```tsx
import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function SiteLayout({
  children,
  transparentHeader = false,
}: {
  children: ReactNode;
  transparentHeader?: boolean;
}) {
  return (
    <>
      <Header transparentOverHero={transparentHeader} />
      <main>{children}</main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 5: Verify**

Run: `pnpm format && pnpm format:check && pnpm lint && pnpm typecheck`
Expected: all green (requires `data/realtor.ts` from Task 7 Step 1 — create it first; recommended order has Task 7's data modules land here).

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/layout/
git commit -m "feat(web): compliant Footer (Equal Housing, attribution, legal) + SiteLayout

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Home content data + Hero + Featured strip + page (ISR)

**Files:**
- Create: `apps/web/src/data/realtor.ts`, `apps/web/src/data/testimonials.ts`, `apps/web/src/data/areas.ts`
- Create: `apps/web/src/components/home/Hero.tsx` + `Hero.module.css`
- Create: `apps/web/src/components/home/FeaturedListings.tsx` + `FeaturedListings.module.css`
- Rewrite: `apps/web/src/pages/index.tsx`

**Interfaces:**
- Consumes: `SiteLayout`, `Container`, `Button`, `Eyebrow`, `Reveal`, `ListingCard`, `getFeaturedListings`, `toListingCardVM`.
- Produces: `REALTOR`, `TESTIMONIALS`, `FEATURED_AREAS`; `<Hero />`; `<FeaturedListings listings={ListingCardVM[]} />`; the real Home page with `getStaticProps`.

> **Recommended execution order:** create the three `data/*` modules (Step 1) **before** Task 6's Footer verify, since Footer imports `REALTOR`. The plan lists them here for cohesion; the executor may pull Step 1 earlier.

- [ ] **Step 1: Content data modules (sample, Fair-Housing-clean)**

`apps/web/src/data/realtor.ts`:

```ts
/** Sample profile for the demo. Figures/credentials are illustrative (not a real license record). */
export const REALTOR = {
  name: "Nilyan Herrera",
  title: "Licensed Florida Realtor®",
  monogram: "NH",
  license: "FL Real Estate License #SL0000000 (sample)",
  email: "hello@herrera-demo.example",
  phone: "+1 (305) 555-0142",
  copyrightYear: 2026,
  bioShort: "Premium real estate guidance in Florida — buy, sell and rent with confidence.",
  bioLong: [
    "Nilyan Herrera helps buyers, sellers, and renters move with confidence across Florida — from Miami and Coral Gables to Naples and the central-Florida suburbs.",
    "Every client gets a clear read on the numbers that matter in Florida: insurance, flood exposure, HOA and CDD fees, and the real monthly cost of ownership — not just the list price.",
  ],
} as const;
```

`apps/web/src/data/testimonials.ts`:

```ts
export type Testimonial = { quote: string; author: string; context: string };

/** Our own sample testimonials (Google reviews come later). Fair-Housing-clean: about service, not people. */
export const TESTIMONIALS: readonly Testimonial[] = [
  {
    quote:
      "Nilyan walked us through every cost — taxes, insurance, HOA — before we made an offer. No surprises at closing.",
    author: "M. & J. Alvarez",
    context: "Bought in Coral Gables",
  },
  {
    quote:
      "She priced our home right and it sold quickly. Communication was fast and honest the whole way through.",
    author: "Priya N.",
    context: "Sold in Orlando",
  },
  {
    quote:
      "As first-time renters we felt looked after. Nilyan found us the right place and explained the lease clearly.",
    author: "Daniel R.",
    context: "Rented in Tampa",
  },
];
```

`apps/web/src/data/areas.ts`:

```ts
export type Area = { name: string; slug: string; blurb: string; image: string };

/** Curated explore-by-area tiles. Links resolve to /areas/[city] (built in D12). Photos are free-license. */
export const FEATURED_AREAS: readonly Area[] = [
  {
    name: "Miami",
    slug: "miami",
    blurb: "Coastal energy, walkable neighborhoods, and a global market.",
    image: "https://images.unsplash.com/photo-1535498730771-e735b998cd64?w=800&q=70",
  },
  {
    name: "Coral Gables",
    slug: "coral-gables",
    blurb: "Tree-lined avenues and Mediterranean architecture.",
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=70",
  },
  {
    name: "Naples",
    slug: "naples",
    blurb: "Gulf-coast calm with refined waterfront living.",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=70",
  },
  {
    name: "Orlando",
    slug: "orlando",
    blurb: "Central-Florida growth, new communities, and value.",
    image: "https://images.unsplash.com/photo-1597466599360-3b9775841aec?w=800&q=70",
  },
  {
    name: "Tampa",
    slug: "tampa",
    blurb: "Bayfront revival with character-filled districts.",
    image: "https://images.unsplash.com/photo-1605723517503-3cadb5818a0c?w=800&q=70",
  },
  {
    name: "Fort Lauderdale",
    slug: "fort-lauderdale",
    blurb: "Canalside homes and an easygoing coastal pace.",
    image: "https://images.unsplash.com/photo-1597006438013-0f0cca2c1f1b?w=800&q=70",
  },
];
```

> Verify these Unsplash IDs load on `pnpm dev`; if any 404, swap for another free-license Unsplash URL (the seed already uses `images.unsplash.com`). The card has a graceful gradient fallback if an image fails.

- [ ] **Step 2: Hero**

`apps/web/src/components/home/Hero.tsx`:

```tsx
import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import styles from "./Hero.module.css";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1920&q=70";

export function Hero() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // D2 builds /search; we pass the query through now.
    void router.push(q.trim() ? `/search?q=${encodeURIComponent(q.trim())}` : "/search");
  }

  return (
    <section
      className={styles.hero}
      style={{ backgroundImage: `linear-gradient(rgba(11,24,22,.45), rgba(11,24,22,.55)), url(${HERO_IMAGE})` }}
    >
      <Container>
        <div className={styles.inner}>
          <p className={styles.eyebrow}>Florida · Licensed Realtor®</p>
          <h1 className={styles.title}>Find your place in Florida.</h1>
          <p className={styles.lede}>
            Curated properties across Miami, Coral Gables, Naples and the entire coast. Buy, sell or
            rent with confidence.
          </p>

          <form className={styles.search} onSubmit={onSubmit} role="search">
            <label className={styles.searchLabel} htmlFor="hero-search">
              Search by city, neighborhood, or ZIP
            </label>
            <div className={styles.searchRow}>
              <input
                id="hero-search"
                className={styles.input}
                type="search"
                placeholder="City, neighborhood, or ZIP"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <button type="submit" className={styles.searchBtn}>
                Search
              </button>
            </div>
          </form>

          <div className={styles.intents}>
            <span className={styles.intentsLabel}>I want to</span>
            <Link href="/buy" className={styles.intent}>
              Buy
            </Link>
            <Link href="/sell" className={styles.intent}>
              Sell
            </Link>
            <Link href="/rent" className={styles.intent}>
              Rent
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
```

`apps/web/src/components/home/Hero.module.css`:

```css
.hero {
  position: relative;
  min-height: 92vh;
  display: flex;
  align-items: center;
  background-size: cover;
  background-position: center;
  /* Pull up under the transparent sticky header. */
  margin-top: -72px;
  padding-top: 72px;
  color: #fff;
}

.inner {
  max-width: 720px;
  padding-block: 80px;
}
.eyebrow {
  font-family: var(--font-sans), system-ui, sans-serif;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.85);
  margin: 0 0 18px;
}
.title {
  font-family: var(--font-serif), Georgia, serif;
  font-size: clamp(40px, 7vw, 68px);
  line-height: 1.04;
  font-weight: 400;
  color: #fff;
  margin: 0;
}
.lede {
  margin: 18px 0 0;
  max-width: 540px;
  font-size: clamp(16px, 2.2vw, 19px);
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.9);
}

.search {
  margin-top: 28px;
  max-width: 560px;
}
.searchLabel {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
.searchRow {
  display: flex;
  gap: 8px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: var(--radius-pill);
  backdrop-filter: blur(8px);
}
.input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  color: #fff;
  font-family: var(--font-sans), system-ui, sans-serif;
  font-size: 15px;
  padding: 10px 16px;
  outline: none;
}
.input::placeholder {
  color: rgba(255, 255, 255, 0.75);
}
.searchBtn {
  flex-shrink: 0;
  font-family: var(--font-sans), system-ui, sans-serif;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: #fff;
  background: var(--color-bronze);
  border: none;
  border-radius: var(--radius-pill);
  padding: 11px 24px;
  cursor: pointer;
  box-shadow: var(--shadow-bronze);
  transition: background-color var(--dur-base) var(--ease-standard);
}
.searchBtn:hover {
  background: var(--color-bronze-dark);
}

.intents {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 22px;
}
.intentsLabel {
  font-size: 13px;
  letter-spacing: 0.04em;
  color: rgba(255, 255, 255, 0.8);
}
.intent {
  font-family: var(--font-sans), system-ui, sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  padding: 9px 20px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: var(--radius-pill);
  transition: background-color var(--dur-base) var(--ease-standard);
}
.intent:hover {
  background: rgba(255, 255, 255, 0.16);
}

@media (max-width: 768px) {
  .hero {
    min-height: 88vh;
  }
  .searchRow {
    flex-direction: column;
    border-radius: var(--radius-md);
  }
  .searchBtn {
    border-radius: var(--radius-sm);
  }
}
```

- [ ] **Step 3: FeaturedListings strip**

`apps/web/src/components/home/FeaturedListings.tsx`:

```tsx
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/motion/Reveal";
import { ListingCard } from "@/components/ui/ListingCard";
import type { ListingCardVM } from "@/lib/listing";
import styles from "./FeaturedListings.module.css";

export function FeaturedListings({ listings }: { listings: ListingCardVM[] }) {
  return (
    <section className={styles.section}>
      <Container>
        <Reveal>
          <div className={styles.head}>
            <div>
              <Eyebrow>Featured</Eyebrow>
              <h2 className={styles.title}>Handpicked Florida homes</h2>
            </div>
            <Link href="/search" className={styles.viewAll}>
              View all listings →
            </Link>
          </div>

          {listings.length > 0 ? (
            <div className={styles.grid}>
              {listings.map((l) => (
                <ListingCard key={l.slug} listing={l} />
              ))}
            </div>
          ) : (
            <p className={styles.empty}>
              Listings are loading — please check back shortly.
            </p>
          )}
        </Reveal>
      </Container>
    </section>
  );
}
```

`apps/web/src/components/home/FeaturedListings.module.css`:

```css
.section {
  padding-block: 72px;
}
.head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 32px;
}
.title {
  font-size: clamp(28px, 4vw, 42px);
  line-height: 1.06;
  margin: 8px 0 0;
}
.viewAll {
  flex-shrink: 0;
  font-family: var(--font-sans), system-ui, sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-bronze);
}
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}
.empty {
  color: var(--color-stone);
  font-size: 15px;
}

@media (max-width: 900px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 560px) {
  .grid {
    grid-template-columns: 1fr;
  }
  .head {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
```

- [ ] **Step 4: Rewrite the Home page (ISR)**

Rewrite `apps/web/src/pages/index.tsx` (replaces the F3 preview):

```tsx
import Head from "next/head";
import type { GetStaticProps } from "next";
import { getFeaturedListings } from "@herrera/db";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Hero } from "@/components/home/Hero";
import { FeaturedListings } from "@/components/home/FeaturedListings";
import { toListingCardVM, type ListingCardVM } from "@/lib/listing";

type HomeProps = { featured: ListingCardVM[] };

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  let featured: ListingCardVM[] = [];
  try {
    const rows = await getFeaturedListings(6);
    featured = rows.map(toListingCardVM);
  } catch (err) {
    // Resilient: keep the build green without DATABASE_URL; ISR refills after deploy.
    console.warn("[home] featured listings unavailable:", (err as Error).message);
  }
  return { props: { featured }, revalidate: 300 };
};

export default function Home({ featured }: HomeProps) {
  return (
    <SiteLayout transparentHeader>
      <Head>
        <title>Herrera — Find your place in Florida</title>
        <meta
          name="description"
          content="Premium real estate guidance in Florida. Browse listings and buy, sell or rent with confidence."
        />
      </Head>
      <Hero />
      <FeaturedListings listings={featured} />
    </SiteLayout>
  );
}
```

> Remaining sections (MapPreview, ExploreAreas, CaptureInvite, Trust) are added in Task 8. After this step the Home renders Hero + Featured only — a valid, reviewable midpoint.

- [ ] **Step 5: Verify (build hits the DB if `DATABASE_URL` is set)**

Run: `pnpm format && pnpm format:check && pnpm lint && pnpm typecheck && pnpm test`
Expected: all green.

Run: `pnpm --filter @herrera/web build`
Expected: builds `/` as ISR. With `apps/web/.env.local` `DATABASE_URL` set → featured listings render; without → empty-state (no crash).

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/data/ apps/web/src/components/home/Hero.tsx apps/web/src/components/home/Hero.module.css apps/web/src/components/home/FeaturedListings.tsx apps/web/src/components/home/FeaturedListings.module.css apps/web/src/pages/index.tsx
git commit -m "feat(web): real Home — hero (search + Buy/Sell/Rent) + featured listings (ISR)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Remaining home sections (map preview, areas, capture, trust) + full verification

**Files:**
- Create: `apps/web/src/components/home/MapPreview.tsx` + `MapPreview.module.css`
- Create: `apps/web/src/components/home/ExploreAreas.tsx` + `ExploreAreas.module.css`
- Create: `apps/web/src/components/home/CaptureInvite.tsx` + `CaptureInvite.module.css`
- Create: `apps/web/src/components/home/Trust.tsx` + `Trust.module.css`
- Modify: `apps/web/src/pages/index.tsx` (mount the four sections)

**Interfaces:**
- Consumes: `Container`, `Button`, `Eyebrow`, `Reveal`, `FEATURED_AREAS`, `TESTIMONIALS`, `REALTOR`.
- Produces: `<MapPreview />`, `<ExploreAreas />`, `<CaptureInvite />`, `<Trust />`.

- [ ] **Step 1: MapPreview (static teaser → /search)**

`apps/web/src/components/home/MapPreview.tsx`:

```tsx
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
import styles from "./MapPreview.module.css";

export function MapPreview() {
  return (
    <section className={styles.section}>
      <Container>
        <Reveal>
          <div className={styles.grid}>
            <div className={styles.copy}>
              <Eyebrow>Search the map</Eyebrow>
              <h2 className={styles.title}>Explore listings on an interactive map</h2>
              <p className={styles.text}>
                Pan and zoom to see what's available, draw your own search zone, and compare
                neighborhoods side by side. The list and the map stay in sync.
              </p>
              <Link href="/search">
                <Button variant="secondary" size="lg">
                  Open map search
                </Button>
              </Link>
            </div>
            <Link href="/search" className={styles.preview} aria-label="Open map search">
              <div className={styles.pin} style={{ top: "32%", left: "28%" }} />
              <div className={styles.pin} style={{ top: "52%", left: "58%" }} />
              <div className={styles.pin} style={{ top: "68%", left: "38%" }} />
              <span className={styles.previewLabel}>Interactive map · built in the search view</span>
            </Link>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
```

`apps/web/src/components/home/MapPreview.module.css`:

```css
.section {
  padding-block: 72px;
  background: var(--color-sand-100);
}
.grid {
  display: grid;
  grid-template-columns: 1fr 1.15fr;
  align-items: center;
  gap: 48px;
}
.title {
  font-size: clamp(28px, 4vw, 42px);
  line-height: 1.06;
  margin: 10px 0 0;
}
.text {
  margin: 16px 0 24px;
  max-width: 440px;
  font-size: 16px;
  line-height: 1.65;
  color: var(--color-stone);
}
.preview {
  position: relative;
  display: block;
  aspect-ratio: 16 / 10;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  overflow: hidden;
  background:
    radial-gradient(circle at 30% 30%, rgba(183, 210, 206, 0.5), transparent 60%),
    radial-gradient(circle at 70% 70%, rgba(196, 207, 168, 0.4), transparent 55%),
    var(--color-sage);
  box-shadow: var(--shadow-card);
}
.pin {
  position: absolute;
  width: 14px;
  height: 14px;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  background: var(--color-bronze);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}
.previewLabel {
  position: absolute;
  left: 16px;
  bottom: 14px;
  font-family: var(--font-sans), system-ui, sans-serif;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--color-forest);
  background: rgba(255, 255, 255, 0.8);
  padding: 6px 10px;
  border-radius: var(--radius-xs);
}

@media (max-width: 900px) {
  .grid {
    grid-template-columns: 1fr;
    gap: 28px;
  }
}
```

- [ ] **Step 2: ExploreAreas**

`apps/web/src/components/home/ExploreAreas.tsx`:

```tsx
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/motion/Reveal";
import { FEATURED_AREAS } from "@/data/areas";
import styles from "./ExploreAreas.module.css";

export function ExploreAreas() {
  return (
    <section className={styles.section}>
      <Container>
        <Reveal>
          <Eyebrow>Explore by area</Eyebrow>
          <h2 className={styles.title}>Find the right corner of Florida</h2>
          <div className={styles.grid}>
            {FEATURED_AREAS.map((area) => (
              <Link key={area.slug} href={`/areas/${area.slug}`} className={styles.tile}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={area.image} alt={area.name} className={styles.img} loading="lazy" />
                <div className={styles.scrim} />
                <div className={styles.tileBody}>
                  <h3 className={styles.tileName}>{area.name}</h3>
                  <p className={styles.tileBlurb}>{area.blurb}</p>
                </div>
              </Link>
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
```

`apps/web/src/components/home/ExploreAreas.module.css`:

```css
.section {
  padding-block: 72px;
}
.title {
  font-size: clamp(28px, 4vw, 42px);
  line-height: 1.06;
  margin: 8px 0 32px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
.tile {
  position: relative;
  display: block;
  aspect-ratio: 3 / 4;
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-card);
  color: #fff;
}
.img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--dur-reveal) var(--ease-standard);
}
.tile:hover .img {
  transform: scale(1.05);
}
.scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(11, 24, 22, 0.72), rgba(11, 24, 22, 0) 55%);
}
.tileBody {
  position: absolute;
  left: 18px;
  right: 18px;
  bottom: 16px;
}
.tileName {
  font-family: var(--font-serif), Georgia, serif;
  font-size: 24px;
  color: #fff;
  margin: 0;
}
.tileBlurb {
  margin: 4px 0 0;
  font-size: 13.5px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.88);
}

@media (max-width: 900px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 560px) {
  .grid {
    grid-template-columns: 1fr;
  }
  .tile {
    aspect-ratio: 16 / 10;
  }
}
```

- [ ] **Step 3: CaptureInvite (lead magnet band)**

`apps/web/src/components/home/CaptureInvite.tsx`:

```tsx
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
import styles from "./CaptureInvite.module.css";

export function CaptureInvite() {
  return (
    <section className={styles.section}>
      <Container>
        <Reveal>
          <div className={styles.band}>
            <Eyebrow>What will it really cost?</Eyebrow>
            <h2 className={styles.title}>Know the true monthly cost before you fall in love.</h2>
            <p className={styles.text}>
              Florida ownership is more than a list price — insurance, flood exposure, taxes, HOA and
              CDD fees all add up. Tell us what you're looking for and Nilyan will send a clear,
              honest breakdown. All figures are estimates.
            </p>
            <div className={styles.actions}>
              <Link href="/buy">
                <Button variant="primary" size="lg">
                  Start with what you want
                </Button>
              </Link>
              <Link href="/home-value">
                <Button variant="ghost" size="lg">
                  What's my home worth?
                </Button>
              </Link>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
```

`apps/web/src/components/home/CaptureInvite.module.css`:

```css
.section {
  padding-block: 72px;
}
.band {
  background: var(--color-forest);
  color: #fff;
  border-radius: var(--radius-md);
  padding: clamp(32px, 6vw, 64px);
  text-align: center;
}
.band :global(.eyebrow) {
  color: var(--color-bronze-light);
}
.title {
  font-size: clamp(26px, 4vw, 40px);
  line-height: 1.1;
  color: #fff;
  margin: 10px auto 0;
  max-width: 680px;
}
.text {
  margin: 18px auto 28px;
  max-width: 560px;
  font-size: 16px;
  line-height: 1.65;
  color: rgba(255, 255, 255, 0.85);
}
.actions {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 14px;
}
.actions :global(.ghost),
.band :global(button) {
  /* keep ghost readable on the dark band */
}
```

> The `:global(.eyebrow)` override is safe because `Eyebrow` uses the literal class `eyebrow`. If CSS Modules hashing makes that brittle, instead pass a custom color by wrapping the eyebrow text in a `<span style={{ color: "var(--color-bronze-light)" }}>` — but the global selector works because `Eyebrow.module.css` defines `.eyebrow` and CSS Modules scopes it; to be certain, verify in `pnpm dev`. **Simpler fallback:** drop the `:global` rule and accept the default stone eyebrow color (still on-brand on dark? no — stone is dark). **Decision:** keep a dedicated light eyebrow by NOT using `Eyebrow` here; render `<p className={styles.eyebrowLight}>What will it really cost?</p>` with its own class. Implement that fallback to avoid `:global` fragility:

Replace the `<Eyebrow>` usage in `CaptureInvite.tsx` with:

```tsx
<p className={styles.eyebrowLight}>What will it really cost?</p>
```

and add to `CaptureInvite.module.css`:

```css
.eyebrowLight {
  font-family: var(--font-sans), system-ui, sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-bronze-light);
  margin: 0;
}
```

(Remove the now-unused `Eyebrow` import and the `:global(.eyebrow)` rule.)

- [ ] **Step 4: Trust (bio + testimonials)**

`apps/web/src/components/home/Trust.tsx`:

```tsx
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
import { REALTOR } from "@/data/realtor";
import { TESTIMONIALS } from "@/data/testimonials";
import styles from "./Trust.module.css";

export function Trust() {
  return (
    <section className={styles.section}>
      <Container>
        <Reveal>
          <div className={styles.bio}>
            <div className={styles.avatar} aria-hidden="true">
              {REALTOR.monogram}
            </div>
            <div>
              <Eyebrow>{REALTOR.title}</Eyebrow>
              <h2 className={styles.name}>{REALTOR.name}</h2>
              {REALTOR.bioLong.map((p) => (
                <p key={p.slice(0, 24)} className={styles.bioText}>
                  {p}
                </p>
              ))}
              <Link href="/about">
                <Button variant="ghost">More about Nilyan</Button>
              </Link>
            </div>
          </div>

          <ul className={styles.testimonials}>
            {TESTIMONIALS.map((t) => (
              <li key={t.author} className={styles.quote}>
                <p className={styles.quoteText}>“{t.quote}”</p>
                <p className={styles.quoteAuthor}>
                  {t.author} · <span className={styles.quoteContext}>{t.context}</span>
                </p>
              </li>
            ))}
          </ul>
        </Reveal>
      </Container>
    </section>
  );
}
```

`apps/web/src/components/home/Trust.module.css`:

```css
.section {
  padding-block: 72px;
  background: var(--color-sand-100);
}
.bio {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 28px;
  align-items: start;
  max-width: 840px;
}
.avatar {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-forest);
  color: var(--color-bronze-light);
  font-family: var(--font-serif), Georgia, serif;
  font-size: 30px;
  letter-spacing: 0.06em;
}
.name {
  font-size: clamp(28px, 4vw, 38px);
  line-height: 1.08;
  margin: 8px 0 12px;
}
.bioText {
  margin: 0 0 12px;
  font-size: 16px;
  line-height: 1.7;
  color: var(--color-ink-soft);
  max-width: 620px;
}

.testimonials {
  list-style: none;
  margin: 48px 0 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
.quote {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 24px;
  box-shadow: var(--shadow-sm);
}
.quoteText {
  font-family: var(--font-serif), Georgia, serif;
  font-size: 18px;
  line-height: 1.5;
  color: var(--color-ink);
  margin: 0 0 16px;
}
.quoteAuthor {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-ink-soft);
  margin: 0;
}
.quoteContext {
  font-weight: 400;
  color: var(--color-stone);
}

@media (max-width: 900px) {
  .testimonials {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 560px) {
  .bio {
    grid-template-columns: 1fr;
    gap: 18px;
  }
}
```

- [ ] **Step 5: Mount the four sections in the Home page**

In `apps/web/src/pages/index.tsx`, add the imports and render the sections after `<FeaturedListings>`:

```tsx
import { MapPreview } from "@/components/home/MapPreview";
import { ExploreAreas } from "@/components/home/ExploreAreas";
import { CaptureInvite } from "@/components/home/CaptureInvite";
import { Trust } from "@/components/home/Trust";
```

```tsx
      <Hero />
      <FeaturedListings listings={featured} />
      <MapPreview />
      <ExploreAreas />
      <CaptureInvite />
      <Trust />
```

- [ ] **Step 6: Full verification + manual review**

Run: `pnpm format && pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm --filter @herrera/web build`
Expected: all green.

Run (manual): `pnpm dev` → http://localhost:3000 and confirm:
- Header is transparent white-text over the hero, turns solid (forest text + shadow) on scroll.
- Hero: search routes to `/search?q=...`; Buy/Sell/Rent link out.
- Featured strip shows real seeded listings (price-forward cards) when `DATABASE_URL` is set.
- Map-preview, Explore-areas (image tiles), Capture band (forest), Trust (bio + 3 testimonials).
- Footer: Equal Housing mark + notice, attribution, "sample data" line, legal links.
- Resize to mobile (<900px): hamburger menu opens/closes; grids stack; layout holds at 360px.
- Toggle OS "Reduce motion": section reveals + route transition are disabled (instant).
- Keyboard: Tab through header/cards/footer — visible bronze focus rings; menu button is operable.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/components/home/ apps/web/src/pages/index.tsx
git commit -m "feat(web): home sections — map preview, explore areas, capture invite, trust

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 9 (OPTIONAL — confirm): `/about` page (reuses bio + testimonials)

**Files:**
- Create: `apps/web/src/pages/about.tsx`

**Interfaces:**
- Consumes: `SiteLayout`, `Container`, `Eyebrow`, `Reveal`, `REALTOR`, `TESTIMONIALS`.

> Include only if decision 2 is accepted. Gives the "About" nav link a real destination and satisfies `docs/pages.md` (which assigns `/about` to D1). Header is **solid** (no hero) here.

- [ ] **Step 1: About page (ISR)**

`apps/web/src/pages/about.tsx`:

```tsx
import Head from "next/head";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/motion/Reveal";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { REALTOR } from "@/data/realtor";
import { TESTIMONIALS } from "@/data/testimonials";

export default function About() {
  return (
    <SiteLayout>
      <Head>
        <title>About Nilyan Herrera — Licensed Florida Realtor®</title>
        <meta
          name="description"
          content="Meet Nilyan Herrera, a licensed Florida Realtor® helping buyers, sellers, and renters across the state."
        />
      </Head>
      <Container>
        <div style={{ maxWidth: 760, paddingBlock: "96px 48px" }}>
          <Reveal>
            <Eyebrow>{REALTOR.title}</Eyebrow>
            <h1 style={{ fontSize: "clamp(34px, 6vw, 56px)", lineHeight: 1.05, margin: "12px 0 0" }}>
              {REALTOR.name}
            </h1>
            {REALTOR.bioLong.map((p) => (
              <p
                key={p.slice(0, 24)}
                style={{ fontSize: 17, lineHeight: 1.7, color: "var(--color-ink-soft)", marginTop: 18 }}
              >
                {p}
              </p>
            ))}
            <p style={{ marginTop: 18, color: "var(--color-stone)" }}>
              {REALTOR.license} ·{" "}
              <a href={`mailto:${REALTOR.email}`}>{REALTOR.email}</a> ·{" "}
              <a href={`tel:${REALTOR.phone.replace(/[^+\d]/g, "")}`}>{REALTOR.phone}</a>
            </p>
          </Reveal>
        </div>
      </Container>
      <section style={{ background: "var(--color-sand-100)", paddingBlock: 72 }}>
        <Container>
          <Reveal>
            <Eyebrow>What clients say</Eyebrow>
            <ul
              style={{
                listStyle: "none",
                margin: "24px 0 0",
                padding: 0,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 20,
              }}
            >
              {TESTIMONIALS.map((t) => (
                <li
                  key={t.author}
                  style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    padding: 24,
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <p style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: 18, lineHeight: 1.5, margin: "0 0 16px" }}>
                    “{t.quote}”
                  </p>
                  <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>
                    {t.author} · <span style={{ fontWeight: 400, color: "var(--color-stone)" }}>{t.context}</span>
                  </p>
                </li>
              ))}
            </ul>
          </Reveal>
        </Container>
      </section>
    </SiteLayout>
  );
}
```

> Inline styles are acceptable here (a thin reuse page); if you prefer, factor a shared `<Testimonials>` out of `Trust` and reuse it — optional refactor, not required.

- [ ] **Step 2: Verify**

Run: `pnpm format && pnpm format:check && pnpm lint && pnpm typecheck && pnpm --filter @herrera/web build`
Expected: all green; `/about` builds (ISR/static). Manual: header is solid from the top; "About" nav link resolves.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/about.tsx
git commit -m "feat(web): /about page (bio + credentials + testimonials)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review

**1. Spec coverage (BUILD_PLAYBOOK D1 + pages.md):**
- Public shell header/nav/footer → Tasks 5 (Header), 6 (Footer + SiteLayout). ✅
- Home hero with prominent location search + Buy/Sell/Rent → Task 7 (Hero). ✅
- Featured-listings strip (from our DB) → Tasks 3 (query), 4 (card), 7 (strip + ISR). ✅
- Band previewing the map search → Task 8 (MapPreview → /search). ✅
- Explore-by-area → Task 8 (ExploreAreas). ✅
- Capture invitation → Task 8 (CaptureInvite → /buy, /home-value). ✅
- Trust (Nilyan bio + our own testimonials) → Task 8 (Trust); data in Task 7. ✅
- Mobile-first → responsive rules in every module (hamburger <900px, stacking grids). ✅
- Design system / ADR-016 → tokens via `var(--...)`, Spectral/Hanken roles, green shadows, crisp radii, F3 primitives + `Reveal`; no Tailwind. ✅
- `/about` (pages.md → D1) → Task 9 (optional). ✅
- Compliance (Equal Housing + attribution in footer; FH-clean copy) → Task 6 + copy review. ✅

**2. Placeholder scan:** every file step contains complete code; every command lists expected output. No "TBD"/"add error handling"/"similar to". The only intentional non-final note is the `CaptureInvite` `:global` discussion, which resolves to a concrete `eyebrowLight` implementation in the same step. ✅

**3. Type consistency:** `ListingCardVM` shape is identical in `lib/listing.ts` (producer), the Task-2 test, `ListingCard` (consumer), and the Home `getStaticProps` (`rows.map(toListingCardVM)`). `getFeaturedListings(limit?: number): Promise<Listing[]>` is defined in Task 3 and consumed in Task 7. `Listing` is re-exported (Task 3) and imported by `lib/listing.ts`. `PRIMARY_NAV`/`FOOTER_NAV` defined in Task 5, consumed in Header/Footer. `useScrolled` / `SiteLayout transparentHeader` / `Header transparentOverHero` names match across files. `REALTOR.copyrightYear`/`bioLong`/`monogram`/`license`/`email`/`phone` defined in Task 7, used in Footer/Trust/About. ✅

## Risks / notes for the executor

- **Execution order across tasks:** `lib/listing.ts` (Task 2) imports `Listing` from `@herrera/db`, re-exported in **Task 3**; and the Footer (Task 6) imports `REALTOR` from **Task 7 Step 1**. Cleanest linear order: **3 → 2 → 4 → 5 → 7(Step 1 data) → 6 → 7(rest) → 8 → 9**, or simply create `data/realtor.ts` and run Task 3 before the verifies that need them. Each task's own gate still passes once its prerequisites exist.
- **Build without DB:** `getStaticProps` swallows DB errors → `featured: []`. The gate `build` stays green with no `DATABASE_URL`; the deployed/`.env.local` build shows real listings. (Per the user's note, put the rotated `DATABASE_URL` in `apps/web/.env.local`.)
- **Drizzle `numeric` → string:** `bathrooms` arrives as `"2.5"`; `formatBathsLabel` handles the string. `latitude/longitude` are also numeric strings but unused by the card.
- **next/image deferred (D14):** plain `<img>` avoids remote-host config; if Task 1 enabled `@next/next/no-img-element`, the inline `eslint-disable-next-line` comments suppress it intentionally (documented as a D14 upgrade).
- **Header overlay vs solid:** Home passes `transparentHeader`; the Hero pulls up under the 72px sticky header (`margin-top:-72px; padding-top:72px`). Other pages (e.g. `/about`) use the solid header from the top.
- **Unsplash IDs:** the `areas.ts` and `Hero` image URLs must be confirmed live on `pnpm dev`; the card/tile gradient fallbacks keep the layout intact if one 404s. Swap any dead URL for another `images.unsplash.com` photo (free license, same host as the seed).
- **No F3 primitive changes:** `Reveal`/`Section`/`Container`/`Button`/`Eyebrow` are reused unmodified; home bands wrap their own `<section className>` around `<Container><Reveal>` so band backgrounds work without extending `Reveal`.
- **Compliance copy:** keep area blurbs and testimonials about *places and service*, never about who lives somewhere (Fair Housing — no steering). A `security-compliance-auditor` pass is appropriate before the demo deploy (not required to merge D1).
