# Month 1 build: design spec

Date: 2026-10-10. Source plan: `docs/plans/2026-10-10-fitso-pivot-plan.md` (sections 3, 4, 4.1, 6, 9 month 1, 15). This spec is what executors build from. Where it and the plan differ, this spec wins.

## 1. Goal of month 1

By the end of month 1 the root domain runs the new product, the old app runs frozen at `closet.fitso.me`, and a stranger from search can land on a content page, run the free quick win on their own face, see a shareable result, and buy the Style Report at the founding price. The Report itself ships in month 2; checkout works now and buyers are told the date.

## 2. Decisions fixed for this build

- **One Next.js app** (`apps/web`) serves the content site and the product. No Astro. Pages under `/guides`, `/tools`, `/men`, `/women`, `/` are static. The product lives under `/app` and route handlers under `/api`.
- **The old app moves, unchanged, to `apps/closet`** and deploys to `closet.fitso.me`. It gets one banner and redirects for its guide URLs. Nothing else changes.
- **Vercel hosts both** as two projects: root `apps/web` and root `apps/closet`. The Cloudflare worker stays as it is for the closet app.
- **Supabase** stays the auth and database. The new app talks to it only from the server (route handlers and server components) with the service-role key, never from the browser.
- **AI** calls go through the Vercel AI Gateway with the AI SDK. Model ids are env-configurable; defaults: quick win and verdict on `anthropic/claude-sonnet-5-5`, Report (month 2) on `anthropic/claude-opus-5-5`. Structured output with a zod schema, never free text parsing.
- **Payments** go through Dodo Payments as merchant of record. When `DODO_API_KEY` is absent the checkout runs in stub mode: it records the order as `test` and redirects to the success page. The founding counter counts only `paid` orders.
- **Photos are never stored.** The selfie is held in memory for the model call and discarded. The result stores derived fields only.
- **Email is required to see the result.** Stored on the quick-win row. No email sending in month 1.
- **Analytics** is PostHog, browser SDK for page and UI events, server SDK for the money events.

## 3. Repo layout after this build

```
fitso.me/
  package.json            npm workspaces: apps/*, packages/*
  apps/
    closet/               today's src/, public/, index.html, vite.config.ts, tailwind, tsconfig*, vercel.json, package.json (moved as-is)
    web/                  Next.js 16 App Router, TypeScript, Tailwind 4
      src/app/            routes (section 6)
      src/features/       profile/, verdict/, billing/, content/
      src/lib/            ai.ts, supabase.ts, posthog.ts, env.ts, pricing.ts
      src/components/     brand/ (Wordmark, DrapeChip, ResultCard, Door, Stamp), ui/
      content/            guides/*.json, colours/*.json, tools/*.json, archetypes.json, seasons.json
      supabase/migrations/0001_month1.sql
      .env.example
  packages/core/          shared zod schemas and types: profile, verdict, order
  workers/                unchanged, minus hygiene deletions
  docs/
```

Hygiene deletions (plan 15.2): `workers/.wrangler/state/`, `workers/fix-server-data.js`, `workers/fix-server-data.mjs`, `workers/theshajha/metadata.json`, `src/lib/guides.ts` (the wrapper; after the move it is `apps/closet/src/lib/guides.ts`; delete it and fix the one import path), `workers/worker-configuration.d.ts` out of git. `.gitignore` gains `workers/.wrangler/`, `workers/worker-configuration.d.ts`, `.next/`, `.vercel/`, `.env*.local`. `package-lock.json` is tracked (remove it from `.gitignore`).

## 4. Brand tokens (the design.md for this build)

Subject: an honest, loud stylist. Audience: men and women in India and the Gulf, 20 to 35, who shop online. The page's single job: get a selfie uploaded.

Physical world to mine: the colour-drape session (fabric held under the chin), swatch fans, paint-chip cards, size tags, the "YES" stamp on a fitting-room ticket, lookbook grids.

Tokens (CSS variables in `globals.css`, also exported from `src/lib/tokens.ts`):

```
--paper:     #FFFDF8   page background (warm white, not cream)
--ink:       #14121B
--ink-2:     #4B4757
--line:      #E6E2EC
--magenta:   #F0127A   women's door accent and the shared "yes" energy
--tangerine: #FF6B1A   women's door secondary
--cobalt:    #2B3DF5   men's door accent
--lime:      #C8F031   men's door secondary (never as text; as blocks and chips only)
--good:      #15735A   verdict yes (text-safe)
--warn:      #965007   verdict yes-if (text-safe)
--bad:       #B3261E   verdict no (text-safe)
seasons:     spring #FF7A45 · summer #7FA8D9 · autumn #B8632F · winter #2642E5  (palette strips, never text)
```

Dark mode: not in month 1. `color-scheme: light` only.

Type (Google Fonts, `next/font`): **Unbounded** 700 and 900 for display and the wordmark, **Hanken Grotesk** 400 to 700 for body, **Spline Sans Mono** 500 for labels, counters and timers. Display is tight (letter-spacing -0.02em), uppercase only in labels.

Layout: 1200px container, 16px side gutter, generous vertical rhythm (sections at 96px desktop, 56px mobile). Prose runs full width. No `ch` measures.

Signature: **the drape fan**. A fan of five rounded colour chips (four seasons plus the door's accent, labelled "you") that opens on load. It appears on the landing hero, on the quick-win page while the model is thinking, and collapsed as the top of the result card. Everything else stays quiet so the fan and the result card carry the brand.

Result card (the share unit, 1080x1920 and 1200x630 variants rendered by an image route): season block in the season colour, archetype name in Unbounded, three "working for you" lines as stamped chips, one "stop buying" line, the palette strip, the wordmark and `fitso.me`. Men's cards use cobalt and lime chrome, women's magenta and tangerine chrome. The text on a card is never set in a season colour.

Copy voice: a friend who dresses well and likes you. Sentence case. Short. Every compliment points at something in the photo. Never a percentile.

## 5. Data model (Supabase, `0001_month1.sql`)

All tables in `public`, RLS enabled, no policies for `anon` or `authenticated` (server-only access through the service role). `updated_at` triggers on each.

```sql
create type door as enum ('men','women');
create type verdict_kind as enum ('yes','yes_if','no');
create type order_status as enum ('pending','paid','refunded','test');
create type product as enum ('report','pro');

create table quick_wins (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  door door not null,
  email text not null,
  answers jsonb not null,            -- the five answers
  profile jsonb not null,            -- QuickWinProfile (section 7)
  confidence numeric(3,2) not null,  -- 0.00 to 1.00
  share_token text not null unique,  -- short, for /r/[token]
  shared_at timestamptz,
  opened_by_others int not null default 0,
  finish_today_expires_at timestamptz not null,  -- created_at + 24h, never changed
  verdict_credits int not null default 1,
  user_id uuid                       -- set when the person signs in later
);
create index on quick_wins (email);
create index on quick_wins (share_token);

create table verdicts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  quick_win_id uuid not null references quick_wins(id),
  input_kind text not null check (input_kind in ('screenshot','link')),
  input_url text,
  verdict verdict_kind not null,
  reasons jsonb not null,            -- string[]
  item jsonb not null,               -- {name, brand, category, colour, price_guess}
  saved_amount_inr int
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  quick_win_id uuid references quick_wins(id),
  email text not null,
  product product not null,
  currency text not null check (currency in ('INR','USD')),
  amount_minor int not null,         -- paise or cents
  list_amount_minor int not null,
  price_tier text not null check (price_tier in ('founding','finish_today','list')),
  status order_status not null default 'pending',
  provider text not null default 'dodo',
  provider_order_id text unique,
  raw jsonb
);
create index on orders (status);

create table counters (
  key text primary key,
  value_minor int not null default 0,   -- founding_revenue_usd_cents
  updated_at timestamptz not null default now()
);
insert into counters (key, value_minor) values ('founding_revenue_usd_cents', 0);
```

The founding counter is recomputed from `orders` on every paid webhook (sum of `paid` orders converted to USD cents at a fixed `INR_PER_USD` env rate) and cached in `counters`.

## 6. Routes (`apps/web/src/app`)

Static, built at deploy, revalidated daily:

| Route | What |
|---|---|
| `/` | two doors. Hero: wordmark, "Know what's working for you.", the drape fan, two large door cards (Men, Women) each with one line of copy and a CTA to its quick win. Below: how it works in three steps, the honesty promise (photos deleted, no fake scores), founding price line with the live counter (client component), three sample result cards. |
| `/men`, `/women` | the door landing: same structure, single door, door-specific copy and sample card, CTA to `/app/quick-win?door=men` |
| `/guides` | index by pillar and door, with filters as links (no JS needed) |
| `/guides/[slug]` | a guide page from `content/guides/*.json`: title, intro, sections with looks, tips, FAQ, related guides, a CTA block "see which of these you can already wear" linking to the quick win with the door preselected |
| `/tools` | the four tools, each a card |
| `/tools/colour-season`, `/tools/style-archetype`, `/tools/does-this-suit-me`, `/tools/wardrobe-gap` | tool landing pages that explain, show a sample, and route into the quick win (`colour-season` and `style-archetype` are the quick win with a different headline; `does-this-suit-me` is the quick win followed by the free verdict; `wardrobe-gap` is a static checklist page with a CTA, no AI in month 1) |
| `/pricing` | three tiers from the plan, founding counter, the honesty rules in plain words, FAQ |
| `/privacy`, `/terms` | from the old app's Privacy page, rewritten for photo handling |
| `/sitemap.xml`, `/robots.txt` | generated from the route list and content |

Dynamic (product):

| Route | What |
|---|---|
| `/app/quick-win` | the intake. Query `door=men|women` preselects. Steps: door, five answers, selfie (camera or upload, with the capture guidance), email, submit. Shows the fan while waiting. On success, redirect to `/r/[token]`. |
| `/r/[token]` | the result. Season, archetype, three strengths, one stop-buying, palette strip, confidence note (with "retake in daylight" if under 0.6), share buttons (copy link, download card image, share sheet on mobile), the finish-today price block with a live countdown and a "Get the Style Report" button, and the free verdict block. Public URL. Shows `opened_by_others` increments when a visitor who is not the owner opens it (owner detected by a cookie set at creation). |
| `/r/[token]/verdict` | upload a screenshot (or paste a link), get the verdict. One credit in month 1. |
| `/r/[token]/card.png` | 1200x630 share image. `/r/[token]/story.png` 1080x1920. Rendered with `next/og` ImageResponse from the stored profile. No photo. |
| `/checkout/success`, `/checkout/cancel` | after Dodo |

API:

| Route | Method | Contract |
|---|---|---|
| `/api/quick-win` | POST multipart: `door`, `answers` (JSON string), `email`, `selfie` (image, max 6 MB) | validates, calls the model, writes `quick_wins`, sets the owner cookie, returns `{token}` |
| `/api/verdict` | POST multipart: `token`, `screenshot` or `link` | checks credits, calls the model with the stored profile, writes `verdicts`, decrements credit, returns the verdict |
| `/api/share` | POST `{token}` | sets `shared_at` |
| `/api/open` | POST `{token}` | increments `opened_by_others` when the cookie is not the owner's |
| `/api/checkout` | POST `{token, product, currency}` | computes the price tier (section 8), creates the order `pending`, creates the Dodo checkout session, returns `{url}`; stub mode returns the success URL |
| `/api/webhooks/dodo` | POST | verifies signature, marks the order `paid` or `refunded`, recomputes the counter |
| `/api/counter` | GET | `{founding_usd_cents, cap_usd_cents, founding_active}` |

## 7. AI contracts (`packages/core`)

```ts
export const QuickWinProfile = z.object({
  season: z.enum(['spring','summer','autumn','winter']),
  season_depth: z.enum(['light','true','deep','soft','bright','warm','cool']),
  undertone: z.enum(['warm','cool','neutral']),
  archetype: z.string(),                 // from content/archetypes.json for the door
  working_for_you: z.array(z.string()).length(3),   // each points at something visible
  stop_buying: z.string(),               // one specific item or colour, phrased as an upgrade
  palette: z.array(z.string().regex(/^#[0-9a-f]{6}$/i)).min(6).max(8),
  confidence: z.number().min(0).max(1),
  retake_hint: z.string().nullable(),   // set when confidence < 0.6
});
export const Verdict = z.object({
  verdict: z.enum(['yes','yes_if','no']),
  reasons: z.array(z.string()).min(2).max(4),
  condition: z.string().nullable(),      // for yes_if
  item: z.object({ name: z.string(), brand: z.string().nullable(), category: z.string(), colour: z.string(), price_guess_inr: z.number().nullable() }),
  saved_amount_inr: z.number().nullable(),
});
```

System prompt rules (in `src/lib/ai.ts`, one per door, shared core): lead with what is working, each line names something visible in the photo; gaps as upgrades; no percentiles, no comparisons to other people; confidence reflects lighting and framing; the archetype must be one of the door's list; the palette is 6 to 8 hexes that suit the season and undertone; the verdict must be `no` or `yes_if` when the item duplicates a strength the profile already covers, clashes with the palette, or does not match the stop-buying guidance, and the engine is told that an honest no is more valuable than a polite yes. The five answers (section 9) are passed as context.

## 8. Pricing engine (`src/lib/pricing.ts`)

Constants:

```
LIST:      report INR 1499 / USD 24 · pro INR 4999 / USD 79
FINISH:    report INR 999  / USD 15
FOUNDING:  report INR 499  / USD 10 · pro INR 1999 / USD 39
FOUNDING_CAP_USD_CENTS = 100000
INR_PER_USD = env, default 84
```

`priceFor(product, currency, quickWin, counter)`:
1. If `counter.founding_usd_cents < FOUNDING_CAP_USD_CENTS` the tier is `founding`.
2. Else if product is `report` and `now < quickWin.finish_today_expires_at` the tier is `finish_today`.
3. Else `list`.
Returns `{tier, amount_minor, list_amount_minor, expires_at | null}`. The result page shows exactly one price and, when the tier is `finish_today`, the countdown. When expired it shows the list price and the line "Your finish-today price ended on <date>". Currency defaults from `Accept-Language` and the `cf-ipcountry`/`x-vercel-ip-country` header: `IN` gets INR, everything else USD, with a toggle.

Pro checkout in month 1 creates the order and says "Pro opens in month 3; your founding price is locked" on the success page.

## 9. The five answers

Shared across doors, answer options differ by door, stored as `answers` JSON:

1. `life`: where your clothes need to work: office / hybrid / outdoors / creative / student
2. `climate`: hot and humid / hot and dry / four seasons / mostly cool
3. `occasions` (multi): weddings and festive / dates and evenings / travel / gym and casual / formal work
4. `budget_per_item`: under 1,500 / 1,500 to 4,000 / 4,000 to 10,000 / above 10,000 (INR, with USD equivalents shown)
5. `vibe`: men: clean and minimal / relaxed and easy / sharp and tailored / bold and expressive. women: polished / relaxed / romantic / bold / classic

## 10. Analytics events (PostHog)

Browser: `door_selected`, `quick_win_started`, `quick_win_step` {step}, `selfie_captured` {source: camera|upload}, `quick_win_submitted`, `result_viewed` {owner: bool}, `card_shared` {channel}, `card_downloaded`, `verdict_started`, `verdict_viewed` {verdict}, `pricing_viewed` {tier}, `checkout_started` {product, tier, currency}, `guide_viewed` {slug, door, pillar}, `tool_viewed` {tool}.
Server: `quick_win_created` {door, confidence}, `verdict_created` {verdict}, `order_created` {product, tier, currency, amount}, `order_paid`, `order_refunded`, `founding_counter_updated` {usd_cents}. Person is identified by email hash, never raw email.

## 11. Content model (`apps/web/content`)

`guides/<slug>.json`:

```json
{ "slug": "diwali-outfits-men", "door": "men", "pillar": "A", "title": "...", "description": "...", "updated": "2026-10-10",
  "intro": "...", "sections": [{ "heading": "...", "body": "...", "looks": [{ "name": "...", "pieces": ["..."], "budget_inr": "...", "why": "..." }], "tips": ["..."] }],
  "faq": [{ "q": "...", "a": "..." }], "related": ["slug"], "cta": { "headline": "...", "sub": "..." }, "keywords": ["..."] }
```

Month 1 inventory, 54 pages:
- 42 guide pages: the 21 existing guides each split into a men's and a women's page with door-specific looks, local brands and INR or AED prices, climate notes. Slugs: `<topic>-men`, `<topic>-women`. The old slugs redirect to the men's page from the closet app and 301 from the web app (`next.config` redirects).
- 8 colour pages (pillar B): `best-colours-wheatish-skin-men`, `best-colours-wheatish-skin-women`, `best-colours-dusky-skin-men`, `best-colours-dusky-skin-women`, `best-colours-fair-skin-men`, `best-colours-fair-skin-women`, `warm-vs-cool-undertone-indian-skin`, `colour-season-guide-india`.
- 4 tool pages.

`archetypes.json`: eight archetypes per door, each with a name, one-line description, three signature pieces, and the vibe answer it maps to. `seasons.json`: the four seasons with depth variants, undertone, a 12-hex palette, and "wear more / wear less" lists per door.

Writing rules for content: the voice in section 4; every page has at least one data block that no other page has (local brands with prices, a climate note, a looks table); no page under 600 words; no fashion news; each page ends with the CTA block naming the quick win.

## 12. Closet app changes (`apps/closet`)

- Move as-is. Fix import paths broken by the move. Build must pass.
- A top banner component: "fitso has a new home at fitso.me. Your closet stays here." with a link. Dismissable per session.
- Guide routes redirect to `https://fitso.me/guides/<slug>-men` (301 via `vercel.json` redirects and a client fallback).
- Landing page CTA copy changes from "Build your wardrobe" to "Open your closet"; the marketing sections about guides are removed since they live on the new site.

## 13. Environment

`apps/web/.env.example`:

```
NEXT_PUBLIC_SITE_URL=https://fitso.me
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
AI_GATEWAY_API_KEY=
AI_MODEL_QUICK_WIN=anthropic/claude-sonnet-5-5
AI_MODEL_VERDICT=anthropic/claude-sonnet-5-5
AI_MODEL_REPORT=anthropic/claude-opus-5-5
DODO_API_KEY=
DODO_WEBHOOK_SECRET=
DODO_PRODUCT_REPORT_INR=
DODO_PRODUCT_REPORT_USD=
DODO_PRODUCT_PRO_INR=
DODO_PRODUCT_PRO_USD=
INR_PER_USD=84
OWNER_COOKIE_SECRET=
```

`src/lib/env.ts` validates with zod at startup and reports which optional integrations are in stub mode.

## 14. Non-goals for month 1

The Style Report content, Pro features, wardrobe auto-fill, rail photos, the import wizard in the new app, email sending, dark mode, accounts and sign-in in the new app (the quick win is cookie-owned; sign-in arrives with the Report in month 2), Reels or Pinterest tooling, the pen.dev brand file (separate track).

## 15. Acceptance

- `npm run build` passes at the root (both apps) and `npm run lint` passes for `apps/web`.
- `apps/web` boots with no secrets in stub mode: the quick win returns a fixture profile, checkout goes to the success page, the counter reads 0.
- With real keys the quick win returns a schema-valid profile for a real selfie in under 20 seconds.
- Lighthouse on `/` and one guide page: performance and SEO above 90 on mobile.
- `/sitemap.xml` lists 54 content pages plus the static routes. `/robots.txt` allows all and names the sitemap.
- The closet app builds, shows the banner, and its guide URLs redirect.
- Every analytics event in section 10 fires where named.
- No photo bytes are written to disk, blob storage, logs, or the database. A code search for the upload buffer confirms it is only passed to the model call.
