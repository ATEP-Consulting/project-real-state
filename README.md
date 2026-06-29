# Herrera — real estate lead-gen platform (Nilyan Herrera, FL)

A custom real estate website + admin/CRM for licensed Florida realtor **Nilyan Herrera**.
Public visitors browse listings for free, search a map, and submit lead forms; Nilyan works
those leads from a built-in CRM. **Lead generation is the #1 priority.**

> **Read [`CLAUDE.md`](./CLAUDE.md) first — it is the authoritative source of truth** for
> context, scope, and guardrails.

## Current phase

A **full end-to-end demo on seed data**, deployed to a protected preview. The app always reads
from our own DB; only the populator changes (seed now, MLS sync worker later) — the demo is not
throwaway. See the phasing in [`docs/adr/ADR-017-scope-and-phasing.md`](./docs/adr/ADR-017-scope-and-phasing.md).

## Repo layout (pnpm workspaces)

```
apps/web/        # Next.js (Pages Router): public site + /admin   (scaffolded in Phase 1)
apps/worker/     # MLS sync worker                                 (Phase 3, stub for now)
packages/db/     # Drizzle schema + migrations + seed script       (Phase 1)
packages/config/ # shared tsconfig, eslint, env schema (Zod)       (Phase 1)
docs/adr/        # Architecture Decision Records (ADR-001 … ADR-019)
docs/visual-direction.md   # committed Claude Design token snapshot
docs/pages.md              # route inventory (ADR-019)
CLAUDE.md        # authoritative project instructions
BUILD_PLAYBOOK.md          # task-by-task build order
```

## Docs

- **[CLAUDE.md](./CLAUDE.md)** — authoritative instructions.
- **[docs/adr/](./docs/adr/)** — architecture decisions (start at [ADR-000](./docs/adr/ADR-000-index.md)).
- **[docs/visual-direction.md](./docs/visual-direction.md)** — design tokens.
- **[docs/pages.md](./docs/pages.md)** — page & route spec.
- **[BUILD_PLAYBOOK.md](./BUILD_PLAYBOOK.md)** — how to build it, one task at a time.

## Status

Phase 0 (planning artifacts) — in review. No application code yet. Tooling (TypeScript strict,
ESLint/Prettier, env schema, Next.js scaffold, Drizzle schema, seed, deploy) lands in Phase 1.
