import { z } from 'zod';
import { Door } from './enums.js';
import { Season } from './profile.js';

const Look = z.object({
  name: z.string(),
  pieces: z.array(z.string()),
  budget_inr: z.string(),
  why: z.string(),
});

const GuideSection = z.object({
  heading: z.string(),
  body: z.string(),
  looks: z.array(Look).optional(),
  tips: z.array(z.string()).optional(),
});

const Faq = z.object({ q: z.string(), a: z.string() });
const Cta = z.object({ headline: z.string(), sub: z.string() });

/** content/guides/<slug>.json (spec section 11). */
export const Guide = z.object({
  slug: z.string(),
  door: Door,
  pillar: z.string(),
  title: z.string(),
  description: z.string(),
  updated: z.string(),
  intro: z.string(),
  sections: z.array(GuideSection),
  faq: z.array(Faq),
  related: z.array(z.string()),
  cta: Cta,
  keywords: z.array(z.string()),
});
export type Guide = z.infer<typeof Guide>;

/**
 * content/colours/<slug>.json (pillar B). Same shape as a guide; the door may
 * be 'both' for pages such as the undertone explainer. Extra keys are kept.
 */
export const ColourPage = z.looseObject({
  slug: z.string(),
  door: z.union([Door, z.literal('both')]),
  pillar: z.string(),
  title: z.string(),
  description: z.string(),
  updated: z.string(),
  intro: z.string(),
  sections: z.array(GuideSection),
  faq: z.array(Faq),
  related: z.array(z.string()),
  cta: Cta,
  keywords: z.array(z.string()),
});
export type ColourPage = z.infer<typeof ColourPage>;

/** One archetype. content/archetypes.json is { men: Archetype[], women: Archetype[] }. */
export const Archetype = z.looseObject({
  key: z.string(),
  name: z.string(),
  one_line: z.string(),
  /** The vibe answer this archetype maps to. */
  vibe_answer: z.string(),
  signature_pieces: z.array(z.string()).length(3),
  avoid_list: z.array(z.string()).optional(),
  famous_for: z.string().optional(),
});
export type Archetype = z.infer<typeof Archetype>;

export const ArchetypesFile = z.object({
  men: z.array(Archetype),
  women: z.array(Archetype),
});
export type ArchetypesFile = z.infer<typeof ArchetypesFile>;

/** One season. content/seasons.json is { spring, summer, autumn, winter }: SeasonContent. */
export const SeasonContent = z.looseObject({
  key: Season,
  name: z.string(),
  one_line: z.string(),
  undertone: z.enum(['warm', 'cool', 'neutral']),
  depth_variants: z.array(z.string()),
  palette: z.array(z.string().regex(/^#[0-9a-f]{6}$/i)).length(12),
  neutrals: z.array(z.string()).optional(),
  metal: z.string().optional(),
  wear_more: z.object({ men: z.array(z.string()), women: z.array(z.string()) }),
  wear_less: z.object({ men: z.array(z.string()), women: z.array(z.string()) }),
  indian_skin_notes: z.string().optional(),
});
export type SeasonContent = z.infer<typeof SeasonContent>;

export const SeasonsFile = z.object({
  spring: SeasonContent,
  summer: SeasonContent,
  autumn: SeasonContent,
  winter: SeasonContent,
});
export type SeasonsFile = z.infer<typeof SeasonsFile>;

/** content/tools/<slug>.json. Extra keys (sample, checklist, how_it_works, ...) are kept. */
export const ToolPage = z.looseObject({
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  headline: z.string(),
  sub: z.string().optional(),
  intro: z.string().optional(),
  how_it_works: z.array(z.string()).optional(),
  what_you_get: z.array(z.string()).optional(),
  tips: z.array(z.string()).optional(),
  honesty: z.string().optional(),
  faq: z.array(Faq),
  cta: z.object({ label: z.string(), href: z.string() }),
  keywords: z.array(z.string()),
});
export type ToolPage = z.infer<typeof ToolPage>;
