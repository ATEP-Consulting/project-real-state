# F3 — Design Tokens, Base Theme & Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the minimal `apps/web` Next.js (Pages Router) shell and wire the committed Claude Design tokens, base theme/typography, and reduced-motion-aware motion utilities — so every later D-task builds on a faithful, premium foundation. No real pages or features.

**Architecture:** A bare Next.js Pages-Router app hosts: (1) a machine-readable **tokens** layer (`tokens.css` CSS custom properties copied verbatim from `docs/visual-direction.md`, plus a tiny typed `motion.ts` for JS-side timing); (2) **global theme** (reset + base element styling + self-hosted fonts via `next/font`); (3) **motion utilities** (`PageTransition`, `Reveal`) that always honor `prefers-reduced-motion`; (4) a minimal **primitive** set (Button, Container, Section, Eyebrow) + a placeholder **design-preview** page to demonstrate the system. The full header/nav/footer and real pages are D-tasks.

**Tech Stack:** Next.js 15 (Pages Router) + React 19 + TypeScript strict (`@herrera/config/tsconfig/nextjs.json`) · `next/font/google` (Spectral + Hanken Grotesk, self-hosted) · CSS custom properties + **CSS Modules** (no Tailwind) · **framer-motion** for transitions/reveals.

## Global Constraints

- **ADR-016 / `docs/visual-direction.md` is the source of truth.** Copy token values **verbatim** — do **not** invent or alter palette/type/spacing/shadows/motion. No runtime/build dependency on the Claude Design MCP.
- **ADR-001:** Pages Router only. **No App Router, no React Server Components, no `"use client"`.** (framer-motion is fine — Pages Router is all client-side already.)
- **Scope:** tokens + base layout/theme + motion utilities + a minimal primitive set + a placeholder preview page. **No real pages/features** (home/search/etc. are D-tasks). Keep `apps/web` to the bare shell needed to host the theme.
- **Motion:** subtle/restrained, **~0.3s** easing matching the prototype (`cubic-bezier(.4,0,.2,1)`); route/page transitions + on-scroll section reveals; **ALWAYS honor `prefers-reduced-motion: reduce`** (JS hook + a global CSS backstop). Never flashy.
- **Quality gate:** `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, and `pnpm --filter @herrera/web build` (the app boots) all green. (Visual review is via `pnpm dev`.)
- **Demo posture (ADR-003):** `<meta name="robots" content="noindex,nofollow">` in the document head (full deploy protection is F6).

## Decisions in this plan (confirm at review)

1. **Styling = CSS custom properties + CSS Modules (no Tailwind).** Matches the prototype's token-driven styling and removes any "templated Tailwind" risk (CLAUDE.md). *Alternative: Tailwind v4 mapped to the tokens — would replace `*.module.css` with a `@theme` token map + utility classes.*
2. **Motion = framer-motion.** Clean route **exit** transitions (`AnimatePresence`) + a first-class `useReducedMotion()`. *Alternative: zero-dep custom (CSS transitions + an IntersectionObserver hook) — lighter, but route exit animations are limited.*
3. **Fonts via `next/font/google`** (self-hosted, no layout shift, no runtime Google dependency). Same families/weights as `visual-direction.md`; `next/font` owns `--font-serif`/`--font-sans`, so `tokens.css` omits the font-family vars (mechanism differs, design does not).
4. **Tokens live in `apps/web`** (only the web app consumes them) — not a shared package.

## File Structure

```
apps/web/
  package.json            # @herrera/web — next, react, react-dom, framer-motion
  next.config.mjs         # reactStrictMode, transpilePackages
  next-env.d.ts           # committed so `tsc` is hermetic
  tsconfig.json           # extends @herrera/config/tsconfig/nextjs.json
  src/
    pages/
      _app.tsx            # global CSS + next/font + PageTransition wrapper
      _document.tsx       # <html lang>, noindex meta
      index.tsx           # design-system PREVIEW placeholder (replaced in D1)
      styleguide.tsx      # 2nd placeholder (demonstrates route transition)
    styles/
      tokens.css          # CSS custom properties — verbatim from visual-direction.md
      globals.css         # reset + base element styling + reduced-motion backstop
    theme/
      motion.ts           # typed timing/easing constants for JS (framer-motion)
    components/
      Layout.tsx          # minimal shell (wordmark bar + container) — NOT the D1 nav/footer
      motion/
        PageTransition.tsx
        Reveal.tsx
      ui/
        Button.tsx + Button.module.css
        Container.tsx + Container.module.css
        Section.tsx + Section.module.css
        Eyebrow.tsx + Eyebrow.module.css
```

Root: add `dev`/`build` scripts + extend `typecheck`; `.gitignore` already covers `.next/`.

---

### Task 1: Scaffold the Next.js Pages-Router shell (it boots)

**Files:**
- Create: `apps/web/package.json`, `apps/web/next.config.mjs`, `apps/web/tsconfig.json`, `apps/web/next-env.d.ts`
- Create: `apps/web/src/pages/_app.tsx`, `apps/web/src/pages/_document.tsx`, `apps/web/src/pages/index.tsx`
- Modify: `package.json` (root — add `dev`/`build`, extend `typecheck`)

**Interfaces:**
- Produces: a buildable `@herrera/web` app; root `dev`/`build` scripts; `typecheck` covers the app.

- [ ] **Step 1: App manifest**

`apps/web/package.json`:

```json
{
  "name": "@herrera/web",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "framer-motion": "^11.15.0",
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0"
  }
}
```

> Versions are floors; install latest matching and adapt if an API differs (per the project norm — never downgrade to match the plan).

- [ ] **Step 2: Next + TS config**

`apps/web/next.config.mjs`:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@herrera/config"],
};

export default nextConfig;
```

`apps/web/tsconfig.json`:

```json
{
  "extends": "../../packages/config/tsconfig.nextjs.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "src/**/*.ts", "src/**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

`apps/web/next-env.d.ts` (committed so `tsc` runs without a prior `next build`):

```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/basic-features/typescript for more information.
```

- [ ] **Step 3: Minimal pages (proves boot)**

`apps/web/src/pages/_document.tsx`:

```tsx
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* ADR-003 demo posture — removed/conditional at production (F6). */}
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
```

`apps/web/src/pages/_app.tsx` (minimal for now; theme + motion added in Tasks 2–3):

```tsx
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
```

`apps/web/src/pages/index.tsx` (temporary):

```tsx
export default function Home() {
  return <main>Herrera — shell booting (F3).</main>;
}
```

- [ ] **Step 4: Root scripts**

In root `package.json` `scripts`, add `dev`/`build` and extend `typecheck`:

```json
    "dev": "pnpm --filter @herrera/web dev",
    "build": "pnpm --filter @herrera/web build",
    "typecheck": "tsc --noEmit -p tsconfig.json && pnpm --filter @herrera/web typecheck",
```

(Keep `db:*`, `lint`, `format*`, `test`. The root `tsconfig.json` stays packages-only; the app is typechecked via its own tsconfig through the filter.)

- [ ] **Step 5: Install and verify boot**

Run: `pnpm install`
Expected: links `@herrera/web`; installs next/react/react-dom/framer-motion.

Run: `pnpm --filter @herrera/web build`
Expected: Next builds successfully (compiles `/` and `/_app`, `/_document`). No errors.

Run: `pnpm typecheck && pnpm lint`
Expected: both exit 0.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(web): scaffold Next.js Pages-Router shell (boots, noindex, typecheck wired)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Tokens + global theme + self-hosted fonts

**Files:**
- Create: `apps/web/src/styles/tokens.css`, `apps/web/src/styles/globals.css`
- Modify: `apps/web/src/pages/_app.tsx` (import CSS, wire `next/font`)

**Interfaces:**
- Produces: global CSS variables (`--color-*`, `--radius-*`, `--shadow-*`, `--container-max`, `--gutter`, `--ease-standard`, `--dur-*`); `--font-serif`/`--font-sans` (from `next/font`); themed base elements.

- [ ] **Step 1: Tokens (verbatim from `docs/visual-direction.md` §7, minus font-family vars)**

`apps/web/src/styles/tokens.css`:

```css
/* Design tokens — synced verbatim from docs/visual-direction.md (Prototipo.dc.html). Do not invent/alter. */
/* Font families (--font-serif / --font-sans) are provided by next/font in _app.tsx. */
:root {
  /* paper & ink */
  --color-paper: #f3efe7;
  --color-surface: #ffffff;
  --color-sand-100: #efeadf;
  --color-sand-200: #e9e3d6;
  --color-border: #e4ded1;
  --color-border-strong: #d8d1c2;
  --color-ink: #1a1b19;
  --color-ink-soft: #3a3a36;
  /* forest */
  --color-forest: #15302c;
  --color-forest-900: #11201d;
  /* bronze accent */
  --color-bronze: #a9794a;
  --color-bronze-light: #c9a06a;
  --color-bronze-dark: #8f6238;
  /* sage / olive */
  --color-sage: #b7d2ce;
  --color-sage-alt: #9cc2be;
  --color-olive: #c4cfa8;
  /* stone text */
  --color-stone: #6f6857;
  --color-stone-soft: #9a9384;
  --color-stone-faint: #b5ae9e;

  /* radii */
  --radius-xs: 2px;
  --radius-sm: 3px;
  --radius-md: 6px;
  --radius-pill: 22px;
  --radius-full: 9999px;

  /* elevation (green-tinted) */
  --shadow-sm: 0 6px 20px rgba(11, 24, 22, 0.06);
  --shadow-card: 0 12px 34px rgba(11, 24, 22, 0.08);
  --shadow-card-hover: 0 18px 44px rgba(11, 24, 22, 0.1);
  --shadow-modal: 0 24px 60px rgba(11, 24, 22, 0.34);
  --shadow-bronze: 0 4px 14px rgba(169, 121, 74, 0.3);

  /* layout */
  --container-max: 1440px;
  --gutter: 56px;

  /* motion */
  --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
  --dur-fast: 0.2s;
  --dur-base: 0.3s;
  --dur-reveal: 0.5s;
}
```

- [ ] **Step 2: Global base styles + reduced-motion backstop**

`apps/web/src/styles/globals.css`:

```css
@import "./tokens.css";

*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
}

body {
  background: var(--color-paper);
  color: var(--color-ink);
  font-family: var(--font-sans), system-ui, sans-serif;
  font-size: 15px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

h1,
h2,
h3,
h4 {
  font-family: var(--font-serif), Georgia, serif;
  font-weight: 400;
  line-height: 1.1;
  margin: 0;
}

a {
  color: var(--color-bronze);
  text-decoration: none;
}

::selection {
  background: var(--color-bronze);
  color: #fff;
}

/* Visible keyboard focus (quality floor, ADR-016). */
:focus-visible {
  outline: 2px solid var(--color-bronze);
  outline-offset: 2px;
}

/* Reduced-motion backstop — disables all motion regardless of JS (ADR-016). */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 3: Wire global CSS + fonts in `_app.tsx`**

`apps/web/src/pages/_app.tsx`:

```tsx
import type { AppProps } from "next/app";
import { Spectral, Hanken_Grotesk } from "next/font/google";
import "@/styles/globals.css";

const serif = Spectral({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={`${serif.variable} ${sans.variable}`}>
      <Component {...pageProps} />
    </div>
  );
}
```

- [ ] **Step 4: Verify**

Run: `pnpm --filter @herrera/web build && pnpm typecheck && pnpm lint`
Expected: all green (fonts fetched at build by `next/font`; global CSS compiles).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(web): add design tokens (verbatim) + global theme + self-hosted Spectral/Hanken fonts

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Motion utilities (reduced-motion-aware)

**Files:**
- Create: `apps/web/src/theme/motion.ts`, `apps/web/src/components/motion/PageTransition.tsx`, `apps/web/src/components/motion/Reveal.tsx`
- Modify: `apps/web/src/pages/_app.tsx` (wrap pages in `PageTransition`)

**Interfaces:**
- Produces: `DURATION`, `EASE`, `REVEAL_OFFSET` (motion.ts); `<PageTransition>` (route fade/slide via `AnimatePresence`); `<Reveal>` (on-scroll fade-up via `useInView`). All collapse to static when `useReducedMotion()` is true.

- [ ] **Step 1: Timing constants (mirror the tokens)**

`apps/web/src/theme/motion.ts`:

```ts
// Mirrors the motion tokens in docs/visual-direction.md / tokens.css, for framer-motion (JS).
export const DURATION = { fast: 0.2, base: 0.3, reveal: 0.5 } as const;

// cubic-bezier(.4, 0, .2, 1) — matches --ease-standard.
export const EASE = [0.4, 0, 0.2, 1] as const;

// Subtle on-scroll translate distance (px).
export const REVEAL_OFFSET = 14;
```

- [ ] **Step 2: PageTransition (route transitions)**

`apps/web/src/components/motion/PageTransition.tsx`:

```tsx
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/router";
import type { ReactNode } from "react";
import { DURATION, EASE } from "@/theme/motion";

export function PageTransition({ children }: { children: ReactNode }) {
  const router = useRouter();
  const reduce = useReducedMotion();

  if (reduce) return <>{children}</>;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={router.asPath}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: DURATION.base, ease: EASE }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

- [ ] **Step 3: Reveal (on-scroll section reveal)**

`apps/web/src/components/motion/Reveal.tsx`:

```tsx
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { DURATION, EASE, REVEAL_OFFSET } from "@/theme/motion";

export function Reveal({
  children,
  delay = 0,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  as?: "div" | "section";
}) {
  const reduce = useReducedMotion();
  const MotionTag = as === "section" ? motion.section : motion.div;

  if (reduce) {
    const Tag = as;
    return <Tag>{children}</Tag>;
  }

  return (
    <MotionTag
      initial={{ opacity: 0, y: REVEAL_OFFSET }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: DURATION.reveal, ease: EASE, delay }}
    >
      {children}
    </MotionTag>
  );
}
```

- [ ] **Step 4: Wrap pages in PageTransition**

Update `apps/web/src/pages/_app.tsx` to wrap `<Component>`:

```tsx
import type { AppProps } from "next/app";
import { Spectral, Hanken_Grotesk } from "next/font/google";
import { PageTransition } from "@/components/motion/PageTransition";
import "@/styles/globals.css";

const serif = Spectral({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={`${serif.variable} ${sans.variable}`}>
      <PageTransition>
        <Component {...pageProps} />
      </PageTransition>
    </div>
  );
}
```

- [ ] **Step 5: Verify**

Run: `pnpm --filter @herrera/web build && pnpm typecheck && pnpm lint`
Expected: all green.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(web): add reduced-motion-aware motion utilities (PageTransition, Reveal)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Base primitives + design-preview placeholder

**Files:**
- Create: `apps/web/src/components/ui/Button.tsx` + `Button.module.css`
- Create: `apps/web/src/components/ui/Container.tsx` + `Container.module.css`
- Create: `apps/web/src/components/ui/Section.tsx` + `Section.module.css`
- Create: `apps/web/src/components/ui/Eyebrow.tsx` + `Eyebrow.module.css`
- Create: `apps/web/src/components/Layout.tsx`
- Rewrite: `apps/web/src/pages/index.tsx` (design-system preview)
- Create: `apps/web/src/pages/styleguide.tsx` (2nd placeholder — demonstrates the route transition)

**Interfaces:**
- Consumes: tokens (Task 2), `Reveal` (Task 3).
- Produces: `<Button variant size>`, `<Container>`, `<Section>`, `<Eyebrow>`, `<Layout>` — the foundational primitives D-tasks reuse.

- [ ] **Step 1: Button**

`apps/web/src/components/ui/Button.tsx`:

```tsx
import type { ButtonHTMLAttributes } from "react";
import styles from "./Button.module.css";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      className={`${styles.btn} ${styles[variant]} ${styles[size]} ${className}`}
      {...props}
    />
  );
}
```

`apps/web/src/components/ui/Button.module.css`:

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: var(--font-sans), system-ui, sans-serif;
  font-weight: 600;
  letter-spacing: 0.04em;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition:
    background-color var(--dur-base) var(--ease-standard),
    box-shadow var(--dur-base) var(--ease-standard),
    color var(--dur-base) var(--ease-standard);
}

.md {
  font-size: 14px;
  padding: 11px 20px;
}
.lg {
  font-size: 15px;
  padding: 14px 26px;
}

.primary {
  background: var(--color-bronze);
  color: #fff;
  box-shadow: var(--shadow-bronze);
}
.primary:hover {
  background: var(--color-bronze-dark);
}

.secondary {
  background: var(--color-forest);
  color: #fff;
}
.secondary:hover {
  background: var(--color-forest-900);
}

.ghost {
  background: transparent;
  color: var(--color-ink);
  border-color: var(--color-border-strong);
}
.ghost:hover {
  background: var(--color-sand-100);
}
```

- [ ] **Step 2: Container, Section, Eyebrow**

`apps/web/src/components/ui/Container.tsx`:

```tsx
import type { ReactNode } from "react";
import styles from "./Container.module.css";

export function Container({ children }: { children: ReactNode }) {
  return <div className={styles.container}>{children}</div>;
}
```

`apps/web/src/components/ui/Container.module.css`:

```css
.container {
  width: 100%;
  max-width: var(--container-max);
  margin: 0 auto;
  padding-inline: var(--gutter);
}

@media (max-width: 768px) {
  .container {
    padding-inline: 20px;
  }
}
```

`apps/web/src/components/ui/Section.tsx`:

```tsx
import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/Reveal";
import styles from "./Section.module.css";

export function Section({ children, reveal = true }: { children: ReactNode; reveal?: boolean }) {
  const inner = <div className={styles.section}>{children}</div>;
  return reveal ? <Reveal as="section">{inner}</Reveal> : <section>{inner}</section>;
}
```

`apps/web/src/components/ui/Section.module.css`:

```css
.section {
  padding-block: 64px;
}
```

`apps/web/src/components/ui/Eyebrow.tsx`:

```tsx
import type { ReactNode } from "react";
import styles from "./Eyebrow.module.css";

export function Eyebrow({ children }: { children: ReactNode }) {
  return <span className={styles.eyebrow}>{children}</span>;
}
```

`apps/web/src/components/ui/Eyebrow.module.css`:

```css
.eyebrow {
  display: inline-block;
  font-family: var(--font-sans), system-ui, sans-serif;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--color-stone);
}
```

- [ ] **Step 3: Minimal Layout shell (wordmark bar — NOT the D1 nav/footer)**

`apps/web/src/components/Layout.tsx`:

```tsx
import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <header style={{ padding: "18px 0", borderBottom: "1px solid var(--color-border)" }}>
        <Container>
          <span
            style={{
              fontFamily: "var(--font-serif), Georgia, serif",
              fontSize: 22,
              fontWeight: 500,
              letterSpacing: "0.16em",
            }}
          >
            HERRERA
          </span>
        </Container>
      </header>
      <main>{children}</main>
    </>
  );
}
```

- [ ] **Step 4: Design-system preview page (replaces the placeholder)**

Rewrite `apps/web/src/pages/index.tsx` to demonstrate tokens + primitives + a reveal (this is a **placeholder**; D1 builds the real home):

```tsx
import Link from "next/link";
import Head from "next/head";
import { Layout } from "@/components/Layout";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";

const SWATCHES = [
  "--color-paper",
  "--color-forest",
  "--color-bronze",
  "--color-sage",
  "--color-stone",
  "--color-ink",
];

export default function Home() {
  return (
    <Layout>
      <Head>
        <title>Herrera — design system preview</title>
      </Head>
      <Container>
        <Section reveal={false}>
          <Eyebrow>Florida · Licensed Realtor®</Eyebrow>
          <h1 style={{ fontSize: 68, lineHeight: 1.04, margin: "12px 0 0" }}>Find your place</h1>
          <p style={{ color: "var(--color-stone)", maxWidth: 520 }}>
            F3 preview — design tokens, base theme, and motion. The real home is built in D1.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <Button variant="primary" size="lg">
              Primary
            </Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
        </Section>

        <Section>
          <Eyebrow>Palette</Eyebrow>
          <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
            {SWATCHES.map((v) => (
              <div key={v} style={{ textAlign: "center", fontSize: 12 }}>
                <div
                  style={{
                    width: 88,
                    height: 64,
                    borderRadius: "var(--radius-md)",
                    background: `var(${v})`,
                    border: "1px solid var(--color-border)",
                    boxShadow: "var(--shadow-card)",
                  }}
                />
                <code>{v.replace("--color-", "")}</code>
              </div>
            ))}
          </div>
        </Section>

        <Section>
          <Eyebrow>Motion</Eyebrow>
          <p style={{ color: "var(--color-stone)" }}>
            This section faded up on scroll (disabled under reduced-motion).{" "}
            <Link href="/styleguide">View route transition →</Link>
          </p>
        </Section>
      </Container>
    </Layout>
  );
}
```

- [ ] **Step 5: Second placeholder page (demonstrates the route transition)**

`apps/web/src/pages/styleguide.tsx`:

```tsx
import Link from "next/link";
import Head from "next/head";
import { Layout } from "@/components/Layout";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";

export default function Styleguide() {
  return (
    <Layout>
      <Head>
        <title>Herrera — styleguide</title>
      </Head>
      <Container>
        <Section reveal={false}>
          <Eyebrow>Styleguide</Eyebrow>
          <h2 style={{ fontSize: 42, margin: "12px 0 0" }}>Second page</h2>
          <p style={{ color: "var(--color-stone)" }}>
            Navigating here animated the page transition. <Link href="/">← Back</Link>
          </p>
        </Section>
      </Container>
    </Layout>
  );
}
```

- [ ] **Step 6: Final full verification**

Run: `pnpm format` then `pnpm format:check && pnpm lint && pnpm typecheck && pnpm --filter @herrera/web build`
Expected: all green; Next builds `/` and `/styleguide`.

Run (manual review): `pnpm dev` → open http://localhost:3000 → confirm: cream paper bg, Spectral headings, bronze buttons, palette swatches, on-scroll reveal, and the fade transition to `/styleguide`. Toggle OS "reduce motion" → confirm reveals/transition are disabled.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(web): add base primitives (Button/Container/Section/Eyebrow) + design preview pages

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review

**1. Spec coverage (your F3 list):**
- Tokens pulled **verbatim** from `docs/visual-direction.md` into a machine-readable file the app consumes → Task 2 `tokens.css` (+ `motion.ts`). ✅ (no invented/altered values)
- Base layout/theme + motion utilities (route transitions + on-scroll reveals, ~0.3s, **always** reduced-motion-aware) → Tasks 2–4 (`globals.css` backstop + `useReducedMotion` in both motion components). ✅
- Tokens + base theme + motion only, **no real pages/features** → only placeholder preview pages; full header/nav/footer + real pages deferred to D-tasks. ✅
- `apps/web` scaffolded minimally as a Next.js app to host the theme → Task 1 (bare shell). ✅

**2. Placeholder scan:** every file step has complete code; every command has an expected result. The two preview pages are intentional, labeled placeholders (the only "pages" in F3). ✅

**3. Type consistency:** `@/*` path alias defined in `apps/web/tsconfig.json` and used by all imports; `DURATION`/`EASE`/`REVEAL_OFFSET` defined in `motion.ts` and consumed by `PageTransition`/`Reveal`; `Reveal as="section"` matches its `as` union; `Button` props extend `ButtonHTMLAttributes`. ✅

## Risks / notes for the executor
- **React 19 + Next 15 + framer-motion:** ensure the installed framer-motion supports React 19 (v11.11+ does; the successor package `motion` is an alternative). If `useReducedMotion`/`AnimatePresence` import paths changed, adapt to the installed version (don't downgrade).
- **`next/font` owns `--font-serif`/`--font-sans`:** `tokens.css` deliberately omits font-family vars; `globals.css` references them with a fallback. This is a mechanism change (self-hosted) — **not** a design change.
- **Global CSS rule:** Next only allows global CSS import in `_app`. `tokens.css` is imported via `@import` inside `globals.css` (allowed). Component styles use CSS Modules.
- **`tsc` hermeticity:** `next-env.d.ts` is committed so `pnpm typecheck` works without a prior build; Next may rewrite it on `dev`/`build` (same content).
- **Lint:** React/Next-specific ESLint plugins are intentionally **deferred to D1** (when real components land); F3 relies on typescript-eslint + the Next build's own checks. Hooks are written correctly by hand.
- **No React import** needed in `.tsx` (Next's automatic JSX runtime) — avoids unused-import lint errors.
- **Inline styles** appear in the preview/Layout only (placeholder demo); D-tasks move real styling into CSS Modules.
