# Report output contract

Date: 2026-10-10. Source of truth: `packages/core/src/read.ts` (`ReadReport`). This page is the reading guide for whoever renders it.

One read produces one `ReadReport` JSON, stored on `quick_wins.report`. The free slice is complete when the row is created. The paid parts (`plan`, `text.report`, `card`) are null until the background step finishes, about 60 to 90 seconds later; the row is updated in place. Poll the row until `plan` is non-null.

```
ReadReport
├─ door, presented_as, photo_count
├─ colour            the season vote: season, season_depth, undertone, contrast, clarity,
│                    reasoning, votes (3), agreement (1.0 = all agreed)
├─ observations[]    what the observer saw per photo: heritage, skin, hair, eyes, contrast,
│                    face, build, outfit.items[], photo conditions. The evidence. No photo bytes.
├─ decisions         the stylist's calls (always present)
│  ├─ season, season_depth, undertone, contrast, clarity
│  ├─ palette[8]     {name, hex, use}            the colour fan
│  ├─ neutrals[3-5]  {name, hex, use}            trousers, coats, bags, shoes
│  ├─ metal, metal_why
│  ├─ flow[2-4]      {name, hex, keep}           neighbouring-season shades that still work
│  ├─ must_axis / flexible_axis (+ why)          what they cannot bend, what they can
│  ├─ avoid[3]       {name, hex, why}
│  ├─ changing_room_test                         2 to 3 sentences, for this person
│  ├─ archetype, archetype_why
│  ├─ style_words[3], style_words_why           the purchase filter
│  ├─ working[3]     {claim, why, evidence}      the free read's three lines, with proof
│  ├─ change         {swap_out, swap_in, why, evidence}
│  ├─ line.face      shape, necklines[], collars[], glasses, hair, earrings_or_scale
│  ├─ line.body      summary, silhouettes[], rise_and_lengths[], print_scale,
│  │                 accessory_scale, fabric_weight, fit_fixes[]
│  │                 every item is {what, why, evidence}; "what" is imperative
│  ├─ grooming[]     {area, verdict keep|change, what, why}
│  └─ confidence
├─ plan              (paid; null until written; rebuilt when the person adds settings)
│  ├─ audit          keep[] {item, why}, retire[] {item, why, instead}   from the photo
│  ├─ outfits[5-7]   {occasion, name, pieces[3-6] {slot, item, colour_name, hex, cut,
│  │                 fabric, from_photo}, why}
│  │                 every hex is in palette ∪ neutrals (checked in code)
│  ├─ buy[5-8]       {priority, item, search_terms, colour_name, hex, fabric, cut,
│  │                 length_or_fit, wear_with, unlocks, budget_tier basic|mid|investment}
│  ├─ stop_buying[3] {item, why}
│  ├─ filters[5]     under 12 words each, the shop rules
│  ├─ this_week      one action
│  └─ built_for      {settings[], source stated|inferred}
├─ text.free         headline, working_lines[3], change_line, palette_caption
├─ text.report       (paid; null until written) prose only:
│                    colour.intro, colour.how_to_combine, line.face_intro, line.body_intro,
│                    style.what_you_wear, style.what_it_says, style.the_words,
│                    outfits_intro, buy_intro, grooming_intro, closing
├─ card              (paid) the phone-sized shop card: season, palette, neutrals, metal,
│                    words[3], filters[5]
├─ verification[]    {claim, relation supports|contradicts|says_nothing|skipped, confidence}
├─ models, took_s
```

## The report, section by section, and where each part comes from

| Section | Lists and cards from | Prose from |
|---|---|---|
| Card | `card` | none |
| 1 Colour | `decisions.palette`, `neutrals`, `metal`, `flow`, `must_axis`, `flexible_axis`, `avoid`, `changing_room_test` | `text.report.colour.intro`, `colour.how_to_combine` |
| 2 Line | `decisions.line.face`, `line.body` | `text.report.line.face_intro`, `line.body_intro` |
| 3 Style | `decisions.archetype`, `style_words`, `plan.audit` | `text.report.style.*` |
| 4 Outfits | `plan.outfits`, `plan.built_for` | `text.report.outfits_intro` |
| 5 Buy | `plan.buy`, `plan.stop_buying` | `text.report.buy_intro` |
| 6 Grooming | `decisions.grooming` | `text.report.grooming_intro` |
| 7 Week | `plan.filters`, `plan.this_week` | `text.report.closing` |
| What we saw (proof) | `observations[0]`, `colour`, `decisions.working`, `decisions.change` | none |

## Adding the person's settings after payment

`POST /api/result-context` with `{ token, life?, climate?, occasions? }` (owner cookie required). The server merges the answers, rebuilds `plan`, `text.report` and `card` for those settings, and updates the row. `plan.built_for.source` becomes `stated`. Takes 60 to 90 seconds; poll the row.

Allowed values: `life` one of office, hybrid, outdoors, creative, student; `climate` one of "hot and humid", "hot and dry", "four seasons", "mostly cool"; `occasions` any of "weddings and festive", "dates and evenings", "travel", "gym and casual", "formal work".

## Guarantees

- Every outfit piece and buy item uses a palette or neutral hex, exactly. Checked in code; a stray colour is snapped to the nearest allowed one.
- Every `Advice` and `Grounded` item has `evidence` naming the observation detail it rests on.
- The free read's four lines are checked against the observations by a second model; results are in `verification`.
- `plan` and `text.report` can be null for up to about two minutes after the row appears, and for a short while after `result-context` is called.

## Added later on 2026-10-10

- **Measurements.** `answers.height_cm` and `answers.waist_cm` are optional numbers. When given, the observer and judge use them for proportions and say so in the evidence. `POST /api/result-context` accepts them too.
- **Visuals.** `report.visuals[]` is `{outfit, image (data URL), model}`, generated with Gemini's image model from the person's own photo and each planned outfit, up to three. Empty unless `GEMINI_API_KEY` is set. Only produced in the initial background step, while the photo is still in memory; a later `result-context` rebuild does not add visuals.
- **Samples.** `apps/web/content/samples/women.json` and `men.json` hold a full run on the two hero photos: `{made_at, photo, answers, profile, report}`. Rebuild with `npx tsx scripts/make-samples.ts` after an engine change. These are the fixtures to render as the public sample reports.
