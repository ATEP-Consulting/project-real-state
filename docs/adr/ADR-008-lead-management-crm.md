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

## Addendum (2026-06-30, D10) — the pipeline ships as two views

- The lead pipeline is presented as **two views over the same data and the same backend** (`listLeads`,
  the shared filters, and `updateLeadStatus`), toggled on `/admin/leads` (`?view=board`):
  - **List view** (table) — **mobile-friendly**; where Nilyan works a lead on her phone (open it, add a
    note, update the stage quickly).
  - **Board view** (Kanban — one column per stage) — **desktop-first**; to see the whole pipeline at a
    glance.
- Moving a lead's stage from either view (the list's per-lead **stepper** or a **board card's** stage
  control) calls the same `updateLeadStatus`, which logs a `status_change` activity. The board is not a
  separate engine — just a second visualization.
- Per-card move uses a stage select (no drag-drop dependency); drag-drop is an optional later
  enhancement (must stay reduced-motion-aware and not bloat the build).
- D10 scope is **lead inbox + detail + pipeline (both views) + activities**. Analytics, off-market CRUD,
  content editing, the configurable-questions editor, and the outbound webhook remain **D11** (the
  webhook is a one-line seam comment in the D10 mutation helpers).

## Addendum (2026-07-01, D11) — revised D11 scope; campaigns are Phase 2

- **D11 = three admin management editors** (all admin-only behind F4 `requireAdmin`, reusing existing
  tables/seams, no new auth): **(1) qualification-questions editor** (CRUD + reorder + activate/
  deactivate `qualification_questions`, the editor D7 deferred here); **(2) off-market listings
  management** — CRUD for Nilyan's own manually-entered listings + the 3-state **visibility toggle**
  (`public` / `registered` / `private_link`); works on **real data now**, independent of the Miami
  feed; **(3) guides/blog editor** — CRUD/publish/unpublish for the `content` guides seeded in D12.
  D11 also adds the **optional marketing opt-in** to the four capture forms (ADR-007/020) — small and
  consent-related.
- **Deferred out of D11:** **analytics** (the D10 dashboard covers the demo; deeper time-series/
  per-source analytics needs real leads/listings) and **area/neighborhood content editing** (tied to
  the deferred Phase A area pages — ADR-019/`docs/superpowers/plans/2026-06-30-d12-seo.md`).
- **Email marketing campaigns are NOT in the CRM v1 — they are Phase 2 (ADR-020).** The CRM stays
  **manual-workflow, no automated consumer outbound** (as in the original decision above); D11 only
  captures the marketing consent that a future campaign system will rely on.
