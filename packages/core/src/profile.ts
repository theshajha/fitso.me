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

/** Context the person may give. Since 2026-10-10 the flow asks nothing; every field is optional. */
export const QuickWinAnswers = z.object({
  life: z.string().optional(),
  climate: z.string().optional(),
  occasions: z.array(z.string()).optional(),
  budget_per_item: z.string().optional(),
  vibe: z.string().optional(),
  /** Set when the gate was unsure and the person told us. Free text, optional. */
  heritage: z.string().optional(),
  /** Stated measurements, optional. They beat the photo estimate for proportions. */
  height_cm: z.number().min(120).max(230).optional(),
  waist_cm: z.number().min(50).max(160).optional(),
});
export type QuickWinAnswers = z.infer<typeof QuickWinAnswers>;

export { Door };
