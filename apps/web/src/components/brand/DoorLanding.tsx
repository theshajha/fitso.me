import type { Door } from "@fitso/core";
import { doorTheme } from "@/lib/tokens";
import { Container } from "./Container";
import { DoorCta } from "./DoorCta";
import { DoorFounding } from "./DoorFounding";
import { DrapeFan } from "./DrapeFan";
import { Honesty } from "./Honesty";
import { HowItWorks } from "./HowItWorks";
import { SampleCard } from "./SampleCard";
import { SAMPLE_CARDS } from "./SampleCard.data";
import { Section } from "./Section";

const HERO = {
  men: {
    h1: "Fewer decisions. Better clothes.",
    sub: "One selfie and five questions. You get your colours, your three strengths and the one swap that matters. Then you shop with a straight answer.",
    sample: "sample-men-winter",
  },
  women: {
    h1: "Your palette, your shape, your occasions.",
    sub: "One selfie and five questions. You get your season, your three strengths and the one upgrade that matters. Then you shop with a straight answer.",
    sample: "sample-women-autumn",
  },
} as const;

/** Single-door landing used by /men and /women. */
export function DoorLanding({ door }: { door: Door }) {
  const t = doorTheme[door];
  const h = HERO[door];
  const card = SAMPLE_CARDS.find((c) => c.id === h.sample)!;
  return (
    <div data-door={door}>
      <section
        className="section [&_a:focus-visible]:outline-[var(--ink)]"
        style={{ background: t.secondary, color: "var(--ink)" }}
      >
        <Container className="grid items-center gap-10 md:grid-cols-[1.4fr_1fr]">
          <div className="flex flex-col gap-6">
            <p className="label" style={{ margin: 0 }}>
              fitso for {t.label.toLowerCase()}
            </p>
            <h1 style={{ margin: 0, fontSize: "clamp(2.5rem, 7vw, 5.5rem)", letterSpacing: "-0.04em" }}>{h.h1}</h1>
            <p style={{ margin: 0, fontSize: "1.25rem", fontWeight: 500 }}>{h.sub}</p>
            <div>
              <DoorCta door={door} tone="ink" where="door_hero" />
            </div>
          </div>
          <div className="flex justify-center md:justify-end">
            <div className="md:origin-right md:scale-125 md:pr-4"><DrapeFan door={door} size={200} /></div>
          </div>
        </Container>
      </section>

      <Section>
        <h2 style={{ margin: 0 }}>What your card looks like</h2>
        <div className="mt-10 grid gap-8 md:grid-cols-[minmax(0,420px)_1fr] md:items-center">
          <SampleCard card={card} showFan />
          <p style={{ margin: 0, fontSize: "1.1875rem" }}>
            Every line on your card points at something in your photo. Your gaps show up as upgrades. You get no
            score and no ranking against other people.
          </p>
        </div>
      </Section>

      <HowItWorks />
      <Honesty door={door} />
      <DoorFounding door={door} />

      <Section className="pt-0">
        <div
          className="flex flex-col items-start gap-6 p-8 md:flex-row md:items-center md:justify-between md:p-12"
          style={{ background: t.accent, borderRadius: 32, color: "#fff" }}
        >
          <h2 style={{ color: "#fff", margin: 0 }}>Ready? It takes a minute.</h2>
          <span className="[&_a]:!bg-[var(--ink)] [&_a]:!border-[var(--ink)]">
            <DoorCta door={door} where="door_footer" />
          </span>
        </div>
      </Section>
    </div>
  );
}
