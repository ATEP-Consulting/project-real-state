# NH logo — design spec

**Date:** 2026-07-01
**Status:** approved (design), pending implementation
**Branch (implementation):** `feat/nh-logo` (own branch — do NOT reuse `feat/d13-i18n`; no merge/deploy until Pablo says)

## Goal

Replace the current **CSS text monogram** ("NH" in a bordered circle, styled with
`--font-serif`) with a **real, bespoke vector logo**: a refined **NH monogram in a
high-contrast Didone serif** ("Alta moda" direction), inside a thin ring. Ship it as a
reusable SVG component, wire it into every brand surface, and add the missing favicon.

This is a visual/branding upgrade only. No data-model, routing, or copy changes.

## Decisions (locked with Pablo)

1. **Direction:** refined **NH monogram** (keeps what Pablo already likes, elevated to a crafted mark).
2. **Style:** Concept **02 "Alta moda"** — Playfair/Bodoni-style **Didone** letterforms
   (hairline verticals + thick strokes, flat unbracketed serifs), inside a **thin ring**.
3. **Wordmark:** the name "Nilyan Herrera" stays in **Spectral** (the existing site serif) —
   variant **A**. The Didone accent lives only in the mark; we do **not** add Playfair as a
   site font. (Rejected: all-Playfair wordmark, and mixed-by-context.)
3b. **Tagline (new):** the lockup gains an optional small tagline **"Real Estate · Miami"**
   (rendered uppercase, letter-spaced ~0.32em, in the site sans, bronze) stacked under the
   name — the line Pablo liked from the first concept board. Stored as `REALTOR.tagline`.
   Used in the **branded/prominent** surfaces (admin login, footer); the compact public
   header stays mark + name only (no tagline) to avoid crowding.
4. **Colors** (existing brand tokens, no new colors):
   - Bronze-light `#C9A06A` on dark/forest backgrounds.
   - Forest `#15302C` on cream/light backgrounds.
   - Mark is **`currentColor`-friendly** so it inherits the header color when it flips
     forest↔cream on scroll.
   - Bronze-dark `#8F6238` heavier-weight rendition for tiny favicon sizes (legibility).
5. **Font independence:** the NH is delivered as **outlined `<path>` data**, NOT live
   `<text>`. No runtime font dependency, no FOUC, crisp at any size.
6. **Motion:** static by default. Honor the project's motion guardrails and
   `prefers-reduced-motion` (see [[motion-page-transition-fouc]] — page transitions stay off).

## What gets built

### Components
- **`BrandMark`** — the symbol only (thin ring + NH), props:
  - `size` (px; renders the same `viewBox` scaled — one source of truth).
  - `variant`: `'auto' | 'onDark' | 'onLight'`. `auto` uses `currentColor`; the others pin
    bronze-on-forest / forest-on-cream.
  - Accessible: `role="img"` + `aria-label` when standalone; `aria-hidden` when paired with
    a text wordmark (as in the header, which already has the accessible link label).
- **`Logo`** (lockup) — `BrandMark` + the "Nilyan Herrera" wordmark in Spectral, plus an
  optional **tagline** ("Real Estate · Miami", uppercase + letter-spaced, bronze) via a
  `tagline` boolean prop. Call sites that already render their own wordmark text
  (header/footer) can use `BrandMark` alone and keep their existing markup/CSS.

Location: `apps/web/src/components/brand/` (new folder).

### The NH path data
- Generate outlined paths from **Playfair Display** glyphs (author-time, committed as static
  path data) — e.g. via `opentype.js`/`fonttools` against the Playfair TTF, or hand-authored
  Didone paths if extraction is impractical. Ring is a plain `<circle>`.
- Committed as a small static module/asset so there is **no build-time font tooling** in the
  app pipeline.

### Wiring (4 brand surfaces)
- **Public header** — [Header.tsx](apps/web/src/components/layout/Header.tsx): replace the
  `.monogram` span (keeps the adjacent `.wordmark` Spectral text). Mark uses `variant="auto"`
  so it follows the header's forest↔cream scroll color. Compact — no tagline.
- **Footer** — [Footer.tsx](apps/web/src/components/layout/Footer.tsx): replace the
  `.monogram` span in the brand row; add the tagline under "HERRERA".
- **Admin header** — [AdminLayout.tsx](apps/web/src/components/admin/AdminLayout.tsx): replace
  the `NH` span (keeps "HERRERA" + "admin" tag). Compact — no tagline here.
- **Admin login** — [admin/login.tsx](apps/web/src/pages/admin/login.tsx): add the full
  `Logo` lockup (mark + "Nilyan Herrera" + "Real Estate · Miami" tagline) at the top of the
  sign-in card, above/replacing the current `<Eyebrow>Herrera · Admin</Eyebrow>`. This is a
  branded moment, so it gets the prominent lockup with tagline.
- Remove now-dead `.monogram` CSS rules from the CSS modules that had them.
- Add `tagline: "Real Estate · Miami"` to `REALTOR` in `data/realtor.ts`. `REALTOR.monogram`
  stays (harmless; may be referenced elsewhere / a11y).

### Favicon (currently missing — nothing set today)
- Add an **SVG favicon** (`public/favicon.svg`) using the mark (bronze-dark on cream or
  transparent for legibility at 16px) + PNG fallbacks (`favicon-32.png`, `apple-touch-icon.png`
  180px) and the `<link rel="icon">` tags. Add via the existing `Seo`/head path or
  `_document.tsx`. Keep it `noindex`-safe for the demo (no behavior change).

## Out of scope (v1)
- Animated logo, brand-guidelines PDF, alternate stacked/horizontal lockups beyond what the
  three surfaces + favicon need, OG/social share image (can follow later).

## Verification
- `pnpm typecheck` + `pnpm lint` green; existing test suite still green (no logic touched).
- Visual check on real pages: header at top + scrolled (color flip), footer, `/admin`,
  `/admin/login` (lockup + tagline), and the favicon in a browser tab, at desktop + mobile widths.
- Legibility of the mark at 16px (favicon) confirmed in-browser.
- Reduced-motion: nothing animates.

## Notes
- Concept exploration boards live in the session scratchpad (`logo-board.html`,
  `logo-lockup.html`) — not committed.
- Spec is written on `feat/d13-i18n` working tree but will be **committed on `feat/nh-logo`**
  to avoid entangling the in-progress i18n work.
