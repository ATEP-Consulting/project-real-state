# ADR-007 — Lead capture

- **Status:** Accepted (Phase 0)
- **Date:** 2026-06-29
- **Deciders:** Pablo (lead engineer), Nilyan Herrera (owns the questions)

## Context

Lead generation is the **#1 priority**. Capture must feel effortless, qualify the lead for Nilyan,
and never lose a contact to a too-demanding form. Nilyan must be able to change the questions
herself without a developer.

## Decision

- **Typeform-style flow — one question per screen**, branched by **intent: Buy / Sell / Rent**,
  with **contact captured last**. Implemented as a **shared multi-step overlay** launched from any
  CTA (home, listing, area pages, Florida-cost CTA), with optional dedicated URLs `/start/[intent]`
  and the landing shells `/buy` `/sell` `/rent` `/home-value` (ADR-019).
- **Questions are admin-configurable** (`qualification_questions`, per intent), edited by Nilyan in
  `/admin/questions`. Answers are stored as **JSONB** on the lead, keyed to the question set.
  **Seed Carolina-style defaults** so the flow is complete on day one.
- **Contact rule:** **phone and/or email required — at least one, never force both.** Validated
  with Zod on client and server.
- **Additional capture surfaces:** per-listing **"request info / schedule a tour"**, and the
  **"what's my home worth?"** seller magnet (`/home-value`). The `/contact` page is also a capture
  surface.
- **Per-channel consent** is captured with the lead and stored as records (ADR-011).
- **Viewed listings** are recorded and attached to the lead (browser-side history → submitted with
  the lead) so Nilyan sees what they looked at.
- On submit: write the lead + consent, **trigger notifications** (ADR-009), and send the lead a
  single transactional **auto-response**.

## Consequences

- Low-friction, progressive disclosure maximizes completion; contact-last + "at least one channel"
  removes the biggest drop-off.
- Nilyan owns her qualification logic; engineering isn't in the loop for question changes.
- JSONB answers keep the schema stable as questions evolve, at the cost of needing the question
  set to interpret them (acceptable; rendered via the stored question definitions).
- Consent and viewed-listings modeling now means the future AI concierge (ADR-014) and any v2
  automation inherit clean, well-attributed lead context — seam, not rebuild.
- Auto-response is **transactional** (a direct reply to the user's submission), distinct from
  marketing — keeps us clear of consumer-outbound concerns in v1 (ADR-011).

## Alternatives considered

- **Single long form** — rejected; higher abandonment, weaker qualification.
- **Hardcoded questions** — rejected; violates the "Nilyan configures" requirement.
- **Requiring both phone and email** — rejected explicitly by the brief.

## Addendum (2026-07-01, D11) — optional marketing opt-in on every capture form

All **four** capture surfaces — the per-listing inquiry, the Buy/Sell/Rent flow, `/contact`, and the
**home-valuation flow** (the *sell* branch with the address pre-filled — a **sell-flow variant**, not
a standalone `/home-value` page, which stays deferred) — gain **one optional marketing opt-in
checkbox** (added in D11), **separate from and in addition to** the required per-channel contact
consent. It is **optional** (the form submits fine without it), **unchecked by default** (never
pre-ticked), and **separately worded** (*"I'd like to receive news and new listings by email"*). It
always records its own marketing `consent_records` row — `granted=true` when ticked, **`granted=false`
when left unticked** (auditable, never omitted) — and gates the **Phase 2** email campaigns. The
**contact rule above stays required and unchanged.** Full decision + hard rules: **ADR-020** (and
ADR-011).
