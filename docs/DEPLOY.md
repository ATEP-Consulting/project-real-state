# Deploying the Herrera preview (Vercel)

The preview is intentionally **noindex + access-restricted + marked "sample data — demo"**
(ADR-003). All three are keyed off env, so flipping to production is an env change, not a code edit.

## Vercel project settings

- **Root Directory:** `apps/web` (Vercel detects the pnpm workspace and installs from the repo root).
- **Framework:** Next.js (auto-detected). Install/build commands: defaults.
- **Node:** 20+ (matches `.nvmrc` / `engines`).

## Environment variables (set for Preview, and Production when ready)

| Var | Value |
|---|---|
| `DATABASE_URL` | Neon connection string (PostGIS-enabled branch), `...?sslmode=require` |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | the deployment URL (e.g. `https://herrera-xxx.vercel.app`) |
| `ADMIN_EMAIL` | Nilyan's admin email |
| `ADMIN_PASSWORD_HASH` | bcrypt hash (`.env.example` has the generation one-liner) |
| `NEXT_PUBLIC_SITE_URL` | the deployment URL |
| `NEXT_PUBLIC_DEMO_MODE` | `true` (preview) |
| `PREVIEW_BASIC_AUTH` | `user:strong-password` (preview only — the access gate) |
| `NEXT_PUBLIC_MAP_STYLE_URL` | _(optional)_ MapLibre style URL (D2). Default = the free Carto Positron style (`https://basemaps.cartocdn.com/gl/positron-gl-style/style.json`), **no token required**. |

> `NEXT_PUBLIC_*` are read at **build time** — after changing them, redeploy.
> `PREVIEW_BASIC_AUTH` and the rest are read at **runtime**.

## Deploy

- **Dashboard:** connect the Git repo, set the Root Directory + env vars above, deploy.
- **CLI:** `pnpm dlx vercel@latest link --cwd apps/web` → `vercel env add ...` → `vercel deploy --cwd apps/web`.

## Verify the live preview

```bash
URL=<deployed-url>
curl -s -o /dev/null -w "%{http_code}\n" "$URL/"                       # 401 (gated)
curl -s -u USER:PASS -o /dev/null -w "%{http_code}\n" "$URL/"          # 200 (F3 shell)
curl -s -u USER:PASS -D - -o /dev/null "$URL/" | grep -i x-robots-tag  # noindex, nofollow
curl -s "$URL/robots.txt"                                              # Disallow: /
curl -s -u USER:PASS "$URL/api/health"                                 # {"ok":true,"listings":124}
curl -s -u USER:PASS -o /dev/null -w "%{http_code}\n" "$URL/admin"     # 307 → /admin/login
```

## Going to production later

Set `NEXT_PUBLIC_DEMO_MODE=false`, **unset** `PREVIEW_BASIC_AUTH`, and ship a real
robots/sitemap (D12). That removes the noindex header/meta, the access gate, and the demo marker.
