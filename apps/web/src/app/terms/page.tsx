import type { Metadata } from "next";
import { Container } from "@/components/brand/Container";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "The fitso service, founding and finish-today pricing, refunds within 7 days, and our honest-verdict promise.",
  alternates: { canonical: "/terms" },
};

export default function Page() {
  return (
    <Container className="section prose-full">
      <p className="label" style={{ margin: 0 }}>
        Last updated: 10 October 2026
      </p>
      <h1 style={{ margin: "12px 0 24px" }}>Terms</h1>
      <p style={{ fontSize: "1.25rem" }}>
        These terms are short on purpose. By using fitso you agree to them.
      </p>

      <h2 style={{ margin: "48px 0 16px" }}>The service</h2>
      <p>
        fitso reads one selfie and five answers. It gives you a colour season, a style archetype, three strengths and
        one upgrade. It also gives you honest verdicts on items you want to buy. The free quick win costs nothing.
        The Style Report and Pro are paid products.
      </p>
      <p>
        The Style Report is built in month 2. If you buy it before it ships, we tell you the delivery date at
        checkout. Pro opens in month 3, and your founding price is locked.
      </p>

      <h2 style={{ margin: "48px 0 16px" }}>Pricing</h2>
      <ul>
        <li>
          <strong>Founding price.</strong> The Style Report is INR 499 (USD 10) and Pro is INR 1,999 (USD 39). The
          founding price runs until founding sales reach USD 1,000 in total. The counter on the site shows how far we
          are.
        </li>
        <li>
          <strong>Finish-today price.</strong> After founding ends, the Style Report is INR 999 (USD 15) for 24 hours
          from the moment your result was made. The 24 hours never restart.
        </li>
        <li>
          <strong>List price.</strong> After that, the Style Report is INR 1,499 (USD 24) and Pro is INR 4,999
          (USD 79).
        </li>
        <li>You see exactly one price at a time. We do not invent a countdown. The clock is real.</li>
        <li>Dodo Payments is the merchant of record. Taxes are added at checkout where the law requires them.</li>
      </ul>

      <h2 style={{ margin: "48px 0 16px" }}>Refunds</h2>
      <p>
        You can ask for a refund within 7 days of your purchase, before the Report is delivered. We ask no questions
        and we refund the full amount. Email{" "}
        <a href="mailto:shashank@fitso.me" className="font-semibold">
          shashank@fitso.me
        </a>{" "}
        from the address you used to buy.
      </p>

      <h2 style={{ margin: "48px 0 16px" }}>Honest-verdict promise</h2>
      <p>
        A verdict can say no. We do not tune the answer to make a sale and we do not take payment from brands for a
        yes. We show a link to an item only when the verdict is yes. We never give a face score or a percentile.
      </p>

      <h2 style={{ margin: "48px 0 16px" }}>Not medical or professional advice</h2>
      <p>
        fitso gives style guidance from a photo and a few answers. It is not medical, dermatological or professional
        advice. A model reads your photo, so it can be wrong. Lighting and framing change the result, and we show a
        confidence note when the read is weak. You decide what to buy and wear.
      </p>

      <h2 style={{ margin: "48px 0 16px" }}>Your photo and your content</h2>
      <p>
        Upload only photos of yourself, or photos you have the right to use. Do not upload anything illegal or
        anything of another person without their consent. We do not store your photo. See{" "}
        <a href="/privacy" className="font-semibold">
          Privacy
        </a>
        .
      </p>

      <h2 style={{ margin: "48px 0 16px" }}>Use of the site</h2>
      <p>
        Do not abuse the service, scrape it, or try to break it. We may block use that harms the service or other
        people. We may change the product as we build it. If we make a change that affects a paid product, we tell
        you.
      </p>

      <h2 style={{ margin: "48px 0 16px" }}>Liability</h2>
      <p>
        We provide fitso as it is. To the extent the law allows, our liability to you is limited to the amount you
        paid us in the 12 months before the claim.
      </p>

      <h2 style={{ margin: "48px 0 16px" }}>Contact</h2>
      <p>
        Questions go to{" "}
        <a href="mailto:shashank@fitso.me" className="font-semibold">
          shashank@fitso.me
        </a>
        .
      </p>
    </Container>
  );
}
