# apps/web

Next.js (**Pages Router**) app — the public site + `/admin`. Scaffolded in **Phase 1 (task F1)**.

- Rendering: ISR (`getStaticProps` + `revalidate`) for SEO pages; `getServerSideProps` where
  needed; client/gated for `/search`, favorites, and admin. See [ADR-001](../../docs/adr/ADR-001-framework-and-rendering.md).
- Builds against the committed design tokens — never a default shadcn/Tailwind theme. See
  [ADR-016](../../docs/adr/ADR-016-design-system-and-visual-direction.md) and `docs/visual-direction.md`.
- Routes: see [`docs/pages.md`](../../docs/pages.md) (ADR-019).

_No application code yet — Phase 0 is planning only._
