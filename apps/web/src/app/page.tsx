import type { Metadata } from "next";
import { Container } from "@/components/brand/Container";
import { DoorCard } from "@/components/brand/DoorCard";
import { DoorFounding } from "@/components/brand/DoorFounding";
import { DrapeFan } from "@/components/brand/DrapeFan";
import { Honesty } from "@/components/brand/Honesty";
import { HowItWorks } from "@/components/brand/HowItWorks";
import { SampleCard } from "@/components/brand/SampleCard";
import { SAMPLE_CARDS } from "@/components/brand/SampleCard.data";
import { Section } from "@/components/brand/Section";

export const metadata: Metadata = {
  title: { absolute: "fitso: know what's working for you" },
  description:
    "One selfie. Five questions. Your colour season, your three strengths, and an honest answer before you buy anything. Photos deleted after the result.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <>
      <section className="pt-10 md:pt-16">
        <Container className="grid items-center gap-10 md:grid-cols-[1.5fr_1fr]">
          <div className="flex flex-col gap-6">
            <h1 style={{ margin: 0, fontSize: "clamp(2.5rem, 7.4vw, 6rem)", letterSpacing: "-0.045em" }}>
              Know what&apos;s working for you.
            </h1>
            <p style={{ margin: 0, fontSize: "1.25rem", fontWeight: 500 }}>
              One selfie. Five questions. Your season, your three strengths, and an honest answer before you buy
              anything.
            </p>
          </div>
          <div className="flex justify-center md:justify-end">
            <div className="md:origin-right md:scale-125 md:pr-4"><DrapeFan size={200} /></div>
          </div>
        </Container>
      </section>

      <Section id="doors" className="!pt-10 md:!pt-14">
        <h2 className="sr-only">Choose women or men</h2>
        <div className="grid gap-10 md:grid-cols-2 md:gap-8">
          <DoorCard door="men" />
          <DoorCard door="women" />
        </div>
      </Section>

      <HowItWorks />
      <Honesty />
      <DoorFounding />

      <Section className="pt-0">
        <h2 style={{ margin: 0 }}>This is what you get</h2>
        <p style={{ margin: "12px 0 0", fontSize: "1.1875rem", color: "var(--ink-2)" }}>
          Three sample cards. Every line on a real card points at something in your photo.
        </p>
        <div className="mt-10 grid gap-10 md:grid-cols-3 md:gap-6">
          {SAMPLE_CARDS.map((c) => (
            <SampleCard key={c.id} card={c} />
          ))}
        </div>
      </Section>
    </>
  );
}
