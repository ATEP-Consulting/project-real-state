# ADR-017 — Scope & phasing

- **Status:** Accepted (Phase 0)
- **Date:** 2026-06-29
- **Deciders:** Pablo (lead engineer), Nilyan Herrera (stakeholder)

## Context

Clear scope boundaries prevent both under-delivery and scope creep. The immediate goal is a
**full end-to-end demo on seed data**, deployed — built as the *real* app so nothing is throwaway
(ADR-006). AI and growth features are explicitly later.

## Decision

**Build order:**
- **Phase 0 — planning artifacts** (this): ADRs, structure, committed design tokens, route spec,
  skills proposal. *Stop for review before any app code.*
- **Phase 1 — foundations:** monorepo/tooling, Drizzle schema, design tokens + base layout/motion,
  admin auth, seed script, protected preview deploy.
- **Phase 2 — the demo (spine first):** home → search+map (with intelligence layers) → listing
  detail (with the Florida cost panel) → Buy/Sell/Rent capture (configurable questions) →
  notifications + auto-response → admin CRM (pipeline, notes, analytics, content, questions). Then
  EN/ES and neighborhood SEO pages. **No AI.**
- **Phase 3 — MLS integration:** the sync worker → same `listings` table → purge `mock` (ADR-004),
  only once Nilyan's MLS access exists.
- **v2 — on real data:** the AI features (ADR-014) + the rest below.

**In v1 (the demo):** search+map, draw-a-zone, intelligence layers (free/mock), Florida
cost-of-ownership, rich listing detail, configurable lead capture, notifications + auto-response,
login-less favorites, trust/content, **complete admin/CRM**, EN/ES.

**Explicitly NOT in v1 — Phase 2/v2 (build only the data-model seams):**
- AI features (NL search + concierge chat, on real MLS data) — ADR-014.
- Passwordless **client accounts** — ADR-010.
- **Saved searches** + email/SMS **alerts**; **nurturing/automation** — consent/suppression +
  saved-search **shape** only (ADR-011).
- **AI lead scoring** by behavior.
- **Automated SEO blog generation** (human-reviewed) — ADR-015.

## Consequences

- The demo is a complete, shippable slice that becomes production by swapping the populator — not a
  prototype.
- Seams (consent/suppression, saved-search shape, structured-filter search boundary, clean lead
  model, webhook, notification channels) are in v1 so v2 is additive.
- A request that crosses the boundary must be flagged and, if accepted, recorded by **updating the
  relevant ADR first** (and this one), then building.

## Alternatives considered

- **Throwaway clickable prototype** — rejected; the brief mandates the real app on seed data.
- **AI in the demo** — rejected (ADR-014).
