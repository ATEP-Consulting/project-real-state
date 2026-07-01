# ADR-018 — Internationalization (EN/ES)

- **Status:** Accepted (Phase 0). Default locale: **English** (`/es/...` for Spanish), confirmed 2026-06-29. **Extended 2026-07-01 (D13 scoping)** with the full multilingual-SEO + bilingual-admin-content decision.
- **Date:** 2026-06-29 (extended 2026-07-01)
- **Deciders:** Pablo (lead engineer), Nilyan Herrera (audience knowledge)

## Context

Florida's market — especially Nilyan's (Miami, Coral Gables, Naples) — is heavily bilingual. The
site must serve **English and Spanish**. The design prototype is fully bilingual (a complete EN/ES
string set with an EN/ES toggle) and **defaults to Spanish (`lang: 'es'`)**. CLAUDE.md and the
kickoff currently state **English is the default** with `/es/...` for Spanish.

## Decision

**English is the default (root, no prefix); Spanish is first-class under `/es/`.** SEO across *both*
languages is a **top priority** — Nilyan's Miami market is heavily bilingual, so both language
versions of every public page must be **independently indexable**.

### 1. URL-prefix routing (Next.js Pages-Router i18n)

- Locales `['en','es']`, `defaultLocale: 'en'`. **English at the root** (`/search`), **Spanish under
  `/es/`** (`/es/search`) — **two indexable URLs per public page**.
- A **header EN/ES toggle** switches to the *same* page in the other language (matching the
  prototype's EN/ES chip), preserving the current route + query.
- (The design prototype defaults to Spanish; we deliberately keep English-default for v1. If ever
  revisited, flip CLAUDE.md, `docs/pages.md`, and this ADR together — the URL strategy inverts.)

### 2. Multilingual SEO done properly (top priority)

- **`hreflang` reciprocal alternates + `x-default` on every page** — each page advertises its `en`
  and `es` URLs plus an `x-default`. This is the **seam D12 left in `<Seo>`**; it is **wired up in
  D13** (ADR-015).
- **Bilingual sitemap** — `sitemap.xml` lists **both** language versions of **every** public page.
- **Correct `<html lang>` per locale** (`en` / `es`), and a **self-referential canonical** per
  locale (each locale's page is canonical to itself, not to the other language).

### 3. Static UI strings

- All hard-coded UI copy is translated via a **lightweight typed EN/ES dictionary** — no heavy i18n
  runtime dependency, consistent with the no-heavy-deps stack. (Final mechanism chosen in the D13
  plan.)

### 4. Nilyan's admin-authored content is bilingual (first-class requirement)

- Nilyan is bilingual and fills **both** languages. Every field she authors in the admin has an
  **EN + ES** pair: the **qualification questions** (label + options), the **guides/blog** (title,
  excerpt, body, SEO meta), and the **off-market listing descriptions**. The public site renders the
  **active locale's** version, **falling back to EN** when an ES value is empty.
- This **reuses the ES columns already in the schema** (`content.title_es/excerpt_es/body_es`,
  `qualification_questions.label_es` + option `labelEs`, `search_filters.label_es`) and **adds the
  few missing ones** via a small migration: **`listings.description_es`** and
  **`content.meta_title_es/meta_description_es`**. (D13 Phase 2.)
- **Admin UI chrome stays English-only** in v1 (a single, bilingual user) — only the **content
  fields** are bilingual, not the admin interface itself.

### 5. Deferred — MLS property-description translation (post-feed)

- The future **MLS feed arrives in English**; translating **MLS property descriptions**
  (auto-translate vs. structured/field-based Spanish rendering) is **decided post-feed**, alongside
  D5 / the sync worker / D12 Phase A (ADR-004/017). **D13 covers the UI strings + Nilyan's own
  content only** — not MLS free-text.

## Consequences

- Serves the bilingual market and matches the prototype's bilingual design.
- Two independently-indexable URLs per page + reciprocal `hreflang`/`x-default` + a bilingual sitemap
  give search engines a clean bilingual signal — the SEO win that motivates the whole feature.
- The default-locale decision drives URL structure, canonical/hreflang, and analytics — settled
  before building the localized routes (D13).
- Bilingual admin content means Nilyan's questions, guides, and off-market listings show in the
  visitor's language with a safe EN fallback; the schema already anticipated this (ES columns).
- Keeping the admin **chrome** EN-only limits translation scope to the public surface + the content
  fields, not the tooling.
- MLS-description localization is explicitly **out of D13**, so a future task doesn't assume it
  shipped.

## Alternatives considered

- **Spanish default, `/en/...` for English** — strong case given the audience and the prototype;
  considered but not chosen for v1 (revisit if conversion data favors it).
- **English only in v1** — rejected; the bilingual market is core, and the design is already EN/ES.
