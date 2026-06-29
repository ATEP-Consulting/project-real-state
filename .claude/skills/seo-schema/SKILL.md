---
name: seo-schema
description: Use when building or editing public SEO pages for Herrera (home, listing detail, areas/city/neighborhood, guides) — adds correct metadata, canonical/hreflang, schema.org JSON-LD, sitemap entries, and local-SEO best practices for a Next.js Pages-Router real-estate site, while honoring Fair-Housing no-steering. Rewritten for this stack (do not import a generic SEO collection).
---

# SEO & schema for Herrera

Stack-specific SEO guidance for this **Next.js Pages-Router** real-estate site. Authoritative
context: `CLAUDE.md`, ADR-015 (SEO & content), ADR-001 (rendering), ADR-011 (Fair Housing),
ADR-018 (i18n: **English default, `/es/...` for Spanish**).

## When to apply
Building or editing any public SEO page: `/`, `/homes/[slug]`, `/areas`, `/areas/[city]`,
`/areas/[city]/[neighborhood]`, `/guides`, `/guides/[slug]`, `/about`.

## Rendering (ADR-001/015)
- SEO pages are **ISR** (`getStaticProps`/`getStaticPaths` + `revalidate`). Never client-render
  primary content that should be indexed.
- Each page sets: unique `<title>`, meta description, **canonical**, Open Graph + Twitter tags, and
  **`hreflang`** alternates for EN/ES (with `x-default`).

## schema.org JSON-LD (emit via a `<script type="application/ld+json">`)
- **Listing detail** → `RealEstateListing` (or `Residence`/`SingleFamilyResidence`) + `Offer`
  (price, currency, availability) + `BreadcrumbList`. Include address, geo, photos, beds/baths,
  floorSize. **Do not** put cost *estimates* into structured price fields — only the actual list
  price is the `Offer` price (estimates are labeled UI, not schema; ADR-013).
- **City / neighborhood** → `Place` + `BreadcrumbList`; market stats as plain content (not faked
  ratings).
- **Agent / site** → `RealEstateAgent` (Nilyan, consistent NAP) and `Organization` + `WebSite`
  site-wide.
- **Guides** → `Article` with author/date.
- Validate shapes against schema.org; never emit fields you don't have real data for.

## Local SEO
- Clean, human-readable URLs (already specced in `docs/pages.md`); stable slugs.
- One H1 per page; logical heading order; descriptive internal links between areas ↔ listings ↔
  guides.
- Generate `sitemap.xml` (all locales) and `robots.txt`. **On the demo deploy keep `noindex` +
  disallow-all** (ADR-003); production flips these on at cutover.
- Real images with descriptive `alt`; use Next image optimization.

## Fair Housing — hard rule (ADR-011)
Area/neighborhood/guide copy and meta must stay **objective**: amenities, schools-as-data, commute,
market stats. **Never** describe an area by the protected-class makeup of residents, never imply
who an area is "good for," and never use steering language in titles, descriptions, or JSON-LD.

## Checklist before done
- [ ] ISR with `revalidate`; no indexable content client-only
- [ ] title / description / canonical / OG / hreflang (EN + ES + x-default)
- [ ] correct JSON-LD type, only real data, validates
- [ ] breadcrumbs; single H1; clean slug; internal links
- [ ] sitemap + robots correct for the environment (demo `noindex`)
- [ ] no Fair-Housing steering anywhere
