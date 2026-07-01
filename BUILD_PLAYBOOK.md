# Build playbook — Herrera (Nilyan Herrera)

How to build the app with Claude Code, end to end. Paste **one task at a time**, in order.
After each task: review the plan/diff, make sure `typecheck` + `lint` are green, commit, then
move to the next. Never paste "build the whole app."

The tasks reference the ADRs created in Phase 0 and the authoritative `CLAUDE.md`.

---

## 0) Install Superpowers (one-time)

Superpowers forces a plan → test-first → review workflow, which is exactly the discipline you
want here. It honors your `CLAUDE.md` as higher priority than its own skills, so it won't
override our decisions.

**Prerequisite:** a recent Claude Code that supports `/plugin`. If `/plugin` isn't recognized,
update and restart:
```
npm update -g @anthropic-ai/claude-code
```

**Install (recommended — official marketplace):**
```
/plugin install superpowers@claude-plugins-official
```
**Or via the author's community marketplace:**
```
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

Then **quit and restart** Claude Code. Verify with `/help` — you should see new commands:
`/superpowers:brainstorm`, `/superpowers:write-plan`, `/superpowers:execute-plan`.

**How it changes the loop:** the skills auto-trigger from what you ask. For each task below,
paste the prompt; Superpowers will brainstorm/clarify, then produce a plan. **Read the plan
carefully and approve it** (this is where bugs are prevented), then it executes with TDD
(red-green-refactor) and a two-stage review before declaring done. Without Superpowers, ask it
to "plan first, then implement, then stop for review" yourself — every task prompt below already
ends that way.

---

## Phase 0 — planning artifacts (already triggered by the kickoff prompt)
If you haven't yet: paste `KICKOFF_PROMPT.md` into a fresh Claude Code session with `CLAUDE.md`
in the repo root. Let it create the ADRs + structure and **stop**. Review the ADRs with me
before continuing.

---

## Phase 1 — Foundations

**F1 · Monorepo & tooling**
```
Set up the pnpm workspaces monorepo per CLAUDE.md and ADR-003: apps/web, apps/worker (empty
stub), packages/db, packages/config. Configure TypeScript strict, ESLint + Prettier, and a
Zod-validated env schema in packages/config. No app features yet. Plan first, implement, then
stop and show me.
```

**F2 · Database & schema**
```
Implement the Drizzle schema in packages/db per ADR-002, 005, 006, 007, 008, 011: tables
listings (source mls|manual|mock, visibility, PostGIS geometry, Florida fields
flood_zone/hoa/cdd/taxes, media photos/video/tour), leads (contact phone and/or email, intent,
qualification answers jsonb, source, viewed listings, per-channel consent), activities,
qualification_questions, content. Enable PostGIS, generate migrations, wire a Neon connection.
Plan first, then stop and show me the schema before I approve.
```

**F3 · Design tokens from Claude Design**
```
Connect the Claude Design MCP (server https://api.anthropic.com/v1/design/mcp, auth via
/design-login) and import the project
https://claude.ai/design/p/8ecde379-78f0-45f9-b563-f36a2b076a82?file=Prototipo.dc.html .
Implement the design from Prototipo.dc.html (the visual source of truth): commit its tokens
(colors, typography, spacing, radii, motion) to docs/visual-direction.md plus a tokens file the
app consumes (ADR-016), build the base layout/theme, and re-skin component primitives so nothing
looks like default shadcn/Tailwind. Also set up shared motion utilities for subtle, elegant
transitions: smooth route/page transitions and an on-scroll section-reveal helper, restrained and
honoring prefers-reduced-motion. Plan first, then stop and show me the base layout + a sample
transition.
```

**F4 · Admin auth**
```
Set up Auth.js for ADMIN ONLY per ADR-010 (no public accounts). Seed an admin user for Nilyan
Herrera and protect /admin. Plan first, then stop and show me login working.
```

**F5 · Seed script (realistic demo data)**
```
Write `pnpm db:seed` per ADR-006 and 013: ~120 realistic central-Florida listings (real
cities/neighborhoods/ZIPs, plausible coordinates that cluster on a map, credible
prices/beds/baths/sqft, assigned FEMA flood zones, plausible HOA/CDD/tax/insurance estimates,
free-license photo URLs), a handful of off-market listings, and sample leads + activities so the
CRM looks alive. Tag all rows source='mock'. Plan first, then stop and show me sample rows.
```

**F6 · Preview deploy**
```
Set up the Vercel preview deploy per ADR-003: noindex, access-restricted (basic auth or Vercel
protection), and a subtle "sample data — demo" marker. Confirm the deployed skeleton is
reachable. Stop and give me the URL.
```

> **Checkpoint:** foundations done — schema, tokens, auth, seed data, deployed skeleton.

---

## Phase 2 — The demo (spine first, then extras)

**D1 · Public shell + home**
```
Build the public shell (header/nav/footer) and the home page per the design system and ADR-016:
hero with a prominent location search and the three lead intents (Buy/Sell/Rent), a
featured-listings strip, a band previewing the map search, explore-by-area, a capture
invitation, and trust (Nilyan's bio + our own testimonials). Mobile-first. Plan first, then stop
and show me.
```

**D2 · Search + map (the signature screen)**
```
Build the search results + interactive map as ONE synced split view per ADR-012: results list
and a MapLibre map side by side; hovering a card highlights its pin and vice versa; moving/zooming
the map reloads results for the visible area (PostGIS bbox); a draw-a-zone polygon filter (PostGIS
ST_Within); pin clustering. The map is client-only via next/dynamic { ssr: false }. On mobile, a
list/map toggle. This is the signature screen — make it genuinely excellent. Plan first, then stop
and show me.
```

**D3 · Filters**
```
Add search filters per ADR-007/012: price, beds, baths, type, plus a few Florida-relevant ones
(waterfront, pool, HOA, 55+). Keep them useful but intentionally limited, and make the exposed set
configurable from the admin. Plan first, then stop and show me.
```

**D4 · Listing detail (rich)**
```
Build the listing detail page per ADR-005/007: large gallery + video + virtual-tour support,
key-facts strip, map, mortgage calculator, similar listings, and a persistent prominent contact
module. Render with ISR (getStaticProps/getStaticPaths + revalidate) and add schema.org JSON-LD.
Plan first, then stop and show me.
```

**D5 · Florida cost-of-ownership (the differentiator)**
```
Implement the Florida cost-of-ownership panel per ADR-013: on each listing and as a map layer,
show FEMA flood zone + estimated flood insurance + home insurance + HOA/CDD + taxes → a realistic
monthly cost. Label everything clearly as ESTIMATES (never quotes or advice). Add a "what will this
really cost you?" CTA that opens lead capture. Plan first, then stop and show me.
```

**D6 · Map intelligence layers**
```
Add the map intelligence layers per ADR-012: schools (with ratings), transit, walkability, and
shops/POI. Use free or mock data sources for the demo, wired so real APIs can swap in later. Plan
first, then stop and show me.
```

**D7 · Lead capture (the core)**
```
Build the Buy/Sell/Rent lead capture per ADR-007/011: typeform-style, one question per screen,
branched by intent, with questions loaded from the admin-configurable set (seed Carolina-style
defaults). Contact captured last, phone and/or email required (never force both, at least one).
Capture per-channel consent with stored records. Also add per-listing "request info / schedule a
tour" and a "what's my home worth?" magnet, and record the lead's viewed listings. Plan first,
then stop and show me.
```

**D8 · Notifications + auto-response**
```
Wire notifications per ADR-009: on every new lead, send Nilyan an instant email alert (Resend)
and a daily digest of new leads; send the lead one transactional auto-response ("thanks, we'll be
in touch shortly"). Add the Twilio WhatsApp/SMS path as a ready-but-inactive seam. Plan first,
then stop and show me.
```

**D9 · Favorites (login-less)**
```
Add login-less favorites per ADR-010: stored in the browser, with a soft "save these / get
notified — leave your email" capture nudge. No accounts. Plan first, then stop and show me.
```

**D10 · Admin CRM (core)**
```
Build the admin lead CRM per ADR-008: a lead inbox with filters (intent/status/date/source), lead
detail (contact + qualification answers + viewed listings), a pipeline
(New→Contacted→Qualified→Appointment→Offer→Closed/Lost), and a call log + notes + follow-up
reminders. Plan first, then stop and show me.
```

**D11 · Admin management editors (questions, off-market, guides)** — revised 2026-07-01, ADR-008/020
```
Build three admin-only management editors (behind F4 requireAdmin, reusing existing tables/seams,
no new auth): (1) qualification-questions editor — CRUD + reorder + activate/deactivate the
qualification_questions the Buy/Sell/Rent flow reads live (the editor D7 deferred here); (2)
off-market listings management — CRUD for Nilyan's own manual listings + the 3-state visibility
toggle (public/registered/private_link); works on real data now, independent of the Miami feed;
(3) guides/blog editor — CRUD/publish/unpublish for the content guides seeded in D12. Also add the
optional, unchecked-by-default marketing opt-in to the four capture forms (ADR-020). Plan first,
then stop and show me.

DEFERRED out of D11: analytics (D10's dashboard covers the demo; deeper analytics needs real
data) and area/neighborhood content editing (tied to the deferred D12 Phase A area pages).
NOT in scope: email marketing campaigns — Phase 2 (ADR-020); the MLS worker — Phase 3 (ADR-004).
```

**D12 · Neighborhood SEO pages**
```
Build location landing pages per ADR-015: a page per city/neighborhood/zip, ISR-rendered, with
local market data, schools, and matching listings, plus schema.org structured data and a clean
URL structure. Plan first, then stop and show me.
```

**D13 · EN/ES internationalization** — two phases, ADR-018
```
Add EN/ES internationalization per ADR-018 across the public site, in TWO phases.

PHASE 1 — language infra + UI translation: Next.js Pages-Router i18n with locales ['en','es'],
defaultLocale 'en' (English at the root, Spanish under /es/); a header EN/ES toggle (same page,
other language); all static UI strings via a lightweight typed EN/ES dictionary (no heavy i18n
dep). Multilingual SEO is a TOP priority: wire reciprocal hreflang + x-default into <Seo> (the D12
seam), a bilingual sitemap (both language URLs of every page), correct <html lang> per locale, and
a self-referential canonical per locale.

PHASE 2 — bilingual admin content: the three D11 editors become bilingual so Nilyan fills EN + ES —
qualification questions (label + options; label_es already exists), guides/blog (title_es/
excerpt_es/body_es already exist — add meta_title_es/meta_description_es), and off-market listings
(add description_es). Reuse the existing ES columns + a small migration for the missing ones; the
public site renders the active locale, falling back to EN.

DEFERRED (not in D13): translating MLS property descriptions — the feed arrives in English; decide
auto-translate vs structured-only when the Miami feed is live (with D5 / the worker / D12 Phase A,
ADR-004/017). D13 covers the UI + Nilyan's own content only.

Plan first (two phases), then stop and show me.
```

**D14 · Polish pass**
```
Do a quality pass per ADR-016/011: performance (image CDN, fast loads), accessibility (keyboard
focus, labels, contrast), responsive/mobile (the list/map toggle), empty/loading/error states,
the "sample data" marker, a Fair-Housing review (no steering anywhere), and a motion pass —
confirm subtle, consistent page transitions and on-scroll section reveals across the site, all
honoring prefers-reduced-motion and never flashy. Stop and show me a checklist of what you
changed.
```

**D15 · Final demo deploy + walkthrough**
```
Deploy the full demo to the protected Vercel preview, then give me a short walkthrough script for
the meeting — the path that best shows a lead being captured and landing in the CRM. Stop.
```

> **Checkpoint:** the end-to-end demo is live on the protected link and runs locally. This is what
> you show Nilyan and your father-in-law.

---

## After the demo (not part of the demo build)

**Phase 3 · MLS integration** (only once Nilyan's MLS access is confirmed)
```
Build the MLS sync worker in apps/worker per ADR-004 against Nilyan's feed (RESO Web API or
SimplyRETS), point it at the same listings table, upsert and remove sold/expired within 24h, then
purge the source='mock' rows. The public site shows real inventory with zero UI changes. Plan
first, then stop and show me.
```

**v2 · on real data** (after MLS data exists)
- AI natural-language search + concierge chat per ADR-014, with the guardrails (grounded in our
  data, no legal/insurance advice, Fair Housing no-steering).
- Then the rest of v2: passwordless client accounts, saved searches + alerts, automation, AI lead
  scoring, automated (human-reviewed) SEO blog, and **email marketing campaigns** (mass outbound to
  CRM leads under CAN-SPAM — recipient lists/templates/scheduling/ESP/tracking/unsubscribe; the
  marketing opt-in + consent seam already ship in v1/D11, ADR-020).
- **D12 Phase A — area/location pages** (`/areas/*`) also wait for the Miami feed (built with the
  MLS worker on real data; not on the mock Orlando seed).
- **MLS property-description translation** also waits for the Miami feed — decide auto-translate vs
  structured/field-based ES rendering once real (English) MLS descriptions exist. D13 localized only
  the UI + Nilyan's own admin-authored content (ADR-018).

---

## Driving tips
- One task at a time. Read the plan before approving (Superpowers makes this explicit).
- Commit each slice; keep `typecheck` + `lint` green.
- If a task contradicts an ADR, update the ADR first, then build.
- `CLAUDE.md` stays authoritative — if Claude Code drifts, point it back to the relevant ADR.
- Build the spine (D1–D11) solid before the nice-to-haves; the AI is v2, not the demo.
