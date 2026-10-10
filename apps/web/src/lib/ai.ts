import { generateText, Output } from "ai";
import {
  QuickWinProfile,
  Verdict,
  type Door,
  type QuickWinAnswers,
} from "@fitso/core";
import { env, isStub } from "./env";

/**
 * AI calls through the Vercel AI Gateway (AI SDK 7). Model ids are plain
 * "provider/model" strings, so the gateway is the default provider and reads
 * AI_GATEWAY_API_KEY (or the Vercel OIDC token). Structured output uses
 * generateText with Output.object and a zod schema.
 *
 * Photo bytes are only ever passed into these calls. They are never stored or logged.
 */

// ---------- prompts ----------

const HONESTY_CORE = `You are fitso, an honest stylist: a friend who dresses well and likes the person you are talking to.
Voice: sentence case, short, warm, specific. Never use percentiles. Never compare the person to other people. No fake scores.
Rules:
- Lead with what is working. Every compliment must name something actually visible in the photo (skin tone against a colour, fit of a collar, hair, glasses, jawline, background light).
- Frame gaps as upgrades, never as flaws.
- Confidence reflects lighting and framing, not the person. Low light, filters, heavy shadow, a cropped face or a tinted background all lower it. If confidence is below 0.6, set retake_hint to one short, kind instruction (for example: "retake in daylight, facing a window"). Otherwise retake_hint is null.
- An honest no is worth more than a polite yes. Never flatter.
- Respond only with the structured object that matches the schema. No extra commentary.`;

const DOOR_BLOCKS: Record<Door, string> = {
  men: `Door: men. The audience is men in India and the Gulf, 20 to 35, who shop online. Think kurtas and shirts, chinos, denim, sneakers and loafers, climate-aware fabrics (linen, cotton), and festive wear when it fits. Prices are in INR. Keep the tone direct and easy, like a friend who knows clothes.`,
  women: `Door: women. The audience is women in India and the Gulf, 20 to 35, who shop online. Think kurtas and sets, sarees and festive wear, western separates, dresses, tops and denim, jewellery and dupattas where they matter, climate-aware fabrics. Prices are in INR. Keep the tone warm and specific, like a friend who knows clothes.`,
};

const PROFILE_TASK = `Task: read the selfie and the five answers, and return the person's colour season and style profile.
- season and season_depth: the four-season colour system (spring, summer, autumn, winter) and the depth variant that fits best. Judge from skin, hair and eyes, accounting for the light.
- undertone: warm, cool or neutral.
- archetype: it MUST be exactly one name from the allowed list given in the user message. Prefer the one that fits the person's "vibe" answer and the photo.
- working_for_you: exactly three short lines. Each one points at something visible in the photo and says why it works.
- stop_buying: one specific item or colour they should stop buying, phrased as an upgrade ("Swap X for Y").
- palette: 6 to 8 hex colours (format #rrggbb) that suit the season and undertone. Wearable shades, not a rainbow.
- confidence: 0 to 1.`;

const VERDICT_TASK = `Task: give a verdict on one item the person is thinking of buying, given their stored profile and answers.
- verdict: "yes", "yes_if" or "no".
- It MUST be "no" or "yes_if" when the item duplicates a strength the profile already covers, clashes with the palette or undertone, or goes against the stop_buying guidance. Do not soften an honest no.
- reasons: 2 to 4 short reasons. Name the colour, cut or fabric you are judging.
- condition: for "yes_if", one concrete condition (for example "only in the olive, not the mustard"). Otherwise null.
- item: name, brand (null if unknown), category, colour, price_guess_inr (null if unknown).
- saved_amount_inr: the price_guess_inr when the verdict is "no" (money not spent), otherwise null.
Use only what you can see or read. If the item is unclear, say so in a reason and lean to "yes_if".`;

export function quickWinSystemPrompt(door: Door): string {
  return [HONESTY_CORE, DOOR_BLOCKS[door], PROFILE_TASK].join("\n\n");
}

export function verdictSystemPrompt(door: Door): string {
  return [HONESTY_CORE, DOOR_BLOCKS[door], VERDICT_TASK].join("\n\n");
}

// ---------- public API ----------

export type QuickWinProfileInput = {
  door: Door;
  answers: QuickWinAnswers;
  imageBytes: Uint8Array;
  mimeType: string;
  /** Archetype names allowed for this door (from content/archetypes.json). */
  archetypes: string[];
};

export type ItemVerdictInput = {
  profile: QuickWinProfile;
  answers: QuickWinAnswers;
  imageBytes?: Uint8Array;
  mimeType?: string;
  link?: string;
  /** The door of the quick win. Defaults to "women" when omitted, so pass it. */
  door?: Door;
};

export async function quickWinProfile(input: QuickWinProfileInput): Promise<QuickWinProfile> {
  if (input.archetypes.length === 0) throw new Error("quickWinProfile: archetypes list is empty");
  if (isStub.ai) return stubProfile(input);

  const userText = [
    `Allowed archetypes for this door (choose exactly one): ${input.archetypes.join(" | ")}`,
    `Answers: ${JSON.stringify(input.answers)}`,
  ].join("\n");

  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { output } = await generateText({
        model: env.aiModelQuickWin,
        system: quickWinSystemPrompt(input.door),
        output: Output.object({ schema: QuickWinProfile }),
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: userText },
              { type: "file", mediaType: input.mimeType, data: input.imageBytes },
            ],
          },
        ],
      });
      if (!input.archetypes.includes(output.archetype)) {
        throw new Error(`model returned an archetype outside the list: ${output.archetype}`);
      }
      return normaliseProfile(output);
    } catch (err) {
      lastError = err;
    }
  }
  throw new Error(`quickWinProfile failed: ${(lastError as Error)?.message ?? "unknown error"}`);
}

export async function itemVerdict(input: ItemVerdictInput): Promise<Verdict> {
  if (!input.imageBytes && !input.link) throw new Error("itemVerdict: pass a screenshot or a link");
  if (input.imageBytes && !input.mimeType) throw new Error("itemVerdict: mimeType is required with imageBytes");
  if (isStub.ai) return stubVerdict(input);

  const door: Door = input.door ?? "women";
  const content: Array<
    { type: "text"; text: string } | { type: "file"; mediaType: string; data: Uint8Array }
  > = [
    {
      type: "text",
      text: [
        `Stored profile: ${JSON.stringify(input.profile)}`,
        `Answers: ${JSON.stringify(input.answers)}`,
        input.link ? `Item link: ${input.link}` : "Item: see the screenshot.",
      ].join("\n"),
    },
  ];
  if (input.imageBytes && input.mimeType) {
    content.push({ type: "file", mediaType: input.mimeType, data: input.imageBytes });
  }

  const { output } = await generateText({
    model: env.aiModelVerdict,
    system: verdictSystemPrompt(door),
    output: Output.object({ schema: Verdict }),
    messages: [{ role: "user", content }],
  });
  return output;
}

function normaliseProfile(p: QuickWinProfile): QuickWinProfile {
  if (p.confidence < 0.6 && !p.retake_hint) {
    return { ...p, retake_hint: "Retake in daylight, facing a window, with your whole face in frame." };
  }
  if (p.confidence >= 0.6 && p.retake_hint) return { ...p, retake_hint: null };
  return p;
}

// ---------- stub fixtures (deterministic) ----------

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const SEASON_FIXTURES = {
  spring: { depth: "bright", undertone: "warm", palette: ["#FF7A45", "#F4B942", "#7BC47F", "#2FA7A0", "#E8D5B0", "#C85A54", "#F7E7CE"] },
  summer: { depth: "soft", undertone: "cool", palette: ["#7FA8D9", "#B8A9C9", "#D98BA3", "#5E7A99", "#CFE0E8", "#8E8AA8", "#E9D8E4"] },
  autumn: { depth: "deep", undertone: "warm", palette: ["#B8632F", "#6B7A3A", "#C99A2E", "#7A3B2E", "#3F5B4B", "#D9B88F", "#8C5A3C"] },
  winter: { depth: "true", undertone: "cool", palette: ["#2642E5", "#14121B", "#B3261E", "#0F6B5C", "#E6E2EC", "#7A3F8F", "#FFFFFF"] },
} as const;

const SEASONS = ["spring", "summer", "autumn", "winter"] as const;

function stubProfile(input: QuickWinProfileInput): QuickWinProfile {
  const h = hash(`${input.door}|${JSON.stringify(input.answers)}|${input.imageBytes.length}`);
  const season = SEASONS[h % 4];
  const fx = SEASON_FIXTURES[season];
  return QuickWinProfile.parse({
    season,
    season_depth: fx.depth,
    undertone: fx.undertone,
    archetype: input.archetypes[h % input.archetypes.length],
    working_for_you: [
      "Your skin tone carries warm, saturated colour without going flat.",
      "The strong contrast between your hair and skin holds a crisp collar well.",
      "Your jawline and shoulders sit well in structured cuts.",
    ],
    stop_buying: "Swap washed-out beige tees for clear, deeper tones that keep your face lit.",
    palette: [...fx.palette],
    confidence: 0.82,
    retake_hint: null,
  });
}

function stubVerdict(input: ItemVerdictInput): Verdict {
  const seed = hash(`${input.link ?? ""}|${input.imageBytes?.length ?? 0}|${input.profile.season}`);
  const kind = (["yes", "yes_if", "no"] as const)[seed % 3];
  const item = {
    name: "Slim-fit overshirt",
    brand: null,
    category: "outerwear",
    colour: kind === "no" ? "mustard" : "olive",
    price_guess_inr: 2499,
  };
  if (kind === "yes") {
    return Verdict.parse({
      verdict: "yes",
      reasons: ["The olive sits inside your palette.", "The cut matches the structure that already works for you."],
      condition: null,
      item,
      saved_amount_inr: null,
    });
  }
  if (kind === "yes_if") {
    return Verdict.parse({
      verdict: "yes_if",
      reasons: ["The cut is good for you.", "This colour is borderline for your undertone."],
      condition: "Only if it comes in a deeper shade than the one pictured.",
      item,
      saved_amount_inr: null,
    });
  }
  return Verdict.parse({
    verdict: "no",
    reasons: ["Mustard fights your undertone and flattens your face.", "You already own a layer that does this job better."],
    condition: null,
    item,
    saved_amount_inr: 2499,
  });
}
