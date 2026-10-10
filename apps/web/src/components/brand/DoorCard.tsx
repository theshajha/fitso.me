import type { Door } from "@fitso/core";
import { doorTheme } from "@/lib/tokens";
import { DoorCta } from "./DoorCta";

const COPY = {
  men: {
    kicker: "For men",
    lines: [
      "A uniform that works: three looks you repeat without thinking.",
      "Fewer decisions every morning, and one honest answer before each buy.",
    ],
  },
  women: {
    kicker: "For women",
    lines: [
      "A range for every occasion, from Monday meetings to wedding week.",
      "Your palette first, then the outfits that put it to work.",
    ],
  },
} as const;

/** Big two-panel door: a saturated top block, a secondary-colour pitch panel. */
export function DoorCard({ door }: { door: Door }) {
  const t = doorTheme[door];
  const c = COPY[door];
  return (
    <article
      data-door={door}
      className="flex flex-col overflow-hidden [&_a:focus-visible]:outline-[var(--ink)]"
      style={{ borderRadius: 32, boxShadow: "0 10px 0 var(--ink)" }}
    >
      <div
        className="relative overflow-hidden px-7 pb-8 pt-7 md:px-9 md:pb-10"
        style={{ background: t.accent, color: "#fff", minHeight: 220 }}
      >
        <span
          className="label inline-block"
          style={{ background: t.secondary, color: "var(--ink)", borderRadius: 999, padding: "6px 14px" }}
        >
          {c.kicker}
        </span>
        <h2
          style={{
            color: "#fff",
            fontWeight: 900,
            fontSize: "clamp(3.25rem, 12vw, 5rem)",
            letterSpacing: "-0.04em",
            margin: "28px 0 0",
            position: "relative",
            zIndex: 1,
          }}
        >
          {t.label}
        </h2>
        <div aria-hidden="true" className="absolute -right-4 -top-2 flex gap-2" style={{ transform: "rotate(14deg)" }}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                width: 36,
                height: 110 + i * 24,
                borderRadius: 22,
                background: t.secondary,
                opacity: 1 - i * 0.3,
              }}
            />
          ))}
        </div>
      </div>
      <div
        className="flex flex-1 flex-col gap-6 px-7 py-8 md:px-9"
        style={{ background: t.secondary, color: "var(--ink)" }}
      >
        <div className="flex flex-col gap-3" style={{ fontSize: "1.1875rem", fontWeight: 500, lineHeight: 1.45 }}>
          {c.lines.map((l) => (
            <p key={l} style={{ margin: 0 }}>
              {l}
            </p>
          ))}
        </div>
        <div>
          <DoorCta door={door} tone="ink" where="landing_card" />
        </div>
      </div>
    </article>
  );
}
