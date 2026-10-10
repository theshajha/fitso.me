import {
  BuyPlan,
  ColourCall,
  ColourStyleDecisions,
  Decisions,
  LineDecisions,
  OutfitPlan,
  FreeText,
  Observation,
  PhotoGate,
  Plan,
  QuickWinProfile,
  ReadReport,
  ReportText,
  ShopCard,
  type Door,
  type QuickWinAnswers,
} from "@fitso/core";
import { structured, type ImagePart } from "@/lib/anthropic";
import { env, isStub } from "@/lib/env";
import { COLOUR_SCHOOLS, GATE_SYSTEM, OBSERVE_SYSTEM, buySystem, colourUser, judgeColourStyleSystem, judgeLineSystem, judgeUser, observeUser, outfitsSystem, planUser, writeFreeSystem, writeReportSystem, writeUser } from "./prompts";
import { stubGate, stubReport } from "./stub";
import { failing, verifyClaims } from "./verify";
import { visualiseOutfits, type OutfitVisual } from "./visualise";

/**
 * The read engine. See docs/superpowers/specs/2026-10-10-read-engine-design.md.
 * Photo bytes come in as `image` and go to the gate and the observer only.
 */

export type ReadInput = {
  door: Door;
  answers: QuickWinAnswers;
  /** One to four photos of the same person. */
  images: ImagePart[];
  /** Archetype names allowed for this door. */
  archetypes: string[];
  /** Called after each stage, for logs and the eval script. */
  onStage?: (stage: string, data: unknown, ms: number) => void;
  /** Called before each stage starts. */
  onStart?: (stage: string) => void;
  /** Write the report text in the same call. Off in the web route, which writes it after the response. */
  withReport?: boolean;
};

export type ReadOutput = { report: ReadReport; profile: QuickWinProfile; observations: Observation[] };

export async function gatePhoto(image: ImagePart): Promise<PhotoGate> {
  if (isStub.ai) return stubGate(image);
  return structured({
    model: env.aiModelGate,
    system: GATE_SYSTEM,
    user: "Check this photo.",
    image,
    schema: PhotoGate,
    effort: "low",
    maxTokens: 2000,
  });
}

/** Run fn, and once more on a schema or parse failure (the model usually gets it right the second time). */
async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    const m = e instanceof Error ? e.message : "";
    if (/schema|parse|max_tokens/i.test(m)) return fn();
    throw e;
  }
}

/** "#abc", "ABCDEF", "#aabbcc " -> "#aabbcc"; anything else -> null. */
export function normaliseHex(raw: string): string | null {
  const s = raw.trim().replace(/^#/, "").toLowerCase();
  if (/^[0-9a-f]{6}$/.test(s)) return `#${s}`;
  if (/^[0-9a-f]{3}$/.test(s)) return `#${s.split("").map((c) => c + c).join("")}`;
  return null;
}

const COLOUR_VOTES = 5;
const OBSERVERS_SINGLE_PHOTO = 3;

/**
 * Majority season; within it the highest-confidence vote. Ties go to the most
 * confident vote overall. When the analysts split on undertone, the winner is
 * recorded as neutral: that is the honest answer for a person on the warm/cool
 * border, and the judge then marks undertone as the flexible axis.
 */
export type ColourVote = ColourCall & { votes: number; agreement: number; runner_up: { season: ColourCall["season"]; season_depth: string; votes: number } | null };

export function pickColour(votes: ColourCall[]): ColourVote {
  const bySeason = new Map<string, ColourCall[]>();
  for (const v of votes) bySeason.set(v.season, [...(bySeason.get(v.season) ?? []), v]);
  let best: ColourCall[] = [];
  for (const group of bySeason.values()) {
    if (group.length > best.length) best = group;
    else if (group.length === best.length && Math.max(...group.map((g) => g.confidence)) > Math.max(...best.map((g) => g.confidence))) best = group;
  }
  const top = [...best].sort((a, b) => b.confidence - a.confidence)[0];
  const agreement = best.length / votes.length;
  const undertones = new Set(votes.map((v) => v.undertone));
  const undertone = undertones.size > 1 && agreement < 1 ? "neutral" : top.undertone;
  const reasoning = undertone !== top.undertone ? `${top.reasoning} The analysts split on warm versus cool, so the undertone is recorded as neutral.` : top.reasoning;
  const others = [...bySeason.entries()].filter(([season]) => season !== top.season).sort((a, b) => b[1].length - a[1].length);
  const runner_up = others.length
    ? { season: others[0][1][0].season, season_depth: [...others[0][1]].sort((a, b) => b.confidence - a.confidence)[0].season_depth, votes: others[0][1].length }
    : null;
  return { ...top, undertone, reasoning, confidence: Math.round(top.confidence * agreement * 100) / 100, votes: votes.length, agreement, runner_up };
}

function tidyDecisions(d: Decisions): Decisions {
  const clean = <T extends { hex: string }>(xs: T[]) => xs.map((p) => ({ ...p, hex: normaliseHex(p.hex) })).filter((p): p is T & { hex: string } => p.hex !== null);
  const palette = clean(d.palette).slice(0, 8);
  const neutrals = clean(d.neutrals).slice(0, 5);
  const flow = clean(d.flow).slice(0, 4);
  const avoid = d.avoid.map((p) => ({ ...p, hex: normaliseHex(p.hex) ?? "#9a9a9a" })).slice(0, 3);
  if (palette.length < 6) throw new Error("judge returned fewer than 6 valid palette colours (schema)");
  if (neutrals.length < 3) throw new Error("judge returned fewer than 3 valid neutrals (schema)");
  return { ...d, palette, neutrals, flow, avoid, working: d.working.slice(0, 3) };
}

/** Hex values the plan may use: the palette and the neutrals. */
function allowedHexes(d: Decisions): Set<string> {
  return new Set([...d.palette, ...d.neutrals].map((p) => p.hex.toLowerCase()));
}

/** Outfit and buy colours must come from the palette or neutrals. Returns the offending lines. */
export function checkPlanColours(plan: Plan, d: Decisions): string[] {
  const ok = allowedHexes(d);
  const bad: string[] = [];
  plan.outfits.forEach((o) => o.pieces.forEach((p) => {
    const h = normaliseHex(p.hex);
    if (!h || !ok.has(h)) bad.push(`outfit "${o.name}", ${p.slot} "${p.item}" uses ${p.hex}, which is not a palette or neutral hex`);
  }));
  plan.buy.forEach((b) => {
    const h = normaliseHex(b.hex);
    if (!h || !ok.has(h)) bad.push(`buy item "${b.item}" uses ${b.hex}, which is not a palette or neutral hex`);
  });
  return bad;
}

/** The phone-sized card, derived from the decisions and the plan. */
export function cardFrom(d: Decisions, plan: Plan): ShopCard {
  return ShopCard.parse({
    season: `${d.season_depth.charAt(0).toUpperCase() + d.season_depth.slice(1)} ${d.season}`,
    palette: d.palette,
    neutrals: d.neutrals,
    metal: d.metal.replace("_", " "),
    words: d.style_words,
    filters: plan.filters,
  });
}

export async function runRead(input: ReadInput): Promise<ReadOutput> {
  if (input.archetypes.length === 0) throw new Error("runRead: archetypes list is empty");
  if (input.images.length < 1 || input.images.length > 6) throw new Error("runRead: send 1 to 6 photos");
  if (isStub.ai) return stubReport(input);

  const t0 = Date.now();
  const stage = async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    const s = Date.now();
    input.onStart?.(name);
    const out = await fn();
    input.onStage?.(name, out, Date.now() - s);
    return out;
  };

  // One observer is a single read of an ambiguous photo and the biggest source of
  // run-to-run drift. With one photo, three observers read it in parallel and every
  // later stage sees all three records. With several photos, one observer each.
  const observersPerPhoto = input.images.length === 1 ? OBSERVERS_SINGLE_PHOTO : 1;
  const observations = await stage("observe", () =>
    Promise.all(
      input.images.flatMap((image, i) =>
        Array.from({ length: observersPerPhoto }, () =>
          withRetry(() =>
            structured({
              model: env.aiModelObserve,
              system: OBSERVE_SYSTEM,
              user: observeUser(input.answers.heritage, i + 1, input.images.length, { height_cm: input.answers.height_cm, waist_cm: input.answers.waist_cm }),
              image,
              schema: Observation,
              effort: "medium",
            }),
          ).then((o) => ({ ...o, photo_index: i + 1 })),
        ),
      ),
    ),
  );


  // Three colour analysts vote in parallel; the majority season wins, ties go to confidence.
  const colour = await stage("colour", async () => {
    const votes = await Promise.all(
      COLOUR_SCHOOLS.slice(0, COLOUR_VOTES).map((system) =>
        withRetry(() =>
          structured({
            model: env.aiModelJudge,
            system,
            user: colourUser(observations),
            schema: ColourCall,
            effort: "high",
            maxTokens: 3000,
          }),
        ),
      ),
    );
    return pickColour(votes);
  });

  // The judge is two parallel calls on the same inputs: colour and style, then line and fit.
  const judgeColourStyle = (feedback?: string[]) =>
    withRetry(() =>
      structured({
        model: env.aiModelJudge,
        system: judgeColourStyleSystem(input.door, input.archetypes.join(" | ")),
        user: judgeUser(observations, input.answers, colour, feedback),
        schema: ColourStyleDecisions,
        effort: env.aiJudgeEffort,
      }),
    );
  const judgeLine = () =>
    withRetry(() =>
      structured({
        model: env.aiModelJudge,
        system: judgeLineSystem(input.door),
        user: judgeUser(observations, input.answers, colour),
        schema: LineDecisions,
        effort: env.aiJudgeEffort,
      }),
    );
  const merge = (cs: ColourStyleDecisions, line: LineDecisions): Decisions =>
    tidyDecisions({ ...cs, ...line, season: colour.season, season_depth: colour.season_depth, undertone: colour.undertone, contrast: colour.contrast, clarity: colour.clarity });

  let lineDecisions: LineDecisions | null = null;
  const judgeOnce = async (feedback?: string[]) => {
    const [cs, line] = await Promise.all([judgeColourStyle(feedback), lineDecisions ? Promise.resolve(lineDecisions) : judgeLine()]);
    lineDecisions = line;
    return merge(cs, line);
  };

  let decisions = await stage("judge", () => judgeOnce());
  if (!input.archetypes.includes(decisions.archetype)) {
    decisions = await stage("judge_retry", () =>
      judgeOnce([`archetype "${decisions.archetype}" is not in the allowed list; pick one of the allowed names exactly`]),
    );
    if (!input.archetypes.includes(decisions.archetype)) {
      throw new Error(`judge returned an archetype outside the list: ${decisions.archetype}`);
    }
  }

  const bare = (t: string) => t.replace(/^(the|a|an|your|my)\s+/i, "");
  const claimsOf = (d: Decisions) => [...d.working.map((w) => w.claim), `Swap the ${bare(d.change.swap_out)} (worn in the photo) for ${bare(d.change.swap_in)}.`];
  let checks = await stage("verify", () => verifyClaims(claimsOf(decisions), observations));
  const bad = failing(checks);
  if (bad.length) {
    decisions = await stage("judge_after_verify", () => judgeOnce(bad));
    checks = await stage("verify_2", () => verifyClaims(claimsOf(decisions), observations));
  }

  const free = await stage("write_free", () =>
    withRetry(() => structured({
      model: env.aiModelWrite,
      system: writeFreeSystem(input.door),
      user: writeUser(decisions, input.answers),
      schema: FreeText,
      effort: "low",
      maxTokens: 2000,
    })).then((f) => ({ ...f, working_lines: f.working_lines.slice(0, 3) })),
  );
  const finished = input.withReport
    ? await stage("finish_report", () => finishReport(input.door, decisions, observations, input.answers, input.images[0]))
    : null;

  const report = ReadReport.parse({
    door: input.door,
    presented_as: input.door === "men" ? "man" : "woman",
    photo_count: input.images.length,
    colour,
    observations,
    decisions,
    plan: finished?.plan ?? null,
    text: { free, report: finished?.text ?? null },
    card: finished?.card ?? null,
    visuals: finished?.visuals ?? [],
    verification: checks.map((c) => ({ claim: c.claim, relation: c.relation, confidence: c.confidence })),
    models: {
      observe: env.aiModelObserve,
      judge: env.aiModelJudge,
      write: env.aiModelWrite,
      verify: isStub.verify ? null : "jev-latest",
    },
    took_s: Math.round((Date.now() - t0) / 100) / 10,
  });

  return { report, profile: profileFrom(report, observations), observations };
}

export type FinishedReport = { plan: Plan; text: ReportText; card: ShopCard; visuals: OutfitVisual[] };

/**
 * Everything after the free slice: the plan (outfits, buy list, audit, filters), the
 * prose, and the shop card. Called in the eval run with withReport, after the response
 * in the web route, and again when the person adds their settings after paying.
 */
export async function finishReport(door: Door, decisions: Decisions, observations: Observation[], answers: QuickWinAnswers, photo?: ImagePart): Promise<FinishedReport> {
  const fix = (feedback?: string[]) => (feedback?.length ? `\n\nYour last plan broke these rules; fix them and keep everything else:\n- ${feedback.join("\n- ")}` : "");
  const outfitsOnce = (feedback?: string[]) =>
    withRetry(() =>
      structured({
        model: env.aiModelJudge,
        system: outfitsSystem(door),
        user: planUser(decisions, observations, answers) + fix(feedback),
        schema: OutfitPlan,
        effort: env.aiJudgeEffort,
      }),
    );
  const buyOnce = (outfits: OutfitPlan, feedback?: string[]) =>
    withRetry(() =>
      structured({
        model: env.aiModelJudge,
        system: buySystem(door),
        user: planUser(decisions, observations, answers, outfits) + fix(feedback),
        schema: BuyPlan,
        effort: env.aiJudgeEffort,
      }),
    );
  const planOnce = async (feedback?: string[]): Promise<Plan> => {
    const outfits = await outfitsOnce(feedback);
    const rest = await buyOnce(outfits, feedback);
    return { ...outfits, ...rest };
  };
  let plan = await planOnce();
  let bad = checkPlanColours(plan, decisions);
  if (bad.length) {
    plan = await planOnce(bad);
    bad = checkPlanColours(plan, decisions);
    if (bad.length) {
      // Snap stray colours to the nearest allowed hex rather than fail the whole report.
      const allowed = [...decisions.palette, ...decisions.neutrals];
      const snap = (hex: string) => nearestHex(hex, allowed.map((a) => a.hex)) ?? allowed[0].hex;
      plan = {
        ...plan,
        outfits: plan.outfits.map((o) => ({ ...o, pieces: o.pieces.map((p) => ({ ...p, hex: snap(p.hex) })) })),
        buy: plan.buy.map((b) => ({ ...b, hex: snap(b.hex) })),
      };
    }
  }
  const [text, visuals] = await Promise.all([
    withRetry(() =>
      structured({
        model: env.aiModelWrite,
        system: writeReportSystem(door),
        user: writeUser(decisions, answers, plan, observations),
        schema: ReportText,
        effort: "medium",
      }),
    ),
    photo ? visualiseOutfits(photo, plan.outfits) : Promise.resolve([] as OutfitVisual[]),
  ]);
  return { plan, text, card: cardFrom(decisions, plan), visuals };
}

/** Nearest colour by simple RGB distance. */
export function nearestHex(hex: string, candidates: string[]): string | null {
  const h = normaliseHex(hex);
  if (!h || candidates.length === 0) return null;
  const rgb = (x: string) => [1, 3, 5].map((i) => parseInt(x.slice(i, i + 2), 16));
  const a = rgb(h);
  let best: string | null = null;
  let bestD = Infinity;
  for (const c of candidates) {
    const b = rgb(c);
    const d = (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

/** The compact profile the cards, OG image and result page already read. */
export function profileFrom(report: ReadReport, observations: Observation[]): QuickWinProfile {
  const d = report.decisions;
  const bestRead = Math.max(...observations.map((o) => o.photo.colour_read_confidence));
  const confidence = Math.min(d.confidence, bestRead);
  return QuickWinProfile.parse({
    season: d.season,
    season_depth: d.season_depth,
    undertone: d.undertone,
    archetype: d.archetype,
    working_for_you: report.text.free.working_lines.slice(0, 3),
    stop_buying: report.text.free.change_line,
    palette: d.palette.map((p) => p.hex.toLowerCase()),
    confidence: Math.round(confidence * 100) / 100,
    retake_hint: confidence < 0.6 ? "Retake in daylight, facing a window, with your whole face in frame." : null,
  });
}
