# ADR-005 — Listings data model

- **Status:** Accepted (Phase 0)
- **Date:** 2026-06-29
- **Deciders:** Pablo (lead engineer)

## Context

One `listings` table must serve three origins — the demo **seed**, Nilyan's **manual/off-market**
entries, and the future **MLS** feed — without schema changes when the source swaps (ADR-006). It
must carry geospatial data (ADR-012), Florida cost-of-ownership fields (ADR-013), rich media, and
the compliance attributes IDX requires (ADR-011).

## Decision

A single normalized **`listings`** table with:

- **`source: 'mls' | 'manual' | 'mock'`** — provenance. `mls` rows are owned by the sync worker
  and never hand-edited; `mock` rows are seed data (one-query purge); `manual` rows are Nilyan's.
- **`visibility: 'public' | 'registered' | 'private_link'`** — applies to **manual** rows
  (off-market control). MLS rows are always public (IDX: never login-gated, ADR-011).
- **Geometry** — a PostGIS `geometry(Point, 4326)` column (+ lat/lng convenience) for map/bbox/
  polygon queries; spatial index.
- **Core facts** — price, beds, baths, half-baths, sqft, lot size, year built, property type,
  status (active/pending/sold/off-market), MLS number (nullable), address parts, slug.
- **Florida fields** — `flood_zone` (FEMA), HOA fee, CDD fee/flag, estimated property taxes,
  estimated insurance inputs — all surfaced as **labeled estimates** (ADR-013).
- **Media** — ordered photos, optional `video` url, optional `virtual_tour` url.
- **Compliance/attribution** — listing brokerage/agent attribution, originating MLS, and the
  fields needed to render the MLS disclaimer + Equal Housing notice on real rows (ADR-011).
- **Bookkeeping** — `created_at`, `updated_at`, `last_synced_at` (MLS).

## Consequences

- The app queries one table regardless of origin; `source`/`visibility`/`status` are the filters
  that gate what the public sees.
- Off-market workflow (manual + `private_link`) is a first-class capability for Nilyan, distinct
  from MLS rows she cannot edit.
- Media as structured fields keeps the gallery/video/tour rendering uniform across sources.
- Seeded `mock` rows must populate every field a real listing would (incl. plausible geometry and
  Florida estimates) so the demo exercises the real UI; purge is `DELETE … WHERE source='mock'`.
- Estimate fields are clearly modeled as estimates (naming + UI labels) to avoid implying quotes
  or advice (ADR-011, ADR-013).

## Alternatives considered

- **Separate tables per source** — rejected; would force UI/query branching and break the
  "invisible swap" goal (ADR-006).
- **JSONB blob for all facts** — rejected for core/queried fields (need typed columns + indexes);
  JSONB is used only where it fits (e.g. lead qualification answers, ADR-007).

## Addendum (2026-07-01, D13) — off-market listing descriptions are bilingual

- **Manual (off-market) listings** are Nilyan-authored, so their free-text **`description` gets a
  Spanish pair** — a new **`description_es`** column added in the D13 migration. Facts, address, and
  media are language-neutral and are **not** duplicated per language.
- The public listing renders the **active locale's** description, **falling back to EN** when
  `description_es` is empty.
- **MLS-sourced descriptions are not translated in v1** — that decision is deferred post-feed
  (ADR-017/018). `description_es` is populated only for `source='manual'` rows Nilyan authors.
