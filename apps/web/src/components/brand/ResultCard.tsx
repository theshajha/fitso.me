import type { Door, QuickWinProfile } from "@fitso/core";
import { colors, doorTheme, seasonColors } from "@/lib/tokens";

/**
 * The share card, drawn for next/og (Satori): flexbox and inline styles only.
 * Door chrome: men cobalt and lime, women magenta and tangerine.
 * Text is never set in a season colour. No photo anywhere.
 */
export type ResultCardData = {
  door: Door;
  season: QuickWinProfile["season"];
  seasonLabel: string;
  archetype: string;
  strengths: string[];
  stopBuying: string;
  palette: string[];
};

export type CardVariant = "card" | "story";

export const CARD_SIZE = {
  card: { width: 1200, height: 630 },
  story: { width: 1080, height: 1920 },
} as const;

const clip = (t: string, n: number) => (t.length <= n ? t : `${t.slice(0, n - 1).trimEnd()}…`);

export function ResultCard({ data, variant }: { data: ResultCardData; variant: CardVariant }) {
  const story = variant === "story";
  const { accent, secondary } = doorTheme[data.door];
  const seasonFill = seasonColors[data.season];
  // Ink or white for the label on the season block, picked by the block's brightness.
  const onSeason = data.season === "autumn" || data.season === "winter" ? "#FFFFFF" : colors.ink;
  const k = story ? 2.05 : 1;
  const pad = 44 * k;

  const label = (text: string, color: string = colors.ink2) => (
    <div style={{ display: "flex", fontSize: 15 * k, letterSpacing: 2, color, fontFamily: "Hanken", fontWeight: 700 }}>
      {text.toUpperCase()}
    </div>
  );

  const seasonBlock = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        background: seasonFill,
        borderRadius: 28 * k,
        padding: 28 * k,
        width: story ? "100%" : 300,
        height: story ? 520 : "100%",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", fontSize: 14 * k, letterSpacing: 2, color: onSeason, fontFamily: "Hanken", fontWeight: 700 }}>
        YOUR SEASON
      </div>
      <div style={{ display: "flex", fontSize: 40 * k, color: onSeason, fontFamily: "Unbounded", fontWeight: 900, lineHeight: 1.05 }}>
        {data.seasonLabel}
      </div>
    </div>
  );

  const body = (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 16 * k, minWidth: 0 }}>
      {label("Archetype")}
      <div
        style={{
          display: "flex",
          fontSize: story ? 100 : 54,
          lineHeight: 1.05,
          fontFamily: "Unbounded",
          fontWeight: 900,
          color: colors.ink,
          letterSpacing: -1,
        }}
      >
        {data.archetype}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 * k, marginTop: 6 * k }}>
        {label("Working for you")}
        {data.strengths.slice(0, 3).map((s, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              fontSize: 19 * k,
              lineHeight: 1.25,
              color: colors.ink,
              fontFamily: "Hanken",
              fontWeight: 600,
              border: `3px solid ${accent}`,
              borderRadius: 14 * k,
              padding: `${9 * k}px ${14 * k}px`,
              background: colors.paper,
            }}
          >
            {clip(s, story ? 120 : 84)}
          </div>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4 * k,
          background: secondary,
          borderRadius: 14 * k,
          padding: `${10 * k}px ${14 * k}px`,
        }}
      >
        <div style={{ display: "flex", fontSize: 13 * k, letterSpacing: 2, color: colors.ink, fontFamily: "Hanken", fontWeight: 700 }}>
          ONE UPGRADE
        </div>
        <div style={{ display: "flex", fontSize: 19 * k, lineHeight: 1.25, color: colors.ink, fontFamily: "Hanken", fontWeight: 600 }}>
          {clip(data.stopBuying, story ? 130 : 90)}
        </div>
      </div>
    </div>
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        background: colors.paper,
        fontFamily: "Hanken",
      }}
    >
      <div style={{ display: "flex", height: 14 * k, width: "100%" }}>
        <div style={{ display: "flex", flex: 3, background: accent }} />
        <div style={{ display: "flex", flex: 1, background: secondary }} />
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: story ? "column" : "row",
          flex: 1,
          gap: 28 * k,
          padding: `${pad * 0.7}px ${pad}px ${pad * 0.4}px`,
        }}
      >
        {seasonBlock}
        {body}
      </div>
      <div style={{ display: "flex", gap: 8 * k, padding: `0 ${pad}px`, height: 40 * k }}>
        {data.palette.slice(0, 8).map((hex) => (
          <div key={hex} style={{ display: "flex", flex: 1, background: hex, borderRadius: 10 * k, border: "2px solid rgba(20,18,27,0.15)" }} />
        ))}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: `${14 * k}px ${pad}px ${20 * k}px`,
        }}
      >
        <div style={{ display: "flex", fontSize: 30 * k, fontFamily: "Unbounded", fontWeight: 900, color: colors.ink, letterSpacing: -1 }}>
          fitso
        </div>
        <div style={{ display: "flex", fontSize: 20 * k, fontFamily: "Hanken", fontWeight: 700, color: colors.ink2 }}>
          fitso.me
        </div>
      </div>
    </div>
  );
}
