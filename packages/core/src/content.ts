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

/** content/archetypes.json holds Archetype[] (eight per door). */
export const Archetype = z.looseObject({
  door: Door,
  name: z.string(),
  description: z.string(),
  signature_pieces: z.array(z.string()).length(3),
  /** The vibe answer this archetype maps to. */
  vibe: z.string(),
});
export type Archetype = z.infer<typeof Archetype>;

/** content/seasons.json holds SeasonContent[] (four seasons, depth variants). */
export const SeasonContent = z.looseObject({
  season: Season,
  undertone: z.enum(['warm', 'cool', 'neutral']),
  depths: z.array(z.string()),
  palette: z.array(z.string().regex(/^#[0-9a-f]{6}$/i)).length(12),
  wear_more: z.record(Door, z.array(z.string())),
  wear_less: z.record(Door, z.array(z.string())),
});
export type SeasonContent = z.infer<typeof SeasonContent>;

/** content/tools/<slug>.json. */
export const ToolPage = z.looseObject({
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  headline: z.string().optional(),
  intro: z.string().optional(),
  sections: z.array(GuideSection).optional(),
  faq: z.array(Faq).optional(),
  cta: Cta.optional(),
  keywords: z.array(z.string()).optional(),
});
export type ToolPage = z.infer<typeof ToolPage>;
