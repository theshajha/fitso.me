# Read engine: design spec

Date: 2026-10-10. Follows `docs/decisions/2026-10-10-reports-reframe.md`. Built end to end in the same session on the user's instruction; routine calls made by the builder are marked "call".

## Goal

One photo and a few answers go in. One run produces the free read and the full Style Report. The free read shows at once. The report unlocks in place after payment. Every line in both is tied to something visible in the photo.

## Pipeline

```
photo ──> gate ──> observe ──> judge ──> write ──> verify ──> store
          Haiku     Opus        Opus      Sonnet    TypeSafe   quick_wins.profile + quick_wins.report
          5.5       5.5         5.5       5.5       Jev
```

- **gate** (`claude-haiku-5-5`, vision, structured): usable or not, issues from a fixed list, one kind ask, and how the person presents (man, woman, unsure). Runs on its own route before the questions so the person fixes the photo first and the flow picks the door without asking.
- **observe** (`claude-opus-5-5`, vision, structured): what is visible. Skin depth and undertone evidence, hair, eyes, contrast, face shape and features, build, every garment with colour and fit, photo conditions. No opinions.
- **judge** (`claude-opus-5-5`, effort high, structured, no image): season and depth, undertone, contrast, palette of 8, 3 to avoid, archetype from the door's list, three working claims each with evidence, the one change, the three report parts as facts, keep or change lists for colours, cuts, fabrics, details.
- **write** (`claude-sonnet-5-5`, structured): the stylist's voice. Free slice: headline, three working lines, change line, palette caption. Report: about you, about your style, what works and what does not, closing.
- **verify** (TypeSafe Jev, optional on `TYPESAFE_API_KEY`): for each free line, a Choice over {supports, contradicts, says_nothing} against the observation. A contradiction or low confidence sends judge and write back once with the failing lines named. Notes are stored with the report.

Photo bytes live in one local variable in the route and are passed to gate and observe only.

## Free versus paid (call)

- Free, shown at once, no email: season label, three working lines, the one change, the palette.
- Paid: the three report parts. Generated in the same run. Unlocked on the result page the moment the order is paid (or `test` in stub mode). No ship date anywhere.
- Email: asked on the result page, not before it. Required to save the result and to buy. The `quick_wins.email` column becomes nullable.

## Flow

1. Photo first. The gate runs. If not usable, the ask is shown and the person retakes.
2. Four or five questions. The door comes from the gate; if `unsure`, one extra question asks.
3. Submit. Waiting screen. Result page.
4. On the result page: free read, "save to email", the locked report with its three part titles, the price, one button.

## Quality bar

The report must feel worth ten times its price. Cost per run is secondary. The eval script `apps/web/scripts/eval-read.ts` runs the pipeline on the photos in a folder and prints every stage so prompts can be tuned by reading real output.

## Out of scope here

Pro, the verdict code (kept, unused), real photos for the hero, the Dodo and Supabase keys.

## Additions after the first eval (same day)

- **Multi-photo.** One to four photos of the same person. The gate runs per photo in the flow. The observer runs once per photo in parallel; the judge receives all observations and reconciles them (daylight outranks indoor light for colour, the full-length photo decides build, several outfits show range). `photo_count` is stored on the report.
- **Streaming.** `POST /api/quick-win` returns NDJSON: `{type:"stage", stage, status:"start"|"done", data?}` per stage, then `{type:"done", token}` or `{type:"error", code, message}`. `data` is a small, photo-free summary per stage so the processing screen can build the analysis live. The owner cookie goes out in the headers before the body streams.
- **Report after the response.** The run returns once the free slice is written. The report text is written in `after()` and stored on the same row; the result page polls until it is there.
- **Tolerance.** Palette and working counts are normalised in code (hex normalised, lists sliced), and each model call retries once on a schema failure.
- **Guardrails** (`src/lib/guard.ts`): optional `ACCESS_CODE` with a signed cookie set at `/access`; per-IP sliding-window limits (30 photo checks and 5 reads per hour); a daily cap on reads in the `counters` table (`MAX_READS_PER_DAY`, default 200). Vercel's firewall rate limit should sit in front in production.
- **Heritage.** The gate reads heritage with a confidence; below 0.6 the flow asks once, optionally. Prompts no longer assume a region.
- **Eval findings on 24 photos.** Gates rejected dark, filtered, multi-person and scanned images correctly. Claims cite evidence; the checker supported most lines at 0.8 or higher. Fixed from the run: third-person slips, mentions of "the observer" in customer text, an autumn bias in warm light (clarity added as a fourth axis), four working items instead of three, one bad hex.
