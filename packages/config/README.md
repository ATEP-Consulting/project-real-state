# packages/config

Shared configuration consumed by every Herrera workspace. **Implemented in Phase 1 (task F1).**

## Provides

- **TypeScript presets** — `tsconfig.base.json` (strict + `noUncheckedIndexedAccess` etc.),
  `tsconfig.nextjs.json`, `tsconfig.node.json`. Extend via `@herrera/config/tsconfig/<preset>.json`.
- **ESLint** — flat config at `@herrera/config/eslint` (typescript-eslint, Prettier-compatible).
- **Prettier** — shared config at `@herrera/config/prettier`.
- **Env schema** — `@herrera/config/env`: Zod-validated `serverEnvSchema` / `clientEnvSchema` with
  `parseServerEnv()` / `parseClientEnv()` (throw `EnvValidationError` on invalid input). Keys are
  documented in the root [`.env.example`](../../.env.example).

This is an **internal package**: it exports raw `.ts`/config (no build step); the future Next app
consumes `@herrera/config/env` via `transpilePackages`.

See [ADR-001](../../docs/adr/ADR-001-framework-and-rendering.md) (TS strict) and
[ADR-003](../../docs/adr/ADR-003-infra-and-deploy.md) (env / deploy). Env keys for later phases
(DB in F2, auth in F4, notifications in D8, MapLibre in ADR-012) are already modeled — feature/seam
keys are `optional` until activated.
