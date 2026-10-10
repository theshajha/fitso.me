import type { Door } from "@fitso/core";
import { colors } from "@/lib/tokens";

const PROMISES = [
  "Your photo is deleted after the result.",
  "No face scores. No percentiles.",
  "A verdict can say no.",
  "Links only on a yes.",
] as const;

type Tile = { bg: string; fg: string; border?: string };

const TILES: Record<"shared" | Door, Tile[]> = {
  shared: [
    { bg: colors.cobalt, fg: "#fff" },
    { bg: colors.magenta, fg: "#fff" },
    { bg: colors.tangerine, fg: colors.ink },
    { bg: colors.lime, fg: colors.ink },
  ],
  men: [
    { bg: colors.cobalt, fg: "#fff" },
    { bg: colors.lime, fg: colors.ink },
    { bg: colors.ink, fg: colors.paper, border: colors.paper },
    { bg: colors.paper, fg: colors.ink, border: colors.cobalt },
  ],
  women: [
    { bg: colors.magenta, fg: "#fff" },
    { bg: colors.tangerine, fg: colors.ink },
    { bg: colors.ink, fg: colors.paper, border: colors.paper },
    { bg: colors.paper, fg: colors.ink, border: colors.magenta },
  ],
};

/** Four promises as colour blocks on an ink band. Titles are large bold text for contrast. */
export function Honesty({ door }: { door?: Door }) {
  const tiles = TILES[door ?? "shared"];
  return (
    <section className="section" style={{ background: "var(--ink)", color: "var(--paper)" }}>
      <div className="container">
        <p className="label" style={{ margin: 0, color: "var(--paper)" }}>
          Honest, by design
        </p>
        <h2 style={{ color: "var(--paper)", margin: "12px 0 0" }}>Four promises. We keep them.</h2>
        <ul className="m-0 mt-10 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
          {PROMISES.map((p, i) => (
            <li
              key={p}
              className="flex items-end p-6"
              style={{
                background: tiles[i].bg,
                color: tiles[i].fg,
                borderRadius: 24,
                minHeight: "clamp(110px, 18vw, 180px)",
                border: `3px solid ${tiles[i].border ?? tiles[i].bg}`,
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "1.25rem",
                lineHeight: 1.2,
                letterSpacing: "-0.02em",
              }}
            >
              {p}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
