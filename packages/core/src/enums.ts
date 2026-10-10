import { z } from 'zod';

export const Door = z.enum(['men', 'women']);
export type Door = z.infer<typeof Door>;

export const VerdictKind = z.enum(['yes', 'yes_if', 'no']);
export type VerdictKind = z.infer<typeof VerdictKind>;

export const Product = z.enum(['report', 'pro']);
export type Product = z.infer<typeof Product>;

export const Currency = z.enum(['INR', 'USD']);
export type Currency = z.infer<typeof Currency>;

export const PriceTier = z.enum(['founding', 'finish_today', 'list']);
export type PriceTier = z.infer<typeof PriceTier>;

export const OrderStatus = z.enum(['pending', 'paid', 'refunded', 'test']);
export type OrderStatus = z.infer<typeof OrderStatus>;
