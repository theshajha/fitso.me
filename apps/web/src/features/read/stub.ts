import { Observation, PhotoGate, ReadReport, type Decisions, type Door, type Plan } from "@fitso/core";
import type { ImagePart } from "@/lib/anthropic";
import type { ReadInput, ReadOutput } from "./pipeline";
import { cardFrom, profileFrom } from "./pipeline";

/** Deterministic fixtures for stub mode (no ANTHROPIC_API_KEY). Keyed off the image size so retries agree. */

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function stubGate(image: ImagePart): PhotoGate {
  const h = hash(String(image.bytes.length));
  return PhotoGate.parse({
    usable: true,
    person_count: 1,
    face_visible: true,
    full_length: h % 2 === 0,
    lighting: "daylight",
    presented_as: h % 3 === 0 ? "man" : "woman",
    issues: [],
    ask: null,
    face_box: { x: 0.4, y: 0.1, w: 0.2, h: 0.14 },
    heritage: { guess: "South Asian", confidence: 0.8 },
  });
}

const SEASON = {
  spring: { depth: "bright", undertone: "warm", contrast: "medium", palette: ["#e8734a", "#f2b950", "#7fc07a", "#2fa7a0", "#e9d7b4", "#c85a54", "#f7e7ce", "#3d6b8f"] },
  summer: { depth: "soft", undertone: "cool", contrast: "low", palette: ["#7fa8d9", "#b8a9c9", "#d98ba3", "#5e7a99", "#cfe0e8", "#8e8aa8", "#e9d8e4", "#4a5f7a"] },
  autumn: { depth: "deep", undertone: "warm", contrast: "medium", palette: ["#b8632f", "#6b7a3a", "#c99a2e", "#7a3b2e", "#3f5b4b", "#d9b88f", "#8c5a3c", "#2f3a2a"] },
  winter: { depth: "true", undertone: "cool", contrast: "high", palette: ["#2642e5", "#14121b", "#b3261e", "#0f6b5c", "#e6e2ec", "#7a3f8f", "#f4f4f4", "#1f2a44"] },
} as const;

const NEUTRALS = [
  { name: "Espresso", hex: "#4a3020", use: "trousers and shoes" },
  { name: "Warm ivory", hex: "#efe6d2", use: "shirts and knits" },
  { name: "Camel", hex: "#b08550", use: "coats and bags" },
];

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const adv = (what: string, why = "Stub.", evidence = "stub") => ({ what, why, evidence });

/** Emits the same stages as the real run, with short pauses, so the processing screen can be reviewed in stub mode. */
export async function stubReport(input: ReadInput): Promise<ReadOutput> {
  const h = hash(`${input.door}|${JSON.stringify(input.answers)}|${input.images[0].bytes.length}`);
  const season = (["spring", "summer", "autumn", "winter"] as const)[h % 4];
  const fx = SEASON[season];
  const door: Door = input.door;
  const archetype = input.archetypes[h % input.archetypes.length];

  const observation = Observation.parse({
    heritage: { read: input.answers.heritage ?? "South Asian", source: input.answers.heritage ? "stated" : "photo", confidence: 0.8 },
    skin: { depth: "medium", apparent_undertone: fx.undertone, undertone_evidence: "Stub: gold jewellery reads well against the skin." },
    hair: { colour: "black", depth: "very_deep", texture: "wavy", length: "medium", style_notes: "Stub." },
    eyes: { colour: "dark brown" },
    contrast: fx.contrast,
    face: { shape: "oval", notable_features: ["defined jaw", "strong brows"], facial_hair: door === "men" ? "short beard" : null, glasses: false, makeup_or_grooming_notes: null },
    build: { frame: "average", shoulders_vs_hips: "balanced", torso_vs_legs: "balanced", height_impression: "average", posture_notes: null },
    outfit: {
      items: [{ garment: "shirt", colour_name: "tan", colour_hex_estimate: "#c49a6c", fit: "regular", fabric_guess: "cotton", notes: null }],
      accessories: [],
      footwear: "white sneakers",
      formality: "casual",
    },
    photo: { lighting: "daylight", background: "plain wall", colour_cast: null, colour_read_confidence: 0.85 },
  });

  const palette = fx.palette.map((hex, i) => ({ name: `Shade ${i + 1}`, hex, use: i < 3 ? "near the face" : "trousers and layers" }));
  const decisions: Decisions = {
    season,
    season_depth: fx.depth,
    undertone: fx.undertone,
    contrast: fx.contrast,
    clarity: "clear",
    palette,
    neutrals: NEUTRALS,
    metal: fx.undertone === "warm" ? "gold" : "silver",
    metal_why: "Stub.",
    flow: [
      { name: "Soft rust", hex: "#a0482a", keep: "keep it warm" },
      { name: "Forest", hex: "#1f4a32", keep: "keep it deep" },
    ],
    must_axis: "undertone",
    must_axis_why: "Stub.",
    flexible_axis: "depth",
    flexible_axis_why: "Stub.",
    avoid: [
      { name: "Flat grey", hex: "#9a9a9a", why: "Stub: washes the face out." },
      { name: "Icy pastel", hex: "#dfe8f3", why: "Stub: fights the undertone." },
      { name: "Neon lime", hex: "#c8f031", why: "Stub: too bright next to the skin." },
    ],
    changing_room_test: "Stub: hold the fabric under your chin in daylight and watch the shadows along your jaw.",
    archetype,
    archetype_why: "Stub: matches the outfit notes.",
    style_words: ["easy", "warm", "sharp"],
    style_words_why: "Stub.",
    working: [
      { claim: "The tan shirt sits right on your skin.", evidence: "outfit.items[0].colour_name = tan; skin.apparent_undertone", why: "Warm on warm keeps the face lit." },
      { claim: "A regular fit through the shoulder suits your frame.", evidence: "outfit.items[0].fit; build.frame", why: "Nothing pulls, nothing swims." },
      { claim: "Your brows carry a clean, simple neckline.", evidence: "face.notable_features", why: "Strong features do not need busy collars." },
    ],
    change: { swap_out: "white sneakers", swap_in: "tan suede loafers", why: "One warm shoe finishes the warm top half.", evidence: "outfit.footwear" },
    line: {
      face: {
        shape: "oval",
        necklines: [adv("A crew or a shallow V"), adv("An open collar")],
        collars: [adv("A spread collar")],
        glasses: adv("Thin rounded-square frames in tortoiseshell"),
        hair: adv("Keep the length; add a little height on top"),
        earrings_or_scale: adv("A medium watch, 38 to 40 mm"),
      },
      body: {
        summary: "Average frame, balanced shoulders and hips.",
        silhouettes: [adv("Straight and slim-straight"), adv("One relaxed piece with one fitted piece")],
        rise_and_lengths: [adv("Mid rise"), adv("Trousers with a slight break")],
        print_scale: adv("Medium prints"),
        accessory_scale: adv("Medium scale"),
        fabric_weight: adv("Mid-weight cotton and linen"),
        fit_fixes: [adv("Take the shirt in at the sides by 2 cm")],
      },
    },
    grooming: [
      { area: "hair", verdict: "keep", what: "The current length", why: "Stub.", evidence: "stub" },
      { area: "jewellery", verdict: "change", what: "Move to gold", why: "Stub.", evidence: "stub" },
    ],
    confidence: 0.82,
  };

  const piece = (slot: "top" | "bottom" | "shoes", item: string, hex: string, from_photo = false) => ({ slot, item, colour_name: "stub", hex, cut: "regular", fabric: "cotton", from_photo });
  const outfit = (name: string, occasion: string) => ({
    name,
    occasion,
    pieces: [piece("top", "shirt", palette[0].hex, true), piece("bottom", "trousers", NEUTRALS[0].hex), piece("shoes", "loafers", NEUTRALS[2].hex)],
    why: "Stub outfit.",
  });
  const buy = (priority: number, item: string, hex: string) => ({
    priority,
    item,
    search_terms: `${item} cotton`,
    colour_name: "stub",
    hex,
    fabric: "cotton",
    cut: "regular",
    length_or_fit: "regular",
    wear_with: "the tan shirt",
    unlocks: "two outfits",
    budget_tier: "mid" as const,
  });
  const plan: Plan = {
    audit: { keep: [{ item: "tan shirt", why: "Stub." }], retire: [{ item: "white sneakers", why: "Stub.", instead: "tan loafers" }] },
    outfits: [outfit("Everyday", "everyday"), outfit("Work", "work"), outfit("Evening", "evening"), outfit("Festive", "festive"), outfit("Travel", "travel")],
    buy: [buy(1, "tan suede loafers", NEUTRALS[2].hex), buy(2, "espresso trousers", NEUTRALS[0].hex), buy(3, "ivory shirt", NEUTRALS[1].hex), buy(4, "rust knit", palette[0].hex), buy(5, "olive overshirt", palette[1].hex)],
    stop_buying: [
      { item: "flat grey tees", why: "Stub." },
      { item: "white sneakers", why: "Stub." },
      { item: "skinny trousers", why: "Stub." },
    ],
    filters: ["Warm colour near the face", "Espresso, not black", "Gold, not silver", "Straight leg, slight break", "Ask: is it easy, warm, sharp?"],
    this_week: "Buy one pair of tan suede loafers and wear them with the tan shirt.",
    built_for: { settings: ["everyday", "work", "evening", "festive", "travel"], source: "inferred" },
  };

  const withReport = input.withReport !== false;
  const text = {
    free: {
      headline: `You're a ${fx.depth} ${season}.`,
      subline: "Warm colour. Gold. Straight leg.",
      working_lines: [
        "The tan shirt sits right on your skin and keeps your face lit.",
        "A regular fit through the shoulder suits your frame. Nothing pulls, nothing swims.",
        "Your brows carry a clean neckline. You do not need busy collars.",
      ],
      change_line: "Swap the white sneakers for tan suede loafers. One warm shoe finishes the look.",
      palette_caption: "Wear the first three near your face. The rest are for trousers and layers.",
    },
    report: withReport
      ? {
          summary: { you_are: "You're a stub spring with an average frame.", five_lines: ["Warm colour near the face.", "Espresso and gold.", "Straight leg, slight break.", "Easy, warm, sharp.", "Buy tan loafers this week."] },
          seen: { lead: "Medium warm skin, dark hair, an oval face, an average frame.", points: ["Stub point one.", "Stub point two.", "Stub point three."], detail: "Stub detail." },
          colours: { lead: "Wear warm colour near your face.", points: ["Stub point one.", "Stub point two.", "Stub point three."], detail: "Stub detail." },
          face: { lead: "Open collars and shallow V-necks.", points: ["Stub point one.", "Stub point two.", "Stub point three."], detail: "Stub detail." },
          body: { lead: "Straight legs, one relaxed piece with one fitted piece.", points: ["Stub point one.", "Stub point two.", "Stub point three."], detail: "Stub detail." },
          style: { lead: "Easy Classic, in three words: easy, warm, sharp.", points: ["Stub point one.", "Stub point two.", "Stub point three."], detail: "Stub detail." },
          outfits: { lead: "Five outfits for everyday, work, evenings, festive days and travel.", points: ["Stub point one.", "Stub point two.", "Stub point three."], detail: "Stub detail." },
          buy: { lead: "Buy tan suede loafers first.", points: ["Stub point one.", "Stub point two.", "Stub point three."], detail: "Stub detail." },
          grooming: { lead: "Keep the hair as it is.", points: ["Stub point one.", "Stub point two.", "Stub point three."], detail: "Stub detail." },
          week: { lead: "Buy one pair of tan suede loafers this week.", points: ["Stub point one.", "Stub point two.", "Stub point three."], detail: "Stub detail." },
        }
      : null,
  };

  const report = ReadReport.parse({
    door,
    presented_as: door === "men" ? "man" : "woman",
    photo_count: input.images.length,
    colour: { undertone: fx.undertone, depth: "medium", contrast: fx.contrast, clarity: "clear", season, season_depth: fx.depth, reasoning: "Stub.", confidence: 0.8, votes: 5, agreement: 1, runner_up: null },
    observations: [observation],
    decisions,
    plan: withReport ? plan : null,
    text,
    card: withReport ? cardFrom(decisions, plan) : null,
    verification: [],
    models: { observe: "stub", judge: "stub", write: "stub", verify: null },
    took_s: 0,
  });

  const observations = input.images.map((_, i) => ({ ...observation, photo_index: i + 1 }));
  const checks = report.decisions.working.map((w) => ({ claim: w.claim, relation: "skipped" as const, confidence: 0 }));
  const stages: Array<[string, unknown]> = [
    ["observe", observations],
    ["colour", report.colour],
    ["judge", report.decisions],
    ["verify", checks],
    ["write_free", report.text.free],
  ];
  for (const [name, data] of stages) {
    input.onStart?.(name);
    await wait(input.onStage ? 900 : 0);
    input.onStage?.(name, data, 900);
  }
  return { report, profile: profileFrom(report, observations), observations };
}
