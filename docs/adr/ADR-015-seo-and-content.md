# ADR-015 — SEO & content

- **Status:** Accepted (Phase 0)
- **Date:** 2026-06-29
- **Deciders:** Pablo (lead engineer)

## Context

Organic discovery is a major lead source for real estate. We need crawlable, fast, structured
location pages (city / neighborhood / ZIP) and neighborhood guides, without thin AI-generated
content (which is a Fair-Housing and quality risk, ADR-011). The demo deploy is `noindex`
(ADR-003); SEO targets production.

## Decision

- **ISR-rendered SEO pages** (ADR-001): `/areas`, `/areas/[city]`, `/areas/[city]/[neighborhood]`,
  `/guides`, `/guides/[slug]`, listing detail, and home — static-fast with `revalidate`.
- **schema.org JSON-LD** on the right pages: `RealEstateListing`/`Residence` + `Offer` and
  breadcrumbs on listing detail; `Place`/area + breadcrumbs on location pages; `RealEstateAgent`
  /`LocalBusiness` for Nilyan; `Article` for guides; `Organization`/`WebSite` site-wide.
- **Local SEO:** clean URL structure, per-page titles/meta/canonical/OG, an XML sitemap and
  `robots` (production), and consistent NAP for the agent. Content is **editable from the admin**
  (`content` table, ADR-008) so Nilyan can maintain area pages/guides.
- **Neighborhood guides in v1** are human-written/edited (seeded for the demo). **Automated blog
  generation is v2** (AI-assisted, human-reviewed — avoid thin AI content) (ADR-014/017).
- **Fair Housing in content** (ADR-011): area/neighborhood copy is objective (amenities, schools as
  data, commute, market stats) — never demographic desirability or steering.
- A **dedicated SEO/schema skill** assists location-page metadata + JSON-LD (see Phase 0 summary).

## Consequences

- Programmatic location pages create many indexable entry points → organic leads.
- JSON-LD improves rich results for listings/agent/areas.
- Admin-editable content keeps SEO maintainable by Nilyan without a developer.
- Holding blog automation to v2 (human-reviewed) protects quality and Fair-Housing compliance.
- `noindex` on the demo means SEO is validated structurally now, activated at production cutover.

## Alternatives considered

- **Client-rendered area pages** — rejected; worse SEO than ISR.
- **AI-generated guides in v1** — rejected; thin-content + steering risk; deferred to v2 with human
  review.

## Addendum (2026-07-01, D13) — multilingual SEO + bilingual guides

- The **`hreflang` reciprocal alternates + `x-default`** seam left in `<Seo>` (D12) and the
  **bilingual sitemap** (both language URLs of every public page) are **wired up in D13**. Each
  locale's page carries its own **`<html lang>`** and a **self-referential canonical** (each locale
  canonical to itself). This is the "keeps both locales crawlable with proper `hreflang`" promise
  from ADR-018 being delivered — SEO across **both** languages is a top priority (bilingual Miami
  market).
- **Guides/blog content is bilingual** (EN + ES fields Nilyan fills): reuse
  `content.title_es/excerpt_es/body_es`, **add `content.meta_title_es/meta_description_es`**. The
  public guide renders the active locale's version, **falling back to EN** when a field is empty.
- **MLS property descriptions are NOT translated in v1** (deferred post-feed — ADR-017/018); D13
  localizes the UI + Nilyan's own admin-authored content only. `noindex` on the demo means the
  bilingual SEO is validated structurally now and activated at production cutover (ADR-003).
