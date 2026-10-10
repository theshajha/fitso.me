import type { ReactNode } from "react";

export type StampKind = "yes" | "no" | "yes-if" | "verdict" | "founding";

const KIND: Record<StampKind, { color: string; text: string }> = {
  yes: { color: "var(--good)", text: "YES" },
  no: { color: "var(--bad)", text: "NO" },
  "yes-if": { color: "var(--warn)", text: "YES-IF" },
  verdict: { color: "var(--ink)", text: "VERDICT" },
  founding: { color: "var(--accent)", text: "FOUNDING" },
};

/** A rotated label chip, like the stamp on a fitting-room ticket. */
export function Stamp({
  kind,
  children,
  rotate = -4,
  className = "",
}: {
  kind: StampKind;
  /** Overrides the default text for the kind. */
  children?: ReactNode;
  rotate?: number;
  className?: string;
}) {
  const { color, text } = KIND[kind];
  return (
    <span
      className={`label inline-block ${className}`.trim()}
      style={{
        color,
        border: `2px solid ${color}`,
        borderRadius: 6,
        padding: "4px 10px",
        background: "var(--paper)",
        transform: `rotate(${rotate}deg)`,
        fontSize: "0.8125rem",
        fontWeight: 500,
        whiteSpace: "nowrap",
      }}
    >
      {children ?? text}
    </span>
  );
}
