import { getDb } from "@/lib/supabase";
import { env } from "@/lib/env";
import { FOUNDING_CAP_USD_CENTS } from "@/lib/pricing";
import { recomputeCounter, type CounterOrder } from "./order";

const KEY = "founding_revenue_usd_cents";

/** Server-only. The cached founding revenue in USD cents. */
export async function readFoundingCents(): Promise<number> {
  const { data } = await getDb().from("counters").select("value_minor").eq("key", KEY).maybeSingle();
  return (data as { value_minor: number } | null)?.value_minor ?? 0;
}

export function counterPayload(foundingCents: number) {
  return {
    founding_usd_cents: foundingCents,
    cap_usd_cents: FOUNDING_CAP_USD_CENTS,
    founding_active: foundingCents < FOUNDING_CAP_USD_CENTS,
  };
}

/** Recompute from all orders and write to `counters`. Returns the new value. */
export async function recomputeAndStoreCounter(): Promise<number> {
  const db = getDb();
  const { data, error } = await db.from("orders").select("status, amount_minor, currency").eq("status", "paid");
  if (error) throw new Error(`counter recompute failed: ${error.message}`);
  const cents = recomputeCounter((data ?? []) as CounterOrder[], env.inrPerUsd);
  const { error: upErr } = await db
    .from("counters")
    .upsert({ key: KEY, value_minor: cents, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (upErr) throw new Error(`counter write failed: ${upErr.message}`);
  return cents;
}
