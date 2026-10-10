import { describe, expect, it } from "vitest";
import { priceFor } from "@/lib/pricing";
import {
  buildOrderRow,
  checkoutMetadata,
  isUnderpaid,
  mapWebhookEvent,
  nextStatus,
  recomputeCounter,
} from "./order";

const future = new Date(Date.now() + 3600_000).toISOString();
const past = new Date(Date.now() - 3600_000).toISOString();
const qw = (t: string) => ({ finish_today_expires_at: t });

describe("buildOrderRow", () => {
  it("builds a founding order", () => {
    const price = priceFor("report", "INR", qw(future), { founding_usd_cents: 0 });
    const row = buildOrderRow({ id: "o1", quickWinId: "q1", email: " A@B.com ", product: "report", currency: "INR", price });
    expect(row).toMatchObject({
      status: "pending", price_tier: "founding", amount_minor: 84900, list_amount_minor: 249900, email: "a@b.com",
    });
  });
  it("builds a finish-today order after the cap", () => {
    const price = priceFor("report", "USD", qw(future), { founding_usd_cents: 100_000 });
    const row = buildOrderRow({ id: "o2", quickWinId: "q1", email: "a@b.com", product: "report", currency: "USD", price });
    expect(row).toMatchObject({ price_tier: "finish_today", amount_minor: 1000, list_amount_minor: 2900 });
  });
  it("builds a list order when finish-today has expired or no quick win exists", () => {
    const expired = priceFor("report", "USD", qw(past), { founding_usd_cents: 100_000 });
    expect(buildOrderRow({ id: "o3", quickWinId: "q1", email: "a@b.com", product: "report", currency: "USD", price: expired })).toMatchObject({ price_tier: "list", amount_minor: 2900 });
    const none = priceFor("pro", "INR", null, { founding_usd_cents: 100_000 });
    expect(buildOrderRow({ id: "o4", quickWinId: null, email: "a@b.com", product: "pro", currency: "INR", price: none })).toMatchObject({ price_tier: "list", amount_minor: 499900, quick_win_id: null });
  });
  it("makes Dodo-safe metadata", () => {
    expect(checkoutMetadata({ orderId: "o1", token: null, product: "pro", tier: "list" })).toEqual({ order_id: "o1", token: "", product: "pro", tier: "list" });
  });
});

describe("mapWebhookEvent", () => {
  it("maps payment.succeeded to paid", () => {
    const ev = mapWebhookEvent({ type: "payment.succeeded", data: { payment_id: "pay_1", total_amount: 49900, currency: "INR", metadata: { order_id: "o1" } } });
    expect(ev).toEqual({ action: "paid", orderId: "o1", paymentId: "pay_1", amountMinor: 49900, currency: "INR" });
  });
  it("maps refund.succeeded to refunded", () => {
    const ev = mapWebhookEvent({ type: "refund.succeeded", data: { payment_id: "pay_1", refund_id: "ref_1", metadata: { order_id: "o1" } } });
    expect(ev).toMatchObject({ action: "refunded", orderId: "o1", paymentId: "pay_1" });
  });
  it("ignores other events and junk", () => {
    expect(mapWebhookEvent({ type: "payment.failed", data: {} }).action).toBe("ignore");
    expect(mapWebhookEvent(null).action).toBe("ignore");
  });
  it("flags underpayment only in the same currency", () => {
    const order = { amount_minor: 1000, currency: "USD" as const };
    expect(isUnderpaid(order, { action: "paid", orderId: null, paymentId: null, amountMinor: 500, currency: "USD" })).toBe(true);
    expect(isUnderpaid(order, { action: "paid", orderId: null, paymentId: null, amountMinor: 1000, currency: "USD" })).toBe(false);
    expect(isUnderpaid(order, { action: "paid", orderId: null, paymentId: null, amountMinor: 500, currency: "INR" })).toBe(false);
  });
});

describe("nextStatus (idempotency)", () => {
  it("pending to paid once", () => {
    expect(nextStatus("pending", "paid")).toEqual({ status: "paid", changed: true });
    expect(nextStatus("paid", "paid")).toEqual({ status: "paid", changed: false });
  });
  it("paid to refunded once", () => {
    expect(nextStatus("paid", "refunded")).toEqual({ status: "refunded", changed: true });
    expect(nextStatus("refunded", "refunded")).toEqual({ status: "refunded", changed: false });
  });
  it("a refund of an unpaid order and a late paid event change nothing", () => {
    expect(nextStatus("pending", "refunded").changed).toBe(false);
    expect(nextStatus("refunded", "paid").changed).toBe(false);
    expect(nextStatus("test", "paid").changed).toBe(false);
    expect(nextStatus("pending", "ignore").changed).toBe(false);
  });
});

describe("recomputeCounter", () => {
  const orders = [
    { status: "paid", amount_minor: 1000, currency: "USD" },
    { status: "paid", amount_minor: 84_000, currency: "INR" },
    { status: "pending", amount_minor: 5000, currency: "USD" },
    { status: "test", amount_minor: 5000, currency: "USD" },
    { status: "refunded", amount_minor: 3900, currency: "USD" },
  ] as const;
  it("sums paid orders in USD cents", () => {
    expect(recomputeCounter([...orders], 84)).toBe(1000 + 1000);
  });
  it("drops an order when it is refunded", () => {
    const after = orders.map((o, i) => (i === 1 ? { ...o, status: "refunded" as const } : o));
    expect(recomputeCounter(after, 84)).toBe(1000);
  });
  it("is the same when recomputed twice", () => {
    expect(recomputeCounter([...orders], 84)).toBe(recomputeCounter([...orders], 84));
  });
  it("is zero with no paid orders", () => {
    expect(recomputeCounter([], 84)).toBe(0);
  });
});
