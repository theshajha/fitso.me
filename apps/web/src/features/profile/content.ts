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
