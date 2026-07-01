# ADR-019 — Pages & routes (sitemap)

- **Status:** Accepted (Phase 0)
- **Date:** 2026-06-29
- **Deciders:** Pablo (lead engineer)

## Context

A complete agent site needs a clear route inventory with the right rendering strategy per page
(SEO vs interactive vs gated), and a deliberate decision about where **lead capture** lives. The
full table is maintained in **`docs/pages.md`** (the route spec).

## Decision

- The **full route inventory + rendering per page lives in `docs/pages.md`** and is authoritative;
  this ADR records the decision and the key principles.
- **Public:** `/` (ISR) · `/search` (**SSR + CSR**, the signature) · `/homes/[slug]` (ISR) ·
  `/buy` `/sell` `/rent` (ISR shells launching capture) · `/home-value` (seller magnet) · `/areas`,
  `/areas/[city]`, `/areas/[city]/[neighborhood]` (ISR, SEO) · `/guides`, `/guides/[slug]` (ISR) ·
  `/favorites` (CSR) · `/about` (ISR) · `/contact` (ISR, a capture surface) · legal (`/privacy`,
  `/terms`, `/accessibility`) · `/404`, `/500`.
- **Admin (gated, Nilyan only):** `/admin/login`, `/admin` (dashboard/analytics), `/admin/leads`
  (+`/[id]`), `/admin/listings` (+`new`, `/[id]`), `/admin/content` (+`/[id]`), `/admin/questions`,
  `/admin/settings`.
- **Lead capture is a shared multi-step overlay**, not a standalone page — launched from CTAs
  across the site (optionally backed by `/start/[intent]` URLs). The **persistent contact module**
  on `/homes/[slug]` and the **Florida-cost CTA** are **capture surfaces**, not pages (ADR-007/013).
- **Rendering principles** (ADR-001): SEO pages = ISR; `/search` = SSR + CSR with filters/viewport
  in the query string; favorites + admin = client/gated.
- **i18n:** all public routes localized — **English at the root, Spanish under `/es/`** (default
  locale per ADR-018) — with **reciprocal `hreflang` + `x-default`** on every page, **both language
  URLs in the sitemap**, per-locale `<html lang>` and a self-referential canonical, and a header
  **EN/ES toggle**. Wired in **D13** (the seam sits in `<Seo>`).
- **API routes** (`/api/*`): lead submission (+consent, notifications, auto-response), geo/search
  queries (PostGIS bbox + polygon), favorites, map-layer data, the daily-digest cron, admin
  mutations. The MLS sync runs in `apps/worker`, not an API route.

## Consequences

- One agreed map of the site for building and for SEO; `docs/pages.md` is the working reference and
  the "Builds in" column ties each route to a `BUILD_PLAYBOOK.md` task.
- Capture-as-overlay keeps the funnel consistent and launchable from anywhere (lead-gen first),
  avoiding scattered one-off forms.
- Rendering choices are decided per route up front, avoiding ad-hoc SSR/CSR decisions later.

## Alternatives considered

- **Dedicated capture pages per intent only** — usable (and available as `/start/[intent]`), but
  the overlay is the primary pattern so any CTA can capture in context.
- **Client-rendering SEO pages** — rejected (ADR-001/015).

## Addendum (2026-06-30, D7) — the home hero leads with lead capture

- **The home (`/`) hero's primary call-to-action is lead capture**, per the client's explicit
  request (lead generation is the #1 priority — see CLAUDE.md). The hero **leads with three
  prominent "I want to Buy / Sell / Rent" buttons** that open the branched capture overlay
  (`openCapture(intent)`); the **map-search card remains in the hero but is secondary** — framed as
  an "Or explore listings yourself" path into `/search`. Search is unchanged functionally (it is
  still the signature screen); it is simply no longer the hero's visual lead.
- This **refines, and does not contradict, the decision above** that lead capture is a shared
  multi-step overlay launched from CTAs — the hero buttons are exactly such CTAs. `/buy` `/sell`
  `/rent` remain real ISR landing routes that host the same flow (overlay + real routes).
- The **`/home-value` seller magnet ships in D7 as a thin Sell-branch variant** (the home valuation
  CTA opens the Sell flow with the address pre-filled); a dedicated `/home-value` landing page is a
  follow-up. See `docs/pages.md`.
- Layout details recorded in `docs/visual-direction.md` (§hero); the committed
  `screens/section_a_hero_card.png` shows the prior search-led arrangement and is intentionally
  superseded for the CTA order. Related: ADR-007 (lead capture).
