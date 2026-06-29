# ADR-004 — MLS integration & sync

- **Status:** Accepted (deferred → Phase 3). Built only once Nilyan's MLS access exists.
- **Date:** 2026-06-29
- **Deciders:** Pablo (lead engineer), Nilyan Herrera (MLS membership)

## Context

Production inventory comes from Florida MLS systems — launch with **Stellar MLS** (central FL),
add **Miami REALTORS / BeachesMLS** (SE FL) later. MLS/IDX rules govern display and freshness
(remove sold/expired promptly; broker attribution; no paywalling — see ADR-011). MLS access
depends on Nilyan's membership and credentials, which are not available during the demo, so this
is **not** built for v1.

## Decision

- A **standalone Node cron worker** in `apps/worker` (hosted off-Vercel, ADR-003) ingests via the
  **RESO Web API** (or **SimplyRETS** as an aggregator) and **upserts into the same `listings`
  table** the app already reads (ADR-005, ADR-006).
- The worker **normalizes** each MLS record (Zod) into our schema, sets `source='mls'`, and is the
  **sole owner of `source='mls'` rows** — these are never hand-edited in the admin.
- **Freshness:** remove/flag sold & expired listings **within 24h** (IDX requirement); track a
  per-listing `last_synced_at` and a sync run log.
- **Florida multi-MLS:** designed for multiple feeds (Stellar first), de-duplicating by MLS number
  / source, each tagged with its originating MLS for attribution.
- **Cutover:** once real data flows, **purge `source='mock'`** rows in one query (ADR-006). The
  public site shows real inventory with **zero UI changes**.

## Consequences

- The demo is not throwaway: only the populator changes (seed → worker), both writing the same
  normalized table.
- Compliance is enforced at ingest: attribution fields and disclaimers travel with each row
  (ADR-011); freshness handled by the worker, not the UI.
- Serverless function limits don't constrain sync (it's a dedicated worker).
- Real schedules, rate limits, and field mappings can only be finalized against Nilyan's actual
  feed — locked in Phase 3, not now.

## Alternatives considered

- **Direct API calls from Next.js at request time** — rejected; rate limits, latency, and IDX
  caching rules favor a sync-into-our-DB model.
- **SimplyRETS vs raw RESO** — SimplyRETS speeds integration/normalization; raw RESO Web API is
  the long-term standard. Choose per Nilyan's MLS offering in Phase 3; the worker abstracts the
  source either way.
