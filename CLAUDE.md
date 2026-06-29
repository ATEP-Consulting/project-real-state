# CLAUDE.md — Herrera (real estate lead-gen platform for Nilyan Herrera)

> Read this file at the start of every session. It is the source of truth for context,
> scope, and guardrails. If a request contradicts it, say so before acting.

## What this is

A custom real estate website for **licensed Florida realtor Nilyan Herrera** (solo — she
is the only team member). Public visitors browse market listings **for free**, search a
map, and submit lead forms; Nilyan works those leads from a built-in **admin/CRM**.
Audience = everyone (buyers, sellers, renters), not a single niche.

**Prime directive: lead generation is the #1 priority.** Every feature exists to capture a
contact and get Nilyan in front of them fast. Filters and tools are deliberately useful
**but not exhaustive** — leaving good reasons to contact her is part of the strategy.

- Market: Florida. Launch with **Stellar MLS** (central FL); add Miami REALTORS /
  BeachesMLS (SE FL) later. Monetization = commissions. No paywall, no consumer payments.

## Current phase: full end-to-end DEMO on seed data

Build the **real application**, populated by a **seed script** instead of the MLS feed, so
stakeholders see everything now without waiting for MLS access. Runs locally AND deploys to
a shareable preview link (Vercel, `noindex` + access-restricted, "sample data" marker).

- The app **always reads from our own DB.** Only the populator changes: seed now, MLS sync
  worker later, both writing the same normalized `listings` table — swap is invisible, so
  **the demo is not throwaway.**
- Seed: realistic central-FL listings (real cities/neighborhoods/ZIPs, plausible coords so
  the map clusters, credible prices/beds/baths/sqft, assigned FEMA flood zones), a few
  off-market listings, and sample leads + activities so the CRM looks alive. Photos from a
  free-license source. **Tag seeded rows** (`source='mock'`) for one-query purge later.

## Hard rules (non-negotiable)

1. **Respect the v1 / Phase 2 boundary** (see Scope).
2. **IDX/MLS compliance:** never paywall or login-gate MLS listings; broker attribution +
   MLS disclaimer + Equal Housing logo on real listings.
3. **Fair Housing:** no steering anywhere (site or AI chat). Never characterize an area by
   the protected-class makeup of its residents or answer "is it good for [type of people]".
4. **Capture consent per channel at every form and store the record.** Consent + suppression
   seam in the data model from day one (no automated consumer outbound in v1).
5. **Cost/insurance figures are clearly-labeled ESTIMATES**, never quotes or advice.
6. **The UI follows the Claude Design system** (see Design). Don't invent a look.

## Stack

- **Next.js (Pages Router) + TypeScript (strict).** ISR via `getStaticProps` +
  `revalidate` for listing/location pages; `getServerSideProps` only when needed.
  (NOT App Router; no server components / `"use client"`.)
- **PostgreSQL + PostGIS.** **Drizzle ORM.** **Zod** at all boundaries.
- **Auth.js — ADMIN ONLY** (Nilyan). No public accounts in v1 (favorites are login-less).
- **Map:** MapLibre GL (or Mapbox), **client-only** via `next/dynamic` `{ ssr: false }`;
  PostGIS geometry queries on the backend.
- **AI features (Phase 2, NOT in the demo):** natural-language search + concierge chat
  (Claude API), grounded in our DB with strict guardrails. Built later, on real MLS data.
- **MLS sync (later, not for the demo):** standalone Node cron worker (RESO Web API or
  SimplyRETS) upserting into the same `listings` table.
- **Notifications (internal, to Nilyan):** Resend (email) — instant alert + daily digest;
  Twilio (WhatsApp/SMS) wired as a **seam**, not active in v1.
- **Hosting:** web on **Vercel** + **Neon** (Postgres) + Cloudflare; worker host later.
- **Package manager:** pnpm (workspaces).

## Repo structure (pnpm workspaces)

```
apps/web/        # Next.js (Pages Router): public site + /admin
apps/worker/     # MLS sync worker (later, not for the demo)
packages/db/     # Drizzle schema + migrations + seed script (shared)
packages/config/ # shared tsconfig, eslint, env schema (Zod)
docs/adr/        # Architecture Decision Records
docs/visual-direction.md   # committed snapshot of the Claude Design tokens
CLAUDE.md
```

## Commands

`pnpm dev` · `pnpm typecheck` · `pnpm lint` · `pnpm db:generate|migrate|studio` ·
`pnpm db:seed` (realistic demo data) · `pnpm sync:run` (later) · `pnpm test`

## Data model (core tables)

- **listings** — `source: 'mls'|'manual'|'mock'`; manual rows carry
  `visibility: 'public'|'registered'|'private_link'`; PostGIS geometry; Florida fields
  (flood_zone, hoa/cdd, est. taxes); media (photos, video, virtual_tour). MLS rows owned by
  the sync worker; never hand-edited.
- **leads** — contact (phone and/or email — at least one) + `intent: 'buy'|'sell'|'rent'` +
  qualification answers (jsonb, from configurable questions) + source/attribution + viewed
  listings + **per-channel consent records**. Pipeline `status` here.
- **activities** — calls, notes, status changes, follow-up reminders, tied to a lead.
- **qualification_questions** — admin-editable questions per intent (Nilyan configures).
- **content** — neighborhood pages / posts editable from the admin.

## Feature set (v1 demo)

- **Search + map:** synced results-list + interactive-map split view (hover card ↔ pin;
  pan/zoom updates results; **draw-a-zone** filter; clustering). Map intelligence layers:
  **schools, transit, walkability, shops/POI.** Filters useful but intentionally limited.
- **Florida cost-of-ownership intelligence (the differentiator):** per listing + as a map
  layer — FEMA **flood zone** + **estimated** flood insurance + home insurance + HOA/CDD +
  property taxes → a realistic **monthly cost**, all labeled estimates. A lead magnet.
- **Listing detail (rich):** big gallery, video, virtual tour, map, key-facts strip,
  mortgage calc, similar listings, the Florida cost panel, persistent contact module.
- **Lead capture (core):** Buy/Sell/Rent typeform-style (one question per screen),
  **questions configurable by Nilyan** (seed with Carolina-style defaults), contact last,
  **phone and/or email required (never force both, at least one)**. Plus per-listing
  inquiry/schedule-tour and a "what's my home worth?" magnet. Every lead → **instant email
  alert + daily digest** to Nilyan (WhatsApp seam ready) + a single transactional
  **auto-response** to the lead ("thanks, we'll be in touch shortly").
- **AI: NOT in the demo — moved to v2.** v1 only keeps the seams so adding it later is
  plug-in, not rebuild: search resolves to structured filters, and listings/leads are well
  modeled so the future concierge chat has clean context. No LLM dependency in the demo.
- **Favorites:** login-less (browser-stored) + a soft "save these / get notified — leave
  your email" capture nudge. No client accounts in v1.
- **Trust/content:** Nilyan's bio + **our own testimonials** now (Google reviews later);
  neighborhood guide pages (programmatic SEO).
- **Admin/CRM (complete):** lead inbox + filters; lead detail (answers + viewed listings);
  pipeline (New→Contacted→Qualified→Appointment→Offer→Closed/Lost); call log + notes +
  reminders; off-market CRUD (with visibility); **analytics** (lead sources, conversion,
  most-viewed listings); **content editing** (neighborhood pages); **configurable
  qualification questions**; webhook seam for a future external CRM.

## Pages & routes (full spec in `docs/pages.md`, ADR-019)

**Public:** `/` (home) · `/search` (results + synced map, the signature) · `/homes/[slug]`
(listing detail) · `/buy` `/sell` `/rent` · `/home-value` (seller magnet) · `/areas` +
`/areas/[city]` + `/areas/[city]/[neighborhood]` (SEO) · `/guides` + `/guides/[slug]` ·
`/favorites` · `/about` · `/contact` · legal pages. **Admin (gated, Nilyan only):**
`/admin/login` · `/admin` (dashboard/analytics) · `/admin/leads` + `/admin/leads/[id]` ·
`/admin/listings` (+ new/[id]) · `/admin/content` (+ [id]) · `/admin/questions` ·
`/admin/settings`. **Lead capture is a shared multi-step overlay** launched from CTAs, not a
standalone page; the persistent contact module on listings and the Florida-cost CTA are capture
surfaces. SEO pages (home, listings, areas, guides) render with ISR; `/search` is SSR+CSR; admin
and favorites are client/gated. EN default, `/es/...` for Spanish.

## Scope — v1 vs Phase 2

**Phase 2 / v2 (DO NOT build yet):** the AI features (natural-language search + concierge
chat, on real MLS data), passwordless client accounts, saved searches + email/SMS alerts,
nurturing/automation, AI lead scoring, automated SEO blog generation.
Design data-model seams (consent, suppression list, saved-search shape) but ship no UI/logic.

## Design — from Claude Design via MCP (integrate, don't invent)

**Visual source of truth: `Prototipo.dc.html`**, imported from the Claude Design MCP
(server `https://api.anthropic.com/v1/design/mcp`, auth `/design-login`; project
`https://claude.ai/design/p/8ecde379-78f0-45f9-b563-f36a2b076a82?file=Prototipo.dc.html`).
Pull its tokens + screens through the MCP and sync into a **committed tokens file** (stable
snapshot; do not depend on the MCP at runtime/build). Build against those tokens; never ship a
generic shadcn/Tailwind theme. Interaction must stay conventional/intuitive (the synced list+map
patterns above, mobile-first list/map toggle); photography treated consistently (aspect-ratio
crops).
**Motion:** subtle, elegant transitions that read as premium — smooth route/page transitions and
sections that gently ease/fade in as they enter the viewport on scroll. Keep it restrained and
consistent (never flashy; overdone motion reads as AI-generated) and **always honor
`prefers-reduced-motion`**.
Quality floor = responsive, keyboard focus, reduced-motion. If a screen drifts from the system or
looks templated, fix it. See `docs/visual-direction.md`, ADR-016.

## How to work here

- Plan before code; reference `docs/adr/*`; if a change contradicts an ADR, update the ADR
  first. Keep the v1 boundary; flag Phase 2 asks. Small commits; typecheck + lint green.
- Data fetching: `getStaticProps`/`getStaticPaths` + `revalidate` for public SEO pages;
  `getServerSideProps` when needed; client fetching for interactive/admin. Client-only libs
  (map) via `next/dynamic` `{ ssr: false }`.
