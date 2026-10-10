/**
 * Re-run only the writer on the existing sample data. Use after a voice or
 * structure change: it costs two Sonnet calls per sample and about 30 seconds,
 * instead of a full four-minute rebuild.
 *
 *   npx tsx scripts/rewrite-samples.ts [women|men]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { FreeText, ReportText, type Door, type ReadReport } from "@fitso/core";
import { structured } from "../src/lib/anthropic";
import { env } from "../src/lib/env";
import { profileFrom } from "../src/features/read/pipeline";
import { writeFreeSystem, writeReportSystem, writeUser } from "../src/features/read/prompts";

async function one(door: Door) {
  const path = `content/samples/${door}.json`;
  const j = JSON.parse(readFileSync(path, "utf8")) as { answers: Record<string, unknown>; report: ReadReport; profile: unknown };
  const r = j.report;
  if (!r.plan || !r.observations) throw new Error(`${door}: sample has no plan or observations`);
  const t0 = Date.now();
  const [free, report] = await Promise.all([
    structured({ model: env.aiModelWrite, system: writeFreeSystem(door), user: writeUser(r.decisions, j.answers, undefined, r.observations), schema: FreeText, effort: "low", maxTokens: 2000 }),
    structured({ model: env.aiModelWrite, system: writeReportSystem(door), user: writeUser(r.decisions, j.answers, r.plan, r.observations), schema: ReportText, effort: "medium" }),
  ]);
  const next: ReadReport = { ...r, text: { free: { ...free, working_lines: free.working_lines.slice(0, 3) }, report } };
  writeFileSync(path, JSON.stringify({ ...j, rewritten_at: new Date().toISOString(), profile: profileFrom(next, r.observations), report: next }, null, 2));
  console.log(`[${door}] rewritten in ${((Date.now() - t0) / 1000).toFixed(0)}s: ${free.headline} / ${free.subline}`);
}

async function main() {
  const which = (process.argv[2] as Door | undefined) ?? null;
  await Promise.all((which ? [which] : (["women", "men"] as Door[])).map((d) => one(d).catch((e) => console.error(`[${d}] FAILED: ${e instanceof Error ? e.message : e}`))));
}
void main();
