# F1 — Monorepo & Tooling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the pnpm-workspace monorepo's shared tooling — TypeScript (strict), ESLint + Prettier, and a Zod-validated environment schema — with green `lint`/`format`/`typecheck`/`test` gates, and **no application code**.

**Architecture:** A single shared **`@herrera/config`** workspace package owns the canonical TypeScript presets, the flat ESLint config, the Prettier config, and the runtime env schema. The repo root consumes them through thin re-export config files and exposes the quality-gate scripts. Other workspaces (`apps/web`, `apps/worker`, `packages/db`) stay as README stubs until their own tasks — they are *not* turned into packages here.

**Tech Stack:** pnpm workspaces · TypeScript 5 (strict) · ESLint 9 (flat config) + typescript-eslint 8 · Prettier 3 · Zod 3 · Vitest 2 · Node ≥ 20.

## Global Constraints

- **Stack (ADR-001/002/003):** TypeScript `strict: true`; pnpm workspaces; PostgreSQL/Drizzle/Zod are downstream — only **Zod** is introduced in F1 (for env).
- **Scope:** **No app features.** Do not install Next.js, Drizzle, Auth.js, etc. Do not create packages for `apps/*` or `packages/db` (they remain README stubs).
- **Package scope/name:** workspace packages use the `@herrera/*` scope; root package is `herrera`.
- **Node:** `engines.node >= 20`; `.nvmrc` pins `22` (already present).
- **Package manager:** `pnpm@10.33.0` (already pinned in root `package.json`).
- **Module style:** root config files are explicit `.mjs` (root `package.json` has **no** `"type"` field, to avoid surprising the future Next app); `@herrera/config` is `"type": "module"`.
- **Quality gate:** `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test` must all be green before the final commit.
- **No secrets committed:** `.env*` is gitignored (already); only `.env.example` is committed.

---

### Task 1: `@herrera/config` package + root tooling wiring (no env schema yet)

Creates the shared config package (TS presets, ESLint, Prettier) and wires the root to consume it, then installs dependencies and proves the `lint` + `format` gates work over the (currently TS-less) repo.

**Files:**
- Create: `packages/config/package.json`
- Create: `packages/config/tsconfig.base.json`
- Create: `packages/config/tsconfig.nextjs.json`
- Create: `packages/config/tsconfig.node.json`
- Create: `packages/config/eslint/base.mjs`
- Create: `packages/config/prettier/base.mjs`
- Modify: `package.json` (root — devDeps + scripts)
- Create: `eslint.config.mjs` (root)
- Create: `prettier.config.mjs` (root)
- Create: `tsconfig.json` (root)
- Create: `.prettierignore` (root)

**Interfaces:**
- Produces (consumed by Task 2, Task 3, and future workspaces):
  - Package `@herrera/config` with subpath exports: `./eslint` → `eslint/base.mjs`, `./prettier` → `prettier/base.mjs`, `./tsconfig/base.json`, `./tsconfig/nextjs.json`, `./tsconfig/node.json`, `./env` → `src/env.ts` (file created in Task 2).
  - Root scripts: `lint`, `lint:fix`, `format`, `format:check`, `typecheck`, `test`.

- [ ] **Step 1: Create the shared config package manifest**

`packages/config/package.json`:

```json
{
  "name": "@herrera/config",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    "./env": "./src/env.ts",
    "./eslint": "./eslint/base.mjs",
    "./prettier": "./prettier/base.mjs",
    "./tsconfig/base.json": "./tsconfig.base.json",
    "./tsconfig/nextjs.json": "./tsconfig.nextjs.json",
    "./tsconfig/node.json": "./tsconfig.node.json"
  },
  "dependencies": {
    "zod": "^3.24.0"
  }
}
```

- [ ] **Step 2: Create the TypeScript presets**

`packages/config/tsconfig.base.json` (strict base, bundler resolution — used directly by the root and by future app/lib configs):

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "moduleDetection": "force",
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "noEmit": true
  }
}
```

`packages/config/tsconfig.nextjs.json` (for `apps/web`, used in a later task — provided now as the shared preset):

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "jsx": "preserve",
    "allowJs": true,
    "incremental": true,
    "plugins": [{ "name": "next" }]
  }
}
```

`packages/config/tsconfig.node.json` (for `apps/worker` / Node scripts — provided now):

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "lib": ["ES2022"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "verbatimModuleSyntax": false
  }
}
```

- [ ] **Step 3: Create the shared flat ESLint config**

`packages/config/eslint/base.mjs`:

```js
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

/** Shared flat ESLint config for all Herrera workspaces (TS base, Prettier-compatible). */
export default tseslint.config(
  { ignores: ["**/dist/**", "**/.next/**", "**/node_modules/**", "**/*.config.*"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
);
```

- [ ] **Step 4: Create the shared Prettier config**

`packages/config/prettier/base.mjs`:

```js
/** Shared Prettier config for Herrera. */
export default {
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  printWidth: 100,
  tabWidth: 2,
};
```

- [ ] **Step 5: Update the root manifest with scripts + dev tooling**

Replace `package.json` (root) with:

```json
{
  "name": "herrera",
  "private": true,
  "description": "Real estate lead-gen platform for Nilyan Herrera (FL realtor). See CLAUDE.md.",
  "packageManager": "pnpm@10.33.0",
  "engines": {
    "node": ">=20"
  },
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "tsc --noEmit -p tsconfig.json",
    "test": "vitest run"
  },
  "devDependencies": {
    "@eslint/js": "^9.17.0",
    "@herrera/config": "workspace:*",
    "@types/node": "^22.10.0",
    "eslint": "^9.17.0",
    "eslint-config-prettier": "^9.1.0",
    "prettier": "^3.4.0",
    "typescript": "^5.7.0",
    "typescript-eslint": "^8.18.0",
    "vitest": "^2.1.0"
  }
}
```

> Versions are floors; `pnpm` resolves the latest matching at install. If a newer major is the only thing available, install latest stable and note it.

- [ ] **Step 6: Create the root config files that re-export the shared configs**

`eslint.config.mjs` (root):

```js
import base from "@herrera/config/eslint";

export default base;
```

`prettier.config.mjs` (root):

```js
export { default } from "@herrera/config/prettier";
```

`tsconfig.json` (root — extends the base preset relatively and includes only real TS sources):

```json
{
  "extends": "./packages/config/tsconfig.base.json",
  "include": ["packages/config/src/**/*"]
}
```

`.prettierignore` (root):

```
node_modules
pnpm-lock.yaml
.next
dist
build
coverage
.vercel
```

- [ ] **Step 7: Install dependencies**

Run: `pnpm install`
Expected: resolves and links `@herrera/config` as a workspace dependency; creates `pnpm-lock.yaml`; no errors.

- [ ] **Step 8: Verify the format gate, then normalize formatting**

Run: `pnpm format` (writes Prettier formatting across the repo)
Then run: `pnpm format:check`
Expected: `All matched files use Prettier code style!`

- [ ] **Step 9: Verify the lint gate**

Run: `pnpm lint`
Expected: exits 0 with no errors. (At this point there is no first-party `.ts` to lint yet; ESLint should find no problems.)

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "build(config): add @herrera/config shared tooling (tsconfig, eslint, prettier) + root scripts

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Zod-validated environment schema (TDD)

Adds the runtime env schema to `@herrera/config` with server/client separation, parsed and validated with Zod, fully unit-tested. This is the only runtime code in F1.

**Files:**
- Create: `packages/config/src/env.ts`
- Test: `packages/config/src/env.test.ts`

**Interfaces:**
- Consumes: `zod` (dependency of `@herrera/config` from Task 1).
- Produces (consumed later by `apps/web`, `apps/worker`, `packages/db`):
  - `serverEnvSchema`, `clientEnvSchema` (Zod schemas)
  - `parseServerEnv(runtimeEnv?: NodeJS.ProcessEnv): ServerEnv`
  - `parseClientEnv(runtimeEnv: Record<string, string | undefined>): ClientEnv`
  - `EnvValidationError` (Error subclass)
  - types `ServerEnv`, `ClientEnv`
  - Importable as `@herrera/config/env`.

- [ ] **Step 1: Write the failing test**

`packages/config/src/env.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { EnvValidationError, parseClientEnv, parseServerEnv } from "./env";

const validServer = {
  NODE_ENV: "test",
  DATABASE_URL: "postgres://user:pass@localhost:5432/herrera",
  AUTH_SECRET: "a-very-long-test-secret-value",
} as NodeJS.ProcessEnv;

describe("parseServerEnv", () => {
  it("parses a valid server environment", () => {
    const env = parseServerEnv(validServer);
    expect(env.DATABASE_URL).toBe("postgres://user:pass@localhost:5432/herrera");
    expect(env.NODE_ENV).toBe("test");
  });

  it("throws EnvValidationError when DATABASE_URL is not a URL", () => {
    expect(() => parseServerEnv({ ...validServer, DATABASE_URL: "not-a-url" })).toThrow(
      EnvValidationError,
    );
  });

  it("throws when AUTH_SECRET is too short", () => {
    expect(() => parseServerEnv({ ...validServer, AUTH_SECRET: "short" })).toThrow(
      EnvValidationError,
    );
  });
});

describe("parseClientEnv", () => {
  it("defaults NEXT_PUBLIC_DEMO_MODE to true and coerces to boolean", () => {
    const env = parseClientEnv({ NEXT_PUBLIC_SITE_URL: "https://demo.example.com" });
    expect(env.NEXT_PUBLIC_DEMO_MODE).toBe(true);
  });

  it("throws when NEXT_PUBLIC_SITE_URL is missing", () => {
    expect(() => parseClientEnv({})).toThrow(EnvValidationError);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test`
Expected: FAIL — cannot resolve `./env` (module not yet created).

- [ ] **Step 3: Write the minimal implementation**

`packages/config/src/env.ts`:

```ts
import { z } from "zod";

/**
 * Server-only environment variables. Never exposed to the client bundle.
 * Keys are added as features land (DB in F2, auth in F4, Resend in D8, Twilio seam, etc.).
 * Seam keys (notifications/Twilio) are optional until the feature is activated.
 */
export const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  // F2 — database (ADR-002/003).
  DATABASE_URL: z.string().url(),
  // F4 — admin auth (ADR-010).
  AUTH_SECRET: z.string().min(16),
  AUTH_URL: z.string().url().optional(),
  // D8 — notifications (ADR-009). Seam: optional until activated.
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  NILYAN_ALERT_EMAIL: z.string().email().optional(),
  // Twilio seam (ADR-009) — inactive in v1.
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
});

/** Client-exposed variables. MUST be prefixed NEXT_PUBLIC_ so Next.js inlines them. */
export const clientEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  // ADR-003 demo posture — defaults on, coerced to a boolean.
  NEXT_PUBLIC_DEMO_MODE: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
  // ADR-012 — MapLibre style URL (free default); Mapbox token is the optional alternative.
  NEXT_PUBLIC_MAP_STYLE_URL: z.string().url().optional(),
  NEXT_PUBLIC_MAPBOX_TOKEN: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;

export class EnvValidationError extends Error {
  constructor(issues: string) {
    super(`Invalid environment variables:\n${issues}`);
    this.name = "EnvValidationError";
  }
}

function parse<T extends z.ZodTypeAny>(schema: T, runtimeEnv: unknown): z.infer<T> {
  const result = schema.safeParse(runtimeEnv);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new EnvValidationError(issues);
  }
  return result.data;
}

export function parseServerEnv(runtimeEnv: NodeJS.ProcessEnv = process.env): ServerEnv {
  return parse(serverEnvSchema, runtimeEnv);
}

export function parseClientEnv(runtimeEnv: Record<string, string | undefined>): ClientEnv {
  return parse(clientEnvSchema, runtimeEnv);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test`
Expected: PASS — 5 tests across 2 suites.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(config): add Zod-validated server/client env schema with tests

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Typecheck gate, `.env.example`, and docs — full green-gate verification

Closes F1: makes `typecheck` cover the new TS, documents the env contract, refreshes the package README, and confirms all four gates pass together.

**Files:**
- Create: `.env.example` (root)
- Modify: `packages/config/README.md`

**Interfaces:**
- Consumes: everything from Tasks 1–2.
- Produces: a committed `.env.example` documenting every key in `serverEnvSchema`/`clientEnvSchema`.

- [ ] **Step 1: Create `.env.example`**

`.env.example`:

```bash
# ── Server (never sent to the browser) ──────────────────────────────────────
NODE_ENV=development
# F2 — Neon Postgres + PostGIS (ADR-002/003)
DATABASE_URL=postgres://user:password@localhost:5432/herrera
# F4 — admin auth (ADR-010); generate with: openssl rand -base64 32
AUTH_SECRET=replace-with-a-long-random-secret
AUTH_URL=http://localhost:3000
# D8 — notifications (ADR-009); optional until activated
RESEND_API_KEY=
EMAIL_FROM=
NILYAN_ALERT_EMAIL=
# Twilio seam (ADR-009) — inactive in v1
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=

# ── Client (NEXT_PUBLIC_*, inlined into the browser bundle) ──────────────────
NEXT_PUBLIC_SITE_URL=http://localhost:3000
# ADR-003 demo posture — keep "true" on preview deploys
NEXT_PUBLIC_DEMO_MODE=true
# ADR-012 — MapLibre style URL (free); leave Mapbox token empty unless using Mapbox
NEXT_PUBLIC_MAP_STYLE_URL=
NEXT_PUBLIC_MAPBOX_TOKEN=
```

- [ ] **Step 2: Run the typecheck gate**

Run: `pnpm typecheck`
Expected: exits 0 — `tsc` checks `packages/config/src/**/*` (`env.ts` + `env.test.ts`) with no errors.

- [ ] **Step 3: Refresh the package README**

Replace `packages/config/README.md` body to reflect F1 completion (shared `tsconfig` presets, ESLint, Prettier, and the `@herrera/config/env` schema), keeping the ADR links. (Note F2 will add `packages/db`; the env keys it needs are already in the schema.)

- [ ] **Step 4: Run ALL gates together**

Run: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test`
Expected: all four pass in sequence; final output shows Vitest green.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "docs(config): add .env.example + F1 README; verify all quality gates green

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review

**1. Spec coverage** (F1 = "pnpm workspaces, TypeScript strict, ESLint + Prettier, Zod env in `packages/config`, no app features"):
- pnpm workspaces → `pnpm-workspace.yaml` exists; Task 1 adds the first real workspace package `@herrera/config` and installs. ✅
- TypeScript strict → `tsconfig.base.json` with `strict: true` (+ `noUncheckedIndexedAccess` etc.); root `typecheck`. ✅
- ESLint + Prettier → shared flat ESLint + Prettier configs, root re-exports, `lint`/`format` gates. ✅
- Zod env in `packages/config` → Task 2 (`src/env.ts` + tests), `.env.example` in Task 3. ✅
- No app features → no Next/Drizzle/Auth installed; `apps/*` and `packages/db` untouched. ✅

**2. Placeholder scan:** no TBD/TODO; every file step contains complete content; every command has an expected result. ✅

**3. Type consistency:** test imports `parseServerEnv`, `parseClientEnv`, `EnvValidationError` from `./env`; `env.ts` exports exactly those names plus `ServerEnv`/`ClientEnv`. Exports map `@herrera/config/env` → `src/env.ts`. ✅

## Risks / notes for the executor
- **Extensionless import (`./env`):** relies on `moduleResolution: Bundler` (TS) + Vite (Vitest), both of which resolve `.ts` — do not add a `.js` extension.
- **`eslint .` is syntactic only** (typescript-eslint *recommended*, not *recommendedTypeChecked*) → no `parserOptions.project` needed, faster, no type-aware config.
- **`extends` path:** root `tsconfig.json` uses a **relative** path to the base preset (bulletproof). Future workspaces may use the package export `@herrera/config/tsconfig/nextjs.json`.
- If `pnpm` pulls a newer major of any dev tool than the floors above, install latest stable and confirm the gates still pass; adjust the flat-config import shape only if typescript-eslint's API changed.
