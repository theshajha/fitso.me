import type { Door } from "@fitso/core";
import archetypes from "../../../content/archetypes.json";
import seasons from "../../../content/seasons.json";

export type SeasonKey = "spring" | "summer" | "autumn" | "winter";

export type SampleCardData = {
  id: string;
  door: Door;
  season: SeasonKey;
  depth: string;
  archetype: string;
  strengths: [string, string, string];
  upgrade: string;
  palette: string[];
};

type ArchetypeFile = Record<Door, { key: string; name: string }[]>;

function archetypeName(door: Door, key: string): string {
  const found = (archetypes as ArchetypeFile)[door].find((a) => a.key === key);
  if (!found) throw new Error(`Unknown archetype ${door}/${key}`);
  return found.name;
}

function palette(season: SeasonKey): string[] {
  return (seasons as Record<SeasonKey, { palette: string[] }>)[season].palette.slice(0, 8);
}

const womenKeys = (archetypes as ArchetypeFile).women.map((a) => a.key);

/** Illustrative samples. They are not real people. */
export const SAMPLE_CARDS: SampleCardData[] = [
  {
    id: "sample-men-winter",
    door: "men",
    season: "winter",
    depth: "deep",
    archetype: archetypeName("men", "quiet-sharp"),
    strengths: [
      "Your jaw holds a spread collar well.",
      "Deep blue next to your skin looks sharp.",
      "Your shoulders carry an unstructured blazer.",
    ],
    upgrade: "Swap the grey-beige chinos for ink navy. You will have one look that always works.",
    palette: palette("winter"),
  },
  {
    id: "sample-women-autumn",
    door: "women",
    season: "autumn",
    depth: "warm",
    archetype: archetypeName("women", womenKeys[1]),
    strengths: [
      "Warm rust lifts the gold in your skin.",
      "A V-neckline suits the length of your neck.",
      "Your hair colour sits well with olive and brass.",
    ],
    upgrade: "Try a mustard or terracotta dupatta in place of the icy pastel one.",
    palette: palette("autumn"),
  },
  {
    id: "sample-women-spring",
    door: "women",
    season: "spring",
    depth: "bright",
    archetype: archetypeName("women", womenKeys[6]),
    strengths: [
      "Coral near your face makes your skin look clear.",
      "Your contrast is high, so bold prints work.",
      "Gold jewellery matches your undertone.",
    ],
    upgrade: "Swap heavy black for warm cream or camel near your face.",
    palette: palette("spring"),
  },
];
