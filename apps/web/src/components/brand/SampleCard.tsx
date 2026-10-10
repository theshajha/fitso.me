import { doorTheme, seasonColors } from "@/lib/tokens";
import { DrapeFan } from "./DrapeFan";
import { Stamp } from "./Stamp";
import type { SampleCardData } from "./SampleCard.data";

/** A result card in door chrome. Season colour is a block, never text colour. */
export function SampleCard({ card, showFan = false }: { card: SampleCardData; showFan?: boolean }) {
  const t = doorTheme[card.door];
  const seasonFill = seasonColors[card.season];
  // Autumn and winter blocks take white text (large only); spring and summer take ink.
  const onSeason = card.season === "autumn" || card.season === "winter" ? "#fff" : "var(--ink)";
  return (
    <article
      data-door={card.door}
      aria-label={`Sample ${t.label} result card: ${card.season}, ${card.archetype}`}
      className="relative flex flex-col overflow-hidden"
      style={{
        background: t.accent,
        padding: 12,
        borderRadius: 32,
        boxShadow: "0 10px 0 var(--ink)",
        color: "var(--ink)",
      }}
    >
      <div
        className="relative flex flex-col justify-between gap-6 p-6"
        style={{ background: seasonFill, color: onSeason, borderRadius: 22, minHeight: 190 }}
      >
        <div className="flex items-start justify-between gap-3">
          <span className="label" style={{ background: t.secondary, color: "var(--ink)", borderRadius: 999, padding: "5px 12px" }}>
            {t.label}
          </span>
          {showFan ? <DrapeFan door={card.door} size={64} state="collapsed" /> : null}
        </div>
        <div>
          <p
            style={{
              margin: 0,
              fontFamily: "var(--font-display)",
              fontWeight: 900,
              fontSize: "clamp(2.25rem, 5vw, 3rem)",
              letterSpacing: "-0.04em",
              lineHeight: 1,
              textTransform: "capitalize",
            }}
          >
            {card.season}
          </p>
          <p className="label mt-3 inline-block" style={{ background: "var(--paper)", color: "var(--ink)", borderRadius: 999, padding: "4px 12px", fontSize: "0.8125rem" }}>
            {card.depth} &middot; sample
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-5 p-5" style={{ background: "var(--paper)", borderRadius: 22, marginTop: 8 }}>
        <h3 style={{ margin: 0, fontSize: "1.5rem" }}>{card.archetype}</h3>
        <div>
          <p className="label" style={{ margin: "0 0 10px", color: "var(--ink-2)" }}>
            Working for you
          </p>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {card.strengths.map((s) => (
              <li
                key={s}
                className="flex items-start gap-2"
                style={{ fontWeight: 500, fontSize: "0.9688rem", lineHeight: 1.4 }}
              >
                <span
                  aria-hidden="true"
                  style={{ flex: "none", marginTop: 3, width: 14, height: 14, borderRadius: 5, background: t.accent }}
                />
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="label" style={{ margin: "0 0 10px", color: "var(--ink-2)" }}>
            One upgrade
          </p>
          <div className="flex items-start gap-3">
            <Stamp kind="yes-if" rotate={-5}>
              Swap
            </Stamp>
            <p style={{ margin: 0, fontSize: "0.9688rem", lineHeight: 1.4 }}>{card.upgrade}</p>
          </div>
        </div>
        <div role="img" aria-label={`Palette: ${card.palette.length} colours for ${card.season}`} className="flex h-9 overflow-hidden" style={{ borderRadius: 12 }}>
          {card.palette.map((hex) => (
            <span key={hex} className="flex-1" style={{ background: hex }} />
          ))}
        </div>
        <p className="label" style={{ margin: 0, color: "var(--ink-2)" }}>
          fitso.me
        </p>
      </div>
    </article>
  );
}
