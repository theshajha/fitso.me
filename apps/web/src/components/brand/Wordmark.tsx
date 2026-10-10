import type { Door } from "@fitso/core";
import { doorAccent, seasonColors } from "@/lib/tokens";

/** "fitso" in Unbounded 900 with a small drape-chip mark. */
export function Wordmark({
  size = 28,
  door,
  withMark = true,
  className = "",
}: {
  /** Font size in px. */
  size?: number;
  door?: Door;
  withMark?: boolean;
  className?: string;
}) {
  const accent = doorAccent(door);
  const chip = size * 0.7;
  return (
    <span
      className={`inline-flex items-center gap-[0.35em] ${className}`.trim()}
      style={{
        fontFamily: "var(--font-display)",
        fontWeight: 900,
        fontSize: size,
        letterSpacing: "-0.04em",
        lineHeight: 1,
        color: "var(--ink)",
      }}
    >
      {withMark && (
        <svg
          aria-hidden="true"
          width={chip * 1.2}
          height={chip}
          viewBox="0 0 24 20"
          style={{ flex: "none" }}
        >
          <rect x="2" y="6" width="8" height="13" rx="3" fill={seasonColors.summer} transform="rotate(-24 6 19)" />
          <rect x="8" y="3" width="8" height="16" rx="3" fill={seasonColors.spring} transform="rotate(-6 12 19)" />
          <rect x="14" y="4" width="8" height="15" rx="3" fill={accent} transform="rotate(16 18 19)" />
        </svg>
      )}
      <span>fitso</span>
    </span>
  );
}
