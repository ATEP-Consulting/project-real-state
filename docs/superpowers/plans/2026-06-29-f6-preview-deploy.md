# F6 — Protected Vercel Preview Deploy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy the app to a **shareable but safe** Vercel preview: `noindex` (header + meta + disallow-all robots.txt), **access-restricted** (Basic Auth gate), a visible **"sample data — demo" marker**, env wired to Neon, and a confirmed live render + DB connection. Config/deploy only — the public side stays the F3 shell.

**Architecture:** All three demo-safety signals key off `NEXT_PUBLIC_DEMO_MODE`: an `X-Robots-Tag` header (next.config), a conditional `noindex` `<meta>` (`_app`), and a dynamic `/robots.txt` (rewrite → API route). Access is gated by **edge middleware Basic Auth** (active only when `PREVIEW_BASIC_AUTH` is set, so production isn't gated). A lazy `getDb()` + a tiny `/api/health` prove the deploy reaches Neon. The Vercel deploy itself (env wiring + build) is the final step and needs your Vercel account.

**Tech Stack:** Next 15 middleware (edge) · next.config headers/rewrites · Vercel (pnpm monorepo, root dir `apps/web`) · Neon.

## Global Constraints

- **ADR-003:** preview is **noindex + access-restricted + "sample data" marker**; removing them for production is a deliberate switch (the `NEXT_PUBLIC_DEMO_MODE=false` + unset `PREVIEW_BASIC_AUTH` path).
- **No new pages/features** — keep the public side as the F3 shell. The only additions are demo-safety, an access gate, a demo marker, and an ops health check.
- **Build stays hermetic** — no env read at module load in built routes (lazy `getDb()`); `pnpm build` needs no env.
- **Secrets:** never commit secrets; `.env.local` stays gitignored; Vercel env is set via dashboard/CLI.
- **Quality gate:** `format:check` · `lint` · `typecheck` · `test` · `build` green offline (Tasks 1–4) + a **local runtime smoke** (Basic Auth 401/200, `X-Robots-Tag`, `/robots.txt` disallow, `/api/health` ok). Task 5 is the live deploy + verify.

## Decisions in this plan (confirm at review)

1. **Access restriction = edge middleware Basic Auth** (active only when `PREVIEW_BASIC_AUTH="user:pass"` is set). Rationale: works on any Vercel plan, fully in code, one shared link+credential, and auto-disables in production (unset the var). *Alternative: Vercel Deployment Protection (dashboard toggle) — needs a Vercel Pro plan; no code, but plan-dependent.*
2. **Who runs the deploy (Task 5):** *either* I run the Vercel CLI with a `VERCEL_TOKEN` you provide (link + `vercel env add` + deploy), *or* you deploy via the dashboard/CLI and I verify with curl. (Pick at review.)
3. **Dynamic robots + conditional noindex** (one flag `NEXT_PUBLIC_DEMO_MODE`) so flipping to production is a single env change, not a code edit.
4. **A tiny `/api/health`** (lazy DB query) to confirm the deploy connects to Neon — kept as a low-risk ops endpoint.

## File Structure

```
apps/web/
  next.config.mjs       # + headers (X-Robots-Tag) + rewrites (/robots.txt → /api/robots) + transpilePackages @herrera/db
  package.json          # + @herrera/db dependency
  src/
    middleware.ts       # edge Basic Auth gate (active when PREVIEW_BASIC_AUTH set)
    server/robots.ts    # pure robotsBody(isDemo) (+ .test.ts)
    components/DemoBanner.tsx
    pages/
      _app.tsx          # + conditional noindex meta + <DemoBanner/>
      _document.tsx     # remove the static noindex meta (now conditional in _app)
      api/robots.ts     # serves robotsBody()
      api/health.ts     # lazy DB count → { ok, listings }
packages/db/src/
  client.ts             # refactor to lazy getDb() (build-safe)
  index.ts              # export getDb
packages/config/src/env.ts  # + PREVIEW_BASIC_AUTH, NEXTAUTH_URL (optional)
.env.example            # + the new vars
docs/DEPLOY.md          # Vercel settings + env var checklist
```

---

### Task 1: Demo-safety signals (noindex header + meta + dynamic robots + marker)

**Files:**
- Create: `apps/web/src/server/robots.ts`, `apps/web/src/server/robots.test.ts`
- Create: `apps/web/src/pages/api/robots.ts`, `apps/web/src/components/DemoBanner.tsx`
- Modify: `apps/web/next.config.mjs`, `apps/web/src/pages/_app.tsx`, `apps/web/src/pages/_document.tsx`

- [ ] **Step 1: robots body (pure, testable) — write test first**

`apps/web/src/server/robots.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { robotsBody } from "./robots";

describe("robotsBody", () => {
  it("disallows everything in demo mode", () => {
    expect(robotsBody(true)).toContain("Disallow: /");
    expect(robotsBody(true)).not.toContain("Allow: /");
  });
  it("allows crawling in production mode", () => {
    expect(robotsBody(false)).toContain("Allow: /");
    expect(robotsBody(false)).not.toContain("Disallow: /");
  });
});
```

`apps/web/src/server/robots.ts`:

```ts
export function robotsBody(isDemo: boolean): string {
  if (isDemo) return "User-agent: *\nDisallow: /\n";
  // Production: allow crawling. (A real sitemap is added with the SEO pages in D12.)
  return "User-agent: *\nAllow: /\n";
}
```

- [ ] **Step 2: robots API route**

`apps/web/src/pages/api/robots.ts`:

```ts
import type { NextApiRequest, NextApiResponse } from "next";
import { robotsBody } from "@/server/robots";

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";
  res.setHeader("Content-Type", "text/plain");
  res.status(200).send(robotsBody(isDemo));
}
```

- [ ] **Step 3: next.config — X-Robots-Tag header + /robots.txt rewrite + transpile @herrera/db**

Replace `apps/web/next.config.mjs`:

```js
/** @type {import('next').NextConfig} */
const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@herrera/config", "@herrera/db"],
  // Linting is owned by the root `pnpm lint`; `next build` still type-checks.
  eslint: { ignoreDuringBuilds: true },
  async rewrites() {
    return [{ source: "/robots.txt", destination: "/api/robots" }];
  },
  async headers() {
    if (!isDemo) return [];
    return [
      {
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
```

- [ ] **Step 4: Demo marker**

`apps/web/src/components/DemoBanner.tsx`:

```tsx
export function DemoBanner() {
  return (
    <div
      role="note"
      aria-label="Sample data — demo"
      style={{
        position: "fixed",
        left: 16,
        bottom: 16,
        zIndex: 50,
        padding: "6px 12px",
        fontFamily: "var(--font-sans), system-ui, sans-serif",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "#fff",
        background: "var(--color-bronze)",
        borderRadius: "var(--radius-pill)",
        boxShadow: "var(--shadow-bronze)",
        pointerEvents: "none",
      }}
    >
      Sample data — demo
    </div>
  );
}
```

- [ ] **Step 5: Wire conditional noindex meta + banner in `_app`, remove static meta from `_document`**

In `apps/web/src/pages/_app.tsx`: add `import Head from "next/head"` and the `DemoBanner`, compute `const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";`, and render inside the font wrapper:

```tsx
      {isDemo && (
        <Head>
          <meta name="robots" content="noindex,nofollow" />
        </Head>
      )}
      <PageTransition>
        <Component {...pageProps} />
      </PageTransition>
      {isDemo && <DemoBanner />}
```

In `apps/web/src/pages/_document.tsx`: remove the static `<meta name="robots" ... />` line (now conditional in `_app`). Keep the `<Html lang="en">` + `<Head />`.

- [ ] **Step 6: Verify + commit**

Run: `pnpm test && pnpm typecheck && pnpm lint && pnpm build`
Expected: all green; build lists `/api/robots`.

```bash
git add -A
git commit -m "feat(web): demo-safety signals — X-Robots-Tag, conditional noindex meta, dynamic robots.txt, demo marker

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Access restriction — edge Basic Auth middleware

**Files:**
- Create: `apps/web/src/middleware.ts`
- Modify: `packages/config/src/env.ts` (+ `PREVIEW_BASIC_AUTH`, `NEXTAUTH_URL`), `.env.example`

- [ ] **Step 1: Middleware (active only when `PREVIEW_BASIC_AUTH` is set)**

`apps/web/src/middleware.ts`:

```ts
import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const expected = process.env.PREVIEW_BASIC_AUTH; // "user:pass" — unset in production
  if (!expected) return NextResponse.next();

  const header = req.headers.get("authorization");
  if (header) {
    const [scheme, encoded] = header.split(" ");
    if (scheme === "Basic" && encoded && atob(encoded) === expected) {
      return NextResponse.next();
    }
  }
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Herrera preview"' },
  });
}

// Gate everything except Next internals and robots.txt (so crawlers can still read the disallow).
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt).*)"],
};
```

- [ ] **Step 2: Document the new env vars**

In `packages/config/src/env.ts` `serverEnvSchema`, add (optional):

```ts
  // F6 — preview access gate (ADR-003). Format "user:pass"; unset in production.
  PREVIEW_BASIC_AUTH: z.string().optional(),
  // NextAuth callback base URL on the deploy.
  NEXTAUTH_URL: z.string().url().optional(),
```

In `.env.example`, add under the server section:

```bash
# F6 — preview access gate (ADR-003); set on the Vercel preview, unset in production
PREVIEW_BASIC_AUTH=demo:choose-a-strong-password
# NextAuth callback base URL (the deploy URL)
NEXTAUTH_URL=https://your-preview.vercel.app
```

> Middleware reads `process.env.PREVIEW_BASIC_AUTH` directly (edge-safe) — it does not call `parseServerEnv`. The schema entry is for documentation/validation elsewhere.

- [ ] **Step 3: Verify + commit**

Run: `pnpm typecheck && pnpm lint && pnpm build && pnpm test`
Expected: green; build shows `ƒ Middleware`.

```bash
git add -A
git commit -m "feat(web): edge Basic Auth gate for the preview (active when PREVIEW_BASIC_AUTH set)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Lazy DB client + `/api/health` (prove Neon connectivity)

**Files:**
- Modify: `packages/db/src/client.ts`, `packages/db/src/index.ts`
- Modify: `apps/web/package.json` (+ `@herrera/db`)
- Create: `apps/web/src/pages/api/health.ts`

- [ ] **Step 1: Refactor the client to lazy `getDb()` (build-safe)**

Replace `packages/db/src/client.ts`:

```ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema/index";

function createDb(url: string) {
  return drizzle(neon(url), { schema });
}

let _db: ReturnType<typeof createDb> | undefined;

/** Lazily create + memoize the Neon-HTTP Drizzle client (reads DATABASE_URL at call time). */
export function getDb() {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    _db = createDb(url);
  }
  return _db;
}

export type DB = ReturnType<typeof getDb>;
```

Update `packages/db/src/index.ts`:

```ts
export * as schema from "./schema/index";
export { getDb, type DB } from "./client";
```

- [ ] **Step 2: Add `@herrera/db` to the web app**

In `apps/web/package.json` `dependencies`, add:

```json
    "@herrera/db": "workspace:*",
```

Run: `pnpm install`

- [ ] **Step 3: Health route (lazy → build-safe)**

`apps/web/src/pages/api/health.ts`:

```ts
import type { NextApiRequest, NextApiResponse } from "next";
import { sql } from "drizzle-orm";
import { getDb } from "@herrera/db";

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const db = getDb();
    const r = await db.execute(sql`SELECT count(*)::int AS listings FROM listings`);
    const rows = Array.isArray(r) ? r : (r as { rows?: { listings: number }[] }).rows;
    res.status(200).json({ ok: true, listings: rows?.[0]?.listings ?? null });
  } catch (e) {
    res.status(500).json({ ok: false, error: (e as Error).message });
  }
}
```

- [ ] **Step 4: Verify + commit**

Run: `pnpm typecheck && pnpm lint && pnpm build && pnpm test`
Expected: green; build lists `/api/health`. (Build needs no env — `getDb()` is lazy.)

```bash
git add -A
git commit -m "feat(db): lazy getDb() client; add /api/health to confirm Neon connectivity

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Local runtime smoke + deploy docs

**Files:**
- Create: `docs/DEPLOY.md`

- [ ] **Step 1: Local smoke (proves all the gates work before Vercel)**

Add to `apps/web/.env.local` (gitignored): `NEXT_PUBLIC_DEMO_MODE=true` and `PREVIEW_BASIC_AUTH=demo:secret123` (plus the existing `DATABASE_URL` real Neon URL, `AUTH_SECRET`, `ADMIN_*`).

Build + start, then probe:

```bash
pnpm build && (pnpm --filter @herrera/web start &) # serves :3000
# Basic Auth: no creds → 401
curl -s --retry 30 --retry-connrefused -o /dev/null -w "%{http_code}\n" http://localhost:3000/        # 401
# with creds → 200, and noindex header present
curl -s -u demo:secret123 -o /dev/null -w "%{http_code}\n" http://localhost:3000/                      # 200
curl -s -u demo:secret123 -D - -o /dev/null http://localhost:3000/ | grep -i x-robots-tag              # X-Robots-Tag: noindex, nofollow
# robots.txt is public (excluded from auth) and disallows
curl -s http://localhost:3000/robots.txt                                                                # Disallow: /
# health reaches Neon (behind auth)
curl -s -u demo:secret123 http://localhost:3000/api/health                                              # {"ok":true,"listings":124}
# stop the server
pkill -f "next start"
```

Expected: `401`, `200`, the `X-Robots-Tag` line, `Disallow: /`, and `{"ok":true,"listings":124}`.

- [ ] **Step 2: Deploy docs**

`docs/DEPLOY.md` — Vercel project settings + the env-var checklist:

```markdown
# Deploying the Herrera preview (Vercel)

## Project settings
- **Root Directory:** `apps/web` (Vercel detects the pnpm workspace and installs from the repo root).
- **Framework:** Next.js (auto). Build/install commands: defaults.

## Environment variables (Production + Preview)
| Var | Value |
|---|---|
| `DATABASE_URL` | Neon connection string (PostGIS) |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | the deployment URL (e.g. https://herrera-xxx.vercel.app) |
| `ADMIN_EMAIL` | Nilyan's admin email |
| `ADMIN_PASSWORD_HASH` | bcrypt hash (see .env.example one-liner) |
| `NEXT_PUBLIC_SITE_URL` | the deployment URL |
| `NEXT_PUBLIC_DEMO_MODE` | `true` (preview) |
| `PREVIEW_BASIC_AUTH` | `user:strong-password` (preview only; unset for production) |
| `NEXT_PUBLIC_MAP_STYLE_URL` | (optional) MapLibre style URL |

## Going to production later
Set `NEXT_PUBLIC_DEMO_MODE=false`, **unset** `PREVIEW_BASIC_AUTH`, and provide a real robots/sitemap (D12). That removes noindex + the gate + the demo marker.
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "docs: add DEPLOY.md (Vercel settings + env checklist); verified local preview smoke

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Live Vercel deploy + verify

> **Requires Vercel account access** (Decision 2). Either I run the CLI with a `VERCEL_TOKEN` you provide, or you deploy and I verify. If neither is available at execution, STOP and report that Tasks 1–4 are done + ready to deploy.

- [ ] **Step 1: Link + configure (CLI path)**

```bash
# with VERCEL_TOKEN in env:
pnpm dlx vercel@latest link --yes --cwd apps/web --token "$VERCEL_TOKEN"
# set env vars (repeat per var, Preview + Production scopes)
printf '%s' "$DATABASE_URL" | pnpm dlx vercel env add DATABASE_URL preview --token "$VERCEL_TOKEN"
# ...AUTH_SECRET, NEXTAUTH_URL, ADMIN_EMAIL, ADMIN_PASSWORD_HASH, NEXT_PUBLIC_SITE_URL,
#    NEXT_PUBLIC_DEMO_MODE=true, PREVIEW_BASIC_AUTH=user:pass
```

(Dashboard path: set Root Directory `apps/web` + the env vars from `docs/DEPLOY.md`, then deploy from Git.)

- [ ] **Step 2: Deploy**

```bash
pnpm dlx vercel@latest deploy --cwd apps/web --token "$VERCEL_TOKEN"   # preview URL
```

- [ ] **Step 3: Verify the live preview**

```bash
URL=<deployed-url>
curl -s -o /dev/null -w "%{http_code}\n" "$URL/"                       # 401 (gated)
curl -s -u user:pass -o /dev/null -w "%{http_code}\n" "$URL/"          # 200 (F3 shell renders)
curl -s -u user:pass -D - -o /dev/null "$URL/" | grep -i x-robots-tag  # noindex
curl -s "$URL/robots.txt"                                              # Disallow: /
curl -s -u user:pass "$URL/api/health"                                 # {"ok":true,"listings":124}  ← Neon connected
curl -s -u user:pass -o /dev/null -w "%{http_code}\n" "$URL/admin"     # 307 → /admin/login (admin gate still works)
```

Expected: gated (401→200), noindex header, disallow robots, health shows the live Neon count, admin still gated. Report the URL + results.

---

## Self-Review

**1. Spec coverage (your F6 list):**
- noindex: `X-Robots-Tag` header (next.config) + conditional `<meta>` (`_app`) + disallow-all `/robots.txt` (rewrite→API) → Task 1. ✅
- Access restriction: edge Basic Auth middleware (Vercel Deployment Protection noted as the alternative) → Task 2. ✅
- "sample data — demo" marker tied to `NEXT_PUBLIC_DEMO_MODE` → Task 1 `DemoBanner`. ✅
- Wire env in Vercel + confirm it connects to Neon and renders → Task 4 (DEPLOY.md) + Task 3 (`/api/health`) + Task 5 (live verify). ✅
- Config/deploy only, public side stays the F3 shell → no new pages; only safety/gate/marker/health. ✅

**2. Placeholder scan:** complete code; runtime steps have expected status codes/outputs. ✅

**3. Type consistency:** `robotsBody(boolean)` matches its test + API route; `getDb()` replaces eager `db` (nothing imports the old `db` yet); `/api/health` imports `getDb` from `@herrera/db`. ✅

## Risks / notes for the executor
- **`getDb()` refactor:** nothing imports the old eager `db` yet, so this is safe; it also makes `next build` hermetic when `/api/health` is added.
- **Middleware + admin auth:** Basic Auth is the outer gate; once the browser sends the header it persists on all requests, so NextAuth `/api/auth` + `/admin` work behind it. `robots.txt` is excluded so crawlers can read the disallow.
- **`atob` in edge middleware** is available; no Node Buffer needed.
- **Monorepo on Vercel:** Root Directory `apps/web`; Vercel installs from the workspace root and resolves `@herrera/config`/`@herrera/db` (both in `transpilePackages`). Confirm at deploy.
- **`NEXTAUTH_URL`** must equal the deploy URL or admin login callbacks can misbehave; set it in Vercel env (DEPLOY.md).
- **Deploy needs your Vercel account** — provide a `VERCEL_TOKEN` for the CLI path, or deploy via dashboard and I'll run the verify curls.
- **`pnpm --filter @herrera/web start`** needs a prior `build`; the smoke builds first.
