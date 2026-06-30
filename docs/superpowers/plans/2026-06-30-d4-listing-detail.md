# D4 — Listing Detail Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task (the user has chosen **inline execution**). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the rich, ISR-rendered `/homes/[slug]` listing detail page — gallery + video + virtual tour, key-facts strip, location map, mortgage calculator, similar listings, a per-listing inquiry/lead-capture module, schema.org JSON-LD, and the IDX/Equal-Housing compliance block — all fed through a single `toListingDetailVM` mapping seam so the future MLS feed swaps in one place.

**Architecture:** One ISR page (`getStaticProps` + `getStaticPaths` + `revalidate`, resilient to a missing DB at build, exactly like D1's home). The page reads one normalized `listings` row via a new `getListingBySlug` and runs it through `toListingDetailVM` — the **single field-mapping seam** the whole page renders from (when MLS arrives with different field names we change the mapper, not the components). The map reuses D2's client-only MapLibre pattern (`next/dynamic {ssr:false}`, single marker, no rebuild). The inquiry form is an MLS-independent lead path: it POSTs to a new public `/api/leads`, which creates a `lead` + per-channel `consent_records` via a `createListingInquiry` helper. The Florida cost panel stays D5 — D4 leaves only a clearly-marked, toggleable mount point.

**Tech Stack:** Next.js 15 (Pages Router) + React 19 + TS strict; ISR; Drizzle + PostGIS (Neon); Zod boundaries; MapLibre (client-only, reused from D2); vitest (pure-logic TDD); CSS Modules + design tokens.

## Global Constraints

- **Pages Router only** — no App Router, no server components, no `"use client"`. The map is client-only via `next/dynamic {ssr:false}` (reuse D2's pattern). The page itself is ISR.
- **TS strict** with `noUncheckedIndexedAccess` + `verbatimModuleSyntax`. Root `pnpm typecheck` covers `packages/*` only — **`apps/web` is type-checked by `pnpm --filter @herrera/web typecheck`** (run it for every web change).
- **Resilient ISR** (ADR-001 / like `apps/web/src/pages/index.tsx`): `getStaticPaths`/`getStaticProps` must keep the build green with no `DATABASE_URL` — wrap DB calls in try/catch; `fallback: "blocking"` + `revalidate` refill after deploy.
- **One mapping seam (ADR-005/006):** every listing field the page shows flows through `toListingDetailVM(listing)`. Components consume the VM, never a raw `Listing`. This is the swap point for the real MLS feed.
- **Reuse, don't rebuild:** `ListingCard` (D1) for the similar strip; the MapLibre client-only pattern + `MAP_STYLE_URL` (D2) for the location map; `SiteLayout`/`Button`/`Container`/`Section`/`Eyebrow`/`EqualHousingLogo` (D1). No restyling — design tokens only (`--color-forest #15302C`, `--color-paper #F3EFE7`, `--color-bronze #A9794A`, Spectral display + Hanken Grotesk UI).
- **Compliance (ADR-011), hard rules:** render an Equal Housing notice on the listing; on **real `source='mls'` rows** render broker/Realtor® attribution + the MLS/IDX disclaimer from the per-row fields; never paywall/login-gate a listing. Mortgage output is a **clearly-labeled ESTIMATE**, never a quote/advice. No steering language anywhere.
- **Lead capture (ADR-007/011):** per-listing inquiry creates a `lead` (intent default `buy`, `source='listing_inquiry'`, the listing slug in `viewedListingIds` + `answers`), **phone and/or email required — at least one, never force both**, plus a **per-channel consent record** for each channel the visitor provides + consents to. The full Buy/Sell/Rent typeform is **D7** — this is only the focused per-listing inquiry. Internal notifications are **D8** — leave a one-line seam.
- **Florida cost panel is D5, NOT D4** — leave one clearly-commented, toggleable mount point (`{/* D5 SEAM … */}`) and nothing else.
- **Commits:** one per task on `feat/d4-listing-detail`; every gate green before commit — `pnpm format:check && pnpm lint && pnpm --filter @herrera/web typecheck && pnpm test` (+ `pnpm --filter @herrera/web build` for tasks touching the page/SSR/API). **Branch base:** off `main` **if D3 is merged by execution time**, else off `feat/d3-filters` — D4's features list uses D3's `waterfront`/`pool`/`age_restricted` columns (see Open Decisions).

## File structure

**Create:**
- `apps/web/src/lib/listing-detail.ts` — `toListingDetailVM` mapper (the seam) + `toListingJsonLd` + `monthlyMortgage`.
- `apps/web/src/lib/listing-detail.test.ts` — mapper + JSON-LD + mortgage tests.
- `apps/web/src/pages/homes/[slug].tsx` — the ISR page (paths/props + assembly).
- `apps/web/src/components/listing/KeyFacts.tsx` (+ `.module.css`) — facts strip.
- `apps/web/src/components/listing/PhotoGallery.tsx` (+ `.module.css`) — gallery + video + virtual tour.
- `apps/web/src/components/listing/LocationMap.tsx` (+ `.module.css`) — client-only single-marker map.
- `apps/web/src/components/listing/MortgageCalculator.tsx` (+ `.module.css`) — estimate calc.
- `apps/web/src/components/listing/InquiryForm.tsx` (+ `.module.css`) — per-listing lead capture.
- `apps/web/src/components/listing/ListingCompliance.tsx` (+ `.module.css`) — attribution + MLS disclaimer + Equal Housing.
- `apps/web/src/components/listing/SimilarListings.tsx` (+ `.module.css`) — reuses `ListingCard`.
- `apps/web/src/components/listing/ListingDetail.module.css` — page layout (two-column + sticky aside).
- `packages/db/src/listings-detail.ts` — `getListingBySlug`, `getSimilarListings`, `getPublishedListingSlugs`.
- `packages/db/src/inquiries.ts` — `listingInquirySchema` + `createListingInquiry`.
- `packages/db/src/inquiries.test.ts` — inquiry schema validation tests.
- `apps/web/src/pages/api/leads.ts` — public POST endpoint.

**Modify:**
- `packages/db/src/index.ts` — export the new helpers + `listingInquirySchema`/`createListingInquiry` + `ListingDetailVM`-relevant types.
- `packages/db/src/seed/listings.ts` — give a few mock rows `videoUrl`/`virtualTourUrl` so the demo exercises media.

---

## Task 1: DB read helpers — by-slug, similar, published slugs

**Files:**
- Create: `packages/db/src/listings-detail.ts`
- Modify: `packages/db/src/index.ts`

**Interfaces:**
- Produces:
  - `getListingBySlug(slug: string): Promise<Listing | null>`
  - `getSimilarListings(opts: { slug: string; city: string; price: number; limit?: number }): Promise<Listing[]>`
  - `getPublishedListingSlugs(): Promise<string[]>`

- [ ] **Step 1: Create `packages/db/src/listings-detail.ts`**

```ts
import { and, eq, ne, sql } from "drizzle-orm";
import { getDb } from "./client";
import { listings, type Listing } from "./schema/listings";

/** One listing by its public slug (any visibility/status — the page decides what to render). */
export async function getListingBySlug(slug: string): Promise<Listing | null> {
  const rows = await getDb().select().from(listings).where(eq(listings.slug, slug)).limit(1);
  return rows[0] ?? null;
}

/** Up to `limit` public+active listings in the same city, nearest in price, excluding `slug`. */
export async function getSimilarListings(opts: {
  slug: string;
  city: string;
  price: number;
  limit?: number;
}): Promise<Listing[]> {
  return getDb()
    .select()
    .from(listings)
    .where(
      and(
        eq(listings.status, "active"),
        eq(listings.visibility, "public"),
        eq(listings.city, opts.city),
        ne(listings.slug, opts.slug),
      ),
    )
    .orderBy(sql`abs(${listings.price} - ${opts.price})`)
    .limit(opts.limit ?? 4);
}

/** Slugs to pre-render at build (public + active). Off-market/private-link render on demand. */
export async function getPublishedListingSlugs(): Promise<string[]> {
  const rows = await getDb()
    .select({ slug: listings.slug })
    .from(listings)
    .where(and(eq(listings.status, "active"), eq(listings.visibility, "public")));
  return rows.map((r) => r.slug);
}
```

- [ ] **Step 2: Export from `packages/db/src/index.ts`** (add after the `searchListings` export line):

```ts
export {
  getListingBySlug,
  getSimilarListings,
  getPublishedListingSlugs,
} from "./listings-detail";
```

- [ ] **Step 3: Verify live against Neon** (the read helpers are integration-verified, like D2's search). Write a scratchpad script:

```ts
// scratchpad/d4-db-check.ts
import { getListingBySlug, getSimilarListings, getPublishedListingSlugs } from "<repo>/packages/db/src/listings-detail";
async function main() {
  const slugs = await getPublishedListingSlugs();
  console.log("published slugs:", slugs.length);
  const one = await getListingBySlug(slugs[0]!);
  console.log("by slug:", one?.slug, one?.city, one?.price);
  const sim = await getSimilarListings({ slug: one!.slug, city: one!.city, price: one!.price });
  console.log("similar:", sim.length, sim.map((s) => s.slug));
  console.log("missing slug → null:", (await getListingBySlug("does-not-exist")) === null);
}
main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
```

Run with the repo-root env: `set -a && . ./.env.local && set +a && pnpm --filter @herrera/db exec tsx scratchpad/d4-db-check.ts`
Expected: `published slugs: 120`, a real by-slug row, `similar: 1–4` same-city slugs, `missing slug → null: true`.

- [ ] **Step 4: Gate + commit**

```bash
pnpm typecheck && pnpm --filter @herrera/db exec vitest run
git add packages/db/src/listings-detail.ts packages/db/src/index.ts
git commit -m "feat(db): listing-detail read helpers (by-slug, similar, published slugs)"
```

---

## Task 2: `toListingDetailVM` mapper + JSON-LD + mortgage (the seam)

**Files:**
- Create: `apps/web/src/lib/listing-detail.ts`
- Create: `apps/web/src/lib/listing-detail.test.ts`

**Interfaces:**
- Consumes: `Listing` (structural source, below); `formatPrice`, `formatPropertyType`, `formatBedsLabel`, `formatBathsLabel`, `formatSqftLabel` from `@/lib/listing`.
- Produces:
  - `type ListingDetailVM` (full shape below)
  - `toListingDetailVM(l: ListingDetailSource): ListingDetailVM`
  - `monthlyMortgage(principal: number, annualRatePct: number, termYears: number): number`
  - `toListingJsonLd(vm: ListingDetailVM, canonicalUrl: string): object`

- [ ] **Step 1: Write the failing tests** — `apps/web/src/lib/listing-detail.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { monthlyMortgage, toListingDetailVM, toListingJsonLd } from "./listing-detail";

const base = {
  slug: "winter-park-abc-1",
  source: "mock" as const,
  status: "active" as const,
  price: 750000,
  propertyType: "single_family",
  bedrooms: 4,
  bathrooms: "2.5",
  sqft: 2400,
  lotSizeSqft: 8000,
  yearBuilt: 2018,
  description: "A bright home near the park.",
  addressLine1: "123 Oak St",
  addressLine2: null,
  city: "Winter Park",
  state: "FL",
  zip: "32789",
  latitude: "28.59",
  longitude: "-81.35",
  photos: [{ url: "https://x/1.jpg", caption: "Front" }, { url: "https://x/2.jpg" }],
  videoUrl: null,
  virtualTourUrl: "https://tour/abc",
  waterfront: true,
  pool: false,
  ageRestricted: false,
  hoaFeeMonthly: null,
  listingBrokerageName: null,
  listingAgentName: null,
  originatingMls: null,
  createdAt: new Date(),
};

describe("toListingDetailVM", () => {
  const vm = toListingDetailVM(base);
  it("maps headline facts + media", () => {
    expect(vm.priceLabel).toBe("$750,000");
    expect(vm.gallery).toHaveLength(2);
    expect(vm.gallery[0]).toMatchObject({ url: "https://x/1.jpg", caption: "Front" });
    expect(vm.virtualTourUrl).toBe("https://tour/abc");
    expect(vm.video).toBeNull();
    expect(vm.location).toEqual({ lng: -81.35, lat: 28.59 });
  });
  it("builds a key-facts strip", () => {
    const labels = vm.keyFacts.map((f) => f.label);
    expect(labels).toEqual(["Price", "Beds", "Baths", "Sqft", "Type", "Year built", "Lot"]);
    expect(vm.keyFacts.find((f) => f.label === "Beds")?.value).toBe("4");
  });
  it("derives a features list from booleans", () => {
    expect(vm.features).toContain("Waterfront");
    expect(vm.features).not.toContain("Private pool");
  });
  it("marks non-MLS rows so the MLS disclaimer is suppressed", () => {
    expect(vm.compliance.isMls).toBe(false);
  });
});

describe("monthlyMortgage", () => {
  it("amortizes a normal loan", () => {
    // 600000 @ 6.5% / 30y ≈ 3792.0
    expect(Math.round(monthlyMortgage(600000, 6.5, 30))).toBe(3792);
  });
  it("handles a 0% rate as principal / months", () => {
    expect(monthlyMortgage(360000, 0, 30)).toBe(1000);
  });
  it("returns 0 for a non-positive principal", () => {
    expect(monthlyMortgage(0, 6, 30)).toBe(0);
    expect(monthlyMortgage(-5, 6, 30)).toBe(0);
  });
});

describe("toListingJsonLd", () => {
  it("emits a residence node + an offer with the price", () => {
    const ld = toListingJsonLd(toListingDetailVM(base), "https://h.com/homes/winter-park-abc-1") as {
      "@graph": { "@type": string; price?: number; priceCurrency?: string }[];
    };
    const offer = ld["@graph"].find((n) => n["@type"] === "Offer");
    expect(offer?.price).toBe(750000);
    expect(offer?.priceCurrency).toBe("USD");
    expect(ld["@graph"].some((n) => n["@type"] === "SingleFamilyResidence")).toBe(true);
  });
});
```

- [ ] **Step 2: Run — expect FAIL** (module missing).

Run: `pnpm --filter @herrera/web exec vitest run src/lib/listing-detail.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `apps/web/src/lib/listing-detail.ts`**

```ts
import {
  formatBathsLabel,
  formatBedsLabel,
  formatPrice,
  formatPropertyType,
  formatSqftLabel,
  type ListingCardSource,
} from "./listing";

export type GalleryImage = { url: string; caption: string | null; alt: string };
export type KeyFact = { label: string; value: string };
export type ListingDetailVM = {
  slug: string;
  href: string;
  priceLabel: string;
  price: number;
  title: string; // address line 1
  cityLine: string; // "City, ST ZIP"
  propertyTypeLabel: string;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  description: string | null;
  gallery: GalleryImage[];
  video: string | null;
  virtualTourUrl: string | null;
  keyFacts: KeyFact[];
  features: string[];
  location: { lng: number; lat: number } | null;
  status: string;
  compliance: {
    isMls: boolean;
    brokerageName: string | null;
    agentName: string | null;
    originatingMls: string | null;
  };
};

// Structural source — a `Listing` satisfies it. The ONE place MLS field-name differences are mapped.
export type ListingDetailSource = ListingCardSource & {
  source: string;
  status: string;
  lotSizeSqft: number | null;
  yearBuilt: number | null;
  description: string | null;
  addressLine2: string | null;
  latitude: string | null;
  longitude: string | null;
  photos: { url: string; caption?: string }[];
  videoUrl: string | null;
  virtualTourUrl: string | null;
  waterfront: boolean;
  pool: boolean;
  ageRestricted: boolean;
  hoaFeeMonthly: number | null;
  listingBrokerageName: string | null;
  listingAgentName: string | null;
  originatingMls: string | null;
};

const PT_TO_SCHEMA: Record<string, string> = {
  single_family: "SingleFamilyResidence",
  condo: "Apartment",
  co_op: "Apartment",
  townhouse: "House",
  villa: "House",
  multi_family: "ApartmentComplex",
  land: "Place",
  mobile: "Residence",
  other: "Residence",
};

export function toListingDetailVM(l: ListingDetailSource): ListingDetailVM {
  const propertyTypeLabel = formatPropertyType(l.propertyType);
  const bathsNum = l.bathrooms == null ? null : Number(l.bathrooms);
  const lat = l.latitude == null ? null : Number(l.latitude);
  const lng = l.longitude == null ? null : Number(l.longitude);

  const keyFacts: KeyFact[] = [
    { label: "Price", value: formatPrice(l.price) },
    { label: "Beds", value: l.bedrooms == null ? "—" : String(l.bedrooms) },
    { label: "Baths", value: bathsNum == null ? "—" : String(bathsNum) },
    { label: "Sqft", value: l.sqft == null ? "—" : l.sqft.toLocaleString("en-US") },
    { label: "Type", value: propertyTypeLabel },
    { label: "Year built", value: l.yearBuilt == null ? "—" : String(l.yearBuilt) },
    { label: "Lot", value: l.lotSizeSqft == null ? "—" : `${l.lotSizeSqft.toLocaleString("en-US")} sqft` },
  ];

  const features: string[] = [];
  if (l.waterfront) features.push("Waterfront");
  if (l.pool) features.push("Private pool");
  if (l.ageRestricted) features.push("55+ community");
  if (l.hoaFeeMonthly == null || l.hoaFeeMonthly === 0) features.push("No HOA fees");

  const gallery: GalleryImage[] = l.photos.map((p, i) => ({
    url: p.url,
    caption: p.caption ?? null,
    alt: p.caption ?? `${propertyTypeLabel} at ${l.addressLine1}, ${l.city} — photo ${i + 1}`,
  }));

  return {
    slug: l.slug,
    href: `/homes/${l.slug}`,
    priceLabel: formatPrice(l.price),
    price: l.price,
    title: l.addressLine1,
    cityLine: `${l.city}, ${l.state} ${l.zip}`,
    propertyTypeLabel,
    beds: l.bedrooms,
    baths: bathsNum,
    sqft: l.sqft,
    description: l.description,
    gallery,
    video: l.videoUrl,
    virtualTourUrl: l.virtualTourUrl,
    keyFacts,
    features,
    location: lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng) ? { lng, lat } : null,
    status: l.status,
    compliance: {
      isMls: l.source === "mls",
      brokerageName: l.listingBrokerageName,
      agentName: l.listingAgentName,
      originatingMls: l.originatingMls,
    },
  };
}

/** Monthly principal+interest payment (ESTIMATE). 0% → principal/months; non-positive principal → 0. */
export function monthlyMortgage(principal: number, annualRatePct: number, termYears: number): number {
  if (principal <= 0 || termYears <= 0) return 0;
  const n = termYears * 12;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return principal / n;
  const f = Math.pow(1 + r, n);
  return (principal * r * f) / (f - 1);
}

export function toListingJsonLd(vm: ListingDetailVM, canonicalUrl: string): object {
  const [city, rest] = vm.cityLine.split(",");
  const residence: Record<string, unknown> = {
    "@type": PT_TO_SCHEMA[vm.propertyTypeLabel] ?? "Residence",
    name: `${vm.title}, ${city}`,
    url: canonicalUrl,
    image: vm.gallery.map((g) => g.url),
    address: {
      "@type": "PostalAddress",
      streetAddress: vm.title,
      addressLocality: city?.trim(),
      addressRegion: rest?.trim().split(" ")[0],
      postalCode: rest?.trim().split(" ")[1],
      addressCountry: "US",
    },
  };
  if (vm.beds != null) residence.numberOfRooms = vm.beds;
  if (vm.baths != null) residence.numberOfBathroomsTotal = vm.baths;
  if (vm.sqft != null)
    residence.floorSize = { "@type": "QuantitativeValue", value: vm.sqft, unitText: "SqFt" };
  if (vm.location) residence.geo = { "@type": "GeoCoordinates", latitude: vm.location.lat, longitude: vm.location.lng };
  return {
    "@context": "https://schema.org",
    "@graph": [
      residence,
      {
        "@type": "Offer",
        price: vm.price,
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        url: canonicalUrl,
      },
    ],
  };
}
```

Note the JSON-LD `@type` lookup uses `PT_TO_SCHEMA[vm.propertyTypeLabel]` — that's wrong (it's keyed by raw type). Fix: thread the raw `propertyType` into the VM. **Add** `propertyType: string` to `ListingDetailVM`, set it in the mapper (`propertyType: l.propertyType`), and in `toListingJsonLd` use `PT_TO_SCHEMA[vm.propertyType] ?? "Residence"`. (Update the test's `SingleFamilyResidence` expectation stays valid.)

- [ ] **Step 4: Run the tests — expect PASS.**

Run: `pnpm --filter @herrera/web exec vitest run src/lib/listing-detail.test.ts`
Expected: PASS (all groups).

- [ ] **Step 5: Commit**

```bash
pnpm --filter @herrera/web typecheck
git add apps/web/src/lib/listing-detail.ts apps/web/src/lib/listing-detail.test.ts
git commit -m "feat(web): toListingDetailVM mapping seam + JSON-LD + mortgage estimate (TDD)"
```

---

## Task 3: Seed media — video + virtual tour on a few rows

**Files:**
- Modify: `packages/db/src/seed/listings.ts:73-107` (the `buildOne` return)

**Interfaces:**
- Consumes: nothing new.
- Produces: a few `mock` rows with non-null `videoUrl` / `virtualTourUrl` so the gallery's video + tour render in the demo.

- [ ] **Step 1: Give a deterministic subset media** — in `buildOne`, replace the `videoUrl: null,` / `virtualTourUrl: null,` lines with:

```ts
    // A deterministic ~1-in-6 / 1-in-4 of mock rows carry media so the demo exercises both.
    videoUrl: source === "mock" && rng.chance(0.18) ? "https://www.youtube.com/embed/aqz-KE-bpKQ" : null,
    virtualTourUrl: source === "mock" && rng.chance(0.25) ? "https://my.matterport.com/show/?m=SxQL3iGyvQk" : null,
```

(Public sample embeds — replaced with real per-listing media when MLS arrives.)

- [ ] **Step 2: Re-seed Neon**

```bash
pnpm db:seed
```

Expected: `Seed complete` with `listings: 124`.

- [ ] **Step 3: Verify a few rows carry media (live)**

```bash
# scratchpad one-off: SELECT count(*) FILTER (WHERE video_url IS NOT NULL) AS v,
#   count(*) FILTER (WHERE virtual_tour_url IS NOT NULL) AS t FROM listings WHERE source='mock';
```

Expected: both `> 0`.

- [ ] **Step 4: Gate + commit**

```bash
pnpm --filter @herrera/db exec vitest run   # seed determinism test still green (slugs stable within a run)
git add packages/db/src/seed/listings.ts
git commit -m "feat(db): seed video + virtual-tour URLs on a subset of mock listings"
```

---

## Task 4: Page spine — ISR route + key facts + compliance + JSON-LD

**Files:**
- Create: `apps/web/src/pages/homes/[slug].tsx`
- Create: `apps/web/src/components/listing/KeyFacts.tsx` (+ `.module.css`)
- Create: `apps/web/src/components/listing/ListingCompliance.tsx` (+ `.module.css`)
- Create: `apps/web/src/components/listing/ListingDetail.module.css`

**Interfaces:**
- Consumes: `getListingBySlug`, `getSimilarListings`, `getPublishedListingSlugs` (Task 1); `toListingDetailVM`, `toListingJsonLd` (Task 2); `ListingCardVM`/`toListingCardVM`; `SiteLayout`, `Container`, `EqualHousingLogo`.
- Produces: the rendered `/homes/[slug]` page (components mount into it in Tasks 5–10); `type DetailProps = { vm: ListingDetailVM; similar: ListingCardVM[]; jsonLd: object; canonicalPath: string }`.

- [ ] **Step 1: `getStaticPaths` + `getStaticProps` + page shell** — `apps/web/src/pages/homes/[slug].tsx`

```tsx
import Head from "next/head";
import type { GetStaticPaths, GetStaticProps } from "next";
import {
  getListingBySlug,
  getPublishedListingSlugs,
  getSimilarListings,
} from "@herrera/db";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Container } from "@/components/ui/Container";
import { KeyFacts } from "@/components/listing/KeyFacts";
import { ListingCompliance } from "@/components/listing/ListingCompliance";
import { toListingDetailVM, toListingJsonLd, type ListingDetailVM } from "@/lib/listing-detail";
import { toListingCardVM, type ListingCardVM } from "@/lib/listing";
import styles from "@/components/listing/ListingDetail.module.css";

type DetailProps = {
  vm: ListingDetailVM;
  similar: ListingCardVM[];
  jsonLd: object;
  canonicalPath: string;
};

export const getStaticPaths: GetStaticPaths = async () => {
  let paths: { params: { slug: string } }[] = [];
  try {
    const slugs = await getPublishedListingSlugs();
    paths = slugs.map((slug) => ({ params: { slug } }));
  } catch (e) {
    console.warn("[homes] paths unavailable:", (e as Error).message);
  }
  // Off-market/private-link + future MLS rows render on demand.
  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<DetailProps> = async (ctx) => {
  const slug = String(ctx.params?.slug ?? "");
  try {
    const listing = await getListingBySlug(slug);
    if (!listing) return { notFound: true, revalidate: 300 };
    // Visibility gate (ADR-005/011): public + private-link render; registered is not public in v1.
    if (listing.visibility !== "public" && listing.visibility !== "private_link") {
      return { notFound: true, revalidate: 300 };
    }
    const vm = toListingDetailVM(listing);
    const canonicalPath = `/homes/${slug}`;
    const similarRows = await getSimilarListings({
      slug,
      city: listing.city,
      price: listing.price,
    });
    return {
      props: {
        vm,
        similar: similarRows.map(toListingCardVM),
        jsonLd: toListingJsonLd(vm, `https://herrera.example${canonicalPath}`),
        canonicalPath,
      },
      revalidate: 300,
    };
  } catch (e) {
    // No DB at build / transient: 404 now, ISR retries soon (keeps the build green).
    console.warn("[homes] props unavailable:", (e as Error).message);
    return { notFound: true, revalidate: 30 };
  }
};

export default function ListingDetailPage({ vm, similar, jsonLd, canonicalPath }: DetailProps) {
  return (
    <SiteLayout>
      <Head>
        <title>{`${vm.title}, ${vm.cityLine} — Herrera`}</title>
        <meta name="description" content={`${vm.priceLabel} · ${vm.propertyTypeLabel} at ${vm.title}, ${vm.cityLine}.`} />
        <link rel="canonical" href={`https://herrera.example${canonicalPath}`} />
        {/* eslint-disable-next-line react/no-danger */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </Head>

      <Container>
        <div className={styles.layout}>
          <div className={styles.main}>
            {/* D4-TASK5 SEAM: <PhotoGallery /> mounts here */}
            <header className={styles.head}>
              <p className={styles.price}>{vm.priceLabel}</p>
              <h1 className={styles.title}>{vm.title}</h1>
              <p className={styles.cityLine}>{vm.cityLine}</p>
            </header>

            <KeyFacts facts={vm.keyFacts} />

            {vm.features.length > 0 && (
              <ul className={styles.features}>
                {vm.features.map((f) => (
                  <li key={f} className={styles.feature}>{f}</li>
                ))}
              </ul>
            )}

            {vm.description && (
              <section className={styles.section}>
                <h2 className={styles.h2}>About this home</h2>
                <p className={styles.body}>{vm.description}</p>
              </section>
            )}

            {/* D5 SEAM: Florida cost-of-ownership panel (FEMA flood / insurance / HOA / CDD →
                monthly cost) mounts here — built in D5 on real MLS numbers. Not in D4. */}

            {/* D4-TASK6 SEAM: <LocationMap /> mounts here */}
            {/* D4-TASK7 SEAM: <MortgageCalculator /> mounts here */}

            <ListingCompliance compliance={vm.compliance} source={vm.compliance.isMls ? "mls" : "demo"} />
          </div>

          <aside className={styles.aside}>
            {/* D4-TASK9 SEAM: <InquiryForm /> mounts here (persistent contact module) */}
          </aside>
        </div>

        {/* D4-TASK10 SEAM: <SimilarListings /> mounts here */}
      </Container>
    </SiteLayout>
  );
}
```

- [ ] **Step 2: `KeyFacts.tsx`**

```tsx
import type { KeyFact } from "@/lib/listing-detail";
import styles from "./KeyFacts.module.css";

export function KeyFacts({ facts }: { facts: KeyFact[] }) {
  return (
    <dl className={styles.strip}>
      {facts.map((f) => (
        <div key={f.label} className={styles.cell}>
          <dt className={styles.label}>{f.label}</dt>
          <dd className={styles.value}>{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}
```

`KeyFacts.module.css`: a responsive flex/grid strip — cells separated by hairline borders, `.label` Hanken 12px uppercase `--color-stone`, `.value` Spectral ~20px `--color-forest`. Wrap on mobile.

- [ ] **Step 3: `ListingCompliance.tsx`** (Equal Housing always; MLS disclaimer + attribution only on real rows)

```tsx
import { EqualHousingLogo } from "@/components/layout/EqualHousingLogo";
import type { ListingDetailVM } from "@/lib/listing-detail";
import styles from "./ListingCompliance.module.css";

export function ListingCompliance({
  compliance,
  source,
}: {
  compliance: ListingDetailVM["compliance"];
  source: "mls" | "demo";
}) {
  return (
    <section className={styles.box} aria-label="Listing disclosures">
      <div className={styles.eh}>
        <EqualHousingLogo />
        <span>Equal Housing Opportunity</span>
      </div>
      {source === "mls" ? (
        <p className={styles.disclaimer}>
          Listing courtesy of {compliance.brokerageName ?? "the listing brokerage"}
          {compliance.agentName ? ` · ${compliance.agentName}` : ""}. Data provided by{" "}
          {compliance.originatingMls ?? "the originating MLS"} and deemed reliable but not guaranteed.
          Information is for consumers' personal, non-commercial use.
        </p>
      ) : (
        <p className={styles.disclaimer}>
          Presented by Nilyan Herrera, Licensed Florida Real Estate Agent. <strong>Sample data — demo.</strong>{" "}
          Figures shown are illustrative estimates, not quotes or advice.
        </p>
      )}
    </section>
  );
}
```

`ListingCompliance.module.css`: muted card on `--color-sand-100`, small print, logo + text row.

- [ ] **Step 4: `ListingDetail.module.css`** — two-column layout (`.layout` grid `minmax(0,1fr) 360px`; `.aside` sticky `top: calc(var(--header-h) + 16px)`; collapses to one column under 960px with the aside moving inline). `.price` Spectral ~30px forest; `.title` Spectral; `.cityLine` stone; `.features` a wrapped pill list (bronze-tinted chips); `.section`/`.h2`/`.body` typographic defaults.

- [ ] **Step 5: Verify the page renders** (build + a headless load):

```bash
pnpm --filter @herrera/web typecheck && pnpm --filter @herrera/web build
# dev server + Playwright (creds): open /homes/<a real slug>, assert h1 + price + key facts + JSON-LD <script> present, 200.
```

Expected: build green; `/homes/<slug>` returns 200 with the headline, key-facts strip, compliance block, and a `application/ld+json` script.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/pages/homes apps/web/src/components/listing/KeyFacts.* apps/web/src/components/listing/ListingCompliance.* apps/web/src/components/listing/ListingDetail.module.css
git commit -m "feat(web): /homes/[slug] ISR spine — key facts, compliance, JSON-LD"
```

---

## Task 5: Photo gallery + video + virtual tour

**Files:**
- Create: `apps/web/src/components/listing/PhotoGallery.tsx` (+ `.module.css`)
- Modify: `apps/web/src/pages/homes/[slug].tsx` (mount at the TASK5 seam)

**Interfaces:**
- Consumes: `vm.gallery: GalleryImage[]`, `vm.video`, `vm.virtualTourUrl`.
- Produces: `<PhotoGallery gallery={vm.gallery} video={vm.video} virtualTourUrl={vm.virtualTourUrl} />`.

- [ ] **Step 1: `PhotoGallery.tsx`** — a large active image + thumbnail rail; "Video" / "3D tour" toggle chips shown only when present; video/tour render in an embedded iframe inside the stage. Plain `<img>` (next/image is D14, matching `ListingCard`).

```tsx
import { useState } from "react";
import type { GalleryImage } from "@/lib/listing-detail";
import styles from "./PhotoGallery.module.css";

type View = { kind: "photo"; i: number } | { kind: "video" } | { kind: "tour" };

export function PhotoGallery({
  gallery,
  video,
  virtualTourUrl,
}: {
  gallery: GalleryImage[];
  video: string | null;
  virtualTourUrl: string | null;
}) {
  const [view, setView] = useState<View>({ kind: "photo", i: 0 });
  if (gallery.length === 0 && !video && !virtualTourUrl) {
    return <div className={styles.empty} aria-hidden />;
  }
  const active = view.kind === "photo" ? gallery[view.i] : undefined;
  return (
    <div className={styles.wrap}>
      <div className={styles.stage}>
        {view.kind === "photo" && active && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={active.url} alt={active.alt} className={styles.stageImg} />
        )}
        {view.kind === "video" && video && (
          <iframe className={styles.frame} src={video} title="Property video" all;
            allowFullScreen loading="lazy" />
        )}
        {view.kind === "tour" && virtualTourUrl && (
          <iframe className={styles.frame} src={virtualTourUrl} title="Virtual tour" allowFullScreen loading="lazy" />
        )}
        <div className={styles.modes}>
          {video && (
            <button type="button" className={styles.mode} aria-pressed={view.kind === "video"} onClick={() => setView({ kind: "video" })}>
              ▶ Video
            </button>
          )}
          {virtualTourUrl && (
            <button type="button" className={styles.mode} aria-pressed={view.kind === "tour"} onClick={() => setView({ kind: "tour" })}>
              3D tour
            </button>
          )}
        </div>
      </div>
      {gallery.length > 1 && (
        <div className={styles.rail} role="listbox" aria-label="Photos">
          {gallery.map((g, i) => (
            <button
              type="button"
              key={g.url}
              role="option"
              aria-selected={view.kind === "photo" && view.i === i}
              className={`${styles.thumb} ${view.kind === "photo" && view.i === i ? styles.thumbOn : ""}`}
              onClick={() => setView({ kind: "photo", i })}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g.url} alt={g.alt} loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

(Note: fix the stray `all;` typo from the sketch — the video iframe attributes are `allowFullScreen loading="lazy"` only.)

- [ ] **Step 2: `PhotoGallery.module.css`** — `.stage` aspect-ratio 3/2, `object-fit: cover`, rounded; `.frame` fills the stage 16/9; `.rail` horizontal scroll of ~84px thumbs; `.thumbOn` bronze outline; `.modes` absolute top-right chips with a translucent forest bg. Respect `prefers-reduced-motion` (no transition).

- [ ] **Step 3: Mount in the page** — replace the `{/* D4-TASK5 SEAM … */}` comment with:

```tsx
<PhotoGallery gallery={vm.gallery} video={vm.video} virtualTourUrl={vm.virtualTourUrl} />
```

and `import { PhotoGallery } from "@/components/listing/PhotoGallery";`.

- [ ] **Step 4: Verify** — typecheck + headless: a listing WITH a tour shows the "3D tour" chip and switches the stage to an iframe; a listing without shows only photos.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/listing/PhotoGallery.* apps/web/src/pages/homes/[slug].tsx
git commit -m "feat(web): listing photo gallery + video + virtual-tour viewer"
```

---

## Task 6: Location map (client-only single marker)

**Files:**
- Create: `apps/web/src/components/listing/LocationMap.tsx` (+ `.module.css`)
- Modify: `apps/web/src/pages/homes/[slug].tsx` (mount at the TASK6 seam, client-only)

**Interfaces:**
- Consumes: `vm.location: { lng; lat } | null`, `MAP_STYLE_URL`.
- Produces: `<LocationMap lng={n} lat={n} styleUrl={s} />` — a small static-ish MapLibre map with one marker.

- [ ] **Step 1: `LocationMap.tsx`** (reuses the D2 maplibre import + style; no clustering, one `Marker`)

```tsx
import { useEffect, useRef } from "react";
import { Map as MlMap, Marker, NavigationControl } from "maplibre-gl";
import styles from "./LocationMap.module.css";

export function LocationMap({ lng, lat, styleUrl }: { lng: number; lat: number; styleUrl: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const map = new MlMap({
      container: ref.current,
      style: styleUrl,
      center: [lng, lat],
      zoom: 14,
      attributionControl: { compact: true },
    });
    map.addControl(new NavigationControl({ showCompass: false }), "top-right");
    const el = document.createElement("div");
    el.className = styles.pin!;
    new Marker({ element: el }).setLngLat([lng, lat]).addTo(map);
    return () => map.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <div ref={ref} className={styles.map} aria-label="Map showing the listing location" role="application" />;
}
```

`LocationMap.module.css`: `.map` height 320px, rounded, `position: relative`; `.pin` a forest teardrop/dot with a bronze ring (a small CSS shape) — matches the brand. (Imported via `next/dynamic {ssr:false}` from the page so SSR never touches `window`.)

- [ ] **Step 2: Mount client-only in the page** — near the page top add:

```tsx
import dynamic from "next/dynamic";
import { MAP_STYLE_URL } from "@/lib/map-style";
const LocationMap = dynamic(() => import("@/components/listing/LocationMap").then((m) => m.LocationMap), { ssr: false });
```

Replace the `{/* D4-TASK6 SEAM … */}` comment with:

```tsx
{vm.location && (
  <section className={styles.section}>
    <h2 className={styles.h2}>Location</h2>
    <LocationMap lng={vm.location.lng} lat={vm.location.lat} styleUrl={MAP_STYLE_URL} />
  </section>
)}
```

- [ ] **Step 3: Verify** — headless: map canvas mounts on the detail page; SSR HTML does NOT contain a maplibre canvas (client-only). No console errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/listing/LocationMap.* apps/web/src/pages/homes/[slug].tsx
git commit -m "feat(web): client-only single-marker location map on listing detail"
```

---

## Task 7: Mortgage calculator (estimate)

**Files:**
- Create: `apps/web/src/components/listing/MortgageCalculator.tsx` (+ `.module.css`)
- Modify: `apps/web/src/pages/homes/[slug].tsx` (mount at the TASK7 seam)

**Interfaces:**
- Consumes: `monthlyMortgage` (Task 2), `vm.price`.
- Produces: `<MortgageCalculator price={vm.price} />`.

- [ ] **Step 1: `MortgageCalculator.tsx`** (calc is already TDD'd in Task 2; this is the controlled UI)

```tsx
import { useState } from "react";
import { monthlyMortgage } from "@/lib/listing-detail";
import { formatPrice } from "@/lib/listing";
import styles from "./MortgageCalculator.module.css";

export function MortgageCalculator({ price }: { price: number }) {
  const [downPct, setDownPct] = useState(20);
  const [term, setTerm] = useState(30);
  const [rate, setRate] = useState(6.5);
  const down = Math.round((price * downPct) / 100);
  const monthly = Math.round(monthlyMortgage(price - down, rate, term));
  return (
    <section className={styles.box}>
      <h2 className={styles.h2}>Mortgage calculator</h2>
      <div className={styles.grid}>
        <label className={styles.field}>
          <span>Down payment ({downPct}%)</span>
          <input type="range" min={0} max={50} step={1} value={downPct} onChange={(e) => setDownPct(Number(e.target.value))} />
          <span className={styles.sub}>{formatPrice(down)}</span>
        </label>
        <label className={styles.field}>
          <span>Term</span>
          <select value={term} onChange={(e) => setTerm(Number(e.target.value))}>
            <option value={30}>30 years</option>
            <option value={20}>20 years</option>
            <option value={15}>15 years</option>
          </select>
        </label>
        <label className={styles.field}>
          <span>Rate (%)</span>
          <input type="number" min={0} max={20} step={0.1} value={rate} onChange={(e) => setRate(Number(e.target.value))} />
        </label>
      </div>
      <p className={styles.result}>
        <span className={styles.amount}>{formatPrice(monthly)}/mo</span>
        <span className={styles.note}>Estimated principal &amp; interest. Taxes, insurance, HOA not included. An estimate, not a quote or advice.</span>
      </p>
    </section>
  );
}
```

- [ ] **Step 2: `MortgageCalculator.module.css`** — card on `--color-surface`; 3-col field grid (stacks on mobile); `.amount` Spectral ~28px forest; `.note` small stone; range accent bronze.

- [ ] **Step 3: Mount** — replace the TASK7 seam with `<MortgageCalculator price={vm.price} />` + import.

- [ ] **Step 4: Verify** — headless: changing the down-payment slider changes the `/mo` figure; the estimate disclaimer is present.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/listing/MortgageCalculator.* apps/web/src/pages/homes/[slug].tsx
git commit -m "feat(web): mortgage calculator (labeled estimate) on listing detail"
```

---

## Task 8: Inquiry backend — schema + create + public /api/leads

**Files:**
- Create: `packages/db/src/inquiries.ts`
- Create: `packages/db/src/inquiries.test.ts`
- Modify: `packages/db/src/index.ts`
- Create: `apps/web/src/pages/api/leads.ts`

**Interfaces:**
- Consumes: `leads`, `consentRecords` tables; `attributionSchema`.
- Produces:
  - `listingInquirySchema` (zod) + `type ListingInquiry`
  - `createListingInquiry(input: ListingInquiry): Promise<{ leadId: string }>`
  - `POST /api/leads` → `{ ok: true, leadId }` | 400 (validation) | 405 | 500.

- [ ] **Step 1: Write the failing schema test** — `packages/db/src/inquiries.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { listingInquirySchema } from "./inquiries";

describe("listingInquirySchema", () => {
  it("accepts an inquiry with just an email", () => {
    const r = listingInquirySchema.safeParse({ listingSlug: "x", email: "a@b.com", consentEmail: true });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.requestType).toBe("info"); // default
  });
  it("accepts an inquiry with just a phone", () => {
    expect(listingInquirySchema.safeParse({ listingSlug: "x", phone: "3055550148" }).success).toBe(true);
  });
  it("rejects an inquiry with neither email nor phone", () => {
    expect(listingInquirySchema.safeParse({ listingSlug: "x", message: "hi" }).success).toBe(false);
  });
  it("rejects a missing listingSlug and a bad email", () => {
    expect(listingInquirySchema.safeParse({ email: "a@b.com" }).success).toBe(false);
    expect(listingInquirySchema.safeParse({ listingSlug: "x", email: "nope" }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run — expect FAIL** (module missing).

Run: `pnpm --filter @herrera/db exec vitest run src/inquiries.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `packages/db/src/inquiries.ts`**

```ts
import { z } from "zod";
import { getDb } from "./client";
import { consentRecords, type NewConsentRecord } from "./schema/consent";
import { leads } from "./schema/leads";
import { attributionSchema } from "./schema/json";

export const listingInquirySchema = z
  .object({
    listingSlug: z.string().min(1).max(120),
    requestType: z.enum(["info", "tour"]).default("info"),
    name: z.string().trim().min(1).max(120).optional(),
    email: z.string().email().optional(),
    phone: z.string().trim().min(7).max(40).optional(),
    message: z.string().trim().max(2000).optional(),
    preferredDate: z.string().trim().max(40).optional(),
    consentEmail: z.boolean().optional(),
    consentPhone: z.boolean().optional(),
    attribution: attributionSchema.optional(),
  })
  .refine((d) => Boolean(d.email) || Boolean(d.phone), {
    message: "Provide an email or phone (at least one).",
    path: ["email"],
  });

export type ListingInquiry = z.infer<typeof listingInquirySchema>;

const CONSENT_WORDING =
  "I agree to be contacted by Herrera about this property using the details I provided. Message/data rates may apply.";

/** Create a lead + per-channel consent records from a per-listing inquiry (ADR-007/011). */
export async function createListingInquiry(input: ListingInquiry): Promise<{ leadId: string }> {
  const db = getDb();
  const inserted = await db
    .insert(leads)
    .values({
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
    })
    .returning({ id: leads.id });
  const leadId = inserted[0]!.id;

  const consents: NewConsentRecord[] = [];
  if (input.email && input.consentEmail)
    consents.push({ leadId, channel: "email", granted: true, wording: CONSENT_WORDING, source: "listing_inquiry" });
  if (input.phone && input.consentPhone)
    consents.push({ leadId, channel: "phone", granted: true, wording: CONSENT_WORDING, source: "listing_inquiry" });
  if (consents.length) await db.insert(consentRecords).values(consents);

  // D8 SEAM (ADR-009): trigger Nilyan's instant email/WhatsApp alert + daily digest here. Not in D4.
  return { leadId };
}
```

- [ ] **Step 4: Run the schema test — expect PASS.** Then export from `packages/db/src/index.ts`:

```ts
export { listingInquirySchema, createListingInquiry, type ListingInquiry } from "./inquiries";
```

- [ ] **Step 5: Create `apps/web/src/pages/api/leads.ts`**

```ts
import type { NextApiRequest, NextApiResponse } from "next";
import { createListingInquiry, listingInquirySchema } from "@herrera/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const parsed = listingInquirySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid inquiry", issues: parsed.error.flatten() });
    return;
  }
  try {
    const { leadId } = await createListingInquiry(parsed.data);
    res.status(201).json({ ok: true, leadId });
  } catch (e) {
    console.error("[api/leads] failed:", (e as Error).message);
    res.status(500).json({ error: "Could not submit inquiry" });
  }
}
```

- [ ] **Step 6: Verify live** — with the dev server (creds): a POST creates a lead + consent.

```bash
curl -s -u "$CREDS" -X POST http://localhost:3000/api/leads -H 'content-type: application/json' \
  -d '{"listingSlug":"<real-slug>","email":"demo+d4@example.com","consentEmail":true,"message":"Is this still available?","requestType":"tour","preferredDate":"Sat AM"}'
# → {"ok":true,"leadId":"..."}; then a scratchpad SELECT confirms the lead (source='listing_inquiry') + 1 consent_records row (channel='email').
```

Expected: 201 + a `lead` row with `source='listing_inquiry'`, the slug in `viewed_listing_ids`, and an `email` consent record. A body with neither email nor phone → 400.

- [ ] **Step 7: Gate + commit**

```bash
pnpm --filter @herrera/db exec vitest run && pnpm --filter @herrera/web typecheck
git add packages/db/src/inquiries.ts packages/db/src/inquiries.test.ts packages/db/src/index.ts apps/web/src/pages/api/leads.ts
git commit -m "feat: per-listing inquiry → lead + per-channel consent, public POST /api/leads"
```

---

## Task 9: Inquiry form — the persistent contact module

**Files:**
- Create: `apps/web/src/components/listing/InquiryForm.tsx` (+ `.module.css`)
- Modify: `apps/web/src/pages/homes/[slug].tsx` (mount in the `<aside>` TASK9 seam)

**Interfaces:**
- Consumes: `POST /api/leads`; `vm.slug`, `vm.priceLabel`, `vm.title`; `Button`.
- Produces: `<InquiryForm slug={vm.slug} title={vm.title} />` — request info / schedule a tour; submits the inquiry; shows a thank-you state.

- [ ] **Step 1: `InquiryForm.tsx`** (client component in the Pages Router = a normal component with hooks; no `"use client"`)

```tsx
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import styles from "./InquiryForm.module.css";

type Status = "idle" | "submitting" | "done" | "error";

export function InquiryForm({ slug, title }: { slug: string; title: string }) {
  const [requestType, setRequestType] = useState<"info" | "tour">("info");
  const [status, setStatus] = useState<Status>("idle");
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const phone = String(fd.get("phone") ?? "").trim();
    if (!email && !phone) {
      setErr("Please add an email or a phone so Nilyan can reach you.");
      return;
    }
    if (!fd.get("consent")) {
      setErr("Please agree to be contacted.");
      return;
    }
    setStatus("submitting");
    setErr(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          listingSlug: slug,
          requestType,
          name: String(fd.get("name") ?? "").trim() || undefined,
          email: email || undefined,
          phone: phone || undefined,
          message: String(fd.get("message") ?? "").trim() || undefined,
          preferredDate: String(fd.get("preferredDate") ?? "").trim() || undefined,
          consentEmail: Boolean(email),
          consentPhone: Boolean(phone),
          attribution: { landingPath: `/homes/${slug}` },
        }),
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
      <div className={styles.card}>
        <h2 className={styles.h2}>Thanks — we'll be in touch shortly.</h2>
        <p className={styles.sub}>Nilyan personally follows up on every inquiry about {title}.</p>
      </div>
    );
  }

  return (
    <form className={styles.card} onSubmit={onSubmit} noValidate>
      <h2 className={styles.h2}>Interested in this home?</h2>
      <div className={styles.tabs} role="tablist" aria-label="Request type">
        <button type="button" role="tab" aria-selected={requestType === "info"} className={requestType === "info" ? styles.tabOn : styles.tab} onClick={() => setRequestType("info")}>
          Request info
        </button>
        <button type="button" role="tab" aria-selected={requestType === "tour"} className={requestType === "tour" ? styles.tabOn : styles.tab} onClick={() => setRequestType("tour")}>
          Schedule a tour
        </button>
      </div>
      <input className={styles.input} name="name" placeholder="Your name" autoComplete="name" />
      <input className={styles.input} name="email" type="email" placeholder="Email" autoComplete="email" />
      <input className={styles.input} name="phone" type="tel" placeholder="Phone" autoComplete="tel" />
      {requestType === "tour" && (
        <input className={styles.input} name="preferredDate" placeholder="Preferred day/time (e.g. Sat AM)" />
      )}
      <textarea className={styles.textarea} name="message" rows={3} placeholder={requestType === "tour" ? "Anything we should know?" : "I'd like more information about this home."} />
      <label className={styles.consent}>
        <input type="checkbox" name="consent" />
        <span>I agree to be contacted by Herrera about this property using the details I provided.</span>
      </label>
      {err && <p className={styles.err} role="alert">{err}</p>}
      <Button type="submit" size="lg" disabled={status === "submitting"}>
        {status === "submitting" ? "Sending…" : requestType === "tour" ? "Request tour" : "Request info"}
      </Button>
      <p className={styles.fine}>Phone <em>or</em> email is enough — we never require both.</p>
    </form>
  );
}
```

- [ ] **Step 2: `InquiryForm.module.css`** — sticky card (`--color-surface`, `--shadow-card`, rounded); segmented `info/tour` tabs (forest active); stacked inputs with `--color-border-strong`; bronze submit (via `Button`); `.consent` small; respects reduced motion. On mobile the aside drops below the main content (handled by `ListingDetail.module.css`); the form stays prominent.

- [ ] **Step 3: Mount in the aside** — replace the TASK9 seam with `<InquiryForm slug={vm.slug} title={vm.title} />` + import.

- [ ] **Step 4: Verify** — headless: fill email + consent + submit → thank-you state; submit with neither email nor phone → inline error (no network call); a real submit creates a lead (re-check via the API count).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/listing/InquiryForm.* apps/web/src/pages/homes/[slug].tsx
git commit -m "feat(web): persistent per-listing inquiry form (request info / schedule a tour)"
```

---

## Task 10: Similar listings + final assembly

**Files:**
- Create: `apps/web/src/components/listing/SimilarListings.tsx` (+ `.module.css`)
- Modify: `apps/web/src/pages/homes/[slug].tsx` (mount the TASK10 seam; confirm the D5 seam + responsive layout)

**Interfaces:**
- Consumes: `ListingCard` (D1), `similar: ListingCardVM[]`.
- Produces: `<SimilarListings listings={similar} />`.

- [ ] **Step 1: `SimilarListings.tsx`** (reuses `ListingCard`)

```tsx
import { ListingCard } from "@/components/ui/ListingCard";
import type { ListingCardVM } from "@/lib/listing";
import styles from "./SimilarListings.module.css";

export function SimilarListings({ listings }: { listings: ListingCardVM[] }) {
  if (listings.length === 0) return null;
  return (
    <section className={styles.section} aria-label="Similar homes">
      <h2 className={styles.h2}>Similar homes nearby</h2>
      <div className={styles.grid}>
        {listings.map((l) => (
          <ListingCard key={l.slug} listing={l} />
        ))}
      </div>
    </section>
  );
}
```

`SimilarListings.module.css`: `.grid` `repeat(auto-fill, minmax(240px, 1fr))`, gap 16px; `.h2` Spectral; top border separating it from the main content.

- [ ] **Step 2: Mount + confirm seams** — replace the TASK10 seam with `<SimilarListings listings={similar} />` + import. Confirm the **D5 cost-panel seam** comment is intact and the layout collapses cleanly to one column under 960px (aside below main; gallery full-width). Confirm `prefers-reduced-motion` is honored across the page.

- [ ] **Step 3: Gate (full) + commit**

```bash
pnpm format:check && pnpm lint && pnpm --filter @herrera/web typecheck && pnpm test && pnpm --filter @herrera/web build
git add apps/web/src/components/listing/SimilarListings.* apps/web/src/pages/homes/[slug].tsx
git commit -m "feat(web): similar-listings strip + final listing-detail assembly"
```

---

## Task 11: End-to-end verification + gates

**Files:** scratchpad only (fixes, if any, get their own commit).

- [ ] **Step 1: One clean dev server on :3000** (stop any running Next first — never build against a live dev server; shared `.next` corrupts). Warm `/homes/<a real published slug>` (get one from `getPublishedListingSlugs` or the search API).

- [ ] **Step 2: Headless checks** (Playwright + system Chrome, `httpCredentials` from `PREVIEW_BASIC_AUTH`):
  - **Renders + SEO:** `/homes/<slug>` 200; `<h1>` = address, price, key-facts strip (7 cells), description; a `script[type="application/ld+json"]` whose JSON has an `Offer` with the price; `<link rel="canonical">` present; Equal Housing block present.
  - **Gallery:** thumbnails switch the stage; a listing WITH a virtual tour shows the "3D tour" chip and swaps to an iframe.
  - **Location map:** a maplibre canvas mounts (client-only — absent from SSR HTML); no console errors.
  - **Mortgage calc:** moving the down-payment slider changes the `/mo` figure; the "estimate, not a quote" disclaimer is present.
  - **Inquiry → lead:** submit email + consent → thank-you; verify a new `lead` (`source='listing_inquiry'`) + `consent_records` row exist (count before/after via a scratchpad query); submit with neither email nor phone → inline error, no network call.
  - **Similar strip:** shows reused `ListingCard`s linking to other `/homes/...`.
  - **Cards/pins link here:** from `/search`, a price pill click and a card click both land on `/homes/<slug>` and render (D2 → D4 wiring intact).
  - **D5 seam only:** assert NO Florida cost panel is rendered (just the comment seam).
  - **ISR resilience:** `next build` succeeds (paths from DB, `fallback: blocking`); a non-existent slug → 404.
  - **Reduced motion:** gallery/calc/map interactions have no motion violations.

- [ ] **Step 3: Fix any failures** (systematic-debugging; each fix its own commit).

- [ ] **Step 4: Final gate sweep**

```bash
pnpm format:check && pnpm lint && pnpm --filter @herrera/web typecheck && pnpm test && pnpm --filter @herrera/web build
```

Expected: all green. **Stop — do NOT merge or deploy.** Report for local review.

---

## Self-review (done while writing)

- **Spec coverage:** gallery + video + tour → Tasks 3,5; per-listing data through a `toListingDetailVM` seam → Task 2 (consumed everywhere); key-facts strip → Task 4; location map (reuse D2 pattern) → Task 6; mortgage calc (estimate) → Tasks 2,7; similar strip (reuse `ListingCard`) → Task 10; persistent inquiry/lead capture (MLS-independent) → Tasks 8,9; ISR + DB-resilient → Task 4; JSON-LD + compliance (attribution + MLS disclaimer + Equal Housing) → Tasks 2,4; `/homes/[slug]` route → Task 4. D5 cost panel = seam only (Task 4). Reuse D1/D2, no restyle → enforced throughout. ✓
- **Type consistency:** `ListingDetailVM` fields (`gallery`/`video`/`virtualTourUrl`/`keyFacts`/`features`/`location`/`compliance`/`price`/`propertyType`) used identically by `[slug].tsx`, `KeyFacts`, `PhotoGallery`, `LocationMap`, `MortgageCalculator`, `ListingCompliance`. `listingInquirySchema`/`createListingInquiry`/`ListingInquiry` consistent across `inquiries.ts`, `/api/leads`, `InquiryForm` body. DB helpers' names match Task 1 exports. ✓
- **Placeholders:** none — real code/tests/SQL throughout. Two explicit "fix the sketch typo / thread `propertyType` into the VM" notes are corrections to apply, not deferred work. ✓
- **Out of scope (correctly deferred):** Florida cost panel (D5), full Buy/Sell/Rent typeform (D7), notifications (D8), favorites heart (D9, presentational), `next/image` (D14), ES route (D13).

## Open decisions to confirm before building

1. **Branch base:** D4's features list reads D3's `waterfront`/`pool`/`age_restricted` columns, so D4 **stacks on D3**. Plan assumes: branch off `main` **if you've merged D3 by execution time**, otherwise off `feat/d3-filters`. (Either gives identical code.) Confirm which.
2. **Seed media URLs:** plan uses public sample embeds (a YouTube embed + a Matterport demo) on ~18%/25% of mock rows so the gallery's video + tour are exercised. Swapped for real per-listing media when MLS arrives. OK?
3. **JSON-LD shape:** a `@graph` of a residence node (typed from property type) + an `Offer` carrying the price — pragmatic and valid (no perfect schema.org "listing" type exists). OK, or prefer a single `Product`/`Offer`?
