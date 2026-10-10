# fitso.me

An honest stylist. Upload one selfie and learn which colours and clothes are working for you. No fake scores. Photos are deleted after your result.

This repo is an npm workspace with two apps and one shared package.

```
apps/web        Next.js 16 (App Router, Tailwind 4). fitso.me: content site, quick win, result, checkout.
apps/closet     Vite + React. The original wardrobe app, frozen. closet.fitso.me.
packages/core   @fitso/core: shared zod schemas and types (profile, verdict, content).
workers/        Cloudflare worker for the closet app. Unchanged.
docs/           Specs and plans.
```

History: fitso started as a personal wardrobe and closet manager (now `apps/closet`). Month 1 of the pivot adds the new product at the root domain.

## Run

Node 22 or newer.

```
npm install          # installs everything and builds packages/core
npm run dev          # apps/web on http://localhost:3000
npm run build        # builds core, web, closet
npm run lint         # eslint for apps/web
npm run test         # vitest for apps/web
npm run typecheck    # tsc for core, web, closet
```

The closet app: `npm run dev -w apps/closet` (Vite, port 5173).

## Environment

Copy `apps/web/.env.example` to `apps/web/.env.local`. With no keys at all, `apps/web` runs in stub mode and logs which integrations are stubbed:

| Integration | Stub behaviour | Variables |
|---|---|---|
| AI Gateway | deterministic fixture profile and verdict | `AI_GATEWAY_API_KEY`, `AI_MODEL_*` |
| Supabase | in-memory fake database | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| Dodo Payments | order recorded as `test`, redirect to success | `DODO_*` |
| PostHog | no events sent | `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` |

Set `OWNER_COOKIE_SECRET` in production. Database: apply `apps/web/supabase/migrations/0001_month1.sql` (see `apps/web/supabase/README.md`). The closet app has its own `apps/closet/.env.example`.

## Deploy

Two Vercel projects from this repo:

| Project | Root directory | Domain |
|---|---|---|
| fitso-web | `apps/web` | fitso.me |
| fitso-closet | `apps/closet` | closet.fitso.me |

Set "Include source files outside of the Root Directory" on, so `packages/core` is available. Install runs at the repo root (`npm install`), which builds `@fitso/core` through the root `postinstall`. Add a `closet` CNAME for the closet project. The Cloudflare worker deploys separately from `workers/`.

## Docs

- Spec: `docs/superpowers/specs/2026-10-10-month-1-build-design.md`
- Plan: `docs/superpowers/plans/2026-10-10-month-1-build.md`
