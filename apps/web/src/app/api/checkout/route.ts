import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { Currency, Product } from "@fitso/core";
import { env } from "@/lib/env";
import { createCheckout } from "@/lib/dodo";
import { currencyFromHeaders, priceFor } from "@/lib/pricing";
import { getDb } from "@/lib/supabase";
import { hashEmail, trackServer } from "@/lib/posthog-server";
import { buildOrderRow, checkoutMetadata } from "@/features/billing/order";
import { readFoundingCents } from "@/features/billing/counter";

export const dynamic = "force-dynamic";

const Body = z
  .object({
    token: z.string().min(1).max(64).optional(),
    email: z.email().max(254).optional(),
    product: Product,
    currency: Currency.optional(),
  })
  .refine((b) => b.token || b.email, { message: "token or email is required" });

type QuickWinRow = { id: string; email: string; finish_today_expires_at: string };

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "bad_request", detail: z.prettifyError(parsed.error) }, { status: 400 });
  }
  const { token, product } = parsed.data;
  const currency = parsed.data.currency ?? currencyFromHeaders(req.headers);
  const db = getDb();

  let quickWin: QuickWinRow | null = null;
  if (token) {
    const { data } = await db
      .from("quick_wins")
      .select("id, email, finish_today_expires_at")
      .eq("share_token", token)
      .maybeSingle();
    if (!data) return NextResponse.json({ error: "unknown_token" }, { status: 404 });
    quickWin = data as QuickWinRow;
  }
  const email = quickWin?.email ?? parsed.data.email!;

  const productId = env.dodoProducts[product][currency];
  if (!productId && env.dodoApiKey) {
    return NextResponse.json({ error: "product_not_configured" }, { status: 500 });
  }

  const price = priceFor(product, currency, quickWin, { founding_usd_cents: await readFoundingCents() });
  const row = buildOrderRow({ id: randomUUID(), quickWinId: quickWin?.id ?? null, email, product, currency, price });

  const ins = await db.from("orders").insert(row);
  if (ins.error) {
    console.error("[fitso] order insert failed", ins.error.message);
    return NextResponse.json({ error: "order_failed" }, { status: 500 });
  }

  try {
    const { url, providerOrderId } = await createCheckout({
      productId: productId ?? "stub",
      email,
      currency,
      amountMinor: price.amount_minor,
      metadata: checkoutMetadata({ orderId: row.id, token: token ?? null, product, tier: price.tier }),
    });
    await db.from("orders").update({ provider_order_id: providerOrderId }).eq("id", row.id);
    await trackServer(await hashEmail(email), "order_created", {
      product,
      tier: price.tier,
      currency,
      amount: price.amount_minor,
    });
    return NextResponse.json({ url });
  } catch (err) {
    console.error("[fitso] checkout failed", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "checkout_failed" }, { status: 502 });
  }
}
