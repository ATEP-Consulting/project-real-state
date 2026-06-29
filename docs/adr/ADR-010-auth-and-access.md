# ADR-010 — Auth & access

- **Status:** Accepted (Phase 0)
- **Date:** 2026-06-29
- **Deciders:** Pablo (lead engineer)

## Context

The only authenticated user in v1 is **Nilyan** (the admin/CRM). Public visitors must never be
forced to register — that would kill lead capture and, for MLS data, violate IDX rules (never
login-gate listings, ADR-011). Favorites should work without an account. Passwordless client
accounts are a v2 idea (ADR-017).

## Decision

- **Auth.js — ADMIN ONLY.** Protects all `/admin/*` routes and admin API mutations. A single
  admin user (Nilyan) is seeded; credentials/secret come from env (ADR-003).
- **No public accounts in v1.** Nothing on the public site requires login.
- **Favorites are login-less** — stored in the browser (localStorage), with a soft email-capture
  nudge ("save these / get notified — leave your email") that creates a lead, not an account
  (ADR-007).
- **Seam for v2:** the data model and auth setup leave room for **passwordless client accounts**
  (saved searches, alerts, synced favorites) without reworking admin auth — deferred (ADR-017).

## Consequences

- Minimal auth surface to secure (one role), low risk for a solo-run site.
- Public capture and IDX display stay unobstructed.
- Browser-stored favorites can be merged into a future account when v2 introduces one.
- Admin protection must cover both page routes (middleware/`getServerSideProps` guard) and API
  routes; reminders/notifications never expose admin data publicly.

## Alternatives considered

- **Public accounts in v1** — rejected; against the brief and counter to lead-gen + IDX.
- **Rolling our own admin auth** — rejected; Auth.js is standard, less error-prone.
