# ADR-011 — Consent, compliance & Fair Housing

- **Status:** Accepted (Phase 0)
- **Date:** 2026-06-29
- **Deciders:** Pablo (lead engineer), Nilyan Herrera (licensed broker/agent)

## Context

A real-estate lead-gen site carries legal obligations: **IDX/MLS display rules**, **Fair Housing**
(no steering), consumer-contact **consent** (CAN-SPAM/TCPA posture), and a duty not to present
estimates as professional/financial advice. These are **hard rules** in CLAUDE.md and must be
seams in the data model from day one.

## Decision

- **Per-channel consent capture + records.** Every form captures explicit, per-channel consent
  (email / phone / SMS·WhatsApp) and stores an immutable **consent record** (what was agreed, when,
  the wording shown, source). A **suppression-list seam** exists in the model from day one. **No
  automated consumer outbound in v1** (ADR-009) — only internal alerts + one transactional reply.
- **IDX/MLS display rules** (on real `source='mls'` rows, ADR-005): **never paywall or login-gate**
  MLS listings; show **broker attribution**, the **MLS disclaimer**, and the **Equal Housing
  Opportunity** logo. These render from per-row attribution fields.
- **Fair Housing — no steering, everywhere** (site copy, area pages, filters, and the future AI
  chat): never characterize an area by the **protected-class makeup** of its residents and never
  answer "is it good for [type of people]." Area/neighborhood content sticks to objective facts
  (amenities, schools-as-data, commute, market stats), never demographic desirability.
- **Estimates, not advice:** all cost/insurance/tax figures are **clearly labeled ESTIMATES**
  (ADR-013) — never quotes, never financial/insurance/legal advice; disclaimer shown wherever they
  appear.

## Consequences

- Consent + suppression modeled now → v2 automation (ADR-014/017) can send compliantly without a
  data migration.
- v1's "internal alerts + transactional auto-response only" posture keeps us clear of marketing
  TCPA/CAN-SPAM rules for now; the auto-response is transactional.
- Real listings carry their compliance furniture as data, so the swap from seed → MLS (ADR-006)
  renders disclaimers automatically.
- Fair Housing is a content + product constraint, not just a legal note — it shapes area pages,
  filters, and (later) AI guardrails. **Demo seed must contain zero steering language.**
- Estimate labeling is a UI contract enforced wherever the cost panel/layer renders.

## Alternatives considered

- **Deferring the consent model to v2** — rejected; retrofitting consent/suppression onto existing
  leads is risky and the brief mandates the seam now.

## Addendum (2026-07-01) — transactional consent vs marketing consent (ADR-020)

We now capture **two distinct kinds of consent**, and they must never be conflated:

1. **Transactional / contact consent** — the per-channel consent decided above (email/phone).
   **Required** on every form so Nilyan may reply to *this* enquiry. This is a **transactional**
   posture (a direct reply to a submission), which is why v1 stays clear of marketing CAN-SPAM/TCPA
   send-time rules. **Unchanged.**
2. **Marketing consent** — an **optional** opt-in to receive ongoing marketing (news / new listings),
   added to all capture forms in D11, gating the **Phase 2** email campaigns (ADR-020).

**HARD RULE — the marketing opt-in must always be, on every form, forever:**
- **Optional** — the form submits successfully without it; it is never required/blocking.
- **Unchecked by default** — **never pre-ticked**; opt-in is an affirmative act only.
- **Separately worded** — its own label, distinct from the contact consent
  (*"I'd like to receive news and new listings by email"*).

No future task may make the marketing opt-in required, pre-checked, or merged into the contact
consent. **Data model:** the two are told apart by a **`purpose` discriminator** on `consent_records`
(`transactional` | `marketing`; existing rows are `transactional`). **Every submission writes a
marketing row: ticked → `channel='email'`, `purpose='marketing'`, `granted=true`; left unticked →
the same row with `granted=false`** (never omitted, never a silent default-true). Recording the
negative is deliberate — a dated, worded, **auditable** proof that the choice was offered and
declined, so an affirmative opt-in is provable and a later flip is reasoned against a record, not an
absence. The **suppression seam** handles later opt-outs. The recipient list for Phase 2 = leads with
a `granted=true, purpose='marketing'` email consent. Full decision: **ADR-020**.
