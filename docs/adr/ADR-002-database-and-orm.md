# ADR-002 — Database & ORM

- **Status:** Accepted (Phase 0)
- **Date:** 2026-06-29
- **Deciders:** Pablo (lead engineer)

## Context

The app is geospatial at its core (map search by viewport bbox and drawn polygons, clustering,
nearest-POI), needs strong typing end-to-end, and must validate untrusted input at every boundary
(public lead forms, search params, admin mutations, and a future MLS feed). It also must run
identically locally and on serverless hosting.

## Decision

- **PostgreSQL + PostGIS** as the single datastore. PostGIS provides geometry columns and the
  spatial predicates we need (`ST_Within`, `ST_Intersects`, bbox `&&`, `ST_DWithin`, clustering).
- **Drizzle ORM** for schema, typed queries, and migrations. Spatial columns/queries that Drizzle
  doesn't model natively are expressed with its SQL escape hatch (`sql\`...\``) and a `geometry`
  custom type.
- **Zod at every boundary** — request/response DTOs, env vars (ADR-003), seed inputs, and the
  future MLS normalizer. DB row types (Drizzle) and wire types (Zod) are kept in deliberate sync.
- **Hosting:** Neon (serverless Postgres) with PostGIS enabled (ADR-003); connect over a pooled
  serverless driver suitable for Vercel functions.
- The schema package is shared (`packages/db`) and owns migrations + the seed script.

## Consequences

- One database for relational + geospatial needs; no separate geo service to operate.
- Drizzle gives compile-time-checked queries and lightweight migrations that suit a solo
  maintainer; the SQL escape hatch covers PostGIS where the typed API stops.
- Zod boundaries mean a single validation story for public forms today and the MLS feed later;
  malformed data never reaches the DB.
- Must confirm PostGIS is enabled on Neon and that the chosen serverless driver works with
  geometry types; migrations must `CREATE EXTENSION IF NOT EXISTS postgis`.
- Geometry queries are written by hand (raw SQL) — covered by tests; acceptable given the small,
  well-bounded set of spatial queries.

## Alternatives considered

- **Prisma** — weaker raw-SQL/PostGIS ergonomics and heavier client; Drizzle preferred for typed
  SQL + geospatial.
- **Separate search/geo engine (Elastic, Typesense)** — overkill for the demo's data volume;
  PostGIS handles bbox/polygon/cluster fine. Revisit only at large MLS scale.
