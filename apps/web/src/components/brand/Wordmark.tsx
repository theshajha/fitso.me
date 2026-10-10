import type { Door } from "@fitso/core";

/**
 * "fitso" in Unbounded 900. The dot of the i is a tilted fabric swatch:
 * the same object the product hands people (their palette).
 */
export function Wordmark({
  size = 28,
  className = "",
  color = "var(--ink)",
  dot = "var(--magenta)",
}: {
  /** Font size in px. */
  size?: number;
  /** Kept for older call sites; the mark no longer changes by door. */
  door?: Door;
  withMark?: boolean;
  className?: string;
  color?: string;
  dot?: string;
}) {
  return (
    <span
      className={`inline-flex items-baseline ${className}`.trim()}
      style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: size, letterSpacing: "-0.05em", lineHeight: 1, color }}
      aria-label="fitso"
      role="img"
    >
      <span aria-hidden="true">f</span>
      <span aria-hidden="true" style={{ position: "relative", display: "inline-block" }}>
        {"ı"}
        <span
          style={{
            position: "absolute",
            left: "50%",
            top: "-0.04em",
            width: "0.27em",
            height: "0.31em",
            marginLeft: "-0.135em",
            borderRadius: "0.07em",
            background: dot,
            transform: "rotate(-14deg)",
          }}
        />
      </span>
      <span aria-hidden="true">tso</span>
    </span>
  );
}
