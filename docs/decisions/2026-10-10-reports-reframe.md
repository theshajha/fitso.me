# Decision: fitso sells one-time reports. First report: the Style Report.

Date: 2026-10-10. Owner: Shashank. Supersedes the product sections of `docs/plans/2026-10-10-fitso-pivot-plan.md` where they differ. That plan stays as written, as a record.

## What changed

- **Pitch.** "fitso is your personal stylist, on demand." The site leads with one free read from one photo, then sells one paid report.
- **Product shape.** fitso is a set of one-time reports, each as accurate as the best models and methods allow. The first is the Style Report. Later reports (for example a face read: hairstyle, beard, glasses) follow the same pattern: one photo, one report, one price.
- **Style Report, three parts.**
  1. About you: colouring and palette, face and features, build and proportions.
  2. About your style: what the person wears now and what it says; their archetype and the version that fits their life.
  3. What works and what does not: colours, cuts, fabrics, lengths, details. Keep, change, and why. Every line tied to the photo.
- **Quality bar.** The report should feel worth ten times its price. Use the best models and any open-source tools or published method that raises accuracy. Cost per report is secondary to accuracy.
- **One front door.** One "Get my read" button. The engine reads whether the person is a man or a woman from the photo. Both are shown on the page so nobody assumes it is for one only. The men and women pages stay as landing pages, not as a required choice.
- **Dropped: "should I buy this".** Buy or skip verdicts are too subjective to promise. Removed from every page, the pricing FAQ, and the plan. The verdict code stays in the repo, unused.

## Still open

- The engine workflow: photo-quality gate with specific feedback, separate vision, judge and writer steps, one run that feeds both the free read and the paid report. Needs a spec before code.
- What exactly is in the free read versus the paid report, and whether the email wall sits before or after the free result.
- Pro: whether it stays as "every new report plus a yearly refresh" or goes.
- Real photos for the hero. The current ones are AI-generated placeholders.

## Later the same day

- **Pricing in USD only.** Style Report $10 today, $29 list. Pro stays at $39 founding, $79 list. INR is no longer shown. Local pricing for a few countries is a later decision.
- **The report is instant.** It is generated in the same run and unlocks the moment the order is paid. No ship date anywhere.
- **Multi-photo reads.** The engine accepts one to four photos. Whether a multi-photo "deep read" is a separate, higher-priced tier is open.
- **Audience is global.** The engine reads heritage from the photo and asks only when unsure.
- **Stripe** comes after local testing; Dodo stays in stub mode until then.
