# ADR-003 — Infrastructure & deploy

- **Status:** Accepted (Phase 0)
- **Date:** 2026-06-29
- **Deciders:** Pablo (lead engineer)

## Context

We need to (a) develop locally with a realistic environment, and (b) deploy a **shareable but
safe** demo on seed data — not crawlable, not mistakable for a live brokerage with real
inventory. Later the same app serves real MLS data in production.

## Decision

- **Monorepo:** pnpm **workspaces** — `apps/web`, `apps/worker`, `packages/db`, `packages/config`.
- **Web hosting:** **Vercel** (Next.js). **Database:** **Neon** (Postgres + PostGIS).
  **CDN/edge/DNS:** **Cloudflare** in front. The MLS **worker** is hosted separately later (a
  scheduled/long-running host, not Vercel functions) — Phase 3.
- **Demo-deploy safety (all three):**
  1. **`noindex`** — `X-Robots-Tag: noindex, nofollow` + `<meta name="robots">` + a disallow-all
     `robots.txt` on the preview.
  2. **Access-restricted** — Vercel password/Deployment Protection (or Basic Auth via middleware).
  3. **Visible "sample data — demo" marker** in the UI so no one mistakes seed listings for real
     inventory.
- **Config & secrets:** a **Zod-validated env schema** in `packages/config` is the single source
  of truth for environment variables; the app fails fast on missing/invalid env. `.env.example`
  is committed; real `.env*` are gitignored.
- **CI quality gate:** `typecheck` + `lint` must be green per task (small commits).

## Consequences

- One-command preview deploys with protection built in; the demo can be shared with Nilyan and
  stakeholders without SEO or "is this real?" risk.
- Neon's serverless Postgres fits Vercel's function model and keeps local/prod parity (same
  Postgres + PostGIS).
- The worker being off-Vercel (Phase 3) keeps long-running sync out of serverless limits.
- Env validation centralizes the (eventually long) list of keys: DB URL, Auth.js secret, Resend,
  Twilio (seam), map provider token (if Mapbox), etc.
- Removing demo protection for production is a deliberate, documented switch — the `noindex` +
  marker + auth come off together when real inventory goes live.

## Alternatives considered

- **Single package (no workspaces)** — rejected; the worker and shared db/config benefit from
  isolation and shared types.
- **Render/Fly/Railway for web** — viable, but Vercel is the first-class Next.js host named in the
  brief and pairs cleanly with Neon.
