# apps/worker

Standalone MLS sync worker (RESO Web API / SimplyRETS) — **Phase 3, built only once Nilyan's MLS
access exists.** Stub for now.

It upserts into the **same `listings` table** the app already reads, then purges `source='mock'`
rows. The swap from seed → real inventory is invisible to the web app. See
[ADR-004](../../docs/adr/ADR-004-mls-integration-and-sync.md) and
[ADR-006](../../docs/adr/ADR-006-data-source-abstraction-and-seed.md).

_Empty stub — do not build in v1._
