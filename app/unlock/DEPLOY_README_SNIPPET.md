<!--
WS-F deliverable. This is the exact text for the README "Deploy" + "Environment"
sections. WS-E / the owner should append it verbatim to README.md (WS-F does not
edit README.md directly, per the ownership boundary in PLAN.md §7.1).
Everything between the two ==== markers goes into the README.
-->

==== BEGIN README SNIPPET ====

## Deploy

Drafting Board deploys on push to `main`. **Vercel** is the host (first choice for
Next.js; zero-config, built-in Edge middleware, per-push preview URLs).

### One-time setup (Vercel)

1. Create a Vercel project and import this Git repository.
2. Framework preset: **Next.js** (auto-detected; `vercel.json` pins it explicitly).
3. Add environment variables under **Settings → Environment Variables**:
   - `SITE_PASSWORD` — the shared stakeholder password (**required** in Production).
   - `SITE_SESSION_SECRET` — optional; a long random string
     (`openssl rand -hex 32`) mixed into the cookie signature.
4. Deploy. Every push to `main` ships to Production; every branch/PR gets a
   preview URL.

### Custom domain (optional)

In **Settings → Domains**, add e.g. `drafting.<team-domain>` and point the DNS
record Vercel shows you. Until then, use the `*.vercel.app` URL. No code change
is needed either way.

### Railway (fallback host)

Railway also works with zero code changes: create a service from this repo,
set the same env vars, and it builds via Nixpacks (`npm install` → `npm run
build` → `npm run start`). Choose Railway only if Vercel is unavailable — Vercel
is preferred for first-class Next.js Edge-middleware support.

## Environment variables

Copy `.env.example` to `.env.local` for local development.

| Variable | Required | Purpose |
|---|---|---|
| `SITE_PASSWORD` | Yes (in any protected env) | Shared password for the site gate. **When unset, the gate is disabled** — handy for local dev, but never leave it unset in Production. |
| `SITE_SESSION_SECRET` | No | Extra secret folded into the session-cookie HMAC. Changing it (or `SITE_PASSWORD`) invalidates all active sessions. |

## Password gate — how it works

A Next.js Edge middleware (`middleware.ts`) guards every route except `/unlock`
and static assets. Unauthenticated visitors are redirected to **`/unlock`**,
where they enter the shared password. On success a signed, HTTP-only session
cookie (HMAC-SHA-256 over the password + optional secret, **never the password
itself**) is set for **30 days**, granting access across all routes. Wrong or
missing password → back to `/unlock`.

==== END README SNIPPET ====
