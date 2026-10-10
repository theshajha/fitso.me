import { z } from 'zod';

export const Verdict = z.object({
  verdict: z.enum(['yes', 'yes_if', 'no']),
  reasons: z.array(z.string()).min(2).max(4),
  /** For yes_if. */
  condition: z.string().nullable(),
  item: z.object({
    name: z.string(),
    brand: z.string().nullable(),
    category: z.string(),
    colour: z.string(),
    price_guess_inr: z.number().nullable(),
  }),
  saved_amount_inr: z.number().nullable(),
});
export type Verdict = z.infer<typeof Verdict>;
