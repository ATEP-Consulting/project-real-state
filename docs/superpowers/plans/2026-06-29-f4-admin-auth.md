# F4 — Admin Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up admin-only authentication (Auth.js) for `/admin/*` pages **and** admin API routes, backed by a single env-defined admin user (Nilyan), with a minimal themed `/admin/login` and one protected placeholder. No public accounts; favorites stay login-less. No CRM screens (those are D10/D11).

**Architecture:** NextAuth (Auth.js) v4 with a **Credentials** provider and a **JWT** session (no DB adapter — keeps F4 DB-free until F5). The single admin is defined entirely by env: `ADMIN_EMAIL` + `ADMIN_PASSWORD_HASH` (bcrypt), validated in the Zod env schema. A pure `verifyAdminCredentials()` is unit-tested; `authorize()` wires env → it. Protection is explicit: a `requireAdmin()` page guard (in `getServerSideProps`) and a `withAdminApi()` API wrapper (401 if unauthenticated). `next build` stays hermetic — no env is read at module load in any built route.

**Tech Stack:** next-auth v4 (Credentials + JWT) · bcryptjs (pure-JS hashing) · Zod env (F1) · Next 15 Pages Router.

## Global Constraints

- **ADR-010:** Auth.js **admin-only**. No public accounts; nothing on the public site requires login; favorites stay login-less. Passwordless client accounts are v2.
- **Both guards (your ask):** page guard (`/admin/*` via `getServerSideProps`) **and** API guard (admin API routes return 401 unauthenticated).
- **Single admin from env (ADR-010 + your ask):** `ADMIN_EMAIL` + `ADMIN_PASSWORD_HASH` + `AUTH_SECRET` live in the **Zod env schema** (F1). No users table (DB stays untouched until F5).
- **Scope tight:** auth foundation + minimal `/admin/login` + one protected placeholder + one sample protected API. **No CRM** (D10/D11).
- **Build hermetic:** do **not** call `parseServerEnv()` at module top-level in any built route (API route / imported module); read/validate env at **request time**. `secret` is read via `process.env.AUTH_SECRET` directly (undefined at build is fine).
- **Quality gate:** `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` green; plus a **runtime smoke** (guards return 401 / redirect / 200 without interactive login).

## Decisions in this plan (confirm at review)

1. **Auth library = next-auth v4** (Credentials + JWT). Rationale: v4 is the proven, well-documented **Pages Router** path (`pages/api/auth/[...nextauth].ts`, `getServerSession`, `signIn`/`signOut`). *Alternative: Auth.js v5 (`next-auth@beta`) — current major, supports React 19/Next 15, but its Pages-Router integration is less documented. If v4 hits a React 19 / Next 15.5 incompatibility at install/build, fall back to v5 (adapt the route + `getServerSession`→`auth()`).* 
2. **JWT sessions, no DB adapter** — single admin, keeps F4 DB-free.
3. **Env-based admin** (not a DB users table) — matches "credentials from the Zod env schema" and avoids a DB dependency for login.
4. **bcryptjs** (pure JS, no native build — like our esbuild/sharp posture) for the password hash.
5. **No `SessionProvider` in F4** — pages get their session server-side via `getServerSession` in `getServerSideProps`; `signIn`/`signOut` don't need the provider. (Add it later if a page needs client-side `useSession`.) Keeps public pages free of any auth network calls.

## File Structure

```
packages/config/src/
  env.ts            # + ADMIN_EMAIL, ADMIN_PASSWORD_HASH (required)
  env.test.ts       # updated base + admin-field tests
apps/web/
  package.json      # + next-auth, bcryptjs, @types/bcryptjs
  src/
    server/auth/
      credentials.ts        # pure verifyAdminCredentials() (+ .test.ts)
      options.ts            # NextAuthOptions (build-safe)
      guards.ts             # requireAdmin (page) + withAdminApi (API)
    pages/
      api/auth/[...nextauth].ts   # NextAuth handler
      api/admin/ping.ts           # sample PROTECTED api (demonstrates API guard)
      admin/login.tsx             # minimal themed login form
      admin/index.tsx             # protected placeholder (D10/D11 build the CRM)
      admin/login.module.css
.env.example        # + ADMIN_EMAIL, ADMIN_PASSWORD_HASH (+ generation one-liner)
```

---

### Task 1: Auth env + admin credential verification (TDD)

**Files:**
- Modify: `packages/config/src/env.ts`, `packages/config/src/env.test.ts`
- Modify: `apps/web/package.json` (deps)
- Create: `apps/web/src/server/auth/credentials.ts`, `apps/web/src/server/auth/credentials.test.ts`
- Modify: `.env.example`

**Interfaces:**
- Produces: env `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`; `verifyAdminCredentials(input, adminEmail, adminPasswordHash): boolean`.

- [ ] **Step 1: Add admin fields to the Zod env schema**

In `packages/config/src/env.ts`, add to `serverEnvSchema` (after `AUTH_URL`):

```ts
  // F4 — admin auth (ADR-010). Single seeded admin (Nilyan).
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD_HASH: z.string().min(20),
```

- [ ] **Step 2: Update env tests (base + new assertions)**

In `packages/config/src/env.test.ts`, update `validServer` and add tests:

```ts
const validServer = {
  NODE_ENV: "test",
  DATABASE_URL: "postgres://user:pass@localhost:5432/herrera",
  AUTH_SECRET: "a-very-long-test-secret-value",
  ADMIN_EMAIL: "nilyan@example.com",
  ADMIN_PASSWORD_HASH: "$2a$10$0123456789abcdefghijklmno",
} as NodeJS.ProcessEnv;
```

Add inside the `parseServerEnv` describe block:

```ts
  it("throws when ADMIN_EMAIL is missing", () => {
    const { ADMIN_EMAIL: _omit, ...rest } = validServer as Record<string, string>;
    expect(() => parseServerEnv(rest as NodeJS.ProcessEnv)).toThrow(EnvValidationError);
  });

  it("throws when ADMIN_EMAIL is not an email", () => {
    expect(() => parseServerEnv({ ...validServer, ADMIN_EMAIL: "nope" })).toThrow(
      EnvValidationError,
    );
  });
```

- [ ] **Step 3: Run env tests — expect the OLD base to fail first**

Run: `pnpm test`
Expected: the existing "parses a valid server environment" passes only after the `validServer` update; the two new tests pass. (If you ran before updating `validServer`, it FAILS on the missing admin fields — that's the red signal.)

- [ ] **Step 4: Add auth dependencies**

In `apps/web/package.json`, add to `dependencies`:

```json
    "bcryptjs": "^2.4.3",
    "next-auth": "^4.24.11",
```

and to `devDependencies`:

```json
    "@types/bcryptjs": "^2.4.6",
```

Run: `pnpm install`
Expected: installs next-auth v4 + bcryptjs (peer warnings about React 19 are non-fatal; adapt only if build fails).

- [ ] **Step 5: Write the failing credentials test**

`apps/web/src/server/auth/credentials.test.ts`:

```ts
import bcrypt from "bcryptjs";
import { describe, expect, it } from "vitest";
import { verifyAdminCredentials } from "./credentials";

const EMAIL = "nilyan@herrera.example";
const PASSWORD = "correct-horse-battery-staple";
const HASH = bcrypt.hashSync(PASSWORD, 10);

describe("verifyAdminCredentials", () => {
  it("accepts the correct email + password", () => {
    expect(verifyAdminCredentials({ email: EMAIL, password: PASSWORD }, EMAIL, HASH)).toBe(true);
  });

  it("is case-insensitive on the email", () => {
    expect(verifyAdminCredentials({ email: "Nilyan@Herrera.Example", password: PASSWORD }, EMAIL, HASH)).toBe(true);
  });

  it("rejects a wrong password", () => {
    expect(verifyAdminCredentials({ email: EMAIL, password: "wrong" }, EMAIL, HASH)).toBe(false);
  });

  it("rejects a wrong email", () => {
    expect(verifyAdminCredentials({ email: "intruder@x.com", password: PASSWORD }, EMAIL, HASH)).toBe(false);
  });

  it("rejects missing fields", () => {
    expect(verifyAdminCredentials({ email: null, password: null }, EMAIL, HASH)).toBe(false);
  });
});
```

- [ ] **Step 6: Run it — verify it fails**

Run: `pnpm test`
Expected: FAIL — cannot resolve `./credentials`.

- [ ] **Step 7: Implement verifyAdminCredentials**

`apps/web/src/server/auth/credentials.ts`:

```ts
import bcrypt from "bcryptjs";

export function verifyAdminCredentials(
  input: { email?: string | null; password?: string | null },
  adminEmail: string,
  adminPasswordHash: string,
): boolean {
  if (!input.email || !input.password) return false;
  if (input.email.trim().toLowerCase() !== adminEmail.trim().toLowerCase()) return false;
  return bcrypt.compareSync(input.password, adminPasswordHash);
}
```

- [ ] **Step 8: Document the env in `.env.example`**

Append under the server section of `.env.example`:

```bash
# F4 — admin auth (ADR-010): the single admin (Nilyan)
ADMIN_EMAIL=nilyan@herrera.example
# bcrypt hash of the admin password. Generate with:
#   pnpm --filter @herrera/web exec node -e "console.log(require('bcryptjs').hashSync('YOUR_PASSWORD', 10))"
ADMIN_PASSWORD_HASH=
# NEXTAUTH_URL is set at deploy time (F6); AUTH_SECRET (above) is the NextAuth secret.
```

- [ ] **Step 9: Verify and commit**

Run: `pnpm test && pnpm typecheck && pnpm lint`
Expected: all green (env + credentials suites pass).

```bash
git add -A
git commit -m "feat(auth): add admin env (ADMIN_EMAIL/HASH) + tested verifyAdminCredentials (bcrypt)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: NextAuth config + route (build-safe)

**Files:**
- Create: `apps/web/src/server/auth/options.ts`, `apps/web/src/pages/api/auth/[...nextauth].ts`

**Interfaces:**
- Consumes: `verifyAdminCredentials` (Task 1), `parseServerEnv` (`@herrera/config/env`).
- Produces: `authOptions` (NextAuthOptions); the `/api/auth/*` handler.

- [ ] **Step 1: authOptions (no top-level env read)**

`apps/web/src/server/auth/options.ts`:

```ts
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { parseServerEnv } from "@herrera/config/env";
import { verifyAdminCredentials } from "./credentials";

export const authOptions: NextAuthOptions = {
  // Read directly (build-safe): undefined at build, present at runtime.
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login" },
  providers: [
    CredentialsProvider({
      name: "Admin",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize(credentials) {
        // parseServerEnv() runs at request time (env present), not at build.
        const env = parseServerEnv();
        const ok = verifyAdminCredentials(
          { email: credentials?.email, password: credentials?.password },
          env.ADMIN_EMAIL,
          env.ADMIN_PASSWORD_HASH,
        );
        return ok ? { id: "admin", email: env.ADMIN_EMAIL, name: "Nilyan Herrera" } : null;
      },
    }),
  ],
};
```

- [ ] **Step 2: The NextAuth route**

`apps/web/src/pages/api/auth/[...nextauth].ts`:

```ts
import NextAuth from "next-auth";
import { authOptions } from "@/server/auth/options";

export default NextAuth(authOptions);
```

- [ ] **Step 3: Verify and commit**

Run: `pnpm build && pnpm typecheck && pnpm lint`
Expected: build compiles the `/api/auth/[...nextauth]` route; no env required at build.

> If `next build` fails on a next-auth v4 / React 19 / Next 15.5 incompatibility, switch to Auth.js v5 (see Decision 1) and adapt the route + guards, then re-run. Don't downgrade Next/React.

```bash
git add -A
git commit -m "feat(auth): add NextAuth Credentials+JWT config and route (build-safe env)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Guards + login + protected placeholder + sample protected API

**Files:**
- Create: `apps/web/src/server/auth/guards.ts`
- Create: `apps/web/src/pages/admin/login.tsx`, `apps/web/src/pages/admin/login.module.css`
- Create: `apps/web/src/pages/admin/index.tsx`
- Create: `apps/web/src/pages/api/admin/ping.ts`

**Interfaces:**
- Consumes: `authOptions` (Task 2).
- Produces: `requireAdmin(ctx)` (page guard), `withAdminApi(handler)` (API guard).

- [ ] **Step 1: Guards (page + API)**

`apps/web/src/server/auth/guards.ts`:

```ts
import type { GetServerSidePropsContext, NextApiHandler } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./options";

/** Page guard for getServerSideProps — redirects unauthenticated users to the login page. */
export async function requireAdmin(ctx: GetServerSidePropsContext) {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) {
    return { redirect: { destination: "/admin/login", permanent: false } as const };
  }
  return { session };
}

/** API guard — wraps an admin API handler, returning 401 when unauthenticated. */
export function withAdminApi(handler: NextApiHandler): NextApiHandler {
  return async (req, res) => {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    return handler(req, res);
  };
}
```

- [ ] **Step 2: Sample protected API (demonstrates the API guard)**

`apps/web/src/pages/api/admin/ping.ts`:

```ts
import { withAdminApi } from "@/server/auth/guards";

// Sample protected admin endpoint — real admin mutations arrive in D10/D11.
export default withAdminApi((_req, res) => {
  res.status(200).json({ ok: true, scope: "admin" });
});
```

- [ ] **Step 3: Protected placeholder dashboard**

`apps/web/src/pages/admin/index.tsx`:

```tsx
import type { GetServerSideProps } from "next";
import Head from "next/head";
import { signOut } from "next-auth/react";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";
import { requireAdmin } from "@/server/auth/guards";

export default function AdminHome() {
  return (
    <Container>
      <Head>
        <title>Herrera — admin</title>
      </Head>
      <Section reveal={false}>
        <Eyebrow>Admin · protected</Eyebrow>
        <h1 style={{ fontSize: 42, margin: "12px 0 8px" }}>Welcome, Nilyan</h1>
        <p style={{ color: "var(--color-stone)" }}>
          The CRM (leads, pipeline, analytics) is built in D10/D11. This page is gated.
        </p>
        <Button variant="ghost" onClick={() => void signOut({ callbackUrl: "/admin/login" })}>
          Sign out
        </Button>
      </Section>
    </Container>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const result = await requireAdmin(ctx);
  if ("redirect" in result) return { redirect: result.redirect };
  return { props: {} };
};
```

- [ ] **Step 4: Minimal themed login page**

`apps/web/src/pages/admin/login.module.css`:

```css
.wrap {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
}

.card {
  width: 100%;
  max-width: 380px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  padding: 32px;
}

.field {
  display: block;
  margin-top: 16px;
}

.label {
  display: block;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--color-stone);
  margin-bottom: 6px;
}

.input {
  width: 100%;
  padding: 11px 12px;
  font-size: 15px;
  font-family: var(--font-sans), system-ui, sans-serif;
  background: var(--color-paper);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
}

.error {
  margin-top: 14px;
  color: #8a2b2b;
  font-size: 13.5px;
}
```

`apps/web/src/pages/admin/login.tsx`:

```tsx
import type { GetServerSideProps } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";
import { getServerSession } from "next-auth/next";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { authOptions } from "@/server/auth/options";
import styles from "./login.module.css";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    setBusy(false);
    if (res?.ok) {
      void router.push("/admin");
    } else {
      setError("Invalid email or password.");
    }
  }

  return (
    <div className={styles.wrap}>
      <Head>
        <title>Herrera — admin sign in</title>
      </Head>
      <form className={styles.card} onSubmit={onSubmit}>
        <Eyebrow>Herrera · Admin</Eyebrow>
        <h1 style={{ fontSize: 28, margin: "8px 0 4px" }}>Sign in</h1>
        <label className={styles.field}>
          <span className={styles.label}>Email</span>
          <input
            className={styles.input}
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Password</span>
          <input
            className={styles.input}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p className={styles.error}>{error}</p>}
        <div style={{ marginTop: 20 }}>
          <Button type="submit" variant="primary" size="lg" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </div>
      </form>
    </div>
  );
}

// Already authenticated → go to the dashboard.
export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (session) return { redirect: { destination: "/admin", permanent: false } };
  return { props: {} };
};
```

- [ ] **Step 5: Static verification**

Run: `pnpm format` then `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build`
Expected: all green; build lists `/admin`, `/admin/login`, `/api/admin/ping`, `/api/auth/[...nextauth]`.

- [ ] **Step 6: Runtime smoke (guards work, no interactive login needed)**

Create `apps/web/.env.local` (gitignored) with test values so the dev server runs:

```bash
AUTH_SECRET=local-dev-secret-at-least-16-chars
DATABASE_URL=postgres://placeholder:placeholder@localhost:5432/herrera
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ADMIN_EMAIL=nilyan@herrera.example
# hash of "demo-password-123" — regenerate locally if desired
ADMIN_PASSWORD_HASH=<paste a bcryptjs hash>
```

Start dev in the background, then probe:

```bash
# generate the hash for .env.local first:
pnpm --filter @herrera/web exec node -e "console.log(require('bcryptjs').hashSync('demo-password-123', 10))"

pnpm dev   # background
# unauthenticated API → 401
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/admin/ping   # expect 401
# unauthenticated page → redirect to /admin/login
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/admin            # expect 307/308
# login page renders
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/admin/login      # expect 200
```

Expected: `401`, a redirect (`307`), `200`. Stop the dev server.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(auth): add admin guards (page + API), /admin/login, protected placeholder + sample API

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review

**1. Spec coverage (your F4 list):**
- Auth.js admin-only protecting `/admin/*` **and** admin API mutations → `requireAdmin` (page) + `withAdminApi` (API), demonstrated by `/admin` + `/api/admin/ping`. ✅
- Single seeded admin (Nilyan); secret/credentials from the Zod env schema → `ADMIN_EMAIL`/`ADMIN_PASSWORD_HASH`/`AUTH_SECRET` in `serverEnvSchema`; `authorize()` uses them. ✅
- No public accounts; favorites login-less → nothing public requires auth; no `SessionProvider` on public pages. ✅
- Auth foundation + minimal `/admin/login` + protected placeholder; CRM deferred → exactly those, labeled. ✅

**2. Placeholder scan:** every file has complete code; runtime steps have expected status codes. The `/admin` page and the second-page concept are intentional placeholders. ✅

**3. Type consistency:** `verifyAdminCredentials` signature matches its test and its `authorize()` caller; `requireAdmin` returns `{redirect}` | `{session}` and the page narrows with `"redirect" in result`; `withAdminApi` takes/returns `NextApiHandler`. ✅

## Risks / notes for the executor
- **next-auth v4 + React 19 / Next 15.5:** the key risk. pnpm will install despite peer warnings; verify `pnpm build` compiles the auth route. If it breaks, switch to **Auth.js v5** (Decision 1) — adapt `[...nextauth].ts` to v5 handlers and replace `getServerSession(req,res,authOptions)` with v5's `auth()` in the guards. Do **not** downgrade Next/React.
- **`getServerSession` import:** v4 exposes it from `next-auth/next` (used here) and `next-auth`. If one path errors, use the other.
- **Build hermeticity:** no built module calls `parseServerEnv()` at top level (only inside `authorize()`); `secret` is `process.env.AUTH_SECRET`. So `pnpm build` needs no env.
- **bcryptjs:** if pnpm resolves v3 (ESM, bundled types), drop `@types/bcryptjs` and adjust the import if needed. v2.4.3 is the CJS default targeted here.
- **`.env.local`** is gitignored (`.env.*`) — never committed; it exists only for the local runtime smoke.
- **NEXTAUTH_URL:** not needed locally (v4 infers it); F6 sets it for the deployed preview.
- **`signOut`/`signIn` from `next-auth/react`** work without `SessionProvider` (they hit the API + redirect). Only `useSession` would require the provider — not used in F4.
