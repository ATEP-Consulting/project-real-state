# Architecture Decision Records — index

This directory records the architectural decisions for **Herrera** (real estate lead-gen
platform for Nilyan Herrera). Each ADR captures **Context / Decision / Consequences**.

> **Authoritative order:** `CLAUDE.md` (root) is the source of truth. ADRs expand and justify the
> decisions it summarizes. **If a change contradicts an ADR, update the ADR first** (and CLAUDE.md
> if affected), then build.

## Status legend
`Accepted` — decided for v1. `Accepted (deferred)` — decided, but built in a later phase; v1 only
leaves the seams. `Proposed` — has an open question pending review (see the kickoff summary).

| ADR | Title | Status |
|---|---|---|
| [001](./ADR-001-framework-and-rendering.md) | Framework & rendering | Accepted |
| [002](./ADR-002-database-and-orm.md) | Database & ORM | Accepted |
| [003](./ADR-003-infra-and-deploy.md) | Infrastructure & deploy | Accepted |
| [004](./ADR-004-mls-integration-and-sync.md) | MLS integration & sync | Accepted (deferred → Phase 3) |
| [005](./ADR-005-listings-data-model.md) | Listings data model | Accepted |
| [006](./ADR-006-data-source-abstraction-and-seed.md) | Data-source abstraction & demo seed | Accepted |
| [007](./ADR-007-lead-capture.md) | Lead capture | Accepted |
| [008](./ADR-008-lead-management-crm.md) | Lead management & CRM | Accepted |
| [009](./ADR-009-notifications.md) | Notifications | Accepted |
| [010](./ADR-010-auth-and-access.md) | Auth & access | Accepted |
| [011](./ADR-011-consent-compliance-fair-housing.md) | Consent, compliance & Fair Housing | Accepted |
| [012](./ADR-012-map-and-geospatial-search.md) | Map & geospatial search | Accepted (MapLibre GL) |
| [013](./ADR-013-florida-cost-of-ownership.md) | Florida cost-of-ownership intelligence | Accepted |
| [014](./ADR-014-ai-features-v2.md) | AI features | Accepted (deferred → v2) |
| [015](./ADR-015-seo-and-content.md) | SEO & content | Accepted |
| [016](./ADR-016-design-system-and-visual-direction.md) | Design system & visual direction | Accepted |
| [017](./ADR-017-scope-and-phasing.md) | Scope & phasing | Accepted |
| [018](./ADR-018-internationalization.md) | Internationalization (EN/ES) | Accepted (EN default) |
| [019](./ADR-019-pages-and-routes.md) | Pages & routes (sitemap) | Accepted |

## Open questions — resolved in Phase 0 review (2026-06-29)
1. **Default locale** → **English default** (`/es/...` for Spanish). ADR-018.
2. **Map provider** → **MapLibre GL**. ADR-012.
3. **Project / brand name** → using **"Herrera"** (brand wordmark) / `herrera` (package name); the
   repo dir stays `project-real-state`. Easily renamed later if desired.

**Subagents/skills:** the proposed set was **approved** — scoped agent definitions live in
`.claude/agents/` and the SEO/schema skill in `.claude/skills/seo-schema/`.
