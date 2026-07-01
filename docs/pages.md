# Pages & routes — Herrera (Next.js Pages Router)

> Authoritative route spec for v1 (the demo). Referenced by **ADR-019**. Routes are sensible
> defaults — adjust slugs for SEO if needed. Rendering: **ISR** = static + revalidate (SEO
> pages), **SSR** = getServerSideProps (per-request), **CSR** = client-interactive, **gated** =
> admin auth. "Builds in" maps to the tasks in `BUILD_PLAYBOOK.md`.

---

## Public site

| Route | Page | Rendering | Builds in |
|---|---|---|---|
| `/` | **Home** — hero **led by prominent Buy/Sell/Rent lead-capture CTAs** (clients' #1 priority; "I want to Buy/Sell/Rent" → branched capture overlay), with **map search as the secondary "explore yourself" path**; featured listings, map-search preview, explore-by-area, capture invitation, trust (Nilyan bio + testimonials) | ISR | D1, D7 |
| `/search` | **Search + map** — the signature: synced results list ↔ interactive map, draw-a-zone, filters, clustering, viewport reload. Filters live in the query string | SSR + CSR | D2, D3, D6 |
| `/homes/[slug]` | **Listing detail** — gallery/video/virtual tour, key facts, map, mortgage calc, Florida cost-of-ownership panel, similar listings, persistent contact module, schema.org | ISR | D4, D5 |
| `/buy` | **Buy** landing → launches the Buy capture flow | ISR shell | D7 |
| `/sell` | **Sell** landing → launches the Sell capture flow | ISR shell | D7 |
| `/rent` | **Rent** landing → launches the Rent capture flow | ISR shell | D7 |
| `/home-value` | **"What's my home worth?"** — the seller magnet. **D7 ships this as a thin Sell-branch variant** (the home valuation CTA opens the Sell capture flow with the address pre-filled); a dedicated `/home-value` landing page is a **follow-up** | ISR shell | D7 (follow-up) |
| `/areas` | **Explore by area** — index of cities/neighborhoods | ISR | D12 |
| `/areas/[city]` | **City landing** — local market data, schools, listings (SEO) | ISR | D12 |
| `/areas/[city]/[neighborhood]` | **Neighborhood landing** — hyper-local SEO page | ISR | D12 |
| `/guides` | **Guides index** — neighborhood guides (blog automation is v2) | ISR | D12 |
| `/guides/[slug]` | **Guide article** | ISR | D12 |
| `/favorites` | **Favorites** — login-less, browser-stored + email-capture nudge | CSR | D9 |
| `/about` | **About Nilyan Herrera** — bio, credentials, testimonials | ISR | D1 |
| `/contact` | **Contact** — contact form (a capture surface) | ISR | D7 |
| `/privacy`, `/terms`, `/accessibility` | **Legal** — privacy, terms, accessibility; Equal Housing notice in footer | ISR | D14 |
| `/404`, `/500` | **System** error pages | static | D14 |

**Lead capture flow:** the Buy/Sell/Rent/valuation/contact entries feed one typeform-style flow
(one question per screen, branched by intent, configurable questions, contact last with phone
and/or email). Implement as a **shared multi-step component shown as an overlay** from any CTA —
or, if preferred, dedicated URLs `/start/[intent]`. (D7)

**Also a capture surface (not a page):** the persistent "request info / schedule a tour" module on
every `/homes/[slug]`, and the "what will this really cost?" CTA on the Florida cost panel. (D5, D7)

---

## Admin (`/admin`, auth-gated — Nilyan only)

| Route | Page | Builds in |
|---|---|---|
| `/admin/login` | **Login** (Auth.js, admin only) | F4 |
| `/admin` | **Dashboard** — analytics overview: lead sources, conversion, most-viewed listings | D11 |
| `/admin/leads` | **Lead inbox** — list + filters (intent/status/date/source) | D10 |
| `/admin/leads/[id]` | **Lead detail** — contact, qualification answers, viewed listings, pipeline status, call log, notes, reminders | D10 |
| `/admin/listings` | **Off-market listings** — list | D11 |
| `/admin/listings/new` · `/admin/listings/[id]` | **Create / edit off-market listing** — with visibility toggle (public/registered/private_link) | D11 |
| `/admin/content` · `/admin/content/[id]` | **Content editor** — neighborhood/guide pages | D11 |
| `/admin/questions` | **Qualification questions** — configure the capture questions per intent | D11 |
| `/admin/settings` | **Settings** — notification prefs (instant alert vs daily digest), profile | D8, D11 |

---

## API routes (`/api/*`, brief)

Lead submission (+ consent record, notification trigger, auto-response); search/geo queries
(bbox + polygon via PostGIS); favorites; map-layer data (schools/POI/walkability); the
daily-digest cron; admin mutations. (D2, D7, D8) The MLS sync runs in `apps/worker`, not as an
API route.

---

## Internationalization (EN/ES)

Next i18n routing adds a locale prefix for Spanish (e.g. `/es/search`, `/es/homes/[slug]`); English
is the default with no prefix (**confirmed in Phase 0 review**; ADR-018). **All public pages above
are localized in both languages** — two indexable URLs each. Multilingual SEO is a **top priority**
(bilingual Miami market): every page carries **reciprocal `hreflang` + `x-default`**, the
**sitemap lists both language versions of every page**, each locale has the correct **`<html lang>`**
and a **self-referential canonical**, and a header **EN/ES toggle** switches to the same page in the
other language. Static UI strings come from a typed EN/ES dictionary; **Nilyan's admin-authored
content — qualification questions, guides, and off-market descriptions — is bilingual** and renders
per locale (falling back to EN). Wired in **D13**. **MLS property descriptions are not translated in
v1** (deferred post-feed, ADR-017). ([ADR-018](./adr/ADR-018-internationalization.md), ADR-015)

---

## Not in v1 (v2 pages, for reference)

Client account area (passwordless): saved searches, alerts, synced favorites. AI concierge chat is
a site-wide widget, not a page. These come in v2 on real MLS data. ([ADR-014](./adr/ADR-014-ai-features-v2.md))
