# ADR-016 — Design system & visual direction

- **Status:** Accepted (Phase 0)
- **Date:** 2026-06-29
- **Deciders:** Pablo (lead engineer)

## Context

The UI must look **premium and distinctive**, not a generic shadcn/Tailwind theme. The visual
source of truth already exists in **Claude Design**: project *"Portal inmobiliario premium
Florida"*, file **`Prototipo.dc.html`**. We must integrate that design faithfully, but the
runtime/build must not depend on the MCP.

## Decision

- **Visual source of truth: `Prototipo.dc.html`**, pulled from the Claude Design MCP (server
  `https://api.anthropic.com/v1/design/mcp`; auth via `/design-login`; the **DesignSync** tool /
  `/design-sync` flow). Sibling files `Home/Resultados/Ficha.dc.html` are per-screen exports of the
  same system.
- **Sync into a committed snapshot, build against it.** Tokens live in **`docs/visual-direction.md`**
  (done in Phase 0) and, in Phase 1 (task **F3**), a **machine-readable tokens file the app
  consumes** (CSS variables / theme). **No MCP dependency at runtime or build.** Re-sync + update
  the snapshot in the same commit when the design changes.
- **The look** (see `docs/visual-direction.md`): Spectral (serif display) + Hanken Grotesk (sans
  UI); a warm palette of **cream paper `#F3EFE7`, forest `#15302C`, bronze accent `#A9794A`, sage,
  stone**; **green-tinted soft shadows**; crisp **2–3px** radii; uppercase tracked eyebrows vs
  serif sentence-case headlines.
- **Interaction stays conventional/intuitive:** the synced list+map patterns (ADR-012),
  mobile-first list/map toggle, consistent aspect-ratio photography. Never invent unconventional
  navigation.
- **Motion — subtle, elegant, restrained** (and **always honoring `prefers-reduced-motion`**):
  smooth route/page transitions and on-scroll section reveals (gentle ease/fade-up), ~`.3s` for
  interactions, matching the prototype's calm easing. Overdone motion reads as AI-generated — keep
  it consistent and quiet. Shared motion utilities are set up in F3.
- **Quality floor on every screen:** responsive, visible keyboard focus, reduced-motion. If a
  screen drifts from the system or looks templated, fix it.

## Consequences

- A stable, versioned design system the app builds against, decoupled from MCP availability.
- A clear anti-templated bar; reviews can check screens against `docs/visual-direction.md`.
- Re-syncing is a deliberate, reviewable step (snapshot diff in git), not a silent runtime pull.
- Motion utilities are centralized so transitions/reveals are consistent and reduced-motion-safe by
  default.

## Alternatives considered

- **Depend on the MCP at build time** — rejected; fragile builds, non-reproducible. Snapshot
  instead.
- **A generic component-library theme** — rejected by the brief; would look templated.
