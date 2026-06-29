# ADR-018 — Internationalization (EN/ES)

- **Status:** Accepted (Phase 0). Default locale: **English** (`/es/...` for Spanish), confirmed 2026-06-29.
- **Date:** 2026-06-29
- **Deciders:** Pablo (lead engineer), Nilyan Herrera (audience knowledge)

## Context

Florida's market — especially Nilyan's (Miami, Coral Gables, Naples) — is heavily bilingual. The
site must serve **English and Spanish**. The design prototype is fully bilingual (a complete EN/ES
string set with an EN/ES toggle) and **defaults to Spanish (`lang: 'es'`)**. CLAUDE.md and the
kickoff currently state **English is the default** with `/es/...` for Spanish.

## Decision

- **EN/ES across the entire public site**, using **Next.js i18n routing**: a locale prefix for the
  non-default language and a language toggle (matching the prototype's EN/ES chip).
- **Default locale: English, with `/es/...` for Spanish** — per CLAUDE.md, **confirmed in Phase 0
  review**. (The design prototype defaults to Spanish; we deliberately keep English-default for v1.
  If this is ever revisited, flip CLAUDE.md, `docs/pages.md`, and this ADR together — the URL
  strategy inverts.)
- **Admin** is English-only in v1 (single user).
- **Content/listings** localization: UI strings are fully translated; seeded long-form content
  (area pages/guides) is provided where practical, with a clear fallback when a translation is
  missing.

## Consequences

- Serves the bilingual market and matches the prototype's bilingual design.
- i18n routing keeps both locales crawlable (ADR-015) with proper `hreflang`.
- The default-locale decision affects URL structure, canonical/hreflang, and analytics — worth
  settling before building the public shell's localized routes (D13).
- Keeping admin EN-only limits translation scope to the public surface.

## Alternatives considered

- **Spanish default, `/en/...` for English** — strong case given the audience and the prototype;
  considered but not chosen for v1 (revisit if conversion data favors it).
- **English only in v1** — rejected; the bilingual market is core, and the design is already EN/ES.
