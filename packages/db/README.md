# packages/db

Shared **Drizzle ORM** schema, migrations, and the **seed script** (`pnpm db:seed`). Implemented
in **Phase 1 (tasks F2, F5)**.

- PostgreSQL + **PostGIS**; Zod at boundaries. See [ADR-002](../../docs/adr/ADR-002-database-and-orm.md).
- Core tables: `listings`, `leads`, `activities`, `qualification_questions`, `content` (+ consent
  records). See [ADR-005](../../docs/adr/ADR-005-listings-data-model.md),
  [ADR-007](../../docs/adr/ADR-007-lead-capture.md), [ADR-008](../../docs/adr/ADR-008-lead-management-crm.md),
  [ADR-011](../../docs/adr/ADR-011-consent-compliance-fair-housing.md).
- Seed writes realistic central-FL data tagged `source='mock'` for one-query purge. See
  [ADR-006](../../docs/adr/ADR-006-data-source-abstraction-and-seed.md),
  [ADR-013](../../docs/adr/ADR-013-florida-cost-of-ownership.md).

_No schema code yet — Phase 0 is planning only._
