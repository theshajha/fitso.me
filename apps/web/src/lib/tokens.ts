import type { Door } from "@fitso/core";

/** Brand tokens (spec section 4). Keep in sync with src/app/globals.css. */
export const colors = {
  paper: "#FFFDF8",
  ink: "#14121B",
  ink2: "#4B4757",
  line: "#E6E2EC",
  magenta: "#F0127A",
  tangerine: "#FF6B1A",
  cobalt: "#2B3DF5",
  lime: "#C8F031",
  good: "#15735A",
  warn: "#965007",
  bad: "#B3261E",
} as const;

/** Palette strips only. Never use a season colour as text. */
export const seasonColors = {
  spring: "#FF7A45",
  summer: "#7FA8D9",
  autumn: "#B8632F",
  winter: "#2642E5",
} as const;

export type SeasonKey = keyof typeof seasonColors;

export const layout = {
  containerMax: 1200,
  gutter: 16,
  sectionGapDesktop: 96,
  sectionGapMobile: 56,
} as const;

export const doorTheme = {
  men: { accent: colors.cobalt, secondary: colors.lime, label: "Men" },
  women: { accent: colors.magenta, secondary: colors.tangerine, label: "Women" },
} as const satisfies Record<Door, { accent: string; secondary: string; label: string }>;

export function doorAccent(door?: Door): string {
  return door ? doorTheme[door].accent : colors.magenta;
}

export function doorSecondary(door?: Door): string {
  return door ? doorTheme[door].secondary : colors.tangerine;
}
