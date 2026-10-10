/**
 * Run the read engine on every photo in a folder and write every stage to disk.
 *
 *   npx tsx scripts/eval-read.ts <photos-dir> <out-dir> [door=auto|men|women]
 *
 * Reads ANTHROPIC_API_KEY (and TYPESAFE_API_KEY) from the environment. Each photo
 * gets <out-dir>/<name>/{gate,observation,decisions,text,report}.json and a
 * readable summary.md. Nothing is stored anywhere else.
 */
import { readdirSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Door, QuickWinAnswers } from "@fitso/core";
import archetypes from "../content/archetypes.json" with { type: "json" };
import { gatePhoto, runRead } from "../src/features/read/pipeline";

const [photosDir, outDir, doorArg = "auto"] = process.argv.slice(2);
if (!photosDir || !outDir) {
  console.error("usage: tsx scripts/eval-read.ts <photos-dir> <out-dir> [auto|men|women]");
  process.exit(1);
}

const ANSWERS: Record<Door, QuickWinAnswers> = {
  men: { life: "hybrid", climate: "hot and humid", occasions: ["formal work", "dates and evenings"], budget_per_item: "1,500 to 4,000", vibe: "clean and minimal" },
  women: { life: "office", climate: "hot and humid", occasions: ["formal work", "weddings and festive"], budget_per_item: "1,500 to 4,000", vibe: "polished" },
};

const mime = (f: string) => (f.endsWith(".png") ? "image/png" : f.endsWith(".webp") ? "image/webp" : "image/jpeg") as "image/png" | "image/webp" | "image/jpeg";

async function one(file: string) {
  const name = path.parse(file).name;
  const dir = path.join(outDir, name);
  mkdirSync(dir, { recursive: true });
  const bytes = new Uint8Array(readFileSync(path.join(photosDir, file)));
  const image = { bytes, mimeType: mime(file) };
  const t0 = Date.now();

  const gate = await gatePhoto(image);
  writeFileSync(path.join(dir, "gate.json"), JSON.stringify(gate, null, 2));
  console.log(`[${name}] gate: usable=${gate.usable} presented=${gate.presented_as} issues=${gate.issues.join(",") || "none"} ask=${gate.ask ?? "-"}`);
  if (!gate.usable) return;

  const door: Door = doorArg === "men" || doorArg === "women" ? doorArg : gate.presented_as === "man" ? "men" : "women";
  const names = (archetypes as Record<Door, { name: string }[]>)[door].map((a) => a.name);

  let observation: unknown = null;
  const { report, profile } = await runRead({
    door,
    answers: ANSWERS[door],
    images: [image],
    archetypes: names,
    withReport: true,
    onStage: (stage, data, ms) => {
      console.log(`[${name}] ${stage} ${(ms / 1000).toFixed(1)}s`);
      if (stage === "observe") observation = data;
      writeFileSync(path.join(dir, `${stage}.json`), JSON.stringify(data, null, 2));
    },
  });
  writeFileSync(path.join(dir, "observation.json"), JSON.stringify(observation, null, 2));
  writeFileSync(path.join(dir, "report.json"), JSON.stringify(report, null, 2));
  writeFileSync(path.join(dir, "profile.json"), JSON.stringify(profile, null, 2));

  const d = report.decisions;
  const t = report.text;
  const plan = report.plan;
  const adv = (a: { what: string; why: string }) => `- ${a.what}: ${a.why}`;
  const md = [
    `# ${name} (${door}, ${((Date.now() - t0) / 1000).toFixed(0)}s)`,
    ``,
    `**${t.free.headline}**  confidence ${d.confidence}  ·  vote ${report.colour ? `${Math.round(report.colour.agreement * report.colour.votes)}/${report.colour.votes}` : "-"}`,
    ``,
    `## Free read`,
    ...t.free.working_lines.map((l) => `- ${l}`),
    `- Change: ${t.free.change_line}`,
    ``,
    `## Colour`,
    `- Palette: ${d.palette.map((p) => `${p.name} ${p.hex}`).join(", ")}`,
    `- Neutrals: ${d.neutrals.map((p) => `${p.name} ${p.hex}`).join(", ")}  ·  Metal: ${d.metal} (${d.metal_why})`,
    `- Flow: ${d.flow.map((f) => `${f.name} (${f.keep})`).join("; ")}`,
    `- Must: ${d.must_axis} (${d.must_axis_why})  ·  Flexible: ${d.flexible_axis} (${d.flexible_axis_why})`,
    `- Avoid: ${d.avoid.map((p) => `${p.name}: ${p.why}`).join("; ")}`,
    `- Test: ${d.changing_room_test}`,
    ``,
    `## Style`,
    `- ${d.archetype}: ${d.archetype_why}`,
    `- Words: ${d.style_words.join(", ")}. ${d.style_words_why}`,
    ``,
    `## Line`,
    `Face: ${d.line.face.shape}`,
    ...d.line.face.necklines.map(adv),
    ...d.line.face.collars.map(adv),
    adv(d.line.face.glasses),
    adv(d.line.face.hair),
    adv(d.line.face.earrings_or_scale),
    `Body: ${d.line.body.summary}`,
    ...d.line.body.silhouettes.map(adv),
    ...d.line.body.rise_and_lengths.map(adv),
    adv(d.line.body.print_scale),
    adv(d.line.body.accessory_scale),
    adv(d.line.body.fabric_weight),
    ...d.line.body.fit_fixes.map(adv),
    ``,
    `## Grooming`,
    ...d.grooming.map((g) => `- ${g.area} ${g.verdict}: ${g.what} (${g.why})`),
    ``,
    `## Verification`,
    ...report.verification.map((v) => `- ${v.relation} ${v.confidence.toFixed(2)}: ${v.claim}`),
    ``,
    ...(plan
      ? [
          `## Audit`,
          ...plan.audit.keep.map((k) => `- keep ${k.item}: ${k.why}`),
          ...plan.audit.retire.map((k) => `- retire ${k.item}: ${k.why} -> ${k.instead}`),
          ``,
          `## Outfits (${plan.built_for.source}: ${plan.built_for.settings.join(", ")})`,
          ...plan.outfits.map((o) => `### ${o.name} (${o.occasion})\n${o.pieces.map((p) => `- ${p.slot}: ${p.colour_name} ${p.item}, ${p.cut}, ${p.fabric}${p.from_photo ? " (from photo)" : ""} ${p.hex}`).join("\n")}\n${o.why}\n`),
          `## Buy`,
          ...plan.buy.map((b) => `${b.priority}. ${b.item} [${b.budget_tier}] search: "${b.search_terms}" · ${b.colour_name} ${b.hex}, ${b.fabric}, ${b.cut}, ${b.length_or_fit} · wear with ${b.wear_with} · unlocks ${b.unlocks}`),
          `Stop buying: ${plan.stop_buying.map((s) => `${s.item} (${s.why})`).join("; ")}`,
          ``,
          `## Filters`,
          ...plan.filters.map((f) => `- ${f}`),
          `This week: ${plan.this_week}`,
          ``,
        ]
      : ["(no plan)"]),
    ...(t.report
      ? [
          `## Summary`,
          t.report.summary.you_are,
          ...t.report.summary.five_lines.map((l) => `- ${l}`),
          ...(["seen", "colours", "face", "body", "style", "outfits", "buy", "grooming", "week"] as const).flatMap((k) => {
            const b = t.report![k];
            return [``, `### ${k}: ${b.lead}`, ...b.points.map((x) => `- ${x}`), ...(b.detail ? [`> ${b.detail}`] : [])];
          }),
        ]
      : ["(no prose)"]),
  ].join("\n");
  writeFileSync(path.join(dir, "summary.md"), md);
  console.log(`[${name}] done in ${((Date.now() - t0) / 1000).toFixed(0)}s -> ${dir}/summary.md`);
}

async function main() {
  const files = readdirSync(photosDir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
  console.log(`${files.length} photos`);
  const limit = Number(process.env.EVAL_CONCURRENCY ?? 5);
  const queue = [...files];
  const worker = async () => {
    for (let f = queue.shift(); f; f = queue.shift()) {
      await one(f).catch((e) => console.error(`[${f}] FAILED: ${e instanceof Error ? e.message : e}`));
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, files.length) }, worker));
}
void main();
