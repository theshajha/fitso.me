import { Section } from "@/components/brand";
import { PricingTiers } from "@/features/billing/PricingTiers";

export const metadata = {
  title: "Pricing",
  description: "A free quick win, a one-time Style Report, and an annual Pro plan. The founding price is real and the counter is live.",
};

const RULES: Array<[string, string]> = [
  ["Timers never reset", "Your finish-today price starts when you first see your result. It never restarts, extends, or comes back."],
  ["The counter is real", "The founding counter comes from paid orders. Refunds take money off it."],
  ["Nothing counts down for strangers", "A timer starts only after you do something, like run the quick win. Visitors who did nothing see no countdown."],
  ["No fake caps", "We never write \"only 3 left\". Founding ends at USD 1,000 of revenue, and that is the only cap."],
  ["Refunds over 3 percent pause everything", "If refunds pass 3 percent of a month's sales, we pause every urgency price until we find the cause."],
];

const FAQ: Array<[string, string]> = [
  ["What happens after founding ends?", "The founding price ends for good and never returns. The Report costs INR 1,499 / USD 24 and Pro costs INR 4,999 / USD 79. Right after your free quick win, you see a one-time 24-hour finish-today price for the Report of INR 999 / USD 15. Founding Pro members keep their price on every renewal."],
  ["Why two currencies?", "You can pay in INR or USD. We set each price by hand. We do not convert at checkout. The founding counter converts INR orders to USD at a fixed rate."],
  ["Can I get a refund?", "Yes. Email us and we refund the order. Refunds come off the founding counter right away."],
  ["What is in the Style Report, and when does it ship?", "It is your full profile: season and palette, fit and silhouette notes, and a plan for what to buy and what to skip. It ships in month 2, by 2026-12-14. We email you the moment it is ready."],
  ["When does Pro open?", "Pro opens in month 3. If you buy it now, your founding price is locked."],
];

export default function Page() {
  return (
    <>
      <Section>
        <h1>Pricing</h1>
        <p>Start free. Pay once for the Report, or yearly for Pro. Founding prices are real and they end.</p>
        <PricingTiers />
        <p style={{ marginTop: 24 }}>
          After founding ends, your result page shows a finish-today price for the Report (INR 999 / USD 15) for 24 hours from the moment you first see your result, once, and it never resets.
        </p>
      </Section>

      <Section>
        <h2>Five rules we keep</h2>
        <ol style={{ display: "grid", gap: 16, paddingLeft: 20 }}>
          {RULES.map(([title, body]) => (
            <li key={title}>
              <strong>{title}.</strong> {body}
            </li>
          ))}
        </ol>
        <h3>Shopping links</h3>
        <p>Verdicts are decided before any shopping link exists. Links appear only on a yes.</p>
      </Section>

      <Section>
          <h2>Questions</h2>
          {FAQ.map(([q, a]) => (
            <details key={q} style={{ borderTop: "1px solid var(--line)", padding: "14px 0" }}>
              <summary style={{ cursor: "pointer", fontWeight: 600 }}>{q}</summary>
              <p style={{ marginTop: 10 }}>{a}</p>
            </details>
          ))}
      </Section>
    </>
  );
}
