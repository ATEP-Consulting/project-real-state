# ADR-020 — Marketing consent vs transactional consent; email campaigns (Phase 2)

- **Status:** Accepted — marketing opt-in captured from **D11**; campaigns **deferred → Phase 2**
- **Date:** 2026-07-01
- **Deciders:** Pablo (lead engineer), Nilyan Herrera (licensed broker/agent)
- **Relates to:** ADR-007 (lead capture), ADR-008 (CRM), ADR-009 (notifications),
  ADR-011 (consent/compliance), ADR-017 (scope & phasing)

## Context

Nilyan wants, eventually, to send **marketing email campaigns** to her CRM leads — e.g. a monthly
"new listings this month" blast. That is a growth feature, not part of the v1 demo, and it carries
a **different legal regime** from the transactional contact we capture today. Two things must be
decided now so we don't paint ourselves into a corner:

1. **When** campaigns get built.
2. **How** we start accruing a legally-sound recipient list **before** then, without conflating it
   with the required per-channel contact consent (ADR-011).

## Decision

### 1. Email marketing campaigns → Phase 2 / v2 (deferred, NOT in the demo)

Mass outbound marketing email to CRM leads is **out of v1** and is added to the deferred bucket in
ADR-017. Reasons:

- **(a) It's a full subsystem** — recipient lists/segments, templates, scheduling, an ESP/send
  provider, delivery + open/click tracking, bounce/complaint handling, and unsubscribe management.
  Far beyond a single task.
- **(b) Distinct compliance regime (CAN-SPAM, and TCPA if SMS later).** Marketing outbound requires
  a **separate marketing opt-in**, a **functional unsubscribe** in every send, a valid **physical
  sender address**, honest headers, and prompt suppression on opt-out. This is materially different
  from the **transactional** posture v1 holds today (internal alerts to Nilyan + one transactional
  auto-response to the lead — ADR-009/011).
- **(c) It's meaningless on mock data.** Campaigns need **real, opted-in leads** that only exist
  post-launch. Building it now would be throwaway and un-testable.

### 2. Two distinct consents — never conflated

- **Transactional / contact consent** (existing, ADR-011): **required**, per-channel (email/phone),
  captured on every form so Nilyan may reply to *this* enquiry. **Unchanged by this ADR.**
- **Marketing consent** (new): **optional** permission to receive ongoing marketing (news / new
  listings). It is **separate from and in addition to** the contact consent, and gates the future
  Phase 2 campaigns.

### 3. Marketing opt-in checkbox — added to ALL capture forms in D11

A single opt-in checkbox is added to the **four** lead-capture surfaces — the per-listing
inquiry (ADR-007), the Buy/Sell/Rent qualification flow (ADR-007), `/contact` (ADR-007/019), and
the **home-valuation flow** — i.e. the *sell* branch of the Buy/Sell/Rent flow with the address
pre-filled (the "what's my home worth?" magnet is a **sell-flow variant**, **not** a standalone
`/home-value` page; that dedicated page stays deferred). **Hard rules (non-negotiable):**

- **Optional** — the form submits successfully whether or not it's ticked. It is never a blocker.
- **Unchecked by default** — **no pre-ticking**, ever. Opt-in must be an affirmative act.
- **Separately worded** — its own label, distinct from the contact consent, e.g.
  *"I'd like to receive news and new listings by email (optional)."*
- It records **its own `consent_records` row** distinguished by a new **`purpose` discriminator**
  (`transactional` | `marketing`; existing rows are `transactional`). Ticked → the row is
  `channel='email'`, `purpose='marketing'`, `granted=true`, with its own wording + source.
  **When the opt-in is left unticked, we still write a `consent_records` row —
  `channel='email'`, `purpose='marketing'`, `granted=false`** — never omit it and never `granted=true`.
  Recording the negative is deliberate and **auditable**: every submission leaves a dated,
  worded proof of the choice offered (opted in **or** explicitly declined), which is exactly what
  demonstrates a clean affirmative opt-in for the leads who did opt in, and lets a later opt-in flip
  be reasoned about against a prior record rather than an absence.

This gives Phase 2 a **legally-sound recipient list** from a single query (leads with a
`granted=true, purpose='marketing'` email consent) that accrues from launch onward. The
**suppression seam** (ADR-011) covers later opt-outs.

### Scope note

Only the **opt-in capture + the `purpose` seam** are built now (in D11 — small, consent-related).
The **campaign subsystem** (lists, templates, sending, tracking, unsubscribe UI) is Phase 2.

## Consequences

- The recipient list builds **compliantly from day one**; Phase 2 campaigns are additive, no data
  migration and no retro-consent scramble.
- v1 keeps its clean **transactional-only** outbound posture (ADR-009/011) — no marketing send exists,
  so CAN-SPAM's send-time obligations don't apply yet; only the *consent capture* lands now.
- A hard, written rule that the marketing opt-in is **optional + unchecked + separately worded**
  protects against a future task quietly making it required or pre-checked (which would taint the
  whole list).
- The `purpose` column is a tiny, low-risk schema addition; existing consent behavior is untouched.

## Alternatives considered

- **Pre-checking the opt-in** — **rejected.** Pre-ticked consent is invalid under GDPR and poor
  practice under CAN-SPAM; it also poisons list quality.
- **One combined consent** ("contact me + market to me") — **rejected.** Conflates transactional and
  marketing; can't prove marketing opt-in separately; risks blocking a lead who won't accept
  marketing from even submitting.
- **Building campaigns now** — **rejected** (reasons a–c above); it's a Phase 2 subsystem on real data.
- **Deferring even the opt-in to Phase 2** — **rejected;** we'd launch with no lawful recipient list
  and have to retrofit consent onto existing leads (the same anti-pattern ADR-011 rejected).

## Addendum (2026-07-01, D13) — the opt-in wording is localized EN/ES

- The marketing opt-in label — and the per-channel **contact-consent** wording — is **translated
  EN/ES** and rendered in the visitor's locale.
- The **`consent_records` row stores the exact wording shown** at submission (already true), so a
  **Spanish submission records the Spanish wording**. This preserves the auditable, worded proof of
  the choice **in the language it was offered** — strengthening, not weakening, the consent trail.
- **No rule changes:** the opt-in stays **optional, unchecked-by-default, and separately worded** in
  both languages; the two-consent distinction is unchanged. See **ADR-018** (i18n) / ADR-011.
