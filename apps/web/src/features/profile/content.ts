import type { Door, QuickWinProfile } from "@fitso/core";
import archetypes from "../../../content/archetypes.json";

type ArchetypeFile = Record<Door, { name: string }[]>;

export function archetypeNames(door: Door): string[] {
  return (archetypes as ArchetypeFile)[door].map((a) => a.name);
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "Deep autumn". */
export function seasonLabel(p: Pick<QuickWinProfile, "season" | "season_depth">): string {
  return cap(`${p.season_depth} ${p.season}`);
}

/** Shorten for image cards. */
export function clip(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

/** The colour season in plain words, for the result headline. */
const PLAIN: Record<string, string> = {
  "light spring": "light, warm and clear",
  "true spring": "warm and clear",
  "warm spring": "warm and clear",
  "bright spring": "bright and warm",
  "light summer": "light, cool and soft",
  "true summer": "cool and soft",
  "cool summer": "cool and soft",
  "soft summer": "soft and cool",
  "soft autumn": "soft and warm",
  "true autumn": "warm and earthy",
  "warm autumn": "warm and earthy",
  "deep autumn": "deep and warm",
  "deep winter": "deep and cool",
  "true winter": "cool and clear",
  "cool winter": "cool and clear",
  "bright winter": "bright and cool",
};

export function plainHeadline(p: Pick<QuickWinProfile, "season" | "season_depth">): string {
  const words = PLAIN[`${p.season_depth} ${p.season}`];
  return words ? `Your colours are ${words}.` : `Your colours: ${seasonLabel(p).toLowerCase()}.`;
}

/** Ink or paper, whichever reads better on a background colour. */
export function textOn(hex: string): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return l > 0.22 ? "#14121b" : "#fffdf8";
}
