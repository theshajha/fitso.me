import { z } from 'zod';
import { Door } from './enums.js';
import { Season } from './profile.js';

/**
 * The read engine, in four typed stages. Every stage is a structured object; no
 * free text is parsed. Photo bytes never appear in any of these.
 *
 *   gate      -> PhotoGate       cheap, decides if the photo can be read and what to ask for
 *   observe   -> Observation     what is visible, no opinions
 *   judge     -> Decisions       the calls, each tied to the observation
 *   write     -> ReadText        the stylist's words, free slice and full report
 */

// ---------- 1. gate ----------

export const PhotoIssue = z.enum([
  'no_person',
  'multiple_people',
  'face_hidden',
  'face_too_small',
  'too_dark',
  'too_bright',
  'strong_colour_cast',
  'heavy_filter',
  'blurry',
  'sunglasses',
  'extreme_angle',
  'not_a_photo',
]);
export type PhotoIssue = z.infer<typeof PhotoIssue>;

export const Presented = z.enum(['man', 'woman', 'unsure']);
export type Presented = z.infer<typeof Presented>;

export const PhotoGate = z.object({
  /** True when a colour and style read is possible from this photo. */
  usable: z.boolean(),
  person_count: z.number().int().min(0),
  face_visible: z.boolean(),
  /** Head to feet, or at least head to knees, in frame. */
  full_length: z.boolean(),
  lighting: z.enum(['daylight', 'indoor_even', 'dim', 'harsh', 'mixed']),
  /** How the person presents, read from the photo. Used to pick the door. */
  presented_as: Presented,
  issues: z.array(PhotoIssue),
  /** One short, kind instruction when not usable, or when a better photo would raise the read. Null otherwise. */
  ask: z.string().nullable(),
  /** Where the face sits, as fractions of the image width and height (0 to 1). Null when no face. The app crops a close-up from the original when the face is small. */
  face_box: z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1), w: z.number().min(0).max(1), h: z.number().min(0).max(1) }).nullable(),
  /** Likely heritage, as a region or background ("South Asian", "East African", "Northern European", "East Asian", "Latin American", "Middle Eastern", "mixed"). The flow confirms with the person when confidence is low. */
  heritage: z.object({ guess: z.string(), confidence: z.number().min(0).max(1) }),
});
export type PhotoGate = z.infer<typeof PhotoGate>;

// ---------- 2. observe ----------

const Depth = z.enum(['very_light', 'light', 'medium', 'deep', 'very_deep']);

export const Observation = z.object({
  /** Which photo this is (1-based) when several were sent. */
  photo_index: z.number().int().min(1).optional(),
  /** Heritage as read from the photo, or as the person stated it. Used for skin-tone priors, hair texture and garment vocabulary. */
  heritage: z.object({ read: z.string(), source: z.enum(['photo', 'stated']), confidence: z.number().min(0).max(1) }),
  skin: z.object({
    depth: Depth,
    apparent_undertone: z.enum(['warm', 'cool', 'neutral', 'olive']),
    /** What in the photo points to that undertone: veins, flush, how the current colours sit, jewellery. */
    undertone_evidence: z.string(),
  }),
  hair: z.object({
    colour: z.string(),
    depth: Depth,
    texture: z.enum(['straight', 'wavy', 'curly', 'coily', 'unknown']),
    length: z.enum(['shaved', 'short', 'medium', 'long']),
    style_notes: z.string(),
  }),
  eyes: z.object({ colour: z.string() }),
  /** Difference between hair, skin and eyes. */
  contrast: z.enum(['low', 'medium', 'high']),
  face: z.object({
    shape: z.enum(['oval', 'round', 'square', 'heart', 'oblong', 'diamond', 'unknown']),
    /** Only what is visible: brow, jaw, cheekbones, neck length, smile. */
    notable_features: z.array(z.string()).min(1).max(5),
    facial_hair: z.string().nullable(),
    glasses: z.boolean(),
    makeup_or_grooming_notes: z.string().nullable(),
  }),
  build: z.object({
    frame: z.enum(['slight', 'average', 'broad', 'unknown']),
    shoulders_vs_hips: z.enum(['narrower', 'balanced', 'wider', 'unknown']),
    torso_vs_legs: z.enum(['longer_torso', 'balanced', 'longer_legs', 'unknown']),
    height_impression: z.enum(['short', 'average', 'tall', 'unknown']),
    posture_notes: z.string().nullable(),
  }),
  outfit: z.object({
    items: z
      .array(
        z.object({
          garment: z.string(),
          colour_name: z.string(),
          colour_hex_estimate: z.string(),
          fit: z.enum(['tight', 'slim', 'regular', 'relaxed', 'oversized', 'unknown']),
          fabric_guess: z.string(),
          notes: z.string().nullable(),
        }),
      )
      .max(8),
    accessories: z.array(z.string()),
    footwear: z.string().nullable(),
    formality: z.enum(['athletic', 'casual', 'smart_casual', 'business', 'formal', 'festive']),
  }),
  photo: z.object({
    lighting: z.string(),
    background: z.string(),
    colour_cast: z.string().nullable(),
    /** How far the colour read can be trusted from this photo. */
    colour_read_confidence: z.number().min(0).max(1),
  }),
});
export type Observation = z.infer<typeof Observation>;

// ---------- 2b. colour ----------

/** One colour-analysis vote. Several run in parallel and the majority season wins. */
export const ColourCall = z.object({
  undertone: z.enum(['warm', 'cool', 'neutral']),
  depth: z.enum(['light', 'medium', 'deep']),
  contrast: z.enum(['low', 'medium', 'high']),
  clarity: z.enum(['clear', 'muted']),
  season: Season,
  season_depth: z.enum(['light', 'true', 'deep', 'soft', 'bright', 'warm', 'cool']),
  /** Two or three sentences naming the observation details that decided it. */
  reasoning: z.string(),
  confidence: z.number().min(0).max(1),
});
export type ColourCall = z.infer<typeof ColourCall>;

// ---------- 3. judge ----------

/** Any string the model writes; normaliseHex() in the pipeline turns it into #rrggbb or drops it. */
const Hex = z.string();

export const Grounded = z.object({
  /** The call, one sentence. */
  claim: z.string(),
  /** The observation field or detail it rests on. */
  evidence: z.string(),
  /** Why it works, one sentence. */
  why: z.string(),
});
export type Grounded = z.infer<typeof Grounded>;

/** A piece of advice with its reason and the observation it rests on. */
export const Advice = z.object({
  what: z.string(),
  why: z.string(),
  evidence: z.string(),
});
export type Advice = z.infer<typeof Advice>;

export const Swatch = z.object({ name: z.string(), hex: Hex, use: z.string() });
export type Swatch = z.infer<typeof Swatch>;

export const ColourAxis = z.enum(['undertone', 'depth', 'clarity', 'contrast']);

export const LineDecisions = z.object({
  /** Line, scale and fit. The body section of a real style file. */
  line: z.object({
    face: z.object({
      shape: z.string(),
      necklines: z.array(Advice).min(2).max(4),
      collars: z.array(Advice).min(1).max(3),
      glasses: Advice,
      hair: Advice,
      earrings_or_scale: Advice,
    }),
    body: z.object({
      summary: z.string(),
      silhouettes: z.array(Advice).min(2).max(4),
      rise_and_lengths: z.array(Advice).min(2).max(4),
      print_scale: Advice,
      accessory_scale: Advice,
      fabric_weight: Advice,
      fit_fixes: z.array(Advice).min(1).max(4),
    }),
  }),
  grooming: z.array(z.object({ area: z.enum(['hair', 'beard', 'makeup', 'skin', 'glasses', 'jewellery', 'nails']), verdict: z.enum(['keep', 'change']), what: z.string(), why: z.string(), evidence: z.string() })).min(2).max(6),
});
export type LineDecisions = z.infer<typeof LineDecisions>;

export const ColourStyleDecisions = z.object({
  season: Season,
  season_depth: z.enum(['light', 'true', 'deep', 'soft', 'bright', 'warm', 'cool']),
  undertone: z.enum(['warm', 'cool', 'neutral']),
  contrast: z.enum(['low', 'medium', 'high']),
  clarity: z.enum(['clear', 'muted']),
  /** 8 wearable shades, best first. */
  palette: z.array(Swatch).min(6).max(10),
  /** 3 to 5 neutrals that carry the palette: the colours for trousers, coats, bags, shoes. */
  neutrals: z.array(Swatch).min(3).max(5),
  /** The metal for jewellery, watch, buckles, frames. */
  metal: z.enum(['gold', 'silver', 'both', 'rose_gold', 'bronze']),
  metal_why: z.string(),
  /** Shades from the neighbouring season that still work, and the one thing they must keep. */
  flow: z.array(z.object({ name: z.string(), hex: Hex, keep: z.string() })).min(2).max(4),
  /** The axis the person cannot bend (for example undertone), and the one they can. */
  must_axis: ColourAxis,
  must_axis_why: z.string(),
  flexible_axis: ColourAxis,
  flexible_axis_why: z.string(),
  /** 3 shades to keep away from the face. */
  avoid: z.array(z.object({ name: z.string(), hex: Hex, why: z.string() })).min(2).max(5),
  /** How to test a fabric against the skin in a changing room, two or three sentences, for this person. */
  changing_room_test: z.string(),

  /** Exactly one name from the allowed list. */
  archetype: z.string(),
  archetype_why: z.string(),
  /** Three style words: one from what they wear now, one aspirational within reach, one unifying. The purchase filter. */
  style_words: z.array(z.string()).length(3),
  style_words_why: z.string(),

  /** Three things already working, each tied to the observation. */
  working: z.array(Grounded).min(3).max(5),
  /** The one swap that lifts the most. swap_out is what they wear now; swap_in is what replaces it. */
  change: z.object({ swap_out: z.string(), swap_in: z.string(), why: z.string(), evidence: z.string() }),

  confidence: z.number().min(0).max(1),
});
export type ColourStyleDecisions = z.infer<typeof ColourStyleDecisions>;

/** The judge runs as two parallel calls; this is their merge. */
export const Decisions = ColourStyleDecisions.merge(LineDecisions);
export type Decisions = z.infer<typeof Decisions>;

// ---------- 3b. plan ----------

export const Slot = z.enum(['top', 'bottom', 'dress', 'layer', 'shoes', 'bag', 'accessory', 'jewellery', 'outerwear']);

export const OutfitPiece = z.object({
  slot: Slot,
  item: z.string(),
  colour_name: z.string(),
  /** Must be a palette or neutral hex; checked in code. */
  hex: Hex,
  cut: z.string(),
  fabric: z.string(),
  /** True when the person already wore this piece in the photo. */
  from_photo: z.boolean(),
});
export type OutfitPiece = z.infer<typeof OutfitPiece>;

export const Outfit = z.object({
  occasion: z.string(),
  name: z.string(),
  pieces: z.array(OutfitPiece).min(3).max(6),
  why: z.string(),
});
export type Outfit = z.infer<typeof Outfit>;

export const BuyItem = z.object({
  priority: z.number().int().min(1),
  item: z.string(),
  /** Exact words to type into a shop search box. */
  search_terms: z.string(),
  colour_name: z.string(),
  hex: Hex,
  fabric: z.string(),
  cut: z.string(),
  length_or_fit: z.string(),
  wear_with: z.string(),
  /** What this piece unlocks: how many outfits, which occasion. */
  unlocks: z.string(),
  budget_tier: z.enum(['basic', 'mid', 'investment']),
});
export type BuyItem = z.infer<typeof BuyItem>;

export const OutfitPlan = z.object({
  /** 5 to 7 complete outfits for the person's life. */
  outfits: z.array(Outfit).min(5).max(7),
  /** Which settings the outfits were built for, and whether they came from the person or were read from the photo. */
  built_for: z.object({ settings: z.array(z.string()), source: z.enum(['stated', 'inferred']) }),
});
export type OutfitPlan = z.infer<typeof OutfitPlan>;

export const BuyPlan = z.object({
  /** What they wore that works, and what to retire. From the photo. */
  audit: z.object({
    keep: z.array(z.object({ item: z.string(), why: z.string() })).min(1).max(6),
    retire: z.array(z.object({ item: z.string(), why: z.string(), instead: z.string() })).max(4),
  }),
  /** 5 to 8 pieces, priority order. */
  buy: z.array(BuyItem).min(5).max(8),
  stop_buying: z.array(z.object({ item: z.string(), why: z.string() })).length(3),
  /** Five filters to remember in a shop. Each under 12 words. */
  filters: z.array(z.string()).length(5),
  /** One concrete action for this week. */
  this_week: z.string(),
});
export type BuyPlan = z.infer<typeof BuyPlan>;

/** The planner runs as two calls (outfits first, then the buy list built on them); this is their merge. */
export const Plan = OutfitPlan.merge(BuyPlan);
export type Plan = z.infer<typeof Plan>;

// ---------- 4. write ----------

export const FreeText = z.object({
  /** "You're a bright spring." Plain, under 7 words. */
  headline: z.string(),
  /** What that means in one line, under 12 words. "Clear, warm colour. Gold. Waist on show." */
  subline: z.string(),
  working_lines: z.array(z.string()).min(3).max(5),
  change_line: z.string(),
  palette_caption: z.string(),
});
export type FreeText = z.infer<typeof FreeText>;

/** One section of the report: the takeaway, the points, and the why behind a fold. */
export const Block = z.object({
  /** One sentence, the thing to remember. Under 18 words. */
  lead: z.string(),
  /** 3 to 5 points for most sections, one per outfit or buy item for those; each under 20 words. */
  points: z.array(z.string()).min(2).max(9),
  /** The why, under 70 words. Shown behind a fold. Empty string when nothing to add. */
  detail: z.string(),
});
export type Block = z.infer<typeof Block>;

/** The prose of the report, hierarchy first. Lists and cards come from Decisions and Plan. */
export const ReportText = z.object({
  /** Page one. you_are: one line. five_lines: the five things to remember, in order of weight. */
  summary: z.object({ you_are: z.string(), five_lines: z.array(z.string()).length(5) }),
  seen: Block,
  colours: Block,
  face: Block,
  body: Block,
  style: Block,
  outfits: Block,
  buy: Block,
  grooming: Block,
  week: Block,
});
export type ReportText = z.infer<typeof ReportText>;

export const ReadText = z.object({ free: FreeText, report: ReportText });
export type ReadText = z.infer<typeof ReadText>;

/** The phone-sized shop card. Derived in code from decisions and plan. */
export const ShopCard = z.object({
  season: z.string(),
  palette: z.array(Swatch),
  neutrals: z.array(Swatch),
  metal: z.string(),
  words: z.array(z.string()).length(3),
  filters: z.array(z.string()).length(5),
});
export type ShopCard = z.infer<typeof ShopCard>;

// ---------- the stored result ----------

export const VerificationNote = z.object({
  claim: z.string(),
  relation: z.enum(['supports', 'contradicts', 'says_nothing', 'skipped']),
  confidence: z.number().min(0).max(1),
});

export const ReadReport = z.object({
  door: Door,
  presented_as: Presented,
  /** How many photos went into the read. */
  photo_count: z.number().int().min(1).max(6),
  /** The colour vote that fixed the season: the winning call plus how many analysts agreed. */
  colour: ColourCall.extend({
    votes: z.number().int().min(1),
    agreement: z.number().min(0).max(1),
    /** The season that came second in the vote, when any analyst called it. The flow colours come from here. */
    runner_up: z.object({ season: Season, season_depth: z.string(), votes: z.number().int() }).nullable(),
  }).optional(),
  /** What the observer recorded, one per photo. Derived data, no photo bytes. The report cites it. */
  observations: z.array(Observation).optional(),
  decisions: Decisions,
  /** Outfits, buy list, audit, filters. Written after the response; null until then. Re-made when the person adds context. */
  plan: Plan.nullable(),
  /** The free slice is always present. The report prose is written after the response and filled in when ready. */
  text: z.object({ free: FreeText, report: ReportText.nullable() }),
  /** Null until the plan exists. */
  card: ShopCard.nullable(),
  /** Outfit visuals from the image model (higher tier). Data URLs. Empty when the key is not set. */
  visuals: z.array(z.object({ outfit: z.string(), image: z.string(), model: z.string() })).optional(),
  verification: z.array(VerificationNote),
  models: z.object({ observe: z.string(), judge: z.string(), write: z.string(), verify: z.string().nullable() }),
  /** Seconds, end to end for the free slice. */
  took_s: z.number(),
});
export type ReadReport = z.infer<typeof ReadReport>;
