import { NextResponse } from "next/server";
import { verifyWebhook } from "@/lib/dodo";
import { getDb } from "@/lib/supabase";
import { hashEmail, trackServer } from "@/lib/posthog-server";
import { isUnderpaid, mapWebhookEvent, nextStatus, type OrderRow } from "@/features/billing/order";
import { recomputeAndStoreCounter } from "@/features/billing/counter";

export const dynamic = "force-dynamic";

async function findOrder(ev: ReturnType<typeof mapWebhookEvent>): Promise<OrderRow | null> {
  const db = getDb();
  if (ev.orderId) {
    const { data } = await db.from("orders").select("*").eq("id", ev.orderId).maybeSingle();
    if (data) return data as OrderRow;
  }
  if (ev.paymentId) {
    const { data } = await db.from("orders").select("*").eq("provider_order_id", ev.paymentId).maybeSingle();
    if (data) return data as OrderRow;
    // Refunds without metadata: match the payment id we stored in `raw` when the order was paid.
    const { data: paid } = await db.from("orders").select("*").eq("status", "paid");
    const hit = ((paid ?? []) as OrderRow[]).find((o) => (o.raw as { payment_id?: string } | null)?.payment_id === ev.paymentId);
    if (hit) return hit;
  }
  return null;
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  let event: unknown;
  try {
    event = verifyWebhook(rawBody, req.headers);
  } catch {
    return NextResponse.json({ error: "bad_signature" }, { status: 400 });
  }

  // From here on the provider always gets 200, so it does not retry events we cannot act on.
  try {
    const ev = mapWebhookEvent(event);
    if (ev.action === "ignore") return NextResponse.json({ ok: true, ignored: true });

    const order = await findOrder(ev);
    if (!order) {
      console.warn("[fitso] webhook for unknown order", ev.orderId ?? ev.paymentId);
      return NextResponse.json({ ok: true, unknown_order: true });
    }
    if (ev.action === "paid" && isUnderpaid(order, ev)) {
      console.warn("[fitso] underpaid order, left pending", order.id);
      await getDb().from("orders").update({ raw: event }).eq("id", order.id);
      return NextResponse.json({ ok: true, underpaid: true });
    }

    const { status, changed } = nextStatus(order.status, ev.action);
    const db = getDb();
    if (changed) {
      const raw = { ...((order.raw as object | null) ?? {}), ...(ev.paymentId ? { payment_id: ev.paymentId } : {}), [ev.action]: event };
      const patch: Record<string, unknown> = { status, raw };
      await db.from("orders").update(patch).eq("id", order.id);
    }

    const cents = await recomputeAndStoreCounter();
    if (changed) {
      const id = await hashEmail(order.email);
      await trackServer(id, ev.action === "paid" ? "order_paid" : "order_refunded", {
        product: order.product,
        tier: order.price_tier,
        currency: order.currency,
        amount: order.amount_minor,
      });
      await trackServer(id, "founding_counter_updated", { usd_cents: cents });
    }
    return NextResponse.json({ ok: true, status, changed, founding_usd_cents: cents });
  } catch (err) {
    console.error("[fitso] webhook handling failed", err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: true, error: "handled_with_error" });
  }
}
