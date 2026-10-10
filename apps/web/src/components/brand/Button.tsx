import Link from "next/link";
import type React from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { Door } from "@fitso/core";
import { doorAccent } from "@/lib/tokens";

type Props = {
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  /** Sets the accent. Without it, the nearest [data-door] or magenta applies. */
  door?: Door;
  href?: string;
  children: ReactNode;
  className?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

const SIZES = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
} as const;

export function Button({
  variant = "primary",
  size = "md",
  door,
  href,
  children,
  className = "",
  style,
  onClick,
  ...rest
}: Props) {
  const accent = door ? doorAccent(door) : "var(--accent)";
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold no-underline transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none";
  const look =
    variant === "primary"
      ? { background: accent, color: "#fff", border: `2px solid ${accent}` }
      : { background: "transparent", color: "var(--ink)", border: "2px solid var(--ink)" };
  const cls = `${base} ${SIZES[size]} ${className}`.trim();
  const merged = { ...look, ...style };
  if (href) {
    return (
      <Link href={href} className={cls} style={merged} onClick={onClick as unknown as React.MouseEventHandler<HTMLAnchorElement>}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={cls} style={merged} {...rest}>
      {children}
    </button>
  );
}
