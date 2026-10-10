import type { Currency, OrderStatus, PriceTier, Product } from "@fitso/core";
import { toUsdCents, type PriceResult } from "@/lib/pricing";

/** Pure order helpers. No I/O. The routes and the tests both use these. */

export type OrderRow = {
  id: string;
  quick_win_id: string | null;
  email: string;
  product: Product;
  currency: Currency;
  amount_minor: number;
  list_amount_minor: number;
  price_tier: PriceTier;
  status: OrderStatus;
  provider: "dodo";
  provider_order_id: string | null;
  raw: unknown;
};

export type CounterOrder = Pick<OrderRow, "status" | "amount_minor" | "currency">;

/** The row for a new `pending` order. The caller supplies the id so Dodo metadata can carry it. */
export function buildOrderRow(input: {
  id: string;
  quickWinId: string | null;
  email: string;
  product: Product;
  currency: Currency;
  price: PriceResult;
}): OrderRow {
  return {
    id: input.id,
    quick_win_id: input.quickWinId,
    email: input.email.trim().toLowerCase(),
    product: input.product,
    currency: input.currency,
    amount_minor: input.price.amount_minor,
    list_amount_minor: input.price.list_amount_minor,
    price_tier: input.price.tier,
    status: "pending",
    provider: "dodo",
    provider_order_id: null,
    raw: null,
  };
}

/** Metadata sent to Dodo. Dodo accepts only string, number and boolean values. */
export function checkoutMetadata(input: {
  orderId: string;
  token: string | null;
  product: Product;
  tier: PriceTier;
}): Record<string, string> {
  return { order_id: input.orderId, token: input.token ?? "", product: input.product, tier: input.tier };
}

export type WebhookAction = "paid" | "refunded" | "ignore";

export type MappedEvent = {
  action: WebhookAction;
  /** Our order id, from metadata.order_id. */
  orderId: string | null;
  /** Dodo payment id (payment.succeeded) or the refunded payment's id (refund.succeeded). */
  paymentId: string | null;
  /** Amount in minor units and currency when the event carries them. */
  amountMinor: number | null;
  currency: string | null;
};

type LooseEvent = { type?: unknown; data?: Record<string, unknown> | null };

const str = (v: unknown): string | null => (typeof v === "string" && v !== "" ? v : null);
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

/** Map a Dodo event to what we do with it. Only payment.succeeded and refund.succeeded matter. */
export function mapWebhookEvent(event: unknown): MappedEvent {
  const e = (event ?? {}) as LooseEvent;
  const data = (e.data ?? {}) as Record<string, unknown>;
  const metadata = (data.metadata ?? {}) as Record<string, unknown>;
  const base = {
    orderId: str(metadata.order_id),
    paymentId: str(data.payment_id),
    amountMinor: null as number | null,
    currency: null as string | null,
  };
  if (e.type === "payment.succeeded") {
    return { ...base, action: "paid", amountMinor: num(data.total_amount), currency: str(data.currency) };
  }
  if (e.type === "refund.succeeded") {
    return { ...base, action: "refunded", amountMinor: num(data.amount), currency: str(data.currency) };
  }
  return { ...base, action: "ignore" };
}

/** True when the payment is smaller than the order, in the same currency. Currency mismatch is not judged. */
export function isUnderpaid(order: Pick<OrderRow, "amount_minor" | "currency">, ev: MappedEvent): boolean {
  if (ev.amountMinor === null || ev.currency !== order.currency) return false;
  return ev.amountMinor < order.amount_minor;
}

/**
 * Next status for an order. Repeated events change nothing (idempotent).
 * A refund is final: a late `paid` event never revives a refunded order.
 * `test` orders never change.
 */
export function nextStatus(current: OrderStatus, action: WebhookAction): { status: OrderStatus; changed: boolean } {
  if (action === "ignore" || current === "test") return { status: current, changed: false };
  if (action === "paid") {
    return current === "pending" ? { status: "paid", changed: true } : { status: current, changed: false };
  }
  return current === "paid" ? { status: "refunded", changed: true } : { status: current, changed: false };
}

/** Founding revenue in USD cents: the sum of `paid` orders at the fixed rate. Refunded and pending orders count as zero. */
export function recomputeCounter(orders: CounterOrder[], inrPerUsd: number): number {
  return orders
    .filter((o) => o.status === "paid")
    .reduce((sum, o) => sum + toUsdCents(o.amount_minor, o.currency, inrPerUsd), 0);
}
