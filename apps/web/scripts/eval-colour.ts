/**
 * Stability check for the colour call: observe a photo once, then run the
 * colour vote N times and print the season distribution. Cheap: no judge, no plan.
 *
 *   npx tsx scripts/eval-colour.ts <photo> [runs=4]
 */
import { readFileSync } from "node:fs";
import { ColourCall, Observation } from "@fitso/core";
import { structured } from "../src/lib/anthropic";
import { env } from "../src/lib/env";
import { pickColour } from "../src/features/read/pipeline";
import { COLOUR_SCHOOLS, OBSERVE_SYSTEM, colourUser, observeUser } from "../src/features/read/prompts";

const args = process.argv.slice(2);
const reobserve = args.includes("--reobserve"); // observe again on every run, to measure observer variance
const withImage = args.includes("--with-image"); // let the analysts see the photo as well as the notes
const observers = Number((args.find((a) => a.startsWith("--observers=")) ?? "--observers=1").split("=")[1]); // independent observers per run
const [photo, runsArg = "4"] = args.filter((a) => !a.startsWith("--"));
if (!photo) {
  console.error("usage: tsx scripts/eval-colour.ts <photo> [runs]");
  process.exit(1);
}
const runs = Number(runsArg);
const mime = (photo.endsWith(".png") ? "image/png" : "image/jpeg") as "image/png" | "image/jpeg";

async function main() {
  const bytes = new Uint8Array(readFileSync(photo));
  const image = { bytes, mimeType: mime };
  const observe = () => structured({ model: env.aiModelObserve, system: OBSERVE_SYSTEM, user: observeUser(), image, schema: Observation, effort: "medium" });
  const observeAll = () => Promise.all(Array.from({ length: observers }, observe));
  let obsAll = await observeAll();
  let obs = obsAll[0];
  console.log(`mode: ${observers} observer(s), ${reobserve ? "re-observe each run" : "one observation"}, analysts ${withImage ? "see the photo" : "notes only"}`);
  console.log(`observed: ${obs.skin.depth} skin, ${obs.skin.apparent_undertone} undertone, ${obs.contrast} contrast; read confidence ${obs.photo.colour_read_confidence}`);
  const tally = new Map<string, number>();
  for (let i = 0; i < runs; i++) {
    if (reobserve && i > 0) {
      obsAll = await observeAll();
      obs = obsAll[0];
      console.log(`re-observed: ${obsAll.map((o) => `${o.skin.apparent_undertone}/${o.contrast}`).join(" ")}`);
    }
    const votes = await Promise.all(
      COLOUR_SCHOOLS.map((system) =>
        structured({ model: env.aiModelJudge, system: withImage ? `${system}\n\nYou also have the photo itself. Use it to check the notes, especially undertone and clarity; the notes remain the evidence you cite.` : system, user: colourUser(obsAll), image: withImage ? image : undefined, schema: ColourCall, effort: "high", maxTokens: 3000 }),
      ),
    );
    const pick = pickColour(votes);
    const key = `${pick.season_depth} ${pick.season} / ${pick.undertone}`;
    tally.set(key, (tally.get(key) ?? 0) + 1);
    console.log(`run ${i + 1}: ${votes.map((v) => `${v.season_depth} ${v.season} (${v.undertone}, ${v.clarity}, ${v.confidence})`).join(" | ")}  ->  ${key} (${Math.round(pick.agreement * votes.length)}/${votes.length}${pick.runner_up ? `, runner-up ${pick.runner_up.season_depth} ${pick.runner_up.season}` : ""})`);
  }
  console.log("distribution:", Object.fromEntries(tally));
}
void main();
