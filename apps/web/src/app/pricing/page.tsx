import { Section } from "@/components/brand";
import { PricingTiers } from "@/features/billing/PricingTiers";

export const metadata = {
  title: "Pricing",
  description: "Start free. Pay once for your Style Report, or yearly for Pro. Founding price for the first wave.",
};

const FAQ: Array<[string, string]> = [
  ["What happens after the founding price ends?", "The Report is INR 1,499 / USD 24 and Pro is INR 4,999 / USD 79. If you bought Pro at the founding price, you keep it on every renewal."],
  ["Is there a finish-today price?", "Yes. Right after your free quick win you get 24 hours to take the Report for INR 999 / USD 15. It is personal to you and does not restart."],
  ["Why two currencies?", "You can pay in INR or USD. We set each price by hand. We do not convert at checkout."],
  ["Can I get a refund?", "Yes. Email us within 7 days and we refund the order."],
  ["Do you earn from shopping links?", "Some links are affiliate links. A link appears only when the verdict is yes, and the verdict is decided first."],
  ["What is in the Style Report, and when does it ship?", "It is your full profile: season and palette, fit and silhouette notes, and a plan for what to buy and what to skip. It ships by 14 December 2026. We email you the moment it is ready."],
  ["When does Pro open?", "Pro opens in January 2027. If you buy it now, your founding price is locked."],
];

export default function Page() {
  return (
    <>
      <Section>
        <h1>Pricing</h1>
        <p>Start free. Pay once for the Report, or yearly for Pro.</p>
        <PricingTiers />
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
