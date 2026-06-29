# ADR-009 — Notifications

- **Status:** Accepted (Phase 0)
- **Date:** 2026-06-29
- **Deciders:** Pablo (lead engineer)

## Context

Speed-to-lead wins deals. Nilyan must know **instantly** when a lead arrives and have a daily
recap. All v1 notifications are **internal (to Nilyan)** plus one transactional reply to the lead
— there is **no marketing/automated outbound to consumers** in v1 (ADR-011), so TCPA/CAN-SPAM
marketing rules don't apply to v1's flows.

## Decision

- **Email via Resend:**
  - **Instant alert to Nilyan** on every new lead (contact + intent + answers + viewed listings +
    a deep link to the lead in `/admin`).
  - **Daily digest to Nilyan** summarizing the day's new leads — sent by a scheduled job
    (Vercel Cron) hitting an API route.
  - **Transactional auto-response to the lead** — one message ("thanks, we'll be in touch
    shortly"). Transactional, not marketing.
- **WhatsApp/SMS via Twilio — wired as a seam, inactive in v1.** The notification dispatch layer
  has a Twilio channel implemented behind a feature flag/config but **off by default**; enabling it
  is a config change, not a rebuild.
- Notification preferences (instant vs digest cadence) live in `/admin/settings` (ADR-019).

## Consequences

- Nilyan gets near-real-time alerts and a daily recap with zero extra tooling.
- The lead always gets an immediate acknowledgement, improving conversion and setting expectations.
- The Twilio seam means adding WhatsApp/SMS later is flipping a flag + credentials.
- Resend + Cron are Vercel-friendly; the digest is a single scheduled route.
- Because v1 sends only internal alerts + a transactional reply, we avoid consumer-marketing
  compliance scope entirely in v1 (v2 automation will address it, ADR-014/017).

## Alternatives considered

- **SMTP/SendGrid** — Resend chosen for DX and Vercel fit; swappable behind the dispatch layer.
- **Activating Twilio in v1** — deferred; not needed for the demo and adds compliance + cost
  surface prematurely.
