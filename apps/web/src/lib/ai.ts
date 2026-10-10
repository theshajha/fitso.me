import { QuickWinProfile, Verdict, type Door, type QuickWinAnswers } from "@fitso/core";
import { structured } from "./anthropic";
import { env, isStub } from "./env";

/**
 * The item verdict ("should I buy this"). Kept for the existing /api/verdict route;
 * no page links to it since the 2026-10-10 reframe. The read engine lives in
 * src/features/read.
 */

const VOICE = `You are fitso, a stylist who likes the person you are talking to. Sentence case, short, warm, specific. Never a percentile, never a comparison to other people.`;

const DOOR_BLOCKS: Record<Door, string> = {
  men: `Door: men. The audience is men in India and the Gulf, 20 to 35, who shop online. Prices are in INR.`,
  women: `Door: women. The audience is women in India and the Gulf, 20 to 35, who shop online. Prices are in INR.`,
};

const VERDICT_TASK = `Task: give a verdict on one item the person is thinking of buying, given their stored profile and answers.
- verdict: "yes", "yes_if" or "no".
- It MUST be "no" or "yes_if" when the item clashes with the palette or undertone, or goes against the stop_buying guidance.
- reasons: 2 to 4 short reasons. Name the colour, cut or fabric you are judging.
- condition: for "yes_if", one concrete condition. Otherwise null.
- item: name, brand (null if unknown), category, colour, price_guess_inr (null if unknown).
- saved_amount_inr: the price_guess_inr when the verdict is "no", otherwise null.
Use only what you can see or read. If the item is unclear, say so in a reason and lean to "yes_if".`;

export type ItemVerdictInput = {
  profile: QuickWinProfile;
  answers: QuickWinAnswers;
  imageBytes?: Uint8Array;
  mimeType?: string;
  link?: string;
  door?: Door;
};

export async function itemVerdict(input: ItemVerdictInput): Promise<Verdict> {
  if (!input.imageBytes && !input.link) throw new Error("itemVerdict: pass a screenshot or a link");
  if (input.imageBytes && !input.mimeType) throw new Error("itemVerdict: mimeType is required with imageBytes");
  if (isStub.ai) return stubVerdict(input);

  const door: Door = input.door ?? "women";
  const mime = input.mimeType as "image/jpeg" | "image/png" | "image/webp" | undefined;
  return structured({
    model: env.aiModelVerdict,
    system: [VOICE, DOOR_BLOCKS[door], VERDICT_TASK].join("\n\n"),
    user: [
      `Stored profile: ${JSON.stringify(input.profile)}`,
      `Answers: ${JSON.stringify(input.answers)}`,
      input.link ? `Item link: ${input.link}` : "Item: see the screenshot.",
    ].join("\n"),
    image: input.imageBytes && mime ? { bytes: input.imageBytes, mimeType: mime } : undefined,
    schema: Verdict,
    effort: "low",
    maxTokens: 4000,
  });
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function stubVerdict(input: ItemVerdictInput): Verdict {
  const seed = hash(`${input.link ?? ""}|${input.imageBytes?.length ?? 0}|${input.profile.season}`);
  const kind = (["yes", "yes_if", "no"] as const)[seed % 3];
  const item = { name: "Slim-fit overshirt", brand: null, category: "outerwear", colour: kind === "no" ? "mustard" : "olive", price_guess_inr: 2499 };
  if (kind === "yes") {
    return Verdict.parse({ verdict: "yes", reasons: ["The olive sits inside your palette.", "The cut matches what already works for you."], condition: null, item, saved_amount_inr: null });
  }
  if (kind === "yes_if") {
    return Verdict.parse({ verdict: "yes_if", reasons: ["The cut is good for you.", "This colour is borderline for your undertone."], condition: "Only in a deeper shade than the one pictured.", item, saved_amount_inr: null });
  }
  return Verdict.parse({ verdict: "no", reasons: ["Mustard fights your undertone.", "You already own a layer that does this job."], condition: null, item, saved_amount_inr: 2499 });
}
