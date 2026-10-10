# Month 1 build: task plan

Spec: `docs/superpowers/specs/2026-10-10-month-1-build-design.md`. Branch: `pivot/month-1`. Every task reads the spec first. Tasks own disjoint paths; a task never edits a path another task owns. Shared files (`package.json`, `layout.tsx`, `globals.css`, `next.config.ts`) are owned by T0; later tasks that need a change there report it instead of editing.

| Task | Owner paths | Depends on | Done when |
|---|---|---|---|
| **T0 Foundation** | root `package.json`, `.gitignore`, `README.md`; `apps/closet/**` (the move); `apps/web/**` scaffold except `content/`; `packages/core/**` | none | both apps build; `apps/web` boots in stub mode with placeholder pages; migration, env, tokens, lib, brand primitives exist |
| **T1 Quick win, result, verdict** | `apps/web/src/features/profile/**`, `features/verdict/**`, `src/app/app/quick-win/**`, `src/app/r/**`, `src/app/api/quick-win`, `api/verdict`, `api/share`, `api/open`, `src/components/brand/ResultCard*` | T0 | intake to result to card image to verdict works in stub mode and with keys |
| **T2 Billing** | `apps/web/src/features/billing/**`, `src/app/pricing/**`, `src/app/checkout/**`, `src/app/api/checkout`, `api/webhooks/dodo`, `api/counter` | T0 | pricing engine unit-tested, checkout works in stub mode, webhook verifies and recomputes counter |
| **T3a Content: men's guides** | `apps/web/content/guides/*-men.json` | none | 21 files, schema-valid, each over 600 words |
| **T3b Content: women's guides** | `apps/web/content/guides/*-women.json` | none | 21 files, schema-valid, each over 600 words |
| **T3c Content: colour, archetypes, seasons, tools** | `apps/web/content/colours/*.json`, `content/archetypes.json`, `content/seasons.json`, `content/tools/*.json` | none | 8 colour pages, 16 archetypes, 4 seasons with variants, 4 tool pages |
| **T4 Content routes** | `apps/web/src/features/content/**`, `src/app/guides/**`, `src/app/tools/**`, `src/app/sitemap.ts`, `src/app/robots.ts` | T0 | guides and tools render from JSON, sitemap and robots correct, redirects from old slugs |
| **T5 Landing and doors** | `src/app/page.tsx`, `src/app/men/**`, `src/app/women/**`, `src/app/privacy/**`, `src/app/terms/**`, `src/components/brand/Door*`, `src/components/brand/HowItWorks*`, `src/components/brand/Honesty*` | T0 | the three landing pages match spec section 6, events fire, Lighthouse mobile above 90 |
| **T6 Closet app** | `apps/closet/src/components/NewHomeBanner.tsx`, `apps/closet/src/pages/Landing.tsx`, `apps/closet/vercel.json`, `apps/closet/src/App.tsx` | T0 | banner shows, guide URLs redirect, build passes |
| **T7 Integration** | anything, by the lead | T1 to T6 | spec section 15 acceptance, PR opened |

Execution order: T0 and T3a, T3b, T3c start together. When T0 lands, T1, T2, T4, T5, T6 start together. T7 last.

Content JSON schema for T3 and T4 is spec section 11. Archetype names used by T1's prompts come from `content/archetypes.json`, so T3c lands before T1 is tested with real keys.
