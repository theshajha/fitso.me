import type { Metadata } from "next";
import { Container } from "@/components/brand/Container";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How fitso handles your photo, your email and your result. Photos are never stored. You can delete a result by email.",
  alternates: { canonical: "/privacy" },
};

export default function Page() {
  return (
    <Container className="section prose-full">
      <p className="label" style={{ margin: 0 }}>
        Last updated: 10 October 2026
      </p>
      <h1 style={{ margin: "12px 0 24px" }}>Privacy</h1>
      <p style={{ fontSize: "1.25rem" }}>
        Short version: we look at your photo once, we do not keep it, and we keep only the result and your email.
      </p>

      <h2 style={{ margin: "48px 0 16px" }}>Your photo</h2>
      <ul>
        <li>We hold your selfie in memory for the model call. That is all.</li>
        <li>We never store it. We never write it to disk, to a database or to a log.</li>
        <li>Once the result is ready, the photo is gone. We cannot get it back, and neither can anyone else.</li>
        <li>The model provider receives the photo for that one call, to read it and answer.</li>
      </ul>

      <h2 style={{ margin: "48px 0 16px" }}>What we do store</h2>
      <ul>
        <li>
          Your derived profile: your season, undertone, archetype, three strengths, one upgrade, palette and a
          confidence number.
        </li>
        <li>Your five answers, and the door you chose.</li>
        <li>Your email address. We need it to show you the result and to find your order.</li>
        <li>Your verdicts: the item, the answer and the reasons. Screenshots you upload are treated like photos and are not kept.</li>
        <li>Your orders: the product, the price you paid and the status.</li>
      </ul>

      <h2 style={{ margin: "48px 0 16px" }}>Your share link is public</h2>
      <p>
        Your result lives at a link with a long random token. Anyone who has the link can open it. That is by design,
        so you can send it to friends. The page shows your profile and never your photo. We do not list result
        pages anywhere and we ask search engines to ignore them. Do not share the link if you do not want people to
        see your result.
      </p>

      <h2 style={{ margin: "48px 0 16px" }}>Delete a result</h2>
      <p>
        Email{" "}
        <a href="mailto:shashank@fitso.me" className="font-semibold">
          shashank@fitso.me
        </a>{" "}
        from the address you used, or send us the link. We delete the result, your answers and your verdicts. We
        keep order records for as long as tax law requires. We reply within 7 days.
      </p>

      <h2 style={{ margin: "48px 0 16px" }}>Analytics</h2>
      <p>
        We use PostHog to count visits and clicks, so we can fix what is confusing. We identify you by a hash of your
        email. We never send your raw email to PostHog. We never send your photo. You can block analytics with your
        browser settings or a content blocker, and the site still works.
      </p>

      <h2 style={{ margin: "48px 0 16px" }}>Payments</h2>
      <p>
        Dodo Payments is the merchant of record. Dodo takes your payment and your billing details, and it sends us the
        order status. We never see or store your card number. Dodo&apos;s own privacy policy covers what it holds.
      </p>

      <h2 style={{ margin: "48px 0 16px" }}>Other services</h2>
      <ul>
        <li>Supabase stores the profile, answers, email, verdicts and orders.</li>
        <li>Vercel hosts the site and the AI Gateway that passes your photo to the model for one call.</li>
      </ul>

      <h2 style={{ margin: "48px 0 16px" }}>We do not sell your data</h2>
      <p>We never sell your data. We never use your photo to train a model.</p>

      <h2 style={{ margin: "48px 0 16px" }}>Children</h2>
      <p>
        fitso is not for children under 13. We do not knowingly collect information from them. If you think a child
        gave us information, email us and we will delete it.
      </p>

      <h2 style={{ margin: "48px 0 16px" }}>Changes</h2>
      <p>
        If this page changes in a way that matters, we change the date at the top. Questions go to{" "}
        <a href="mailto:shashank@fitso.me" className="font-semibold">
          shashank@fitso.me
        </a>
        .
      </p>
    </Container>
  );
}
