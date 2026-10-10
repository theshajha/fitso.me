# fitso.me pivot plan: from wardrobe inventory to the honest stylist

Date: 2026-10-10. Horizon: six months, to 2027-04-10. Owner: Shashank, solo. Budget: near zero fixed cost.

## Verdict

Pivot fitso.me into an AI stylist that makes three decisions for a person: what is working for them, what their wardrobe should be, and whether to buy a specific item. Sell it as a free quick win, a one-time Style Report, and an annual Pro plan. Grow it only through content and shared result cards.

The real goal is $5,000 a month by December 2027, from this product or a family of products that grow out of it. This six-month plan is phase one: get as close as the funnel allows, steer every month, and learn which pillar compounds. The six-month base case lands near $5,000 only if traffic ramps as modelled; the low case is about $1,900. Both are progress, and both are reviewed at the monthly check-in (section 13).

$5,000 a month needs about 125 paying buyers a month at a blended $35, plus about $700 a month in affiliate commissions. At the modelled funnel that needs about 15,000 visitors a month. The site has 51 visitors a month today. **Traffic is the binding constraint, not the product.** Roughly 60 percent of the six-month effort goes into the content engine, 40 percent into the product.

Pricing is built to win the impulse: a real founding price, a real personal timer, a credit you earn by sharing, and nothing fake. Section 4.1 has the mechanism and section 14 the game theory behind it.

Decisions that need your call are in section 12.

## 1. Where we start

| Fact | Value | Source |
|---|---|---|
| Visitors, last 30 days | 51 | PostHog web overview, 2026-10-10 |
| Sessions, last 30 days | 63, bounce 70 percent | PostHog |
| Guides written | 21 (8 festival, 6 travel, 2 occasion, 2 lifestyle, 2 celebration, 1 seasonal) | `src/lib/guides/` |
| Guides indexable | effectively none: client-rendered SPA, every guide URL serves the homepage head, no sitemap, no robots file | `vercel.json`, `public/_redirects`, `index.html` |
| AI in product | none; the "AI categorization" is regex | `src/lib/importers/categoryDetection.ts` |
| Order import | Myntra and Ajio bookmarklets that scrape the DOM, high fragility | `src/lib/importers/scrapers/` |
| Stack | React 19 + Vite SPA, Supabase auth and Postgres, Dexie local store, Cloudflare Worker + R2 for images, PostHog | repo |
| Known security gap | browser queries the database directly | agents stack notes |
| Last commit | 2026-08-31, project marked paused | git |

What carries over: Supabase auth and data, the image worker, the item schema, the analytics wiring, the 21 guides as seed content, the packing and wishlist features as low-priority Pro extras, and the domain with six months of age.

What does not carry over: the manual-inventory framing, the landing page promise, the SPA as the home of content pages.

## 2. What we learned from the market

Verified by a three-reviewer research pass unless marked.

- **Whering** is the best-funded direct competitor: about $7M seed led by eBay Ventures and Google AI Futures Fund, nearly $14M total, about 10M users, mostly Gen Z. Its AI features (virtual try-on, a styling chatbot) are announced, not shipped. Its gating could not be verified.
- **Alta** raised $11M seed in June 2025 (Menlo Ventures) for an AI stylist and personal shopper. Currently free with paid tiers undisclosed. Unverified beyond the funding.
- **Style DNA** is the closest working product: selfie colour analysis, body-type guidance, a photo check of store items. Subscription only, with "poor value for money" and "unauthorized charges" among its top review complaints. Unverified, from app store aggregators.
- **Colour analysis apps** (My Best Colors, Drape, Colorayz, Dressika) mostly sell a one-time unlock; a few push weekly subscriptions. Unverified.
- **Stylebook** is a one-time 3.99 EUR manual closet app with no AI. Low confidence.
- **Myntra** expected 200M annual active users by end of 2025, hit an 80M monthly peak in the festive season, and reports Gen Z as half its active base.
- **India online fashion** is forecast to add about USD 56B at 21 percent a year from 2025 to 2030 (Technavio).
- **Conversion benchmark**: hard-paywall mobile apps convert about 12 percent of installs to paid by day 35 against about 2 percent for open freemium (RevenueCat 2025 guest commentary, low confidence, mobile not web). Lesson: keep the free tier narrow and put the paywall right after the first visible result.
- **Payments**: Dodo Payments is a merchant of record with India domestic cards and UPI at about 4 percent plus a fixed fee, plus 1.5 percent international and 0.5 percent for subscriptions. Paddle and Lemon Squeezy both list 5 percent plus 50 cents, with Paddle's Indian onboarding reported as selective. Razorpay is 2 percent domestic but is not a merchant of record. Unverified beyond vendor pages.
- **Affiliate**: Myntra pays about 5 to 8 percent through networks and 8 to 12 percent through its in-app creator program. Amazon India fashion pays about 5 to 9 percent. Unverified beyond affiliate blogs.
- **Search demand** for colour analysis, capsule wardrobes, and occasion outfits could not be quantified. The qualitative signal is strong: colour analysis is a sustained TikTok and Pinterest trend, and every 2026 menswear source frames the year as "fewer, better pieces".

Nobody verified competes on the two things this plan leads with: an honest, flattering read of what is working for the person, and a yes/no on a specific item judged against a target wardrobe. The import pipeline for Indian stores is also unique.

## 3. The product

### 3.1 Three decisions

```
Decision 1  WHAT IS WORKING FOR ME         style profile from photos
            colour season, face and feature read, body proportion, style archetype
            output: "three things working for you" first, then the rules that follow

Decision 2  WHAT SHOULD MY WARDROBE BE     target wardrobe plan
            user declares the wardrobe they want (life, climate, work, occasions, budget, vibe)
            AI builds a core wardrobe template, compares it to what they own, produces a gap list and a phase-out list

Decision 3  SHOULD I BUY THIS              verdict on an item
            screenshot or link in, verdict out: yes / no / yes-if, with reasons tied to the profile and the target
            every yes adds the item to the wardrobe, every no is a saved purchase shown on the dashboard
```

Decision 1 is the proof moment and the share hook. Decision 2 is what makes Decision 3 a real decision instead of "it suits you". Decision 3 is the daily habit and the affiliate channel.

### 3.2 Honest flattery, as a product rule

Every output leads with specific, true positives. The rules:

1. The first screen of any result is "what is working for you", with at least three observations the model can point to in the photo.
2. Every gap is phrased as an upgrade, never a flaw. "A spread collar will do more for your jawline" not "avoid narrow collars".
3. No fabricated comparisons. No "better than 80 percent of people". A percentile claim is a comparison the model cannot make and reads as a trick the second time a user sees it.
4. Confidence is shown. A low-confidence colour read says "retake in daylight for a sharper call" instead of guessing.
5. The tone is a friend who dresses well and likes you, not a fashion editor.

### 3.3 Two front doors

Same engine, separate doors. Nothing on the women's side should read as the men's product with the pronouns changed.

| | Men | Women |
|---|---|---|
| What they are buying | a uniform that works, fewer decisions | a range that handles occasions, more options |
| Unit of thought | the item | the outfit |
| Profile emphasis | fit, proportion, colour palette, grooming cues | colour season, body shape, silhouette, occasion range |
| Target wardrobe | 20 to 35 piece capsule, two or three looks | 40 to 60 pieces across occasion families, outfit formulas |
| Verdict logic | duplicates, fit, palette, replaces a tired item | pairs with what she owns, occasion coverage, silhouette |
| Content topics | capsule, office, wedding guest, Goa, interview, "stop buying navy" | wedding season, festive, office, body shape, colour palette, "what to wear with X" |
| Tone | direct, low-word-count | warm, visual, more options shown |
| Share card | "your three strengths" | "your season and palette" |

Separate: intake questions, archetype library, core wardrobe templates, content calendars, landing pages, result card designs, copy. Shared: vision model, item schema, verdict engine, import, billing, analytics.

### 3.4 The wardrobe fills itself

Manual entry killed the first version. Three automatic inputs replace it:

1. Verdict yeses become items.
2. Myntra and Ajio order import (exists, fragile). Keep it, move it behind a "did this work?" check, and add a screenshot fallback.
3. "Photo of your rail": the user photographs a section of their wardrobe and the vision model itemises it. Five photos cover most wardrobes.

### 3.5 Capture quality

Colour season reads are only as good as the lighting. The intake guides the user: daylight, no filter, white or neutral background, hair pulled back, one close face shot, one full-length shot. The model returns a confidence score. Below a threshold the result says so and asks for a retake. Honest beats wrong.

### 3.6 Privacy

Original photos are deleted after the profile is generated. Only the derived profile and a user-approved thumbnail are kept. This is both the right thing and a selling line.

## 4. Tiers and pricing

Three tiers. The free tier proves it works on this person and is deliberately narrow. The Report is the impulse purchase. Pro is the expensive tier for the people for whom this matters.

| Tier | Price | What you get | Why it exists |
|---|---|---|---|
| **Free quick win** | 0 | one selfie plus five answers. Colour season, style archetype, your three strengths, one "stop buying this", a shareable result card, one free verdict. Email required to see the result. | proof on your own face, list building, the share hook |
| **Style Report** (one-time) | INR 1,499 / USD 24 | full profile from five to eight photos (face, full length, closet rail), target wardrobe intake, core wardrobe template for your life, gap list and phase-out list, ten verdicts, PDF | the impulse buy. Less than one wrong shirt. |
| **Pro** (annual) | INR 4,999 / USD 79 | everything in the Report plus unlimited verdicts under fair use, wardrobe auto-fill (import, rail photos, verdict yeses), live shopping list for your gaps with links, trip packing from your real wardrobe, "what do I wear to X" answered for you, a re-profile each season | the expensive tier. For people who shop often and want the decision made every time. |

Upgrade rule: a Report buyer who upgrades to Pro within 30 days has the Report price credited.

Regional pricing: INR for India, USD for the Gulf and global. The USD price is deliberately higher than the FX conversion because the Gulf buyer's reference price is a Namshi order, not a Myntra order.

Price test in month five: Report at INR 999 against 1,499, Pro at 3,999 against 4,999. The plan's base case uses the higher prices as list prices. What people actually pay in the first months is set by the urgency mechanism below.

### 4.1 Honest urgency: how the price wins the impulse

A visitor who sees USD 24 and no reason to decide today will decide tomorrow, and tomorrow never comes. Three mechanisms give a real reason to decide now. Each is true, each is enforced, and none runs on the landing page for a stranger who has done nothing yet.

| Mechanism | What the user sees | What makes it true | What it is for |
|---|---|---|---|
| **Founding price** | "Founding price: Report INR 499 / USD 10, Pro INR 1,999 / USD 39, until fitso has earned its first USD 1,000. USD 612 of 1,000 so far." | The counter is live from the payments webhook. When it reaches 1,000 the founding price ends and never returns. Founding Pro members keep their price on every renewal. | scarcity that is public and verifiable. The counter is common knowledge, so it creates a rush without a fake "3 left". |
| **Finish-today price** | On the free result page: "Your Report price for the next 24 hours: INR 999 / USD 15. After that, INR 1,499 / USD 24." with a visible countdown. | The timer is server-side, one per account, starts when the free result is shown, and never resets. A user who returns on day three sees the list price and the line "your finish-today price ended on <date>". | urgency that rewards the effort already spent. The user has uploaded a photo and seen something true about themselves. The discount is for finishing, not for being rushed. |
| **Share credit** | "Post your card, get INR 500 / USD 8 off Pro for 7 days." | The credit is issued when the card is opened by someone else at least once. | a price the user earns by doing the thing that grows the product. Referral as discount. |

During the founding period the finish-today price is the founding price, so there is one number on the screen, not two.

Rules that keep this on the right side of honest:

1. A timer never resets, extends, or reappears. Expired means expired.
2. The counter and the list price are real. The list price is what people pay after the founding period, and the plan's base case is built on it.
3. No countdown for anonymous visitors. Urgency starts after the user does something.
4. No "only N left" unless N is a real cap. Founding is capped by revenue, not by a made-up seat count.
5. Refunds over 3 percent of sales in a month pause every urgency mechanism until the cause is found. The monthly review checks this.

Effect on the model: months one and two run at about USD 15 blended revenue per buyer instead of 34, and the first USD 1,000 should land in month two or early three. Conversion is expected to run higher under founding pricing, so the monthly buyer targets in section 5 stand, and the revenue targets for months one and two are soft. From month three the list price and the finish-today price carry the model.

## 5. Path to $5,000 a month

### 5.1 Unit economics

| Item | Value | Basis |
|---|---|---|
| Blended Report price | USD 20 | 60 percent India at USD 18 equivalent, 40 percent Gulf and global at USD 24 |
| Blended Pro price | USD 68 | 60 percent India at USD 60 equivalent, 40 percent at USD 79 |
| Buyer mix | 70 percent Report, 30 percent Pro | assumption, impulse tier dominates early |
| Revenue per buyer | USD 34.4 | 0.7 x 20 + 0.3 x 68 |
| Payment fees | 5.5 percent of revenue | Dodo, INR and USD blended |
| Model cost, Report | USD 0.10 to 0.30 | Opus 5.5 at USD 4 in / USD 20 out, about eight images at roughly 1,500 tokens each plus 4,000 output tokens |
| Model cost, verdict | USD 0.01 to 0.03 | Sonnet 5.5 at USD 2 in / USD 10 out, one image plus cached profile |
| Model cost, free quick win | about USD 0.02 | Sonnet 5.5, one image |
| Affiliate per verdict yes | about USD 1.40 | INR 2,000 average item at 6 percent |

Fig. 1: the funnel from visitor to buyer. Of 100 visitors, 15 start the quick win, 10 finish it, and 0.8 buy. The cost of a buyer is under a dollar in model spend; the cost that matters is the visitor.

### 5.2 Funnel assumptions

| Step | Rate | Basis |
|---|---|---|
| Visitor starts the quick win | 15 percent | quiz-style landing pages with a visible result card |
| Starter finishes | 65 percent | one selfie, five answers, under two minutes |
| Finisher buys within 14 days | 8 percent | between the 2 percent open-freemium and 12 percent hard-paywall benchmarks; the free result is real but partial |
| Visitor to buyer | 0.8 percent | product of the above |
| Report buyer upgrades to Pro within 90 days | 10 percent | assumption |
| Pro user verdict yeses a month | 6 | assumption |
| Verdict yes converted via affiliate link | 40 percent | assumption |

### 5.3 Monthly targets

| Month | Period | Visitors | Quick wins done | New buyers | Subscription revenue | Affiliate | Total |
|---|---|---|---|---|---|---|---|
| 1 | 2026-10-15 to 2026-11-14 | 1,000 | 100 | 5 | USD 120 | 0 | USD 120 |
| 2 | to 2026-12-14 | 3,000 | 300 | 20 | USD 600 | USD 30 | USD 630 |
| 3 | to 2027-01-14 | 6,000 | 600 | 45 | USD 1,450 | USD 100 | USD 1,550 |
| 4 | to 2027-02-14 | 9,000 | 900 | 75 | USD 2,500 | USD 250 | USD 2,750 |
| 5 | to 2027-03-14 | 12,000 | 1,200 | 100 | USD 3,500 | USD 450 | USD 3,950 |
| 6 | to 2027-04-14 | 15,000 | 1,500 | 125 | USD 4,300 | USD 700 | USD 5,000 |

Subscription revenue includes Report-to-Pro upgrades from earlier cohorts. Affiliate assumes the Pro base compounds.

Fig. 2: the six-month revenue ramp against the visitor ramp. The two lines have the same shape because conversion is held flat; the plan's bet is on traffic.

### 5.4 Scenarios at month six

| Scenario | Visitors | Visitor to buyer | Buyers | Revenue per buyer | Affiliate | Month 6 total |
|---|---|---|---|---|---|---|
| Low | 8,000 | 0.6 percent | 48 | USD 34 | USD 250 | USD 1,900 |
| Base | 15,000 | 0.8 percent | 120 | USD 34 | USD 700 | USD 4,800 |
| High | 25,000 | 1.0 percent | 250 | USD 38 | USD 1,400 | USD 10,900 |

The low case still clears cost by ten times. The thing that moves the base to the high case is one content pillar outperforming, not a product feature.

### 5.5 Where month-six visitors come from

| Source | Share | Visitors | How |
|---|---|---|---|
| Occasion pages (search) | 40 percent | 6,000 | programmatic "what to wear to X" pages, India and Gulf first |
| Colour and feature pages (search) | 20 percent | 3,000 | "best colours for wheatish skin", season pages, "does X suit Y" |
| Social (Reels, TikTok, Pinterest) | 25 percent | 3,750 | result-card posts, "AI read my face kindly" format, Pinterest pins of palettes and capsules |
| Shared result cards | 10 percent | 1,500 | every free result is a card built to be posted; the card links back |
| Reddit and communities | 5 percent | 750 | r/IndianFashionAddicts, r/malefashionadvice, r/femalefashionadvice, Dubai expat groups |

## 6. The content engine

### 6.1 The one rule

Every piece of content is a question the product answers better than the page does. The page gives the generic answer in full, and the call to action gives the personal one. "Here are three Diwali looks for men. Want to know which one you can already wear from your closet, and what one item would upgrade it?"

Content that does not map to a decision does not get made. No fashion news, no trend reports, no celebrity coverage.

### 6.2 Four pillars, each tied to a decision

| Pillar | Maps to | Page type | Scale by | Example titles | CTA |
|---|---|---|---|---|---|
| A. What to wear to X | Decisions 2 and 3 | occasion page: three looks per budget band, local brands, INR or AED prices, climate note | occasion x gender x region x budget | "Sangeet outfits for men, Bangalore, under 5,000", "Dubai brunch outfits for women", "Interview outfit India men", "Goa trip packing women" | "see which of these you can already wear" |
| B. Colour and features | Decision 1 | colour page: palette shown, what to buy, what to stop buying, celebrity examples with the same season | skin tone x season x gender; feature x garment | "Best colours for wheatish skin men", "Deep autumn palette for Indian women", "Which collar suits a round face" | "find your season from one selfie" |
| C. Should you buy X | Decision 3 | item or brand verdict page: who it works for, who it does not, what it replaces, what to pair it with | brand x item x season | "Is the Rare Rabbit oversized shirt worth it", "Zara vs H&M chinos in India", "Best white sneakers under 4,000" | "check this against your profile" |
| D. Core wardrobe templates | Decision 2 | capsule page: the full list, the looks it makes, the budget, the shopping order | life situation x gender x climate | "20-piece capsule for a Bangalore techie", "Dubai office wardrobe for women", "Monsoon capsule men" | "build yours from what you own" |

The existing 21 guides are seeds for Pillars A and D. They move to the new content site unchanged in substance, rewritten in the new voice, and split by gender where the current page serves both.

### 6.3 Free tools as content

Each free tool has its own page targeting its own keyword, and each one is the quick win in a different costume:

- Colour season from a selfie (the main quick win)
- Style archetype quiz (five questions, no photo, lowest friction)
- "Does this suit me" single verdict (upload one product screenshot)
- Wardrobe gap calculator (tick what you own from a template, see the gaps)

### 6.4 Social formats

- **Result card posts.** The free result is designed as a vertical card with the person's season, archetype, and three strengths. It is the share unit. Every card carries the URL.
- **"AI read my face, kindly."** Short video format: selfie in, three true compliments out, one upgrade. The honesty is the hook. The flattery is the share.
- **Pinterest.** Palettes, capsules, and occasion boards. Pinterest behaves like search and women's fashion is its largest category. Every Pillar B and D page gets pinned as an image.
- **Reddit.** Honest, non-promotional answers in style threads with the tool mentioned when it is the real answer. One account, long memory, no spam.

### 6.5 Production and quality

- AI drafts, you edit. The pipeline takes a pillar template plus structured inputs (occasion, gender, region, budget, climate, local brands with prices) and drafts a page. You review in batches.
- Capacity: 10 pages a day on a production day, two production days a week, so about 80 pages a month.
- Uniqueness guard: every page carries data that is not on any other page (local brands, local prices, climate, a verdict table). This is what keeps programmatic pages out of Google's scaled-content penalty. Thin variants are not published.
- Month five adds aggregate verdict data to pages: "of users with a warm autumn profile, 7 in 10 got a yes on this item". That is data no competitor has.
- Cadence: 2 production days a week on pages, 3 short videos a week, 20 pins a week, 3 Reddit replies a week.

### 6.6 Page counts

| Month | Pages live | Note |
|---|---|---|
| 1 | 50 | 21 migrated and split by gender, plus Pillar B colour pages and the four tool pages |
| 2 | 150 | wedding season push: sangeet, mehendi, reception, cocktail, for both genders and four cities |
| 3 | 300 | Pillar C verdicts on the top 50 Myntra and Namshi items |
| 4 | 450 | Gulf pages, Ramadan and Eid run-up |
| 5 | 600 | verdict-data enrichment on the top 100 pages |
| 6 | 750 | prune the bottom 20 percent, double the top 10 percent |

### 6.7 Calendar alignment

| Window | What is happening | Content push |
|---|---|---|
| Oct to Nov 2026 | Diwali, start of wedding season | Diwali pages are already written; wedding guest pages for men and women by city |
| Nov 2026 to Feb 2027 | Indian wedding season peak, Dubai winter social season | sangeet, reception, cocktail, Dubai brunch and Friday looks |
| Dec 2026 | New Year, Christmas, Goa | party and travel pages, Goa packing split by gender |
| Jan to Feb 2027 | Pongal, Republic Day, office resolutions, "new year new wardrobe" | capsule pages, office pages, phase-out content |
| Feb to Mar 2027 | Ramadan run-up, Holi, spring | Eid and Ramadan pages for the Gulf, Holi pages |

## 7. Buy, not build

| Need | Choice | Cost | Why |
|---|---|---|---|
| Vision and reasoning | Claude through an AI gateway. Opus 5.5 for the full Report, Sonnet 5.5 for the quick win and verdicts, Haiku 5.5 for itemising rail photos | USD 30 to 80 a month at month six | strongest vision for face and fabric reads, gateway lets you swap models without code changes |
| Payments and tax | Dodo Payments as merchant of record for INR with UPI and for USD | about 5.5 percent of revenue | one integration, handles Indian and Gulf tax, UPI for India. Revisit Razorpay direct for INR at 2 percent once volume justifies two integrations |
| Content site | Astro static site on Cloudflare Pages, programmatic routes from a content database | USD 0 | the SPA cannot do SEO. Astro pre-renders every page, builds from data, and ships almost no JavaScript |
| App | keep React, Supabase auth and Postgres, Cloudflare Worker and R2 | USD 0 to 25 a month | already built. Move all database access behind the Worker to close the direct-query gap |
| Product link to item | screenshot first, link second. A screenshot works for every store and for Instagram. Links use a scraping API as a convenience layer | USD 0 to 50 a month | the Myntra and Ajio scrapers prove that DOM-coupled imports break silently |
| Background removal for item images | an API such as remove.bg, or the open rembg model on the Worker | USD 0 to 20 a month | item cards need clean cutouts |
| Email | Resend | USD 0 to 20 a month | result delivery, nudges, seasonal re-profile reminders |
| Analytics | PostHog, already wired | USD 0 | funnel, feature flags for price tests, session replay on the intake |
| Images for content | the model generates palettes and capsule flat-lays as SVG; product images come from affiliate feeds | USD 0 | no stock photo spend |

Monthly cost at month six: about USD 150 to 250 plus payment fees. Gross margin above 90 percent.

## 8. Brand

- **Lively, loud, colourful.** Colour is literally the product. The seasonal palettes are the brand's palette. A result card should be recognisable from across a room and look nothing like a wardrobe-management tool.
- **The result card is the logo.** Most people will meet the brand as a screenshot in someone's story. Design the card before the landing page.
- **Flattery with receipts.** Every compliment points at something in the photo. The brand's voice is a friend who dresses well and is glad to see you.
- **Two doors, one house.** The men's and women's doors share a wordmark and a colour system but have their own layouts, photography style, and copy.
- The name stays fitso. The tagline candidate: "Know what's working for you."

Design direction, typefaces, and the full visual system are a separate frontend-design pass in month one. This plan sets the principles only.

## 9. Roadmap

Fig. 3: six lanes across six months. Product, content, growth, and money. Each month has one gate.

### Month 1 (2026-10-15 to 2026-11-14): the quick win and the content site

Product
- Week one: today's app moves to `closet.fitso.me` unchanged, with a banner. The root is free for the new product.
- Brand pass in pen.dev: wordmark, colour system, the result card for each door, the landing pages for each door.
- Free quick win live for both doors: one selfie, five answers, result card, one free verdict, email capture.
- Checkout for the Style Report wired through Dodo, with the Report itself shipping in month two. Early buyers are told the date.
- Funnel events in PostHog: landed, started, photo uploaded, result shown, card shared, checkout started, paid.
- Photo deletion after processing, with the policy on the page.

Content
- Astro content site live at the same domain, with sitemap and robots.
- 21 guides migrated, rewritten, and split by gender. Pillar B colour pages. Four tool pages.
- 50 pages live.

Growth
- Launch to your own network, Reddit style threads, and Dubai and Bangalore groups.
- First 20 result cards posted from friends' free results, with permission.

Gate: 100 completed quick wins and 10 shared cards. If the share rate is under 5 percent, redesign the card before anything else.

### Month 2 (to 2026-12-14): the Style Report

Product
- Full Report for both doors: five to eight photos, target wardrobe intake, core template, gap list, phase-out list, ten verdicts, PDF.
- Verdict from a screenshot.
- Confidence scores and retake prompts on the colour read.

Content
- Wedding season push: 100 new pages across sangeet, mehendi, reception, cocktail, by gender and city.
- Three short videos a week start. Pinterest account live, 20 pins a week.

Growth
- Testimonials from the first 20 buyers, with their cards.

Gate: 20 paid Reports and a finisher-to-buyer rate above 5 percent. Below that, fix the paywall screen before adding Pro.

### Month 3 (to 2027-01-14): Pro and the self-filling wardrobe

Product
- Pro tier: unlimited verdicts, wardrobe auto-fill from rail photos and verdict yeses, Myntra and Ajio import behind a health check, live shopping list for gaps with affiliate links.
- Report to Pro upgrade with credit.

Content
- Pillar C verdict pages on the top 50 items from Myntra and Namshi.
- 300 pages live.

Growth
- Affiliate accounts live: Myntra via a network, Amazon India, Namshi or Ounass.
- Referral: a shared card gives the friend one extra free verdict.

Gate: 10 Pro buyers and the first affiliate commission.

### Month 4 (to 2027-02-14): the Gulf door and occasions for you

Product
- "What do I wear to X" answered from the user's own wardrobe, for Pro.
- Trip packing from the real wardrobe.
- Seasonal re-profile flow.

Content
- Gulf pages: Dubai, Abu Dhabi, Riyadh office and social, Ramadan and Eid run-up.
- 450 pages live.

Growth
- Dubai expat communities, Gulf Reddit, and Gulf creators for the women's door.

Gate: USD 2,500 in the month and 40 percent of revenue from outside India.

### Month 5 (to 2027-03-14): data and price

Product
- Aggregate verdict data on content pages.
- Price test via PostHog flags: Report 999 against 1,499, Pro 3,999 against 4,999.
- Seasonal re-profile emails go out to the first cohort.

Content
- 600 pages live. Enrich the top 100 pages with verdict data.

Gate: a winning price and a visitor-to-buyer rate at or above 0.8 percent.

### Month 6 (to 2027-04-14): double down

Product
- Only conversion and retention work. No new features.

Content
- Prune the bottom 20 percent of pages. Double the output on the best pillar.
- 750 pages live.

Gate: USD 5,000 in the month.

## 10. Metrics

Tracked weekly in PostHog. The plan lives or dies on the first three.

| Metric | Month 6 target | Why |
|---|---|---|
| Visitors a month | 15,000 | the binding constraint |
| Visitor to quick-win finish | 10 percent | the content-to-product handoff |
| Finisher to buyer, 14 days | 8 percent | the paywall and the value of the free result |
| Share rate of free results | 10 percent | the organic loop |
| Report to Pro upgrade, 90 days | 10 percent | whether Pro is worth it |
| Pro verdicts per user a month | 6 or more | the habit |
| Affiliate click-through on yes | 40 percent | the shopping list works |
| Colour read confidence above threshold | 80 percent of captures | capture guidance works |
| Pages in the Google index | 90 percent of published | the content site works |

## 11. Risks

| Risk | Likelihood | Effect | Mitigation |
|---|---|---|---|
| Traffic ramps slower than modelled | high | the whole target slips | the plan has 80 pages a month and three social formats, not one channel. Month gates force a channel change early. Low case still clears cost |
| Google treats programmatic pages as scaled-content abuse | medium | index loss | every page carries unique local data and a verdict table; thin variants are never published; month-six prune |
| Colour and face reads are wrong in bad light | high | trust loss on the proof moment | guided capture, confidence score, retake prompt, "what is working" is robust even when the season call is uncertain |
| Face photos feel invasive | medium | drop-off at upload | delete originals after processing, say so on the upload screen, offer a no-photo archetype quiz as the fallback quick win |
| Price sensitivity in India | medium | lower Report conversion | 999 price test in month five, UPI at checkout, INR pricing not converted USD |
| Myntra and Ajio scrapers break | certain | import stops silently | screenshot-first and rail photos make import a convenience not a dependency; health check surfaces breakage |
| Whering or Alta ship the same AI features | medium | harder differentiation | lead with honesty and the buy verdict against a target, which neither has announced; move fast on India and the Gulf where neither is present |
| Instagram or TikTok reach drops | medium | social share falls | Pinterest and search carry 60 percent of the modelled traffic |
| Solo founder bandwidth | high | everything slows | two production days a week are protected; AI drafts all content; no feature work in month six |
| Payment onboarding delays | low | revenue delayed | start Dodo onboarding in week one, Razorpay as the India fallback |

## 12. Decisions needed from you

1. **List prices.** Report at INR 1,499 / USD 24 and Pro at INR 4,999 / USD 79, with the founding prices at INR 499 / USD 10 and INR 1,999 / USD 39 until the first USD 1,000. Yes, or different numbers.
2. **Content site on Astro** next to the React app, pre-rendered, at the same domain. This is the one structural change. Yes, or keep everything in one app and accept the SEO cost.
3. **Dodo Payments as merchant of record** for both INR and USD from day one, with Razorpay as a later INR optimisation. Yes, or Razorpay first.
4. **The old app moves to `closet.fitso.me`, frozen** (section 15.1), and the hygiene deletions in section 15.2 go ahead. Both touch tracked files and DNS, so they wait for a yes. If you prefer another subdomain name, say which.

Assumed and not asked: screenshot-first for verdicts, photo deletion after processing, no human stylist anywhere, annual not lifetime for Pro, the name fitso stays, the check-in is the last Saturday of the month from 10:00 to 12:00 Dubai time.

## 13. Steering: the monthly check-in

The six-month plan is a first guess. The real plan is the one rewritten every month from numbers. The goal it serves is USD 5,000 a month by December 2027, from this product or from products that grow out of its engine.

- **When:** the last Saturday of every month, 10:00 to 12:00 Dubai time. On the calendar from 2026-10-31. Never a Sunday.
- **Before:** the `karma/skills/fitso-monthly-review` skill runs and writes `docs/reviews/YYYY-MM.md`: a scorecard of plan versus actual, the month's gate as pass or fail, what worked with numbers, what did not with a suspected cause, a pricing and honesty check, and three bets for next month.
- **The two hours:** 20 minutes on the scorecard, 30 on what worked, 30 on what did not, 30 on choosing the three bets, 10 on updating the plan and the project roster.
- **Rules:** a claim without a number is "unproven", not "worked". Targets change only after two months more than 40 percent off plan. At least one bet is on traffic until visitors pass 15,000 a month. If the product alone cannot reach the December 2027 goal, the review proposes one adjacent product that reuses the engine, and does not build it.

## 14. Game theory and gamification

The product is a repeated game between fitso and the user, and a one-shot game between fitso and every stranger who lands from a search. Most of what follows is about making honesty the winning strategy and making progress visible.

### 14.1 Mechanisms

| Mechanism | The problem it solves | How it shows up |
|---|---|---|
| **Costly "no"** | A stylist who always says yes is cheap talk. The user cannot tell praise from sales. | The verdict engine must return "no" or "yes-if" at least a third of the time across all users, and the dashboard shows the user their own count of no's and the rupees saved. The no's are the proof that the yes's mean something. The monthly review flags a yes rate above 75 percent. |
| **Incentive compatibility with affiliate** | A shopping assistant that earns on purchases is suspected of pushing purchases. | The verdict is computed and shown before any link lookup. Links appear only on a yes, and the page says so. The rule is written on the pricing page. |
| **Commitment device** | People buy on impulse what they would not buy on reflection. | The declared target wardrobe is the user's own rule. Every verdict is judged against it. The "no-buy streak" counts days since the last purchase made without a verdict. The user binds their future self, and fitso enforces. |
| **Costly signalling** | Social proof that is cheap to fake is ignored. | A shared result card reveals a model's read of your own face and style. That is a real disclosure, so it is a credible signal. Because the card leads with strengths, the cost of sharing is low and the signal is high. |
| **Reciprocity** | Referral programs feel like spam. | A shared card gives the friend one free verdict and the sharer Pro credit. Both sides gain, nobody is asked to recruit. |
| **Common knowledge** | Private deadlines do not move people. | The founding counter is public. Everyone sees the same number, and everyone knows everyone sees it. That is what produces a rush. |
| **Price discrimination by decision time** | One price loses either the impulse buyer or the deliberator. | The finish-today price captures the impulse buyer. The list price captures the deliberator who returns. Nobody is lied to about which one they are. |

### 14.2 Gamification, personal progress only

The product never ranks people against each other on looks, body, or face. Every game element is the user against their own target.

- **Wardrobe score, 0 to 100.** Coverage of the target wardrobe by what the user owns. The big number on the dashboard. It moves with every yes, every import, every phase-out.
- **Gap list as a quest board.** Each gap is a card: what it is, why it matters for the target, "find it" (the shopping list), "I own this".
- **Saved purchases.** A running rupee total of every no the user took. Loss aversion made visible, in the user's favour.
- **No-buy streak.** Days since the last purchase made without a verdict. Breaking it is not shamed, it just resets.
- **Season pass.** Each seasonal re-profile unlocks a new palette card. Four cards a year, collectible, shareable.
- **Badges tied to decisions only.** "Profile complete", "Closed the gap", "Phase-out done", "Ten honest no's". Nothing for logging in or opening the app.
- **Verdict feedback loop.** "I bought it" or "I returned it" earns one free verdict and feeds the accuracy data that section 6 publishes on content pages.
- **Not allowed:** public leaderboards, face or body scores, streak shaming, fake scarcity, notifications designed to make the user feel behind.

## 15. Repo cleanup and new structure

From an audit of the repo on 2026-10-10. The React app is about 19,400 lines, the worker about 1,500. Roughly half the app is inventory-specific.

### 15.1 Freeze the old app, do not delete it

The inventory app moves to **closet.fitso.me** as it is, and the root domain becomes the new product. Nothing of value is thrown away, every existing user keeps their login and data, and the new product reads the same Supabase tables for the wardrobe.

Rules for the frozen app:

- No new features, no redesign. Security fixes and the database-access gap only.
- One banner at the top: "fitso has a new home at fitso.me. Your closet stays here." with a link that signs the user into the new product with the same account.
- The guides move out of it to the content site, with redirects from the old guide URLs.
- The worker keeps serving both apps. Auth, sync, and image routes do not change.

Why `closet` over `manage`: it is shorter, it says what the thing is, and the new product calls the user's wardrobe their closet, so the subdomain reads as a feature of the same brand rather than a leftover.

### 15.2 Hygiene, with your go-ahead

These are tracked files that should not be, independent of the move.

| Item | Why |
|---|---|
| `workers/.wrangler/state/` (5 tracked files: R2 blobs, SQLite) | local dev state in git, may contain user data. Add to `.gitignore`. |
| `workers/fix-server-data.js` and `.mjs` | one-off repair scripts with a hard-coded username. |
| `workers/theshajha/metadata.json` | a zero-byte stray. |
| `src/lib/guides.ts` | 79-line re-export wrapper that shadows `src/lib/guides/index.ts`. Keep the directory, drop the wrapper. |
| `workers/worker-configuration.d.ts` from git | 404 KB generated file. Generate on `types`, ignore in git. |
| `package-lock.json` is both tracked and ignored | pick one. Track it. |
| README product sections, `package.json` description and keywords | describe the old product. Rewrite for the two apps. |

### 15.3 Reuse from the old app in the new one

Supabase auth and the auth worker routes, the item schema and `useItems` (the wardrobe), `ImageUpload` and the image worker routes, the import wizard and both scrapers (behind a health check), `AnalyticsProvider` and the event names, the Radix primitives, the guide data under `src/lib/guides/` as content seed, `Privacy` and `Settings`. These are imported or copied into the new app, not moved out of the frozen one.

### 15.4 New structure

```
fitso.me/
  apps/
    closet/            the existing React app, frozen, deployed to closet.fitso.me (today's src/ and public/)
    web/               the new React app at fitso.me/app/*: landing (two doors), quick win, report, verdicts, wardrobe, billing
      src/features/
        profile/       intake, capture guidance, result card, report
        target/        target wardrobe intake, template, gap list, phase-out
        verdict/       screenshot or link in, verdict out, history, saved purchases
        wardrobe/      items (shared schema), auto-fill from rail photos, import
        billing/       Dodo checkout, founding counter, finish-today timer, credits
    site/              Astro content site at fitso.me: pillars A to D, tool pages, sitemap, robots
      content/         occasions, colours, items, capsules as data files
  workers/             Hono API serving both apps; existing routes plus:
    src/routes/ai.ts       profile, verdict, itemise (vision calls through the gateway)
    src/routes/billing.ts  Dodo webhooks, founding counter, timers
  packages/core/       shared TypeScript types: profile, target, item, verdict
  docs/plans/          this plan
  docs/reviews/        monthly reviews written by the review skill
```

Routing: `closet.fitso.me` serves the frozen app. `fitso.me` serves the Astro site at `/`, `/men`, `/women`, `/guides/*`, `/tools/*`, and the new app at `/app/*`. One routing rule splits the root domain. The move of today's `src/` into `apps/closet/` is a rename, not a rewrite, and happens in week one so the root is free for the new product.

## Figures

- Fig. 1: the funnel from visitor to buyer. Takeaway: 125 buyers a month need 15,000 visitors; model cost per buyer is under a dollar, so the visitor is the only expensive input.
- Fig. 2: revenue and visitor ramps, months one to six. Takeaway: conversion is held flat; the plan bets on traffic.
- Fig. 3: the roadmap lanes with monthly gates. Takeaway: the content site ships before the paid product, because content takes longest to compound.
