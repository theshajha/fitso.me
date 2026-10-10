import { Section } from "./Section";

const STEPS = [
  { n: "1", bg: "var(--spring)", title: "A selfie in daylight", body: "Face a window. No filter, no hat. Your phone camera is enough." },
  { n: "2", bg: "var(--summer)", title: "Five quick questions", body: "Where you wear clothes, your climate, your occasions, your budget and your vibe." },
  { n: "3", bg: "var(--accent-2)", title: "Your result card", body: "Your season, your three strengths and one upgrade, in under a minute." },
] as const;

export function HowItWorks() {
  return (
    <Section>
      <h2 style={{ margin: 0 }}>How it works</h2>
      <ol className="m-0 mt-10 grid list-none gap-5 p-0 md:grid-cols-3">
        {STEPS.map((s) => (
          <li
            key={s.n}
            className="flex flex-col gap-4 p-6"
            style={{ border: "2px solid var(--ink)", borderRadius: 24, background: "var(--paper)" }}
          >
            <span
              aria-hidden="true"
              className="inline-flex items-center justify-center"
              style={{
                width: 56,
                height: 56,
                borderRadius: 18,
                background: s.bg,
                color: "var(--ink)",
                fontFamily: "var(--font-display)",
                fontWeight: 900,
                fontSize: "1.5rem",
              }}
            >
              {s.n}
            </span>
            <h3 style={{ margin: 0 }}>{s.title}</h3>
            <p style={{ margin: 0, color: "var(--ink-2)" }}>{s.body}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
