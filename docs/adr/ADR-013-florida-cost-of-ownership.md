# ADR-013 — Florida cost-of-ownership intelligence

- **Status:** Accepted (Phase 0)
- **Date:** 2026-06-29
- **Deciders:** Pablo (lead engineer)

## Context

The **differentiator** and a primary **lead magnet**: Florida buyers care intensely about the
*true* monthly cost — especially **flood risk and insurance**, plus home insurance, HOA/CDD, and
taxes. Surfacing a realistic monthly number (clearly as an estimate) builds trust and creates a
natural reason to contact Nilyan.

## Decision

- **Per listing + as a map layer**, compute and show a realistic **monthly cost of ownership**:
  **FEMA flood zone** (free public data) → **estimated flood insurance** + **estimated home
  insurance** + **HOA/CDD** + **estimated property taxes** → a combined monthly figure (alongside
  the mortgage estimate from the listing's mortgage calc).
- **Everything is a clearly-labeled ESTIMATE** — never a quote, never financial/insurance/legal
  advice (ADR-011). Each figure shows its basis and a disclaimer.
- **Inputs:** flood zone from FEMA public layers; estimates derived from transparent, documented
  assumptions (rate-of-value tables by zone/price, county millage approximations, HOA/CDD from the
  listing). Assumptions are centralized and tunable, not hidden magic numbers.
- **Lead magnet:** a **"what will this really cost you?"** CTA on the cost panel opens the lead
  capture overlay (ADR-007).
- **Demo:** the seed assigns each listing a plausible flood zone + HOA/CDD/tax/insurance estimate
  (ADR-006) so the panel and the map cost-layer are populated and credible.

## Consequences

- A distinctive, genuinely useful feature competitors don't foreground — strong capture surface.
- Estimate labeling + documented assumptions keep us compliant and honest (ADR-011); the figures
  are defensible, not arbitrary.
- The estimation logic is centralized (one module) so assumptions can improve over time and, later,
  swap to real data sources (insurance quote APIs, county tax rolls) without UI changes.
- The map cost-layer reuses the same per-listing computation (ADR-012).
- Risk: bad assumptions undermine trust — invest in plausible Florida-specific tables and show the
  basis.

## Alternatives considered

- **Live insurance quotes in v1** — rejected; would imply a quote/advice (compliance) and needs
  carrier integrations. v1 = transparent estimates; real quotes are a later enhancement.
