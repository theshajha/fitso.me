import type { Door } from "@fitso/core";
import { Button } from "./Button";
import { Section } from "./Section";

/** Founding price block: the price, what it buys, CTA to /pricing. */
export function DoorFounding({ door }: { door?: Door }) {
  return (
    <Section>
      <div
        data-door={door}
        className="grid gap-8 p-7 md:p-12"
        style={{ border: "3px solid var(--ink)", borderRadius: 32, background: "var(--paper)" }}
      >
        <div className="flex flex-col gap-4">
          <div>
            <span className="label inline-block" style={{ color: "var(--ink)", border: "2px solid var(--accent)", borderRadius: 6, padding: "4px 10px", transform: "rotate(-3deg)", fontSize: "0.8125rem" }}>
              Founding
            </span>
          </div>
          <h2 style={{ margin: 0 }}>Your full Style Report. INR 499.</h2>
          <p style={{ margin: 0, fontSize: "1.1875rem" }}>
            Founding price for early members, usually INR 1,499. Pay once. Your season and palette, your fit
            notes, and the list of what your wardrobe needs. Ships by 14 December 2026.
          </p>
          <div>
            <Button href="/pricing" variant="secondary" size="md">
              See pricing
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}
