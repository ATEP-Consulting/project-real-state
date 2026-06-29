# D1 Restyle — Match the Claude Design Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Re-skin the already-built D1 public shell + home so its **composition** matches the real Claude Design prototype (`docs/reference/prototype/Nilyan-Herrera-Portal.offline.html` + committed screenshots), and make that committed export the documented visual source of truth. Tokens and typography are unchanged (they already match the prototype exactly).

**Architecture:** Same Next.js Pages-Router shell, CSS Modules + tokens, framer-motion `Reveal`. We rebuild the markup/CSS of each shell + home section to the prototype's layout, add three small new presentational pieces (a hero search-card, a map mockup, a home contact section), update the shared content data to the prototype's, and refresh the design docs. No new dependencies; EN copy (ADR-018); the contact form, the "Type" dropdown, the favorite heart, and the ES/EN toggle are **presentational** here (wired in D7/D9/D13).

**Tech Stack:** Next.js 15 (Pages Router) · React 19 · CSS Modules + `var(--token)` · framer-motion · plain `<img>` (next/image is D14).

## Global Constraints

- **Visual source of truth = the committed prototype:** `docs/reference/prototype/Nilyan-Herrera-Portal.offline.html` and `docs/reference/prototype/screens/*.png`. Match each section's composition to those. Do **not** invent layouts.
- **Tokens unchanged.** Keep `apps/web/src/styles/tokens.css`; reference via `var(--…)`. Spectral (serif, sentence-case, untracked headings) + Hanken Grotesk (sans UI); uppercase tracked only for eyebrows/labels/wordmark. Green-tinted soft shadows; crisp 2–6px radii (organic blob radii only as decoration).
- **ADR-001:** Pages Router only; no App Router/RSC/`"use client"`.
- **EN copy now (ADR-018).** Mirror the prototype's structure/voice in English. The ES/EN header toggle stays presentational (D13).
- **Presentational-only in this re-skin (wired later):** home contact form + its consent checkbox (D7), the favorite **heart** on cards (D9), the hero **"Type"** dropdown and intent tabs routing (refined in D2/D3), the ES/EN toggle (D13). Each must look complete but not pretend to submit/persist.
- **Compliance unchanged:** Footer keeps **Equal Housing Opportunity** + Realtor® attribution; keep a subtle **"Sample data — demo"** marker (ADR-003). All area/testimonial/marketing copy stays **Fair-Housing-clean** (about places & service, never who lives there).
- **Reuse, don't fork:** keep F3 primitives (`Container`, `Button`, `Eyebrow`, `Reveal`) and the existing files; rewrite their markup/CSS in place. Work on the existing branch **`feat/d1-public-shell-home`**; one commit per task.
- **Gates (every task):** `pnpm format && pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm --filter @herrera/web build` all green.

## Section deltas (prototype → current) — the spec

From the committed screenshots:

1. **Header** (`screens/home-full.png` top): solid forest bar (white text), **NH monogram circle** + HERRERA wordmark · nav Buy/Sell/Rent/Areas/About · **phone** · **🇪🇸 ES | 🇺🇸 EN** toggle · bronze **Contact** button. (Currently: transparent overlay, no monogram/phone.)
2. **Hero** (`section_a_hero_card.png`): centered eyebrow/title/lede + **white search card** = intent **tabs** (Buy active = forest pill) over a search row (icon · input · `Type ▾` · bronze **Search**) + "or draw your area on the map →" link + **SCROLL** cue. (Currently: left-aligned glass bar + pills.)
3. **Featured** (`section_b_featured.png`): **4-up** cards; **NEW** badge top-left + **heart** top-right; body order **price → meta(beds·baths·sqft) → title(address) → location(city + pin)**. (Currently: 3-up, different order.)
4. **Map** (`section_c_map.png`): **dark forest band**; left eyebrow+serif title+3 bullets+bronze button; right **map mockup card** (faux search + "Draw zone", grid, price pins, dashed zone, "N properties in your zone"). (Currently: light band, simple teaser.)
5. **Areas** (`section_d_areas.png`): centered heading; **bento** = 1 big tile (left) + 4 small (2×2 right), each with name + **property count**. (Currently: uniform 3-up.)
6. **Capture** (`section_e_capture.png`): **two cards** — left light "Find your next home" → Buy; right **dark forest** "What's your home worth?" with **address input** + bronze button → home-value. (Currently: one centered band.)
7. **Agent/Trust** (`section_f_trust.png`): left **portrait photo** + overlaid **stats badge** (12 yrs · 240+ deals · $480M sold); right eyebrow+name+bio+license line + **2 testimonial cards with 5★**. (Currently: monogram + 3 plain quotes.)
8. **Contact** (`section_g_contact.png`): **NEW section** — left eyebrow+title+body+contact details (phone/email/office) + agent mini-card; right white **form card** (intent tabs, name, email+phone, zone, message, consent, bronze Send). Presentational.
9. **Footer** (`section_h_footer.png`): monogram+wordmark+tagline+phone; **3 columns** Explore/Areas/Contact; bottom row "© … FL License …" + "Equal Housing Opportunity · Privacy · Terms". (Currently: 4 columns.)

## File Structure

```
docs/reference/prototype/...              # committed (done): HTML + screens/*.png
docs/visual-direction.md                  # MODIFY: provenance + new "Screen compositions" section
docs/adr/ADR-016-...md                    # MODIFY: source of truth = committed export (not MCP runtime)

apps/web/src/data/realtor.ts              # MODIFY: stats, photo, office, license line, contact
apps/web/src/data/testimonials.ts         # MODIFY: + rating; align to prototype's two (EN)
apps/web/src/data/areas.ts                # MODIFY: + count; 5 areas for the bento
apps/web/src/lib/nav.ts                   # MODIFY: PRIMARY_NAV (5) + FOOTER_NAV (3 cols)
apps/web/src/lib/listing.ts (+ .test.ts)  # MODIFY: ListingCardVM + isNew; reorder fields

apps/web/src/components/layout/Header.tsx + .module.css      # REWRITE (solid, monogram, phone, toggle)
apps/web/src/components/layout/Footer.tsx + .module.css      # REWRITE (3 cols)
apps/web/src/components/layout/SiteLayout.tsx                # MODIFY (drop transparentHeader)
apps/web/src/components/ui/ListingCard.tsx + .module.css     # REWRITE (badge/heart/reorder)
apps/web/src/components/ui/StarRating.tsx                    # CREATE (inline ★)
apps/web/src/components/home/Hero.tsx + .module.css          # REWRITE (centered + search card)
apps/web/src/components/home/HeroSearch.tsx + .module.css    # CREATE (the white search card)
apps/web/src/components/home/FeaturedListings.* (css)        # MODIFY (4-up)
apps/web/src/components/home/MapPreview.tsx + .module.css    # REWRITE (dark + mockup)
apps/web/src/components/home/MapMockup.tsx + .module.css     # CREATE
apps/web/src/components/home/ExploreAreas.tsx + .module.css  # REWRITE (bento)
apps/web/src/components/home/CaptureInvite.tsx + .module.css # REWRITE (dual cards)
apps/web/src/components/home/Trust.tsx + .module.css         # REWRITE (photo+stats+stars)
apps/web/src/components/home/ContactSection.tsx + .module.css# CREATE (presentational form)
apps/web/src/pages/index.tsx                                 # MODIFY (mount Contact; section order)
```

---

### Task A1: Commit the prototype reference + update the design docs

**Files:** `docs/reference/prototype/**` (already staged), `docs/visual-direction.md`, `docs/adr/ADR-016-design-system-and-visual-direction.md`

- [ ] **Step 1:** Confirm `docs/reference/prototype/Nilyan-Herrera-Portal.offline.html` + `screens/*.png` exist (done in this session).
- [ ] **Step 2:** Edit **`docs/visual-direction.md`** §Provenance: state the **committed offline export** (`docs/reference/prototype/…offline.html`) + `screens/*.png` are the visual source of truth (the Claude Design MCP is the upstream origin but is **not** required — we build against the committed export). Add a new **"§9 Screen compositions (Home)"** section transcribing the nine section deltas above (header, hero search-card, 4-up cards w/ badge+heart, dark map band + mockup, bento areas, dual capture cards, agent w/ stats+stars, contact form, 3-col footer). Keep all token tables as-is.
- [ ] **Step 3:** Edit **ADR-016**: under Decision, change "pulled from the Claude Design MCP … build against snapshot" to: the **committed export under `docs/reference/prototype/`** is the source of truth; re-syncing via the MCP is optional and, when done, must refresh that export + `visual-direction.md` in the same commit. No runtime/build MCP dependency (unchanged).
- [ ] **Step 4:** `git add docs/reference/prototype docs/visual-direction.md docs/adr/ADR-016-*.md` ; gates not needed (docs only — but run `pnpm format:check` since prettier covers `.md`). Commit: `docs(design): commit prototype export as visual source of truth; document home screen compositions`.

---

### Task B1: Update shared content data + nav to the prototype

**Files:** `data/realtor.ts`, `data/testimonials.ts`, `data/areas.ts`, `lib/nav.ts`

**Interfaces produced (consumed by later tasks):**
- `REALTOR` gains: `memberOf: string`, `office: string`, `hours: string`, `photo: string`, `stats: { value: string; label: string }[]`.
- `Testimonial` gains `rating: number`.
- `Area` gains `count: number`; `FEATURED_AREAS` has 5 entries (first = bento hero).
- `PRIMARY_NAV` = Buy/Sell/Rent/Areas/About; `FOOTER_NAV` = 3 columns (Explore/Areas/Contact).

- [ ] **Step 1: realtor.ts** — extend (keep "sample" honesty), aligning values to the prototype:

```ts
export const REALTOR = {
  name: "Nilyan Herrera",
  title: "Licensed Florida Realtor®",
  monogram: "NH",
  email: "hola@nilyanherrera.com",
  phone: "+1 (305) 555 0148",
  office: "2000 Ponce de Leon Blvd, Coral Gables, FL",
  hours: "Mon–Sat 9–19h",
  license: "FL License #SL3492210",
  memberOf: "Member of Miami REALTORS®",
  copyrightYear: 2026,
  // Sample portrait (free-license). Replace with Nilyan's real photo before launch.
  photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=900&q=70",
  stats: [
    { value: "12", label: "years" },
    { value: "240+", label: "deals closed" },
    { value: "$480M", label: "sold" },
  ],
  bioShort: "Premium real estate guidance in Florida — buy, sell and rent with confidence.",
  bioLong: [
    "Licensed Realtor® in Florida specializing in residential property across Miami-Dade, Broward, and the Gulf coast. I guide buyers and sellers with a close, honest approach and a local network that opens doors.",
    "Every client gets a clear read on the numbers that matter in Florida — insurance, flood exposure, HOA and CDD fees, and the real monthly cost of ownership, not just the list price.",
  ],
} as const;
```
> Verify the portrait URL returns 200 on `pnpm dev`; swap for another free-license `images.unsplash.com` portrait if not.

- [ ] **Step 2: testimonials.ts** — add `rating`, align to the prototype's two (+ keep a third for /about), FH-clean:

```ts
export type Testimonial = { quote: string; author: string; context: string; rating: number };

export const TESTIMONIALS: readonly Testimonial[] = [
  {
    quote:
      "Sold our Coral Gables home in three weeks and above asking. Professional from start to finish.",
    author: "Marta & Diego R.",
    context: "Sold in Coral Gables",
    rating: 5,
  },
  {
    quote:
      "We moved from Spain and Nilyan made it easy — she found exactly the neighborhood we were looking for.",
    author: "Familia Castaño",
    context: "Relocated to Miami",
    rating: 5,
  },
  {
    quote:
      "She walked us through every cost — taxes, insurance, HOA — before we made an offer. No surprises at closing.",
    author: "Priya N.",
    context: "Bought in Brickell",
    rating: 5,
  },
];
```

- [ ] **Step 3: areas.ts** — add `count`, 5 entries (first is the bento hero). Use verified `images.unsplash.com` URLs (verify on dev; keep the gradient fallback):

```ts
export type Area = { name: string; slug: string; blurb: string; image: string; count: number };

export const FEATURED_AREAS: readonly Area[] = [
  { name: "Miami Beach", slug: "miami-beach", blurb: "Oceanfront living and a global market.", image: "https://images.unsplash.com/photo-1535498730771-e735b998cd64?w=1000&q=70", count: 126 },
  { name: "Coral Gables", slug: "coral-gables", blurb: "Tree-lined avenues, Mediterranean architecture.", image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=70", count: 48 },
  { name: "Coconut Grove", slug: "coconut-grove", blurb: "Leafy, bayside, and walkable.", image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=70", count: 63 },
  { name: "Brickell", slug: "brickell", blurb: "High-rise energy on the bay.", image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=70", count: 91 },
  { name: "Naples", slug: "naples", blurb: "Gulf-coast calm, refined waterfront.", image: "https://images.unsplash.com/photo-1605723517503-3cadb5818a0c?w=800&q=70", count: 54 },
];
```
> Verify each URL 200s on dev (Coconut Grove/Brickell reuse known-good IDs from the seed). Swap any 404.

- [ ] **Step 4: nav.ts** — `PRIMARY_NAV` to the prototype's 5; `FOOTER_NAV` to 3 columns:

```ts
export const PRIMARY_NAV: readonly NavItem[] = [
  { label: "Buy", href: "/buy" },
  { label: "Sell", href: "/sell" },
  { label: "Rent", href: "/rent" },
  { label: "Areas", href: "/areas" },
  { label: "About", href: "/about" },
];

export const FOOTER_NAV: readonly { heading: string; items: readonly NavItem[] }[] = [
  { heading: "Explore", items: [
    { label: "Buy", href: "/buy" }, { label: "Sell", href: "/sell" },
    { label: "Rent", href: "/rent" }, { label: "Map search", href: "/search" } ] },
  { heading: "Areas", items: [
    { label: "Miami Beach", href: "/areas/miami-beach" }, { label: "Coral Gables", href: "/areas/coral-gables" },
    { label: "Brickell", href: "/areas/brickell" }, { label: "Naples", href: "/areas/naples" } ] },
  { heading: "Contact", items: [
    { label: "hola@nilyanherrera.com", href: "mailto:hola@nilyanherrera.com" },
    { label: "Book a visit", href: "/contact" },
    { label: "Instagram", href: "/contact" }, { label: "LinkedIn", href: "/contact" } ] },
];
```

- [ ] **Step 5:** Gates green (typecheck will flag downstream consumers until their tasks land — if so, run only `pnpm -s --filter @herrera/db build` + `pnpm format:check` here and let the full gate pass after B3/B9; OR land B1 together with B2/B3. Recommended: commit B1, accept that `typecheck` is green because new fields are additive and existing code still compiles). Commit: `feat(web): align home content data + nav to the prototype`.

---

### Task B2: Header — solid forest bar, monogram, phone, ES/EN toggle, Contact

**Files:** `components/layout/Header.tsx` + `Header.module.css`, `components/layout/SiteLayout.tsx`

Target (`screens/home-full.png` top): solid `--color-forest` bar, white text, sticky; subtle shadow once scrolled. Left: **NH** in a 36px circle (bronze ring, Spectral) + `HERRERA` wordmark. Center: nav (Buy/Sell/Rent/Areas/About). Right: `🇪🇸 ES · 🇺🇸 EN` (EN active, `title="Español — D13"`), phone `tel:` link, bronze filled **Contact** button. Mobile (<900px): hamburger → panel with nav + phone + Contact.

- [ ] **Step 1:** Rewrite `Header.tsx`: drop `transparentOverHero`; always solid. Keep `useScrolled(8)` only to add a `scrolled` class (slightly stronger shadow). Structure:

```tsx
<header className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}>
  <Container>
    <div className={styles.bar}>
      <Link href="/" className={styles.brand} aria-label="Herrera — home">
        <span className={styles.monogram} aria-hidden="true">NH</span>
        <span className={styles.wordmark}>HERRERA</span>
      </Link>
      <nav className={styles.nav} aria-label="Primary">{/* PRIMARY_NAV → Link.navLink */}</nav>
      <div className={styles.actions}>
        <span className={styles.lang} title="Español — coming in D13">
          <span className={styles.langOn}>🇺🇸 EN</span><span className={styles.langSep}>·</span>
          <span className={styles.langOff}>🇪🇸 ES</span>
        </span>
        <a className={styles.phone} href={`tel:${REALTOR.phone.replace(/[^+\d]/g,"")}`}>{REALTOR.phone}</a>
        <Link href="/contact" className={styles.contactBtn}>Contact</Link>
        <button className={styles.menuBtn} /* aria-expanded, toggles open */>…</button>
      </div>
    </div>
  </Container>
  {open && <nav className={styles.mobileNav}>…nav + phone + Contact…</nav>}
</header>
```
Import `REALTOR`. Keep the existing mobile-menu state pattern.

- [ ] **Step 2:** `Header.module.css`: `.header{position:sticky;top:0;z-index:50;background:var(--color-forest);color:#fff;border-bottom:1px solid rgba(255,255,255,.08)}` ; `.scrolled{box-shadow:var(--shadow-sm)}` ; `.bar{height:76px;display:flex;align-items:center;gap:24px}` ; `.monogram{display:inline-flex;width:36px;height:36px;border-radius:50%;border:1px solid var(--color-bronze);color:var(--color-bronze-light);font-family:var(--font-serif);font-size:14px;align-items:center;justify-content:center;letter-spacing:.04em;margin-right:12px}` ; wordmark Spectral 22/500/.16em white; nav centered (`margin-inline:auto`); `.contactBtn` = filled bronze pill (`background:var(--color-bronze);color:#fff;border-radius:var(--radius-pill);padding:9px 18px;box-shadow:var(--shadow-bronze)`); phone Hanken 14 white .85 opacity; lang chip small. `@media(max-width:900px)`: hide `.nav,.phone,.lang,.contactBtn`, show `.menuBtn` + `.mobileNav` (solid surface panel). Match `screens/home-full.png`.

- [ ] **Step 3:** `SiteLayout.tsx`: remove the `transparentHeader` prop (always solid). `<Header />` only.
- [ ] **Step 4:** Gates green. Commit: `feat(web): restyle Header to the prototype (solid forest, monogram, phone, ES/EN, Contact)`.

> Note: `pages/index.tsx` passes `<SiteLayout transparentHeader>` today — remove that prop in B-hero's home edit (Task B-final) or now to keep typecheck green. Do it now: edit `index.tsx` `<SiteLayout transparentHeader>` → `<SiteLayout>`.

---

### Task B3: Footer — 3 columns to the prototype

**Files:** `components/layout/Footer.tsx` + `Footer.module.css`

Target (`screens/home-full.png` bottom / `section_h_footer.png`): forest bg. Top grid: left brand block (monogram+wordmark, tagline, phone); right 3 columns from `FOOTER_NAV`. Divider. Bottom row: left `© {year} Nilyan Herrera Real Estate · {license}`; right small line `Equal Housing Opportunity · Privacy · Terms` with the `EqualHousingLogo` inline before the text + a muted **"Sample data — demo"** note.

- [ ] **Step 1:** Rewrite `Footer.tsx` to a 3-column `FOOTER_NAV` layout (drop the old 4-col mapping is automatic — `FOOTER_NAV` now has 3). Brand block adds the **NH monogram** before the wordmark. Bottom row: keep `<EqualHousingLogo size={20} />` + "Equal Housing Opportunity", then `· Privacy · Terms` (links), and a separate muted `Sample data — demo` span.
- [ ] **Step 2:** `Footer.module.css`: top grid `1.2fr 2fr`; `.cols{grid-template-columns:repeat(3,1fr)}`; bottom row flex space-between, 12px muted text; responsive: cols→2 then 1. Match the screenshot.
- [ ] **Step 3:** Gates green. Commit: `feat(web): restyle Footer to the prototype (3 columns, EHO + sample marker)`.

---

### Task B4: Listing card + featured grid (4-up, badge, heart, reorder)

**Files:** `lib/listing.ts` (+ `.test.ts`), `components/ui/ListingCard.tsx` + `.module.css`, `components/home/FeaturedListings.module.css`

- [ ] **Step 1 (TDD):** Add `isNew: boolean` to `ListingCardVM` and `toListingCardVM` (true when `createdAt` is within 30 days). Update `listing.test.ts`: extend the full-VM expectation with `isNew` and add a case. Implementation:

```ts
// in toListingCardVM, add:
const createdAt = l.createdAt instanceof Date ? l.createdAt : new Date(l.createdAt);
// 30-day window; getStaticProps passes a real Date from the row.
isNew: Date.now() - createdAt.getTime() < 30 * 24 * 60 * 60 * 1000,
```
> `Date.now()` is fine in app code (it's only forbidden in Workflow scripts). The test builds `createdAt` explicitly. Add `createdAt: new Date()` to the test fixture and assert `isNew === true`, plus a `createdAt: new Date("2000-01-01")` case asserting `false`. Keep field order: VM stays the same shape + `isNew`.

- [ ] **Step 2:** Run `pnpm test -- listing` → fails, then passes after the impl.
- [ ] **Step 3:** Rewrite `ListingCard.tsx` body order to **price → meta → address(title) → location(city + pin)**, add the NEW badge (when `isNew`) and a presentational heart button:

```tsx
<div className={styles.media}>
  {listing.photo ? (/* eslint-disable-next-line @next/next/no-img-element */
    <img src={listing.photo} alt={listing.photoAlt} className={styles.img} loading="lazy" />
  ) : <div className={styles.placeholder} aria-hidden="true" />}
  {listing.isNew && <span className={styles.badge}>NEW</span>}
  <button type="button" className={styles.fav} aria-label="Save listing" onClick={(e)=>e.preventDefault()}>
    {/* heart SVG (outline) — wired to login-less favorites in D9 */}
  </button>
</div>
<div className={styles.body}>
  <p className={styles.price}>{listing.priceLabel}</p>
  {meta.length > 0 && <p className={styles.meta}>{meta.join(" · ")}</p>}
  <p className={styles.title}>{listing.address}</p>
  <p className={styles.loc}><PinIcon/> {listing.cityLine}</p>
</div>
```
`<button>` is inside the card `<Link>` → call `e.preventDefault()` so it doesn't navigate (D9 wires the real toggle). Add a tiny inline pin SVG. Badge = forest pill top-left; heart = white circle top-right.

- [ ] **Step 4:** `ListingCard.module.css`: badge `position:absolute;left:12px;top:12px;background:var(--color-forest);color:#fff;font-size:11px;font-weight:600;letter-spacing:.08em;padding:4px 9px;border-radius:var(--radius-xs)`; `.fav` 34px white circle top-right with soft shadow; body order rules; `.meta` stone 13px; `.title` ink 15px/500; `.loc` stone 13px flex gap 4. Match `section_b_featured.png`.
- [ ] **Step 5:** `FeaturedListings.module.css`: `.grid{grid-template-columns:repeat(4,1fr);gap:20px}` → `repeat(2,…)` ≤1100px → `1fr` ≤560px. (`getFeaturedListings(8)`? keep 8 in `index.tsx` so 4-up has two rows — change `getFeaturedListings(6)`→`(8)` in B-final.)
- [ ] **Step 6:** Gates green. Commit: `feat(web): 4-up listing cards (NEW badge, favorite heart, prototype order)`.

---

### Task B5: Hero — centered, white search card

**Files:** `components/home/Hero.tsx` + `.module.css`, `components/home/HeroSearch.tsx` + `.module.css`

Target (`section_a_hero_card.png`): full-bleed photo + dark scrim; **centered** eyebrow, big serif title (2 lines), lede; the **HeroSearch** card; "or draw your area on the map →" link; **SCROLL** cue at the bottom with a gentle bob (reduced-motion-safe).

- [ ] **Step 1:** `HeroSearch.tsx` — white card: tab row (Buy/Sell/Rent; `useState` active intent; Buy default = forest filled pill) over a search row (search icon · `<input>` placeholder "Where do you want to live?" · vertical divider · `<select>` "Type" with property-type options · bronze **Search** button). On submit route to `/search?intent=<i>&q=<q>&type=<t>` (D2 reads it). The select + tabs are real controls but only shape the query string.
- [ ] **Step 2:** `Hero.tsx` — center the content; render eyebrow/title/lede + `<HeroSearch/>` + the draw-zone `<Link href="/search">` + a `.scrollCue` (`SCROLL` + chevron). Keep the existing background-image style. Remove the `-72px` pull-up (header is solid now, hero sits below it).
- [ ] **Step 3:** CSS — `.hero{min-height:88vh;display:flex;align-items:center;text-align:center}`; constrain inner to ~720px centered; HeroSearch card `max-width:600px;margin:24px auto 0;background:var(--color-surface);border-radius:var(--radius-md);box-shadow:var(--shadow-card)`; tab row + divider + search row per screenshot; scroll cue absolute bottom-center with a `@keyframes bob` (7px) gated by `@media(prefers-reduced-motion:no-preference)`.
- [ ] **Step 4:** Gates green. Commit: `feat(web): centered hero with white search card + scroll cue`.

---

### Task B6: Map section — dark band + map mockup

**Files:** `components/home/MapPreview.tsx` + `.module.css`, `components/home/MapMockup.tsx` + `.module.css`

Target (`section_c_map.png`): forest band; left eyebrow "THE MAP" + serif white "Search by drawing your zone" + 3 bullets (bronze markers) + bronze "Explore the map" button → `/search`; right `MapMockup` card.

- [ ] **Step 1:** `MapMockup.tsx` (pure CSS, presentational): white rounded card; top bar = faux search field ("Coral Gables, FL") + bronze "✎ Draw zone" pill; map area = sage/cream radial-gradients + grid via `repeating-linear-gradient`; 3 absolutely-positioned price pins ($2.4M, $1.6M, $890K — forest/bronze pills); a dashed-circle "zone" (`border:2px dashed …;border-radius:50%`); bottom-left label card "37 properties in your zone".
- [ ] **Step 2:** `MapPreview.tsx` — forest `<section>`; 2-col grid (copy | `<MapMockup/>`); bullets list; bronze button. (Reuse `Reveal`, `Container`, `Eyebrow`, `Button variant="primary"` with a bronze look — use the existing bronze primary.)
- [ ] **Step 3:** CSS to match; responsive: stack ≤900px. Match `section_c_map.png`.
- [ ] **Step 4:** Gates green. Commit: `feat(web): dark map section with interactive-map mockup`.

---

### Task B7: Areas — bento (1 big + 4 small) with counts

**Files:** `components/home/ExploreAreas.tsx` + `.module.css`

Target (`section_d_areas.png`): centered eyebrow + heading; bento grid — first area = large tile (left, full height), next 4 = 2×2 (right). Each tile: image + bottom scrim + serif name + `{count} properties`.

- [ ] **Step 1:** `ExploreAreas.tsx` — `const [hero, ...rest] = FEATURED_AREAS;` render `hero` in `.big` and `rest.slice(0,4)` in `.small`. Each tile = `<Link href={/areas/${a.slug}}>` with `<img>` + scrim + `<h3>` + `<p>{a.count} properties</p>`.
- [ ] **Step 2:** CSS grid: `.grid{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:18px}`; `.big{grid-row:1 / span 2}`; small tiles fill the right two columns/rows; aspect handled by min-heights. Responsive: ≤900px → big full width then 2-col small; ≤560px → 1 col. Match `section_d_areas.png`.
- [ ] **Step 3:** Gates green. Commit: `feat(web): bento explore-by-area with property counts`.

---

### Task B8: Capture — two cards (buy light / sell dark)

**Files:** `components/home/CaptureInvite.tsx` + `.module.css`

Target (`section_e_capture.png`): 2-col. Left card (surface, border): eyebrow "BUY" + "Find your next home" + text + dark **"Start my search"** → `/buy`. Right card (forest): eyebrow "SELL" + "What's your home worth?" + text + **address `<input>`** + bronze **"Get a free valuation"** → `/home-value` (form `preventDefault` → route to `/home-value`; real magnet is D7).

- [ ] **Step 1:** Rewrite `CaptureInvite.tsx` to the two-card layout (reuse `Button`; the sell card's button is bronze, on dark). The address input is presentational; submit routes to `/home-value`.
- [ ] **Step 2:** CSS: `.grid{grid-template-columns:1fr 1fr;gap:24px}`; left `.buy` surface + border; right `.sell` forest; both radius-md, generous padding; stack ≤768px. Keep the `eyebrowLight` (bronze) on the dark card. Match `section_e_capture.png`.
- [ ] **Step 3:** Gates green. Commit: `feat(web): dual capture cards (buy / home-value)`.

---

### Task B9: Agent/Trust — photo + stats badge + 2★ testimonials

**Files:** `components/ui/StarRating.tsx`, `components/home/Trust.tsx` + `.module.css`

Target (`section_f_trust.png`): 2-col. Left: portrait `<img>` (rounded) with an overlaid forest **stats badge** (`REALTOR.stats` → value serif + label). Right: eyebrow "YOUR AGENT" + `REALTOR.name` (serif) + bio + `{license} · {memberOf}` line + **2 testimonial cards** (each: `<StarRating value={5}/>` bronze + quote + author·context).

- [ ] **Step 1:** `StarRating.tsx` — `({ value }: { value: number })` → five inline `★` spans, filled = bronze, with `aria-label={`${value} out of 5 stars`}`.
- [ ] **Step 2:** Rewrite `Trust.tsx` to the photo+stats / bio+testimonials layout. Use `REALTOR.photo`, `REALTOR.stats`, `TESTIMONIALS.slice(0,2)`.
- [ ] **Step 3:** CSS: 2-col `1fr 1.1fr`; `.photoWrap` relative, image `aspect-ratio:4/5;object-fit:cover;border-radius:var(--radius-md)`; `.stats` absolute bottom-left forest card, 3 cells; testimonial cards = surface + border + radius, stars bronze. Stack ≤900px. Match `section_f_trust.png`.
- [ ] **Step 4:** Gates green. Commit: `feat(web): agent section with stats badge + rated testimonials`.

---

### Task B10: Contact section (presentational) + home assembly + verify

**Files:** `components/home/ContactSection.tsx` + `.module.css`, `pages/index.tsx`

Target (`section_g_contact.png`): cream `<section>`, 2-col. Left: eyebrow "CONTACT" + "Let's talk about your next home" + body + contact rows (phone/email/office, with icons) + agent mini-card (monogram + `{license} · {hours}`). Right: white form card "Send a message" — helper line, intent **tabs** (Buy/Sell/Rent), Full name, Email + Phone (2-col), Area of interest, Message (optional `<textarea>`), **consent checkbox** ("I agree to the privacy policy…"), bronze **Send message** button. **Presentational:** `onSubmit={e=>e.preventDefault()}`, fields uncontrolled or local state, no network; a small note in code: `// D7 wires submission + per-channel consent + notifications`.

- [ ] **Step 1:** `ContactSection.tsx` per above (import `REALTOR`). The consent checkbox is required-styled but not enforced (D7).
- [ ] **Step 2:** `ContactSection.module.css` — 2-col `1fr 1.05fr`; left contact rows with small icon circles; right white form card (shadow-card, radius-md); inputs styled to tokens (border, radius-sm, focus bronze); tabs row like the hero; stack ≤900px. Match `section_g_contact.png`.
- [ ] **Step 3:** `pages/index.tsx`: `<SiteLayout>` (no transparent prop), `getFeaturedListings(8)`, section order: `Hero · FeaturedListings · MapPreview · ExploreAreas · CaptureInvite · Trust · ContactSection`.
- [ ] **Step 4: Full verification** — `pnpm format && pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm --filter @herrera/web build` all green; confirm `/` SSG with featured data (no "unavailable" warning). Manual `pnpm dev`: compare each section to `docs/reference/prototype/screens/*` — header solid w/ monogram+phone+Contact; centered hero search card; 4-up cards w/ badge+heart; dark map + mockup; bento areas; dual capture; agent stats+stars; contact form; 3-col footer. Mobile <900px stacks; reduced-motion kills the scroll bob + reveals; visible focus.
- [ ] **Step 5:** Commit: `feat(web): presentational contact section + assemble restyled home`.

---

## Self-Review

**Spec coverage:** 9 prototype deltas → B2 (header), B5 (hero), B4 (cards), B6 (map), B7 (areas), B8 (capture), B9 (agent), B10 (contact), B3 (footer); data/nav → B1; docs/source-of-truth → A1. ✅
**Decisions honored:** contact section built presentational (D7 wires) ✅; EN copy, ES toggle presentational ✅; tokens/typography untouched ✅; demo "Sample data" marker kept ✅; FH-clean copy ✅.
**Type consistency:** `ListingCardVM` + `isNew` defined in B4 and consumed by `ListingCard`; `REALTOR.stats/photo/office/memberOf/hours`, `Testimonial.rating`, `Area.count` defined in B1 and consumed in B2/B3/B7/B9/B10; `PRIMARY_NAV`(5)/`FOOTER_NAV`(3) in B1 consumed by Header/Footer. `SiteLayout` loses `transparentHeader` (B2) — the only caller (`index.tsx`) is updated in B2 Step note + B10 Step 3. ✅

## Risks / notes
- **Order matters:** B1 (data/nav) first so later tasks compile. B2 removes `transparentHeader` and must also edit `index.tsx`'s `<SiteLayout transparentHeader>` in the same task to keep typecheck green.
- **Sample photo / area images:** verify all `images.unsplash.com` URLs 200 on dev; swap any 404 (keep gradient fallbacks).
- **Presentational pieces** (contact form, heart, Type select, ES/EN, hero tabs routing) must not fake persistence — `preventDefault` + route-only; comments point to D7/D9/D13/D2.
- **`getFeaturedListings(8)`** so the 4-up grid shows two full rows (DB has 124).
- Branch stays `feat/d1-public-shell-home`; still no merge/deploy until you review locally.
