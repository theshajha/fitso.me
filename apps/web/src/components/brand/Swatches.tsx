import type { CSSProperties } from "react";

export type Swatch = { name: string; hex: string };

/**
 * The palette as fabric swatches: tall tiles with the colour name under each.
 * This is the one signature object on the site. Use it wherever a palette shows.
 */
export function Swatches({
  colors,
  size = "md",
  animate = false,
  showNames = true,
}: {
  colors: Swatch[];
  size?: "sm" | "md" | "lg";
  animate?: boolean;
  showNames?: boolean;
}) {
  // Tiles share the row: up to 8 fit on a phone without wrapping.
  const max = size === "sm" ? 34 : size === "lg" ? 76 : 56;
  return (
    <>
      <ul
        className={`m-0 grid list-none p-0 ${showNames ? "swatches-named" : ""}`}
        style={{
          gap: size === "sm" ? 6 : 8,
          gridTemplateColumns: `repeat(${Math.min(colors.length, 8)}, minmax(0, ${max}px))`,
        }}
      >
        {colors.map((c, i) => (
          <li
            key={`${c.hex}-${i}`}
            className={`flex flex-col gap-1.5 ${animate ? "swatch-in" : ""}`}
            style={{ minWidth: 0, "--i": i } as CSSProperties}
          >
            <span
              title={c.name}
              style={{
                display: "block",
                width: "100%",
                aspectRatio: "1 / 1.3",
                background: c.hex,
                borderRadius: size === "sm" ? 8 : 12,
                border: "2px solid var(--ink)",
                boxShadow: size === "sm" ? "none" : "0 4px 0 var(--ink)",
              }}
            />
            {showNames ? (
              <span
                style={{
                  fontSize: size === "lg" ? "0.8125rem" : "0.75rem",
                  lineHeight: 1.2,
                  fontWeight: 600,
                }}
              >
                {c.name}
              </span>
            ) : (
              <span className="sr-only">{c.name}</span>
            )}
          </li>
        ))}
      </ul>
      {/* Phones: names need room, so four tiles a row. */}
      {showNames && (
        <style>{`@media (max-width: 639px) { .swatches-named { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; row-gap: 14px !important; } }`}</style>
      )}
    </>
  );
}
