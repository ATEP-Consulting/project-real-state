# Visual direction — Herrera (Nilyan Herrera, FL realtor)

> **Committed snapshot of the Claude Design tokens.** This is the stable source of truth the
> app builds against. The runtime/build must NOT depend on the Claude Design MCP — pull from
> the MCP, sync here, build against this. See ADR-016.
>
> **Provenance:** synced from the Claude Design project *"Portal inmobiliario premium Florida"*
> (`8ecde379-78f0-45f9-b563-f36a2b076a82`), file **`Prototipo.dc.html`** — the visual source of
> truth. Sibling files `Home.dc.html`, `Resultados.dc.html`, `Ficha.dc.html` are per-screen
> exports of the same system; `Prototipo.dc.html` contains all three screen states
> (`isHome` / `isResultados` / `isFicha`) and is comprehensive. Re-sync via the `/design-sync`
> flow (DesignSync MCP) when the design changes; update this file in the same commit.
>
> _Last synced: 2026-06-29._

---

## 1. Brand & character

A **premium, editorial, warm** real-estate brand for a licensed Florida realtor. Not a generic
proptech/shadcn look: cream paper, deep forest green, a bronze accent, and soft sage — a refined,
hospitable, "high-end boutique brokerage" feel.

- **Wordmark:** `HERRERA` set in Spectral, 500 weight, uppercase, letter-spacing `.16em`.
- **Monogram:** `NH` in a circle (avatar/logo lockup, 38px circle, bronze on dark or reversed).
- **Voice (from the prototype copy):** confident, curated, bilingual.
  - EN: *"Find your place in Florida."* · *"Curated properties across Miami, Coral Gables, Naples
    and the entire coast. Buy, sell or [rent]."* · *"Premium real estate guidance in Florida. Buy,
    sell and rent with confidence."*
  - ES: *"Encuentra tu lugar en Florida."* · *"Propiedades seleccionadas en Miami, Coral Gables,
    Naples y toda la costa."* · *"Asesoría inmobiliaria premium en Florida."*
- **Eyebrow line:** *"Florida · Licensed Realtor®"* / *"Florida · Realtor® licenciada"*.

> **Note:** the prototype defaults to Spanish (`lang: 'es'`) with an EN/ES chip toggle. For v1 the
> site **default locale is English** (`/es/...` for Spanish) — confirmed in Phase 0 review
> (ADR-018). Keep the EN/ES toggle in the UI. The token system below is locale-agnostic.

---

## 2. Color tokens

Warm, low-chroma, paper-and-ink. Semantic names on the left; the app's CSS custom properties
mirror these (see §7).

### Core neutrals (paper & ink)
| Token | Hex | Role |
|---|---|---|
| `paper` | `#F3EFE7` | Page background (warm cream) |
| `surface` | `#FFFFFF` | Cards, header-when-scrolled, inputs |
| `sand-100` | `#EFEADF` / `#EEE8DB` / `#ECE6D9` | Subtle raised/tinted surfaces |
| `sand-200` | `#E9E3D6` | Section bands |
| `border` | `#E4DED1` | Hairline borders / dividers |
| `border-strong` | `#D8D1C2` | Stronger dividers, input outlines |
| `ink` | `#1A1B19` | Primary text |
| `ink-soft` | `#3A3A36` | Secondary dark text |

### Brand greens (forest)
| Token | Hex | Role |
|---|---|---|
| `forest` | `#15302C` | Primary brand dark — dark sections, footer, scrolled-header text |
| `forest-900` | `#11201D` | Deepest green (overlays, deepest panels) |
| `forest-tint-*` shadows | `rgba(11,24,22,.06–.34)` | All elevation shadows are tinted with this green, not pure black |

### Brand accent (bronze / gold)
| Token | Hex | Role |
|---|---|---|
| `bronze` | `#A9794A` | **Primary accent** — CTAs, links, active states, text selection |
| `bronze-light` | `#C9A06A` | Hover/lighter accent, highlights |
| `bronze-dark` | `#8F6238` / `#B98B5C` | Pressed/darker accent, on-cream text accent |

### Secondary tint (sage / eucalyptus)
| Token | Hex | Role |
|---|---|---|
| `sage` | `#B7D2CE` | Soft secondary tint — map/eco accents, tags, illustrative fills |
| `sage-alt` | `#9CC2BE` / `#97C0BB` / `#B8D3CF` | Sage variants |
| `olive` | `#C4CFA8` | Occasional warm-green accent (e.g. "green/eco" chips) |

### Muted stone (taupe text)
| Token | Hex | Role |
|---|---|---|
| `stone` | `#6F6857` | Muted/secondary text on paper |
| `stone-soft` | `#9A9384` | Tertiary text, captions, placeholders |
| `stone-faint` | `#B5AE9E` | Disabled, faint meta |

### Functional overlays
- Text/scrim on photos: `rgba(255,255,255,.6–.92)` (light) and `rgba(11,24,22,.5–.72)` (dark glass).
- Glass panels over imagery (hero search, header at top): `rgba(255,255,255,.1–.16)` borders +
  blur, white text.
- **Text selection:** background `#A9794A`, color `#fff`.

---

## 3. Typography

Two families, loaded from Google Fonts:

```
Spectral:        ital,wght@0,300;0,400;0,500;0,600;1,400   (serif — display & headings)
Hanken Grotesk:  wght@400;500;600;700                       (sans — body, UI, data)
```

- **Spectral (serif)** → all display/headings, the wordmark, listing prices/titles, section
  titles. Used mostly at weight **400** for large display (let the serif breathe) and **500** for
  smaller headings/wordmark. Tight line-heights at display sizes (`1.04–1.1`).
- **Hanken Grotesk (sans)** → body copy, navigation, buttons, form fields, key-facts, badges,
  all data/UI. Weights 400/500/600/700. Comfortable line-heights for body (`1.5–1.7`).

### Type scale (observed roles → px)
| Role | Family / weight | Size | Line-height | Notes |
|---|---|---|---|---|
| Hero display | Spectral 400 | 68 | 1.04 | reduce responsively on mobile |
| Section H2 | Spectral 400 | 40–46 | 1.05–1.08 | |
| Sub-section H3 | Spectral 400 | 30–34 | 1.1 | |
| Block heading | Spectral 400/500 | 25–28 | 1.1 | |
| Card / listing title | Spectral 500 | 22–23 | 1.1 | |
| Wordmark | Spectral 500 | 22 | — | letter-spacing `.16em`, uppercase feel |
| Lead / large body | Hanken 400 | 16–19 | 1.6–1.7 | |
| Body | Hanken 400/500 | 14.5–15 | 1.55–1.65 | base |
| Small / meta | Hanken 500/600 | 12.5–13.5 | 1.5 | |
| Micro | Hanken 600 | 11–12 | 1 | |
| **Eyebrow / label** | Hanken 600 | 10.5–12 | 1 | `text-transform:uppercase`, letter-spacing `.18–.3em` |

### Letter-spacing tokens
`-.01em` (large display) · `.02em` · `.04em` (buttons/labels) · `.1em` · `.16em` (wordmark) ·
`.18–.2em` (eyebrows) · `.24–.3em` (widest micro-labels).

> **Pattern:** uppercase + wide tracking is reserved for small eyebrows/labels/the wordmark.
> Headlines are serif, sentence-case, never tracked-out.

---

## 4. Spacing, radii, layout

- **Container:** `max-width: 1440px`, centered. Desktop gutter ≈ `56px` (header padding `18px 56px`).
- **Content measures:** prose/forms cap around `420–680px`; wide content `840–980px`.
- **Spacing scale (px):** the prototype uses a fine-grained scale; normalize the app to
  **`4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 56, 64`**. Section vertical rhythm is
  generous (large gaps between bands) — keep sections airy.
- **Radii:** `2–3px` (chips, buttons, inputs — the dominant, crisp radius), `4–6px` (cards),
  `20–22px` (pills / large rounded buttons & search bar), `50%` (avatars/monogram). A few
  **organic blob radii** (e.g. `46% 54% 50% 50%`, `0 70% 0 0`) appear as decorative image/section
  masks — use sparingly, as art direction, not on functional UI.

---

## 5. Elevation (shadows)

Shadows are **soft, layered, and green-tinted** (`rgba(11,24,22,...)`), never harsh black.

| Token | Value | Use |
|---|---|---|
| `shadow-hairline` | `0 1px 0 #E4DED1` | dividers / header base |
| `shadow-sm` | `0 6px 20px rgba(11,24,22,.06)` | scrolled header, subtle lift |
| `shadow-card` | `0 12px 34px rgba(11,24,22,.08)` | resting cards |
| `shadow-card-hover` | `0 18px 44px rgba(11,24,22,.07–.13)` | hovered cards |
| `shadow-modal` | `0 24px 60px rgba(11,24,22,.34)` | overlays / capture modal |
| `shadow-bronze` | `0 4px 14px rgba(169,121,74,.3)` | primary (bronze) button glow |

On dark/photo contexts the prototype also uses plain `rgba(0,0,0,.16–.4)` drop shadows for
floating pins/cards over the map and imagery.

---

## 6. Motion

**Restrained and premium.** The prototype itself ships minimal motion; the brief mandates we
**add subtle, elegant transitions** consistent with that calm. Never flashy — overdone motion
reads as AI-generated.

From the prototype:
- **Header:** on scroll, background fades to white and a soft shadow appears; nav/logo text color
  flips from white → `#15302C`. Transition: `box-shadow .3s ease` (+ bg/color crossfade).
- **Scroll cue:** hero "scroll down" arrow uses `@keyframes scrollBounce` — `1.8s ease-in-out
  infinite`, a 7px vertical bob with opacity `.55 → 1`.
- **Selection / hover accents:** bronze.

To add in the build (ADR-016), all `prefers-reduced-motion`-aware:
- **Page/route transitions:** smooth, short crossfade/slide between routes.
- **On-scroll section reveals:** sections gently ease/fade up as they enter the viewport
  (IntersectionObserver). Small translate (≈8–16px) + opacity, `~.4–.6s`, default ease.
- **Standard interaction timing:** `~.3s ease` for hovers/state changes (matches the header).
- **`prefers-reduced-motion: reduce`** → disable reveals/route motion; show final state instantly.

---

## 7. Canonical CSS variables (reference for the Phase-1 tokens file)

The Phase-1 task **F3** generates the machine-readable tokens the app consumes. This block is the
canonical reference it must match.

```css
:root {
  /* paper & ink */
  --color-paper: #F3EFE7;
  --color-surface: #FFFFFF;
  --color-sand-100: #EFEADF;
  --color-sand-200: #E9E3D6;
  --color-border: #E4DED1;
  --color-border-strong: #D8D1C2;
  --color-ink: #1A1B19;
  --color-ink-soft: #3A3A36;
  /* forest */
  --color-forest: #15302C;
  --color-forest-900: #11201D;
  /* bronze accent */
  --color-bronze: #A9794A;
  --color-bronze-light: #C9A06A;
  --color-bronze-dark: #8F6238;
  /* sage / olive */
  --color-sage: #B7D2CE;
  --color-sage-alt: #9CC2BE;
  --color-olive: #C4CFA8;
  /* stone text */
  --color-stone: #6F6857;
  --color-stone-soft: #9A9384;
  --color-stone-faint: #B5AE9E;

  /* type */
  --font-serif: 'Spectral', Georgia, serif;
  --font-sans: 'Hanken Grotesk', system-ui, sans-serif;

  /* radii */
  --radius-xs: 2px;
  --radius-sm: 3px;
  --radius-md: 6px;
  --radius-pill: 22px;
  --radius-full: 9999px;

  /* elevation (green-tinted) */
  --shadow-sm: 0 6px 20px rgba(11,24,22,.06);
  --shadow-card: 0 12px 34px rgba(11,24,22,.08);
  --shadow-card-hover: 0 18px 44px rgba(11,24,22,.10);
  --shadow-modal: 0 24px 60px rgba(11,24,22,.34);
  --shadow-bronze: 0 4px 14px rgba(169,121,74,.30);

  /* layout */
  --container-max: 1440px;
  --gutter: 56px;

  /* motion */
  --ease-standard: cubic-bezier(.4, 0, .2, 1);
  --dur-fast: .2s;
  --dur-base: .3s;
  --dur-reveal: .5s;
}
```

---

## 8. Anti-templated rules (quality floor)

- Never ship a default shadcn/Tailwind theme. Spectral + Hanken Grotesk, cream/forest/bronze,
  green-tinted soft shadows, crisp 2–3px radii — those are the fingerprint.
- Eyebrows uppercase + tracked; headlines serif + sentence-case + untracked.
- Photography treated consistently (fixed aspect-ratio crops); the brand leans image-forward.
- Quality floor on every screen: responsive (mobile-first list/map toggle), visible keyboard
  focus, and `prefers-reduced-motion` honored.
- If a screen drifts from this system or looks templated, fix it before moving on.
