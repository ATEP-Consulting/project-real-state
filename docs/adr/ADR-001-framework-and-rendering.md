# ADR-001 — Framework & rendering

- **Status:** Accepted (Phase 0)
- **Date:** 2026-06-29
- **Deciders:** Pablo (lead engineer), Nilyan Herrera (stakeholder)

## Context

The product is a public, SEO-critical real-estate site (listings, location landing pages,
guides) plus an interactive search/map experience and a gated admin/CRM. Lead generation is the
#1 priority, so public pages must render fast, be crawlable, and convert. We want a single,
well-understood React framework with first-class hosting on Vercel and a stable, non-experimental
rendering model.

## Decision

- **Next.js with the Pages Router + TypeScript (strict).** Explicitly **not** the App Router; **no
  React Server Components and no `"use client"`** directives.
- **Rendering per page type:**
  - **ISR** (`getStaticProps` / `getStaticPaths` + `revalidate`) for SEO/content pages: home,
    listing detail (`/homes/[slug]`), areas, guides, legal.
  - **`getServerSideProps`** only where per-request freshness is required — notably `/search`
    (filters + viewport in the query string), then hydrated for client interactivity (SSR + CSR).
  - **Client-side** for interactive/gated surfaces: the map, favorites, and all `/admin`.
- **Client-only libraries** (the map) are loaded via `next/dynamic` with `{ ssr: false }`.
- TypeScript `strict: true` across all workspaces; shared base `tsconfig` lives in
  `packages/config` (ADR-003).

## Consequences

- Mature, predictable data-fetching model; easy to reason about caching and revalidation.
- ISR keeps SEO pages static-fast while still reflecting DB changes (revalidate window) — the seed
  → MLS swap (ADR-006) needs no rendering change.
- No server components means data access happens in `getStaticProps`/`getServerSideProps`/API
  routes, keeping a clean server/client boundary (good for the future AI seams in ADR-014).
- We forgo App-Router features (streaming, nested layouts, server actions). Acceptable: the brief
  mandates Pages Router; layouts are handled with a shared `_app`/layout component.
- The map must be dynamically imported to avoid SSR of WebGL/`window` (ADR-012).

## Alternatives considered

- **App Router / RSC** — rejected by the brief; also more churn for a solo-maintained project.
- **Remix / Astro** — strong SEO stories, but weaker fit with the rest of the chosen stack
  (Vercel + Auth.js + the team's familiarity) and not requested.
