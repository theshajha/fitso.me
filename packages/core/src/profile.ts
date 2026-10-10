import { z } from 'zod';
import { Door } from './enums.js';

export const Season = z.enum(['spring', 'summer', 'autumn', 'winter']);
export type Season = z.infer<typeof Season>;

export const QuickWinProfile = z.object({
  season: Season,
  season_depth: z.enum(['light', 'true', 'deep', 'soft', 'bright', 'warm', 'cool']),
  undertone: z.enum(['warm', 'cool', 'neutral']),
  /** From content/archetypes.json for the door. */
  archetype: z.string(),
  /** Each line points at something visible in the photo. */
  working_for_you: z.array(z.string()).length(3),
  /** One specific item or colour, phrased as an upgrade. */
  stop_buying: z.string(),
  palette: z.array(z.string().regex(/^#[0-9a-f]{6}$/i)).min(6).max(8),
  confidence: z.number().min(0).max(1),
  /** Set when confidence < 0.6. */
  retake_hint: z.string().nullable(),
});
export type QuickWinProfile = z.infer<typeof QuickWinProfile>;

/** The five answers (spec section 9). */
export const QuickWinAnswers = z.object({
  life: z.string(),
  climate: z.string(),
  occasions: z.array(z.string()),
  budget_per_item: z.string(),
  vibe: z.string(),
});
export type QuickWinAnswers = z.infer<typeof QuickWinAnswers>;

export { Door };
