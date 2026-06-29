# ADR-006 — Data-source abstraction & demo seed

- **Status:** Accepted (Phase 0)
- **Date:** 2026-06-29
- **Deciders:** Pablo (lead engineer)

## Context

The current goal is a **full end-to-end demo on seed data**, deployed, with **nothing
throwaway**. Stakeholders must see the real application now, before MLS access exists. The only
thing that should differ between the demo and production is *how listings get into the database*.

## Decision

- **The app always reads from our own DB.** No code path fetches listings from an external source
  at request time. The reading layer is identical for seed and MLS data.
- **Populators are swappable, the schema is not:** the **seed script** (now) and the **MLS sync
  worker** (later, ADR-004) both write the same normalized `listings` table (ADR-005).
- **Seeded rows are tagged `source='mock'`** for a one-query purge at cutover.
- **Seed content** (`pnpm db:seed`): ~120 realistic **central-Florida** listings — real
  cities/neighborhoods/ZIPs, plausible coordinates that **cluster** on the map, credible
  prices/beds/baths/sqft, assigned **FEMA flood zones**, and plausible HOA/CDD/tax/insurance
  **estimates** (ADR-013). Plus a handful of **off-market** listings (manual + visibility), and
  **sample leads + activities** so the CRM looks alive (ADR-007, ADR-008). Photos from a
  **free-license** source. The seed is idempotent/re-runnable.

## Consequences

- The demo exercises the production code paths; the seed → MLS swap requires **no application
  change** — just run the worker and purge `mock`.
- Realistic clustered coordinates make the signature map/search screen demo well.
- The seed must keep pace with the schema (it's part of `packages/db`); treat it as a maintained
  artifact, not a one-off.
- "Sample data — demo" marker (ADR-003) plus `source='mock'` make the demo's nature explicit in
  both UI and data.
- A small risk: seed data quality drives demo credibility — invest in realistic values
  (especially Florida estimates and coordinates).

## Alternatives considered

- **Hardcoded fixtures in the frontend** — rejected; would not exercise the DB/query layer and
  would be throwaway.
- **Pointing the demo at a sandbox MLS** — rejected; access not available, and seed gives full
  control over a credible central-FL dataset.
