import type { Metadata } from "next";
import { Container } from "@/components/brand/Container";
import { HeroPeople, HeroResultCard } from "@/components/brand/HeroPeople";
import { ClosingCta } from "@/components/brand/ClosingCta";
import { Faq } from "@/components/brand/Faq";
import { Pricing } from "@/components/brand/Pricing";
import { SwatchRibbon } from "@/components/brand/SwatchRibbon";
import { SampleRead } from "@/components/brand/SampleRead";
import { Section } from "@/components/brand/Section";
import { QuickWinFlow } from "@/features/profile/QuickWinFlow";

export const metadata: Metadata = {
  title: { absolute: "fitso: your personal style, from one photo" },
  description:
    "Upload one full-length photo. In about a minute, see your colours, what already works on you, and the one thing to change. Free.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <>
      {/* The product is the first screen: headline, uploader, and what a result looks like. */}
      <section className="pt-8 pb-14 md:pt-14 md:pb-20">
        <Container className="grid items-stretch gap-12 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] md:gap-14">
          <div className="flex min-w-0 flex-col justify-center gap-5 md:gap-6">
            <h1 style={{ margin: 0, fontSize: "clamp(2.5rem, 4.9vw, 4.375rem)" }}>
              Your personal style, from <span style={{ color: "var(--magenta)", whiteSpace: "nowrap" }}>one photo.</span>
            </h1>
            <p style={{ margin: 0, fontSize: "clamp(1.0625rem, 1.5vw, 1.25rem)", lineHeight: 1.5 }}>
              Upload a full-length photo. In about a minute, see your colours, what already works on you, and the one thing to change.
            </p>
            <div id="start" className="mt-2" style={{ scrollMarginTop: 24 }}>
              <QuickWinFlow embedded initialDoor={null} from="home" />
            </div>
            <div className="mt-4 md:hidden">
              <HeroResultCard />
            </div>
          </div>
          <div className="hidden md:block">
            <HeroPeople />
          </div>
        </Container>
      </section>

      <SwatchRibbon />

      <Section>
        <SampleRead />
      </Section>

      <Section id="pricing" className="scroll-mt-4">
        <Pricing />
      </Section>

      <Section>
        <Faq />
      </Section>

      <ClosingCta />
    </>
  );
}
