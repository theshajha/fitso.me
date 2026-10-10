import type { CSSProperties } from "react";
import type { Door } from "@fitso/core";
import { doorAccent, seasonColors } from "@/lib/tokens";

export type DrapeFanState = "open" | "thinking" | "collapsed";

const CHIPS = [
  { key: "spring", label: "spring", fill: seasonColors.spring, text: "var(--ink)" },
  { key: "summer", label: "summer", fill: seasonColors.summer, text: "var(--ink)" },
  { key: "autumn", label: "autumn", fill: seasonColors.autumn, text: "#fff" },
  { key: "winter", label: "winter", fill: seasonColors.winter, text: "#fff" },
] as const;

const ANGLES = [-42, -21, 0, 21, 42];

/**
 * The drape fan: five rounded chips (four seasons plus "you" in the door accent).
 * open: opens with a staggered CSS animation on mount. thinking: gentle looping sway.
 * collapsed: nearly closed (top of the result card). Honors prefers-reduced-motion.
 * Pure CSS, so it is a server component and needs no JS to animate.
 */
export function DrapeFan({
  door,
  size = 160,
  state = "open",
  className = "",
}: {
  door?: Door;
  /** Chip height in px. The fan is about 1.5x this wide. */
  size?: number;
  state?: DrapeFanState;
  className?: string;
}) {
  const accent = doorAccent(door);
  const chipW = size * 0.42;
  const items = [
    ...CHIPS.map((c) => ({ ...c })),
    { key: "you", label: "you", fill: accent, text: "#fff" },
  ];
  return (
    <div
      className={`fan ${className}`.trim()}
      data-state={state}
      role="img"
      aria-label="A fan of colour swatches: spring, summer, autumn, winter, and you"
      style={{ position: "relative", width: size * 1.6, height: size * 1.05 }}
    >
      {items.map((c, i) => (
        <div
          key={c.key}
          className="fan-chip"
          aria-hidden="true"
          style={
            {
              "--angle": `${ANGLES[i]}deg`,
              "--i": i,
              position: "absolute",
              left: `calc(50% - ${chipW / 2}px)`,
              bottom: 0,
              width: chipW,
              height: size,
              borderRadius: chipW * 0.45,
              background: c.fill,
              color: c.text,
              boxShadow: "0 0 0 2px var(--paper), 0 6px 14px rgba(20,18,27,0.14)",
              display: "flex",
              justifyContent: "center",
              paddingTop: size * 0.08,
              zIndex: c.key === "you" ? 6 : 1 + i,
            } as CSSProperties
          }
        >
          <span
            className="label"
            style={{
              fontSize: Math.max(8, size * 0.07),
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
              letterSpacing: "0.08em",
            }}
          >
            {c.label}
          </span>
        </div>
      ))}
    </div>
  );
}
