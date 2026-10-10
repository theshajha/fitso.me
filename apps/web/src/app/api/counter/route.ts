import { NextResponse } from "next/server";
import { FOUNDING_CAP_USD_CENTS } from "@/lib/pricing";

// Stub counter (T0). T2 (Billing) replaces this with the real count from the counters table.
export const dynamic = "force-dynamic";

export async function GET() {
  const founding_usd_cents = 0;
  return NextResponse.json({
    founding_usd_cents,
    cap_usd_cents: FOUNDING_CAP_USD_CENTS,
    founding_active: founding_usd_cents < FOUNDING_CAP_USD_CENTS,
  });
}
