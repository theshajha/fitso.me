import type { Metadata } from "next";
import { Container } from "@/components/brand/Container";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "The fitso service, pricing, and refunds within 7 days.",
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
        fitso is a personal stylist, on demand. You send one photo and get a free result, your personal style: what works on you and the one
        thing to change. You can then pay for the Style Report. It has three parts: about you, about your style, and
        what works and what does not. The Style Report opens as soon as you pay.
      </p>

      <h2 style={{ margin: "48px 0 16px" }}>Pricing</h2>
      <ul>
        <li>
          <strong>Style Report.</strong> The Style Report has an introductory price of $10. The list price is $29.
          The price may change. You pay the price you see at checkout.
        </li>
        <li>Dodo Payments is the merchant of record. Taxes are added at checkout where the law requires them.</li>
      </ul>

      <h2 style={{ margin: "48px 0 16px" }}>Refunds</h2>
      <p>
        You can ask for a refund within 7 days of your purchase. We ask no questions
        and we refund the full amount. Email{" "}
        <a href="mailto:shashank@fitso.me" className="font-semibold">
          shashank@fitso.me
        </a>{" "}
        from the address you used to buy.
      </p>

      <h2 style={{ margin: "48px 0 16px" }}>Not medical or professional advice</h2>
      <p>
        fitso gives style guidance from a photo and a few answers. It is not medical, dermatological or professional
        advice. A model reads your photo, so it can be wrong. Lighting and framing change the result, and we show a
        confidence note when the result is weak. You decide what to buy and wear.
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
