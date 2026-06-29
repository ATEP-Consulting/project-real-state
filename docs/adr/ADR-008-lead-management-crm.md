# ADR-008 — Lead management & CRM

- **Status:** Accepted (Phase 0)
- **Date:** 2026-06-29
- **Deciders:** Pablo (lead engineer), Nilyan Herrera (sole user)

## Context

Nilyan works solo and needs to act on leads fast. A built-in, no-extra-subscription CRM keeps the
whole loop — capture → work → close — in one place she controls, while leaving a clean path to an
external CRM later if she ever wants one.

## Decision

A **custom, manual-workflow CRM** in `/admin` (gated, ADR-010):

- **Lead inbox** with filters (intent / status / date / source).
- **Lead detail** — contact, the qualification **answers**, **viewed listings**, consent records,
  and the activity timeline.
- **Pipeline** — `New → Contacted → Qualified → Appointment → Offer → Closed/Lost`.
- **Activities** — calls, notes, status changes, and **follow-up reminders**, tied to a lead.
- **Analytics** — lead **sources**, **conversion** through the pipeline, and **most-viewed
  listings**.
- **Off-market listing CRUD** with the visibility toggle (ADR-005).
- **Content editing** for neighborhood/guide pages (ADR-015).
- **Configurable qualification questions** (ADR-007).
- **Webhook seam** — an outbound webhook on lead create/update so an external CRM can be wired
  later without a rebuild (no external CRM in v1).

Tables: `leads`, `activities`, `qualification_questions`, `content` (+ consent records on the
lead) — see ADR-005/007/011.

## Consequences

- Everything Nilyan needs is in one tool she owns; no per-seat SaaS cost for a solo agent.
- Manual workflow only in v1 — **no automated consumer outbound** (nurturing/sequences are v2,
  ADR-017); this keeps compliance simple (ADR-011).
- Analytics are computed from the same tables (sources from lead attribution, conversion from
  pipeline transitions, most-viewed from listing view events / viewed-listings).
- The webhook seam + clean lead model mean a future external CRM or v2 automation is additive.
- Sample leads + activities in the seed (ADR-006) make the CRM demo as a live system.

## Alternatives considered

- **Third-party CRM (HubSpot/Follow Up Boss) from day one** — rejected for v1: cost, lock-in, and
  it splits the data model; the webhook seam keeps the door open.
