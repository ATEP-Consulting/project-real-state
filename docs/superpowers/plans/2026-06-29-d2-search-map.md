# D2 — Search + Map (the signature screen) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Build `/search` as ONE synced split view — a results list ↔ an interactive MapLibre map — where panning/zooming reloads listings for the visible area (PostGIS bbox), a draw-a-zone polygon filters by PostGIS `ST_Intersects`, pins cluster, hovering a card highlights its pin and vice-versa, all state lives in the shareable query string, and mobile shows a list/map toggle.

**Architecture:** `/search` is **SSR + CSR** (ADR-001). `getServerSideProps` parses the query string, runs a PostGIS search (`searchListings`), and returns the initial result set + an initial map view (fit to results). The client hydrates: the map is loaded **client-only** via `next/dynamic { ssr: false }` (no SSR of WebGL); on map `moveend` (debounced) the client writes the new bbox to the URL and refetches `/api/search`, updating both list and pins from one shared state. The map renders listings as a clustered GeoJSON source; hover sync uses MapLibre **feature-state** keyed by `slug`. A minimal custom polygon-draw control emits a ring that the backend filters with `ST_Intersects`. Reuses the D1 `ListingCard` and the corrected design tokens.

**Tech Stack:** Next.js 15 (Pages Router) · React 19 · **maplibre-gl** (client-only, free no-token tiles) · PostGIS via `@herrera/db` raw SQL (`ST_MakeEnvelope`, `ST_Intersects`, `ST_X/ST_Y`) · **zod** at the API boundary · CSS Modules + tokens · Vitest (pure-logic TDD).

## Global Constraints

- **ADR-012 is authoritative.** MapLibre GL, **client-only** via `next/dynamic { ssr: false }`. **Free tiles, NO token** (default style `https://basemaps.cartocdn.com/gl/positron-gl-style/style.json`, overridable via `NEXT_PUBLIC_MAP_STYLE_URL`). PostGIS does the spatial work; the map is presentation.
- **Query string is the source of truth** (shareable, SSR-friendly): `?q=&type=&intent=&bbox=minLng,minLat,maxLng,maxLat&poly=lng,lat,...&minPrice=&maxPrice=&minBeds=`. The page **must read `?q=`** passed by the D1 home hero.
- **ADR-001:** Pages Router only; no App Router/RSC/`"use client"`. `getServerSideProps` for `/search`.
- **Reuse D1:** `ListingCard` (`@/components/ui/ListingCard`), `toListingCardVM`, the layout `Header`, and the committed tokens (`var(--…)`). Do not restyle the card. CSS Modules; no Tailwind.
- **Filters UI is D3; map intelligence layers (schools/transit/walkability/POI) are D6.** Here: establish the full query-string contract and apply `q/type/bbox/poly/price/beds` in the query layer, but build **no filter bar** and **no intelligence layers** — leave a clear seam in `SearchMap` for D6.
- **Compliance:** public + active listings only (`status='active' AND visibility='public'`), **not** filtered by `source` (MLS rows appear identically later, ADR-006). Keep copy Fair-Housing-clean.
- **Quality floor:** mobile-first list/map toggle, visible keyboard focus, **`prefers-reduced-motion`** honored (map `fitBounds`/`easeTo` use `animate:false` under reduced motion). Demo `noindex` + DemoBanner already global.
- **Gates (every task):** `pnpm format && pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm --filter @herrera/web build` all green. One commit per task, branch `feat/d2-search-map`. **Clear `.next` before a build if a prior build was interrupted** (known stale-manifest issue).
- **Adapt to installed versions** (maplibre-gl, zod, next 15.1, react 19) — never downgrade to match this plan.

## File Structure

```
apps/web/package.json                              # + maplibre-gl, zod
apps/web/src/pages/_app.tsx                         # import "maplibre-gl/dist/maplibre-gl.css"
apps/web/src/lib/search-params.ts (+ .test.ts)      # SearchParams, parseSearchParams (zod, tolerant), serializeSearchQuery
apps/web/src/lib/map-points.ts (+ .test.ts)         # ListingMapPoint, toMapPoint, pointsToGeoJSON, boundsFromPoints, bboxCenter
apps/web/src/lib/debounce.ts (+ .test.ts)           # debounce
apps/web/src/lib/listing.ts                         # MODIFY: formatPriceShort + toListingCardVM accepts ListingCardSource
packages/db/src/search.ts                           # CREATE: searchListings + SearchListing + SearchListingParams
packages/db/src/index.ts                            # export searchListings, type SearchListing
apps/web/src/server/run-search.ts                   # CREATE: runSearch(params) → { cards, points, total } (shared by SSR + API)
apps/web/src/pages/api/search.ts                    # CREATE: GET endpoint (zod boundary → runSearch)
apps/web/src/components/search/SearchResults.tsx + .module.css   # list (reuses ListingCard) + hover wrap + count/empty/loading
apps/web/src/components/search/SearchMap.tsx + .module.css       # client-only maplibre: clustered pins, hover, viewport, click, draw, D6 seam
apps/web/src/components/search/useDrawZone.ts        # custom polygon-draw hook for SearchMap
apps/web/src/components/search/SearchView.tsx + .module.css      # composes results + dynamic map + URL state + debounced fetch + mobile toggle
apps/web/src/pages/search.tsx                        # getServerSideProps (SSR) + renders Header + SearchView
docs/DEPLOY.md                                       # MODIFY: note NEXT_PUBLIC_MAP_STYLE_URL default
```

---

### Task 1: Dependencies + MapLibre CSS + style helper

**Files:** `apps/web/package.json`, `apps/web/src/pages/_app.tsx`, `apps/web/src/lib/map-style.ts`

**Interfaces produced:** `maplibre-gl` + `zod` resolvable in `apps/web`; MapLibre CSS loaded globally; `MAP_STYLE_URL` constant.

- [ ] **Step 1:** Add deps to `apps/web/package.json` `dependencies` (floors; install latest matching):

```json
    "maplibre-gl": "^4.7.0",
    "zod": "^3.24.0"
```

Run: `pnpm install` → both resolve under `apps/web`.

- [ ] **Step 2:** `apps/web/src/lib/map-style.ts`:

```ts
// Free, no-token vector style (ADR-012). Override with NEXT_PUBLIC_MAP_STYLE_URL.
export const MAP_STYLE_URL =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL ??
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

// Central-Florida fallback view when a search has no results to fit to.
export const DEFAULT_VIEW = { center: [-81.38, 28.54] as [number, number], zoom: 9 };
```

- [ ] **Step 3:** In `apps/web/src/pages/_app.tsx`, add the MapLibre CSS import **after** the globals import (global CSS is only allowed in `_app`):

```tsx
import "@/styles/globals.css";
import "maplibre-gl/dist/maplibre-gl.css";
```

- [ ] **Step 4:** `docs/DEPLOY.md` — under the env table note: `NEXT_PUBLIC_MAP_STYLE_URL` is optional; default is the free Carto Positron style (no token).
- [ ] **Step 5:** Verify: `pnpm install && pnpm -s --filter @herrera/web build` (rm `.next` first) → green. Commit: `chore(web): add maplibre-gl + zod, wire map CSS + style config`.

---

### Task 2: Search-param contract + debounce (pure, TDD)

**Files:** `apps/web/src/lib/search-params.ts` (+ `.test.ts`), `apps/web/src/lib/debounce.ts` (+ `.test.ts`)

**Interfaces produced:**
- `type SearchParams = { q?, type?, intent?, bbox?: Bbox, poly?: Ring, minPrice?, maxPrice?, minBeds? }`
- `type Bbox = [number,number,number,number]` (minLng,minLat,maxLng,maxLat); `type Ring = [number,number][]`
- `parseSearchParams(query: Record<string,string|string[]|undefined>): SearchParams` — tolerant boundary validator (drops malformed params, never throws)
- `serializeSearchQuery(p: SearchParams): Record<string,string>`
- `debounce<T extends (...a:any[])=>void>(fn:T, ms:number): T & { cancel(): void }`

- [ ] **Step 1: Write failing tests** — `apps/web/src/lib/search-params.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { parseSearchParams, serializeSearchQuery } from "./search-params";

describe("parseSearchParams", () => {
  it("reads q (trimmed, capped) and a valid type/intent", () => {
    expect(parseSearchParams({ q: "  Coral Gables  ", type: "condo", intent: "buy" })).toEqual({
      q: "Coral Gables",
      type: "condo",
      intent: "buy",
    });
  });
  it("drops an invalid type and invalid intent", () => {
    expect(parseSearchParams({ type: "mansion", intent: "browse" })).toEqual({});
  });
  it("parses + normalizes a bbox (min/max order)", () => {
    expect(parseSearchParams({ bbox: "-81.5,28.4,-81.2,28.7" }).bbox).toEqual([-81.5, 28.4, -81.2, 28.7]);
    expect(parseSearchParams({ bbox: "-81.2,28.7,-81.5,28.4" }).bbox).toEqual([-81.5, 28.4, -81.2, 28.7]);
  });
  it("ignores a malformed bbox", () => {
    expect(parseSearchParams({ bbox: "1,2,3" }).bbox).toBeUndefined();
    expect(parseSearchParams({ bbox: "a,b,c,d" }).bbox).toBeUndefined();
  });
  it("parses a polygon ring of >=3 points", () => {
    expect(parseSearchParams({ poly: "-81.5,28.4,-81.2,28.4,-81.2,28.7" }).poly).toEqual([
      [-81.5, 28.4],
      [-81.2, 28.4],
      [-81.2, 28.7],
    ]);
  });
  it("ignores a degenerate polygon (<3 points)", () => {
    expect(parseSearchParams({ poly: "-81.5,28.4,-81.2,28.4" }).poly).toBeUndefined();
  });
  it("parses numeric filters, dropping non-numbers", () => {
    expect(parseSearchParams({ minPrice: "300000", maxPrice: "x", minBeds: "2" })).toEqual({
      minPrice: 300000,
      minBeds: 2,
    });
  });
  it("takes the first value when a param repeats", () => {
    expect(parseSearchParams({ q: ["Miami", "Tampa"] }).q).toBe("Miami");
  });
});

describe("serializeSearchQuery", () => {
  it("round-trips a full param set to a flat string map", () => {
    expect(
      serializeSearchQuery({ q: "Miami", type: "condo", bbox: [-81.5, 28.4, -81.2, 28.7], minBeds: 2 }),
    ).toEqual({ q: "Miami", type: "condo", bbox: "-81.5,28.4,-81.2,28.7", minBeds: "2" });
  });
  it("serializes a polygon as a flat coord list", () => {
    expect(serializeSearchQuery({ poly: [[-81.5, 28.4], [-81.2, 28.4], [-81.2, 28.7]] }).poly).toBe(
      "-81.5,28.4,-81.2,28.4,-81.2,28.7",
    );
  });
});
```

`apps/web/src/lib/debounce.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { debounce } from "./debounce";

afterEach(() => vi.useRealTimers());

describe("debounce", () => {
  it("calls once with the last args after the wait", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const d = debounce(fn, 300);
    d(1);
    d(2);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledExactlyOnceWith(2);
  });
  it("cancel() prevents a pending call", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const d = debounce(fn, 300);
    d(1);
    d.cancel();
    vi.advanceTimersByTime(300);
    expect(fn).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2:** Run `pnpm test -- search-params debounce` → FAIL (modules missing).
- [ ] **Step 3:** Implement `apps/web/src/lib/search-params.ts`:

```ts
import { z } from "zod";

export const PROPERTY_TYPES = [
  "single_family", "condo", "townhouse", "multi_family", "villa", "co_op", "land", "mobile", "other",
] as const;

export type Bbox = [number, number, number, number];
export type Ring = [number, number][];
export type SearchParams = {
  q?: string;
  type?: (typeof PROPERTY_TYPES)[number];
  intent?: "buy" | "sell" | "rent";
  bbox?: Bbox;
  poly?: Ring;
  minPrice?: number;
  maxPrice?: number;
  minBeds?: number;
};

type Query = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const floats = (s: string) => s.split(",").map((x) => Number(x.trim()));

const TypeSchema = z.enum(PROPERTY_TYPES);
const IntentSchema = z.enum(["buy", "sell", "rent"]);
const PosInt = z.coerce.number().finite().nonnegative();

/** Tolerant boundary validator: keeps valid params, silently drops malformed ones (shared links must degrade gracefully). */
export function parseSearchParams(query: Query): SearchParams {
  const out: SearchParams = {};

  const q = first(query.q)?.trim();
  if (q) out.q = q.slice(0, 80);

  const t = TypeSchema.safeParse(first(query.type));
  if (t.success) out.type = t.data;

  const i = IntentSchema.safeParse(first(query.intent));
  if (i.success) out.intent = i.data;

  const bbox = first(query.bbox);
  if (bbox) {
    const n = floats(bbox);
    if (n.length === 4 && n.every(Number.isFinite)) {
      out.bbox = [Math.min(n[0], n[2]), Math.min(n[1], n[3]), Math.max(n[0], n[2]), Math.max(n[1], n[3])];
    }
  }

  const poly = first(query.poly);
  if (poly) {
    const n = floats(poly);
    if (n.length >= 6 && n.length % 2 === 0 && n.every(Number.isFinite)) {
      const ring: Ring = [];
      for (let k = 0; k < n.length; k += 2) ring.push([n[k], n[k + 1]]);
      out.poly = ring;
    }
  }

  const mn = PosInt.safeParse(first(query.minPrice));
  if (mn.success) out.minPrice = mn.data;
  const mx = PosInt.safeParse(first(query.maxPrice));
  if (mx.success) out.maxPrice = mx.data;
  const mb = PosInt.safeParse(first(query.minBeds));
  if (mb.success) out.minBeds = mb.data;

  return out;
}

export function serializeSearchQuery(p: SearchParams): Record<string, string> {
  const q: Record<string, string> = {};
  if (p.q) q.q = p.q;
  if (p.type) q.type = p.type;
  if (p.intent) q.intent = p.intent;
  if (p.bbox) q.bbox = p.bbox.join(",");
  if (p.poly) q.poly = p.poly.flat().join(",");
  if (p.minPrice != null) q.minPrice = String(p.minPrice);
  if (p.maxPrice != null) q.maxPrice = String(p.maxPrice);
  if (p.minBeds != null) q.minBeds = String(p.minBeds);
  return q;
}
```

> `z.coerce.number().safeParse(undefined)` fails (→ field dropped); `safeParse("x")` fails; `safeParse("2")` → 2. Exactly the tolerant behavior the tests assert.

`apps/web/src/lib/debounce.ts`:

```ts
export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  ms: number,
): T & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const wrapped = ((...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T & { cancel: () => void };
  wrapped.cancel = () => {
    if (timer) clearTimeout(timer);
    timer = undefined;
  };
  return wrapped;
}
```

- [ ] **Step 4:** Run `pnpm test -- search-params debounce` → PASS. Then full gates.
- [ ] **Step 5:** Commit: `feat(web): search query-string contract + debounce (TDD)`.

---

### Task 3: Map-point geo helpers (pure, TDD)

**Files:** `apps/web/src/lib/listing.ts` (MODIFY), `apps/web/src/lib/map-points.ts` (+ `.test.ts`)

**Interfaces produced:**
- `formatPriceShort(n:number): string` (in `listing.ts`)
- `type ListingMapPoint = { slug:string; lng:number; lat:number; priceLabel:string }`
- `toMapPoint(s:{ slug:string; price:number; lng:number|null; lat:number|null }): ListingMapPoint | null`
- `pointsToGeoJSON(points: ListingMapPoint[]): FeatureCollection<Point>`
- `boundsFromPoints(points: ListingMapPoint[]): Bbox | null`
- `bboxCenter(b: Bbox): [number, number]`

- [ ] **Step 1:** Add `formatPriceShort` to `apps/web/src/lib/listing.ts` (after `formatPrice`):

```ts
/** Compact price for map pins: 1_447_000 → "$1.4M", 890_000 → "$890K". */
export function formatPriceShort(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}
```

- [ ] **Step 2: Write failing tests** — `apps/web/src/lib/map-points.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { formatPriceShort } from "./listing";
import { toMapPoint, pointsToGeoJSON, boundsFromPoints, bboxCenter } from "./map-points";

describe("formatPriceShort", () => {
  it("abbreviates millions and thousands", () => {
    expect(formatPriceShort(1_447_000)).toBe("$1.4M");
    expect(formatPriceShort(2_000_000)).toBe("$2M");
    expect(formatPriceShort(890_000)).toBe("$890K");
    expect(formatPriceShort(950)).toBe("$950");
  });
});

describe("toMapPoint", () => {
  it("maps a row with coords", () => {
    expect(toMapPoint({ slug: "a", price: 1_447_000, lng: -81.3, lat: 28.5 })).toEqual({
      slug: "a",
      lng: -81.3,
      lat: 28.5,
      priceLabel: "$1.4M",
    });
  });
  it("returns null when coords are missing", () => {
    expect(toMapPoint({ slug: "a", price: 1, lng: null, lat: 28.5 })).toBeNull();
  });
});

describe("boundsFromPoints / bboxCenter", () => {
  it("computes a bounding box and its center", () => {
    const pts = [
      { slug: "a", lng: -81.5, lat: 28.4, priceLabel: "" },
      { slug: "b", lng: -81.2, lat: 28.7, priceLabel: "" },
    ];
    expect(boundsFromPoints(pts)).toEqual([-81.5, 28.4, -81.2, 28.7]);
    expect(bboxCenter([-81.5, 28.4, -81.2, 28.7])).toEqual([-81.35, 28.55]);
  });
  it("returns null for no points", () => {
    expect(boundsFromPoints([])).toBeNull();
  });
});

describe("pointsToGeoJSON", () => {
  it("builds a FeatureCollection with slug ids", () => {
    const fc = pointsToGeoJSON([{ slug: "a", lng: -81.3, lat: 28.5, priceLabel: "$1.4M" }]);
    expect(fc.type).toBe("FeatureCollection");
    expect(fc.features[0]).toMatchObject({
      id: "a",
      properties: { slug: "a", priceLabel: "$1.4M" },
      geometry: { type: "Point", coordinates: [-81.3, 28.5] },
    });
  });
});
```

- [ ] **Step 3:** Run `pnpm test -- map-points` → FAIL.
- [ ] **Step 4:** Implement `apps/web/src/lib/map-points.ts` (`geojson` types ship with `maplibre-gl`):

```ts
import type { FeatureCollection, Point } from "geojson";
import { formatPriceShort } from "./listing";
import type { Bbox } from "./search-params";

export type ListingMapPoint = { slug: string; lng: number; lat: number; priceLabel: string };

export function toMapPoint(s: {
  slug: string;
  price: number;
  lng: number | null;
  lat: number | null;
}): ListingMapPoint | null {
  if (s.lng == null || s.lat == null) return null;
  return { slug: s.slug, lng: s.lng, lat: s.lat, priceLabel: formatPriceShort(s.price) };
}

export function pointsToGeoJSON(points: ListingMapPoint[]): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: points.map((p) => ({
      type: "Feature",
      id: p.slug,
      properties: { slug: p.slug, priceLabel: p.priceLabel },
      geometry: { type: "Point", coordinates: [p.lng, p.lat] },
    })),
  };
}

export function boundsFromPoints(points: ListingMapPoint[]): Bbox | null {
  if (points.length === 0) return null;
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  for (const p of points) {
    minLng = Math.min(minLng, p.lng);
    minLat = Math.min(minLat, p.lat);
    maxLng = Math.max(maxLng, p.lng);
    maxLat = Math.max(maxLat, p.lat);
  }
  return [minLng, minLat, maxLng, maxLat];
}

export function bboxCenter(b: Bbox): [number, number] {
  return [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2];
}
```

- [ ] **Step 5:** Run `pnpm test -- map-points` → PASS. Full gates.
- [ ] **Step 6:** Commit: `feat(web): map-point geo helpers + short price (TDD)`.

---

### Task 4: PostGIS `searchListings` query

**Files:** `packages/db/src/search.ts` (CREATE), `packages/db/src/index.ts` (MODIFY)

**Interfaces produced:**
- `type SearchListing = Pick<Listing, 'slug'|'price'|'bedrooms'|'bathrooms'|'sqft'|'propertyType'|'addressLine1'|'city'|'state'|'zip'|'photos'|'createdAt'> & { lng: number | null; lat: number | null }`
- `type SearchListingParams = { bbox?: [number,number,number,number]; poly?: [number,number][]; q?: string; type?: string; minPrice?: number; maxPrice?: number; minBeds?: number; limit?: number }`
- `searchListings(p: SearchListingParams): Promise<{ rows: SearchListing[]; total: number }>`

- [ ] **Step 1:** Create `packages/db/src/search.ts`:

```ts
import { sql, type SQL } from "drizzle-orm";
import { getDb } from "./client";
import type { Listing } from "./schema/listings";

export type SearchListing = Pick<
  Listing,
  | "slug" | "price" | "bedrooms" | "bathrooms" | "sqft" | "propertyType"
  | "addressLine1" | "city" | "state" | "zip" | "photos" | "createdAt"
> & { lng: number | null; lat: number | null };

export type SearchListingParams = {
  bbox?: [number, number, number, number]; // minLng,minLat,maxLng,maxLat
  poly?: [number, number][]; // ring of [lng,lat]
  q?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  minBeds?: number;
  limit?: number;
};

/**
 * Public+active listings matching the spatial + attribute filters (ADR-012/006).
 * Raw PostGIS SQL (parameter-bound). Returns rows (camelCase-aliased so they map to ListingCardVM)
 * with lng/lat, plus the total matching count (window count, ignores LIMIT).
 */
export async function searchListings(
  p: SearchListingParams,
): Promise<{ rows: SearchListing[]; total: number }> {
  const limit = Math.min(Math.max(p.limit ?? 300, 1), 500);
  const conds: SQL[] = [
    sql`l.status = 'active'`,
    sql`l.visibility = 'public'`,
    sql`l.geom IS NOT NULL`,
  ];

  if (p.bbox) {
    const [w, s, e, n] = p.bbox;
    conds.push(sql`l.geom && ST_MakeEnvelope(${w}, ${s}, ${e}, ${n}, 4326)`);
  }
  if (p.poly && p.poly.length >= 3) {
    // Build a closed WKT ring from validated numbers (numbers only → injection-safe).
    const ring = [...p.poly, p.poly[0]!];
    const wkt = `POLYGON((${ring.map(([lng, lat]) => `${lng} ${lat}`).join(", ")}))`;
    conds.push(sql`ST_Intersects(l.geom, ST_SetSRID(ST_GeomFromText(${wkt}), 4326))`);
  }
  if (p.q) {
    const like = `%${p.q}%`;
    conds.push(sql`(l.city ILIKE ${like} OR l.address_line1 ILIKE ${like} OR l.zip ILIKE ${like})`);
  }
  if (p.type) conds.push(sql`l.property_type = ${p.type}`);
  if (p.minPrice != null) conds.push(sql`l.price >= ${p.minPrice}`);
  if (p.maxPrice != null) conds.push(sql`l.price <= ${p.maxPrice}`);
  if (p.minBeds != null) conds.push(sql`l.bedrooms >= ${p.minBeds}`);

  const where = sql.join(conds, sql` AND `);
  const result = (await getDb().execute(sql`
    SELECT l.slug, l.price, l.bedrooms, l.bathrooms, l.sqft,
           l.property_type AS "propertyType", l.address_line1 AS "addressLine1",
           l.city, l.state, l.zip, l.photos, l.created_at AS "createdAt",
           ST_X(l.geom) AS lng, ST_Y(l.geom) AS lat,
           count(*) OVER ()::int AS total
    FROM listings l
    WHERE ${where}
    ORDER BY l.price DESC
    LIMIT ${limit}
  `)) as unknown as { rows: (SearchListing & { total: number })[] } | (SearchListing & { total: number })[];

  const rows = Array.isArray(result) ? result : result.rows;
  const total = rows[0]?.total ?? 0;
  return { rows: rows.map(({ total: _t, ...r }) => r), total };
}
```

> `bathrooms` comes back as a string (numeric), `photos` as a parsed array, `createdAt` as an ISO string, `lng/lat` as numbers — all exactly what `toListingCardVM`/`toMapPoint` expect. `&&` (bbox overlap, GiST-indexed) pre-filters before the envelope test.

- [ ] **Step 2:** Export from `packages/db/src/index.ts`:

```ts
export { searchListings, type SearchListing, type SearchListingParams } from "./search";
```

- [ ] **Step 3: Verify live against Neon** — create `scratch/search-check.ts` (or reuse the scratchpad pattern) and run with `DATABASE_URL` from `apps/web/.env.local`:

```ts
import { searchListings } from "/Users/pablo/Projects/project-real-state/packages/db/src/search";
// bbox over central FL
const a = await searchListings({ bbox: [-82, 28, -81, 29], limit: 5 });
console.log("bbox rows:", a.rows.length, "total:", a.total, "first:", a.rows[0]?.slug, a.rows[0]?.lng, a.rows[0]?.lat);
const b = await searchListings({ q: "Winter Park", limit: 5 });
console.log("q rows:", b.rows.length, "total:", b.total);
const c = await searchListings({ poly: [[-82, 28], [-81, 28], [-81, 29], [-82, 29]], limit: 5 });
console.log("poly rows:", c.rows.length, "total:", c.total);
```

Run: `cd packages/db && DATABASE_URL=… pnpm exec tsx scratch/search-check.ts`
Expected: bbox/q/poly each return rows with numeric `lng/lat`, plausible `total` (≤124). `typecheck` green.

- [ ] **Step 4:** Full gates. Commit: `feat(db): searchListings — PostGIS bbox/polygon/q/type query`.

---

### Task 5: `/api/search` + shared search runner (+ card-source refactor)

**Files:** `apps/web/src/lib/listing.ts` (MODIFY), `apps/web/src/server/run-search.ts` (CREATE), `apps/web/src/pages/api/search.ts` (CREATE)

**Interfaces produced:**
- `type ListingCardSource` (in `listing.ts`) and `toListingCardVM(s: ListingCardSource)` (widened input)
- `type SearchResult = { cards: ListingCardVM[]; points: ListingMapPoint[]; total: number }`
- `runSearch(p: SearchParams): Promise<SearchResult>`
- `GET /api/search?<params>` → `200 { cards, points, total }`

- [ ] **Step 1:** In `apps/web/src/lib/listing.ts`, widen the mapper input from `Listing` to a structural `ListingCardSource` so search rows reuse it (the D1 test still passes — a full `Listing` is assignable):

```ts
export type ListingCardSource = {
  slug: string;
  price: number;
  bedrooms: number | null;
  bathrooms: string | null;
  sqft: number | null;
  propertyType: string;
  addressLine1: string;
  city: string;
  state: string;
  zip: string;
  photos: { url: string }[];
  createdAt: Date | string;
};
```

Change the signature `export function toListingCardVM(l: Listing)` → `export function toListingCardVM(l: ListingCardSource)` and **remove** the now-unused `import type { Listing } from "@herrera/db"`. Body unchanged (it already only reads these fields; `l.photos[0]?.url` works on `{url}[]`).

- [ ] **Step 2:** `apps/web/src/server/run-search.ts`:

```ts
import { searchListings } from "@herrera/db";
import { toListingCardVM, type ListingCardVM } from "@/lib/listing";
import { toMapPoint, type ListingMapPoint } from "@/lib/map-points";
import type { SearchParams } from "@/lib/search-params";

export type SearchResult = { cards: ListingCardVM[]; points: ListingMapPoint[]; total: number };

export async function runSearch(p: SearchParams): Promise<SearchResult> {
  const { rows, total } = await searchListings({
    bbox: p.bbox,
    poly: p.poly,
    q: p.q,
    type: p.type,
    minPrice: p.minPrice,
    maxPrice: p.maxPrice,
    minBeds: p.minBeds,
  });
  const cards = rows.map(toListingCardVM);
  const points = rows.map(toMapPoint).filter((x): x is ListingMapPoint => x !== null);
  return { cards, points, total };
}
```

- [ ] **Step 3:** `apps/web/src/pages/api/search.ts` (zod boundary — method + light shape guard; `parseSearchParams` does the field validation):

```ts
import type { NextApiRequest, NextApiResponse } from "next";
import { parseSearchParams } from "@/lib/search-params";
import { runSearch } from "@/server/run-search";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  try {
    const params = parseSearchParams(req.query);
    const result = await runSearch(params);
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
}
```

- [ ] **Step 4: Verify** — `pnpm test` (D1 `listing` test still green after the widen), gates, build. Manual: `pnpm dev`, then
  `curl -s 'http://localhost:3000/api/search?bbox=-82,28,-81,29' | head -c 300` (locally the preview gate may require basic-auth; or hit it after `next start` with `PREVIEW_BASIC_AUTH=` unset) → JSON with `cards`/`points`/`total`.
- [ ] **Step 5:** Commit: `feat(web): /api/search + shared runSearch (+ widen card mapper)`.

---

### Task 6: SearchResults (list + hover wiring + states)

**Files:** `apps/web/src/components/search/SearchResults.tsx` + `.module.css`

**Interfaces produced:** `<SearchResults cards total loading hoveredSlug onHover />` where
`{ cards: ListingCardVM[]; total: number; loading: boolean; hoveredSlug: string | null; onHover(slug: string | null): void }`.

- [ ] **Step 1:** Component — reuses `ListingCard`, wraps each in a hover-aware element (does **not** modify `ListingCard`):

```tsx
import { ListingCard } from "@/components/ui/ListingCard";
import type { ListingCardVM } from "@/lib/listing";
import styles from "./SearchResults.module.css";

export function SearchResults({
  cards, total, loading, hoveredSlug, onHover,
}: {
  cards: ListingCardVM[];
  total: number;
  loading: boolean;
  hoveredSlug: string | null;
  onHover: (slug: string | null) => void;
}) {
  return (
    <div className={styles.panel}>
      <div className={styles.head}>
        <p className={styles.count}>
          {loading ? "Searching…" : `${total} ${total === 1 ? "home" : "homes"} in this area`}
        </p>
      </div>
      {cards.length === 0 && !loading ? (
        <p className={styles.empty}>No homes in this area. Pan or zoom out, or clear the drawn zone.</p>
      ) : (
        <ul className={styles.list}>
          {cards.map((c) => (
            <li
              key={c.slug}
              className={`${styles.item} ${hoveredSlug === c.slug ? styles.active : ""}`}
              onMouseEnter={() => onHover(c.slug)}
              onMouseLeave={() => onHover(null)}
            >
              <ListingCard listing={c} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 2:** `SearchResults.module.css` — scrollable panel; `.active` raises the card (bronze ring) to mirror the pin highlight:

```css
.panel { display: flex; flex-direction: column; height: 100%; background: var(--color-paper); }
.head {
  flex-shrink: 0; padding: 14px 20px; border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
}
.count { margin: 0; font-size: 13px; font-weight: 600; color: var(--color-stone); }
.list {
  list-style: none; margin: 0; padding: 16px; overflow-y: auto;
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; align-content: start;
}
.item { border-radius: var(--radius-md); transition: outline-color var(--dur-fast) var(--ease-standard); outline: 2px solid transparent; outline-offset: 2px; }
.active { outline-color: var(--color-bronze); }
.empty { padding: 32px 20px; color: var(--color-stone); font-size: 14.5px; }
@media (max-width: 1200px) { .list { grid-template-columns: 1fr; } }
```

- [ ] **Step 3:** Gates (component compiles; rendered in Task 9). Commit: `feat(web): SearchResults list with hover-sync + states`.

---

### Task 7: SearchMap (client-only MapLibre — clusters, price pins, hover, viewport, click)

**Files:** `apps/web/src/components/search/SearchMap.tsx` + `.module.css`

**Interfaces produced:** `<SearchMap points initialView hoveredSlug onHoverSlug onViewportChange styleUrl drawnPoly onPolyChange drawing onDrawingChange />` (draw props consumed by Task 8). This task ships everything except the draw control.

```ts
export type InitialView =
  | { kind: "bounds"; bounds: [number, number, number, number] }
  | { kind: "center"; center: [number, number]; zoom: number };
```

- [ ] **Step 1:** `SearchMap.tsx` (only imported via `next/dynamic { ssr:false }`, so `maplibre-gl` never loads server-side):

```tsx
import { useEffect, useRef } from "react";
import maplibregl, { type GeoJSONSource, type LngLatBoundsLike } from "maplibre-gl";
import { pointsToGeoJSON, type ListingMapPoint } from "@/lib/map-points";
import type { Bbox } from "@/lib/search-params";
import { useDrawZone } from "./useDrawZone";
import styles from "./SearchMap.module.css";

export type InitialView =
  | { kind: "bounds"; bounds: [number, number, number, number] }
  | { kind: "center"; center: [number, number]; zoom: number };

const SRC = "listings";

export function SearchMap({
  points, initialView, hoveredSlug, onHoverSlug, onViewportChange, styleUrl,
  drawnPoly, onPolyChange, drawing, onDrawingChange,
}: {
  points: ListingMapPoint[];
  initialView: InitialView;
  hoveredSlug: string | null;
  onHoverSlug: (slug: string | null) => void;
  onViewportChange: (bbox: Bbox) => void;
  styleUrl: string;
  drawnPoly: [number, number][] | null;
  onPolyChange: (ring: [number, number][] | null) => void;
  drawing: boolean;
  onDrawingChange: (on: boolean) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const hoveredRef = useRef<string | null>(null);
  const reduce =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Create the map once.
  useEffect(() => {
    if (!containerRef.current) return;
    const map = new maplibregl.Map({ container: containerRef.current, style: styleUrl, attributionControl: { compact: true } });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      if (initialView.kind === "bounds") {
        map.fitBounds(initialView.bounds as LngLatBoundsLike, { padding: 64, maxZoom: 15, animate: false });
      } else {
        map.jumpTo({ center: initialView.center, zoom: initialView.zoom });
      }

      map.addSource(SRC, {
        type: "geojson",
        data: pointsToGeoJSON(points),
        cluster: true,
        clusterRadius: 52,
        clusterMaxZoom: 14,
        promoteId: "slug",
      });

      // Clusters
      map.addLayer({
        id: "clusters", type: "circle", source: SRC, filter: ["has", "point_count"],
        paint: {
          "circle-color": "#15302c",
          "circle-radius": ["step", ["get", "point_count"], 18, 10, 22, 50, 28],
          "circle-stroke-width": 2, "circle-stroke-color": "#ffffff",
        },
      });
      map.addLayer({
        id: "cluster-count", type: "symbol", source: SRC, filter: ["has", "point_count"],
        layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 12, "text-font": ["Noto Sans Regular"] },
        paint: { "text-color": "#ffffff" },
      });

      // Unclustered: a pill behind a price label, hover-aware via feature-state.
      const hoverColor = ["case", ["boolean", ["feature-state", "hover"], false], "#a9794a", "#ffffff"] as const;
      map.addLayer({
        id: "pins", type: "circle", source: SRC, filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-radius": 13, "circle-color": hoverColor as never,
          "circle-stroke-width": 1.5, "circle-stroke-color": "#15302c",
        },
      });
      map.addLayer({
        id: "pin-labels", type: "symbol", source: SRC, filter: ["!", ["has", "point_count"]],
        layout: { "text-field": ["get", "priceLabel"], "text-size": 11, "text-font": ["Noto Sans Bold"], "text-allow-overlap": true },
        paint: {
          "text-color": ["case", ["boolean", ["feature-state", "hover"], false], "#ffffff", "#15302c"],
        },
      });

      // D6 SEED: intelligence layers (schools/transit/walkability/POI) mount here as
      // toggleable map layers fed by a swappable data source. Not built in D2.

      const setHover = (slug: string | null) => {
        if (hoveredRef.current === slug) return;
        if (hoveredRef.current) map.setFeatureState({ source: SRC, id: hoveredRef.current }, { hover: false });
        hoveredRef.current = slug;
        if (slug) map.setFeatureState({ source: SRC, id: slug }, { hover: true });
        onHoverSlug(slug);
      };

      map.on("mousemove", "pins", (e) => {
        map.getCanvas().style.cursor = "pointer";
        const f = e.features?.[0];
        if (f?.id != null) setHover(String(f.id));
      });
      map.on("mouseleave", "pins", () => {
        map.getCanvas().style.cursor = "";
        setHover(null);
      });
      map.on("click", "pins", (e) => {
        const slug = e.features?.[0]?.properties?.slug;
        if (slug) window.location.assign(`/homes/${slug}`);
      });
      map.on("click", "clusters", (e) => {
        const f = map.queryRenderedFeatures(e.point, { layers: ["clusters"] })[0];
        const id = f?.properties?.cluster_id;
        if (id == null) return;
        (map.getSource(SRC) as GeoJSONSource).getClusterExpansionZoom(id).then((zoom) => {
          map.easeTo({ center: (f.geometry as GeoJSON.Point).coordinates as [number, number], zoom, animate: !reduce });
        });
      });

      const emit = () => {
        const b = map.getBounds();
        onViewportChange([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
      };
      map.on("moveend", emit);
    });

    return () => { map.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push new data when points change (viewport/filter refetch).
  useEffect(() => {
    const map = mapRef.current;
    const src = map?.getSource(SRC) as GeoJSONSource | undefined;
    if (src) src.setData(pointsToGeoJSON(points));
  }, [points]);

  // Reflect card-hover → pin highlight.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getSource(SRC)) return;
    if (hoveredRef.current && hoveredRef.current !== hoveredSlug)
      map.setFeatureState({ source: SRC, id: hoveredRef.current }, { hover: false });
    hoveredRef.current = hoveredSlug;
    if (hoveredSlug) map.setFeatureState({ source: SRC, id: hoveredSlug }, { hover: true });
  }, [hoveredSlug]);

  // Draw-zone control (Task 8).
  useDrawZone({ mapRef, drawing, onDrawingChange, drawnPoly, onPolyChange, reduce });

  return <div ref={containerRef} className={styles.map} aria-label="Map of search results" role="application" />;
}
```

`SearchMap.module.css`:

```css
.map { position: absolute; inset: 0; }
.map :global(.maplibregl-ctrl-attrib) { font-size: 10px; }
```

> Notes: `promoteId: "slug"` makes `feature.id === slug` so feature-state hover keys on the slug. The Carto Positron style provides the `Noto Sans Regular/Bold` glyphs used by the label layers. `window.location.assign` (not `next/router`) is used for the pin click because this component is outside the Pages router tree concerns and keeps it dependency-light; D4 builds `/homes/[slug]`.

- [ ] **Step 2:** Gates (TS compiles; the `useDrawZone` import resolves after Task 8 — **do Task 8 before this task's build**, or stub `useDrawZone` as a no-op first). For a clean order, implement Task 8's `useDrawZone.ts` immediately, then build. Commit: `feat(web): client-only MapLibre map — clustered price pins + hover-sync + viewport`.

---

### Task 8: Draw-a-zone polygon control

**Files:** `apps/web/src/components/search/useDrawZone.ts`

**Interfaces produced:** `useDrawZone({ mapRef, drawing, onDrawingChange, drawnPoly, onPolyChange, reduce })` — a hook that, while `drawing`, lets the user click vertices (live preview), finishes on double-click/Enter into a closed polygon (emits the ring via `onPolyChange`), renders the committed `drawnPoly`, and clears it.

- [ ] **Step 1:** `apps/web/src/components/search/useDrawZone.ts`:

```ts
import { useEffect, useRef } from "react";
import type { GeoJSONSource, Map as MlMap } from "maplibre-gl";
import type { MutableRefObject } from "react";

const DRAW_SRC = "draw-zone";

function ringGeoJSON(ring: [number, number][], closed: boolean): GeoJSON.Feature {
  const coords = closed && ring.length >= 3 ? [...ring, ring[0]!] : ring;
  return {
    type: "Feature",
    properties: {},
    geometry:
      closed && ring.length >= 3
        ? { type: "Polygon", coordinates: [coords] }
        : { type: "LineString", coordinates: coords },
  };
}

export function useDrawZone({
  mapRef, drawing, onDrawingChange, drawnPoly, onPolyChange, reduce,
}: {
  mapRef: MutableRefObject<MlMap | null>;
  drawing: boolean;
  onDrawingChange: (on: boolean) => void;
  drawnPoly: [number, number][] | null;
  onPolyChange: (ring: [number, number][] | null) => void;
  reduce: boolean;
}) {
  const draftRef = useRef<[number, number][]>([]);

  // Ensure the draw source + layers exist (idempotent), once the map is ready.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const ensure = () => {
      if (map.getSource(DRAW_SRC)) return;
      map.addSource(DRAW_SRC, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({ id: "draw-fill", type: "fill", source: DRAW_SRC, paint: { "fill-color": "#a9794a", "fill-opacity": 0.12 } });
      map.addLayer({ id: "draw-line", type: "line", source: DRAW_SRC, paint: { "line-color": "#8f6238", "line-width": 2, "line-dasharray": [2, 1] } });
    };
    if (map.isStyleLoaded()) ensure();
    else map.once("load", ensure);
  }, [mapRef]);

  // Reflect the committed polygon (or a cleared one).
  useEffect(() => {
    const map = mapRef.current;
    const src = map?.getSource(DRAW_SRC) as GeoJSONSource | undefined;
    if (!src) return;
    if (drawnPoly && drawnPoly.length >= 3) src.setData(ringGeoJSON(drawnPoly, true));
    else if (!drawing) src.setData({ type: "FeatureCollection", features: [] });
  }, [drawnPoly, drawing, mapRef]);

  // Drawing interactions.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const src = () => map.getSource(DRAW_SRC) as GeoJSONSource | undefined;

    if (!drawing) {
      draftRef.current = [];
      map.getCanvas().style.cursor = "";
      map.doubleClickZoom.enable();
      return;
    }

    draftRef.current = [];
    map.getCanvas().style.cursor = "crosshair";
    map.doubleClickZoom.disable();
    src()?.setData({ type: "FeatureCollection", features: [] });

    const onClick = (e: maplibregl.MapMouseEvent) => {
      draftRef.current = [...draftRef.current, [e.lngLat.lng, e.lngLat.lat]];
      src()?.setData(ringGeoJSON(draftRef.current, draftRef.current.length >= 3));
    };
    const finish = () => {
      const ring = draftRef.current;
      if (ring.length >= 3) onPolyChange(ring);
      onDrawingChange(false);
    };
    const onDbl = (e: maplibregl.MapMouseEvent) => { e.preventDefault(); finish(); };
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Enter") finish();
      if (ev.key === "Escape") { draftRef.current = []; onDrawingChange(false); onPolyChange(null); }
    };

    map.on("click", onClick);
    map.on("dblclick", onDbl);
    window.addEventListener("keydown", onKey);
    return () => {
      map.off("click", onClick);
      map.off("dblclick", onDbl);
      window.removeEventListener("keydown", onKey);
      map.getCanvas().style.cursor = "";
      map.doubleClickZoom.enable();
    };
    // reduce unused only to keep a stable signature with SearchMap
  }, [drawing, onPolyChange, onDrawingChange, mapRef, reduce]);
}
```

- [ ] **Step 2:** Gates (compiles with SearchMap). Commit: `feat(web): draw-a-zone polygon control (custom, no extra deps)`.

---

### Task 9: `/search` page — SSR + synced view + URL state + mobile toggle

**Files:** `apps/web/src/components/search/SearchView.tsx` + `.module.css`, `apps/web/src/pages/search.tsx`

**Interfaces produced:** the route `/search` (SSR + CSR), reading `?q=` from the home hero and keeping all state in the URL.

- [ ] **Step 1:** `apps/web/src/pages/search.tsx` — `getServerSideProps` parses the query, runs the initial search, computes the initial map view (bbox param → those bounds; else fit to results; else central-FL default), and renders the solid `Header` + `SearchView` (no footer for the full-height split):

```tsx
import Head from "next/head";
import type { GetServerSideProps } from "next";
import { Header } from "@/components/layout/Header";
import { SearchView } from "@/components/search/SearchView";
import { runSearch } from "@/server/run-search";
import { parseSearchParams, serializeSearchQuery, type SearchParams } from "@/lib/search-params";
import { boundsFromPoints } from "@/lib/map-points";
import { DEFAULT_VIEW, MAP_STYLE_URL } from "@/lib/map-style";
import type { SearchResult } from "@/server/run-search";
import type { InitialView } from "@/components/search/SearchMap";

type Props = {
  initial: SearchResult;
  initialView: InitialView;
  params: SearchParams;
  query: Record<string, string>;
  styleUrl: string;
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const params = parseSearchParams(ctx.query);
  let initial: SearchResult = { cards: [], points: [], total: 0 };
  try {
    initial = await runSearch(params);
  } catch (e) {
    console.warn("[search] query failed:", (e as Error).message);
  }
  let initialView: InitialView;
  if (params.bbox) initialView = { kind: "bounds", bounds: params.bbox };
  else {
    const b = boundsFromPoints(initial.points);
    initialView = b ? { kind: "bounds", bounds: b } : { kind: "center", ...DEFAULT_VIEW };
  }
  return {
    props: { initial, initialView, params, query: serializeSearchQuery(params), styleUrl: MAP_STYLE_URL },
  };
};

export default function SearchPage(props: Props) {
  return (
    <>
      <Head>
        <title>Search Florida homes — Herrera</title>
        <meta name="description" content="Search homes across Florida on an interactive map." />
      </Head>
      <Header />
      <SearchView {...props} />
    </>
  );
}
```

- [ ] **Step 2:** `apps/web/src/components/search/SearchView.tsx` — the client brain: dynamic map (ssr:false), shared state, debounced viewport refetch, URL sync, draw-zone toggle, mobile list/map toggle:

```tsx
import { useCallback, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { SearchResults } from "./SearchResults";
import { debounce } from "@/lib/debounce";
import { serializeSearchQuery, type Bbox, type SearchParams } from "@/lib/search-params";
import type { ListingCardVM } from "@/lib/listing";
import type { ListingMapPoint } from "@/lib/map-points";
import type { InitialView } from "./SearchMap";
import type { SearchResult } from "@/server/run-search";
import styles from "./SearchView.module.css";

const SearchMap = dynamic(() => import("./SearchMap").then((m) => m.SearchMap), {
  ssr: false,
  loading: () => <div className={styles.mapLoading}>Loading map…</div>,
});

export function SearchView({
  initial, initialView, params, styleUrl,
}: {
  initial: SearchResult;
  initialView: InitialView;
  params: SearchParams;
  query: Record<string, string>;
  styleUrl: string;
}) {
  const router = useRouter();
  const [cards, setCards] = useState<ListingCardVM[]>(initial.cards);
  const [points, setPoints] = useState<ListingMapPoint[]>(initial.points);
  const [total, setTotal] = useState(initial.total);
  const [loading, setLoading] = useState(false);
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [poly, setPoly] = useState<[number, number][] | null>(params.poly ?? null);
  const [mobileView, setMobileView] = useState<"list" | "map">("map");
  const paramsRef = useRef<SearchParams>(params);

  const fetchFor = useCallback(async (next: SearchParams) => {
    paramsRef.current = next;
    const qs = serializeSearchQuery(next);
    void router.replace({ pathname: "/search", query: qs }, undefined, { shallow: true });
    setLoading(true);
    try {
      const res = await fetch(`/api/search?${new URLSearchParams(qs).toString()}`);
      const data: SearchResult = await res.json();
      setCards(data.cards);
      setPoints(data.points);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Debounced viewport-driven refetch (drops bbox while a drawn zone is active — the polygon wins).
  const onViewportChange = useMemo(
    () =>
      debounce((bbox: Bbox) => {
        const next: SearchParams = { ...paramsRef.current };
        if (paramsRef.current.poly) delete next.bbox;
        else next.bbox = bbox;
        void fetchFor(next);
      }, 400),
    [fetchFor],
  );

  const onPolyChange = useCallback((ring: [number, number][] | null) => {
    setPoly(ring);
    const next: SearchParams = { ...paramsRef.current };
    if (ring) { next.poly = ring; delete next.bbox; } else delete next.poly;
    void fetchFor(next);
  }, [fetchFor]);

  return (
    <div className={styles.shell}>
      <div className={`${styles.results} ${mobileView === "list" ? styles.show : styles.hideMobile}`}>
        <SearchResults
          cards={cards} total={total} loading={loading}
          hoveredSlug={hoveredSlug} onHover={setHoveredSlug}
        />
      </div>

      <div className={`${styles.mapWrap} ${mobileView === "map" ? styles.show : styles.hideMobile}`}>
        <SearchMap
          points={points}
          initialView={initialView}
          hoveredSlug={hoveredSlug}
          onHoverSlug={setHoveredSlug}
          onViewportChange={onViewportChange}
          styleUrl={styleUrl}
          drawnPoly={poly}
          onPolyChange={onPolyChange}
          drawing={drawing}
          onDrawingChange={setDrawing}
        />
        <div className={styles.tools}>
          {poly ? (
            <button type="button" className={styles.tool} onClick={() => onPolyChange(null)}>
              Clear zone
            </button>
          ) : (
            <button
              type="button"
              className={`${styles.tool} ${drawing ? styles.toolActive : ""}`}
              onClick={() => setDrawing((d) => !d)}
            >
              {drawing ? "Click points · double-click to finish" : "Draw a zone"}
            </button>
          )}
        </div>
      </div>

      <div className={styles.mobileToggle} role="tablist" aria-label="View">
        <button type="button" role="tab" aria-selected={mobileView === "list"}
          className={mobileView === "list" ? styles.mtActive : ""} onClick={() => setMobileView("list")}>
          List
        </button>
        <button type="button" role="tab" aria-selected={mobileView === "map"}
          className={mobileView === "map" ? styles.mtActive : ""} onClick={() => setMobileView("map")}>
          Map
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3:** `SearchView.module.css`:

```css
.shell {
  position: relative;
  display: grid;
  grid-template-columns: minmax(420px, 44%) 1fr;
  height: calc(100dvh - var(--header-h));
}
.results { min-width: 0; border-right: 1px solid var(--color-border); overflow: hidden; }
.mapWrap { position: relative; min-width: 0; }
.mapLoading {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  background: var(--color-sand-100); color: var(--color-stone); font-size: 14px;
}
.tools { position: absolute; left: 16px; top: 16px; z-index: 5; display: flex; gap: 8px; }
.tool {
  font-family: var(--font-sans), system-ui, sans-serif; font-size: 13px; font-weight: 600;
  background: var(--color-surface); color: var(--color-forest);
  border: 1px solid var(--color-border-strong); border-radius: var(--radius-pill);
  padding: 9px 16px; cursor: pointer; box-shadow: var(--shadow-sm);
}
.toolActive { background: var(--color-forest); color: #fff; border-color: var(--color-forest); }

.mobileToggle { display: none; }
.show { display: block; }

@media (max-width: 900px) {
  .shell { grid-template-columns: 1fr; }
  .results, .mapWrap { grid-column: 1; grid-row: 1; }
  .hideMobile { display: none; }
  .mobileToggle {
    position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 20;
    display: inline-flex; background: var(--color-forest); border-radius: var(--radius-pill);
    padding: 4px; box-shadow: var(--shadow-modal);
  }
  .mobileToggle button {
    font-family: var(--font-sans), system-ui, sans-serif; font-size: 13px; font-weight: 600;
    color: rgba(255, 255, 255, 0.8); background: transparent; border: none;
    border-radius: var(--radius-pill); padding: 8px 22px; cursor: pointer;
  }
  .mtActive { background: #fff !important; color: var(--color-forest) !important; }
}
```

- [ ] **Step 4: Full verification** — `rm -rf apps/web/.next`, then `pnpm format && pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm --filter @herrera/web build` all green; `/search` builds as `ƒ` (SSR). Manual (`pnpm dev`):
  - Visit `/search` → split list+map; map shows clustered price pins over central FL fit to results.
  - Hover a card → its pin highlights bronze; hover a pin → its card outlines bronze.
  - Pan/zoom → URL `bbox=` updates and the list/pins refetch (debounced); shareable (reload the URL → same view).
  - From the home hero, search a city → lands on `/search?q=…&intent=…` and the list reflects `q`.
  - "Draw a zone" → click ≥3 points, double-click → only listings inside remain; "Clear zone" restores viewport search.
  - Resize to mobile (<900px) → List/Map toggle; one fills the screen.
  - Reduced-motion → cluster zoom / fit are instant.
- [ ] **Step 5:** Commit: `feat(web): /search signature screen — synced list↔map, viewport refetch, draw-zone, mobile toggle`.

---

## Self-Review

**Spec coverage (your D2 checklist):**
- Synced split, hover card↔pin → Task 6 (`onHover`) + Task 7 (feature-state both ways). ✅
- Map client-only `next/dynamic {ssr:false}` → Task 9 (`dynamic(... , {ssr:false})`). ✅
- Viewport bbox refetch (`ST_MakeEnvelope`), debounced → Task 4 (`&&`/`ST_MakeEnvelope`) + Task 9 (`debounce(…,400)` on `moveend`). ✅
- Draw-a-zone polygon (`ST_Intersects`) → Task 4 (poly→WKT→`ST_Intersects`) + Task 8 (draw) + Task 9 (poly state). ✅
- Clustering → Task 7 (GeoJSON `cluster:true` + cluster layers). ✅
- Filters + viewport in the query string, shareable, reads `?q=` → Task 2 (contract) + Task 9 (URL sync, SSR reads `ctx.query`, hero `q` applied). ✅
- Mobile list/map toggle → Task 9. ✅
- Intelligence layers = D6 seam only → Task 7 comment, no build. ✅
- Reuse `ListingCard`, corrected tokens → Task 6 (reuses card) + token vars throughout. ✅
- MapLibre, free tiles, no token → Task 1 (Carto Positron default, env override). ✅

**Placeholder scan:** every step has complete code/commands; the only deferred items are the explicitly-scoped D3 (filter UI) and D6 (layers) seams. ✅

**Type consistency:** `SearchParams`/`Bbox`/`Ring` (Task 2) used by Tasks 4/5/9; `SearchListing` (Task 4) → `runSearch` (Task 5) → `ListingCardVM`+`ListingMapPoint` (Task 3) → `SearchResults`/`SearchMap` (6/7) → `SearchView` (9). `toListingCardVM` widened to `ListingCardSource` (Task 5) keeps D1's `getFeaturedListings` callers valid (full `Listing` is assignable). `InitialView` defined in Task 7, consumed in Task 9. `promoteId:"slug"` ↔ feature-state `id:slug` ↔ `onHoverSlug(slug)` consistent. ✅

## Risks / notes for the executor
- **Execution order:** Task 8 (`useDrawZone`) must exist before Task 7 builds (SearchMap imports it). Do 7's component then 8 before building, or build them together.
- **Glyphs:** the cluster-count and pin-label symbol layers need the style's font glyphs; Carto Positron ships `Noto Sans Regular/Bold`. If you swap `NEXT_PUBLIC_MAP_STYLE_URL` to a style without those fonts, update the `text-font` arrays.
- **`getBounds` antimeridian:** central FL never crosses ±180, so the simple `[W,S,E,N]` bbox is safe; no wrap handling needed.
- **`.next` corruption:** if a build was interrupted (seen in D1), `rm -rf apps/web/.next` before rebuilding.
- **Preview gate when testing the API/map locally:** the F6 Basic-Auth middleware gates `/search` + `/api/search` when `PREVIEW_BASIC_AUTH` is set in `apps/web/.env.local`; unset it for the shell (`PREVIEW_BASIC_AUTH= pnpm --filter @herrera/web dev`) or pass creds.
- **Result cap:** `searchListings` caps at 500 (default 300). With 124 seed rows it never triggers; when MLS lands, add "zoom in to see all N" messaging (note for D3/MLS, not built here).
- **No SSR of WebGL:** never import `SearchMap`/`maplibre-gl` outside the `next/dynamic {ssr:false}` boundary, or the build will try to evaluate `window`.
- Branch `feat/d2-search-map`; per cadence, stop after D2 before D3.
```
