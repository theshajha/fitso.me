/**
 * Build the two sample reports the site shows (a woman and a man), end to end,
 * with the current engine. Writes content/samples/{women,men}.json as full
 * ReadReport objects plus the profile. Re-run whenever the engine changes.
 *
 *   npx tsx scripts/make-samples.ts            # both
 *   npx tsx scripts/make-samples.ts women      # one
 *
 * Reads ANTHROPIC_API_KEY, TYPESAFE_API_KEY (and GEMINI_API_KEY when visuals are on) from the environment.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import type { Door, QuickWinAnswers } from "@fitso/core";
import archetypes from "../content/archetypes.json" with { type: "json" };
import { runRead } from "../src/features/read/pipeline";

const SAMPLES: Record<Door, { photo: string; answers: QuickWinAnswers }> = {
  women: {
    photo: "public/people/woman-1.jpg",
    answers: { life: "office", climate: "hot and humid", occasions: ["formal work", "weddings and festive"], budget_per_item: "1,500 to 4,000", height_cm: 165 },
  },
  men: {
    photo: "public/people/man-1.jpg",
    answers: { life: "hybrid", climate: "hot and humid", occasions: ["formal work", "dates and evenings"], budget_per_item: "1,500 to 4,000", height_cm: 180 },
  },
};

async function one(door: Door) {
  const { photo, answers } = SAMPLES[door];
  const bytes = new Uint8Array(readFileSync(photo));
  const t0 = Date.now();
  const names = (archetypes as Record<Door, { name: string }[]>)[door].map((a) => a.name);
  const { report, profile } = await runRead({
    door,
    answers,
    images: [{ bytes, mimeType: "image/jpeg" }],
    archetypes: names,
    withReport: true,
    onStage: (stage, _d, ms) => console.log(`[${door}] ${stage} ${(ms / 1000).toFixed(1)}s`),
  });
  mkdirSync("content/samples", { recursive: true });
  const out = path.join("content/samples", `${door}.json`);
  writeFileSync(out, JSON.stringify({ made_at: new Date().toISOString(), photo: photo.replace("public", ""), answers, profile, report }, null, 2));
  console.log(`[${door}] wrote ${out} in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}

async function main() {
  const which = (process.argv[2] as Door | undefined) ?? null;
  const doors: Door[] = which ? [which] : ["women", "men"];
  await Promise.all(doors.map((d) => one(d).catch((e) => console.error(`[${d}] FAILED: ${e instanceof Error ? e.message : e}`))));
}
void main();
