import type { Door } from "@fitso/core";
import { Button } from "./Button";
import { Counter } from "./Counter";
import { Section } from "./Section";

/** Founding price block: live counter, one price line, CTA to /pricing. */
export function DoorFounding({ door }: { door?: Door }) {
  return (
    <Section>
      <div
        data-door={door}
        className="grid gap-8 p-7 md:grid-cols-[1.4fr_1fr] md:items-center md:p-12"
        style={{ border: "3px solid var(--ink)", borderRadius: 32, background: "var(--paper)" }}
      >
        <div className="flex flex-col gap-4">
          <div>
            <span className="label inline-block" style={{ color: "var(--ink)", border: "2px solid var(--accent)", borderRadius: 6, padding: "4px 10px", transform: "rotate(-3deg)", fontSize: "0.8125rem" }}>
              Founding
            </span>
          </div>
          <h2 style={{ margin: 0 }}>Founding price</h2>
          <p style={{ margin: 0, fontSize: "1.1875rem" }}>
            The Style Report costs INR 499 (USD 10) until the first USD 1,000 is raised. Then it is INR 999
            (USD 15) if you finish within 24 hours of your result, and INR 1,499 (USD 24) after that.
          </p>
          <div>
            <Button href="/pricing" variant="secondary" size="md">
              See pricing
            </Button>
          </div>
        </div>
        <Counter />
      </div>
    </Section>
  );
}
