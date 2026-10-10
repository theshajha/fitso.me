import { NextResponse } from "next/server";
import { counterPayload, readFoundingCents } from "@/features/billing/counter";

export const dynamic = "force-dynamic";

export async function GET() {
  let cents = 0;
  try {
    cents = await readFoundingCents();
  } catch (err) {
    console.error("[fitso] counter read failed", err);
  }
  return NextResponse.json(counterPayload(cents), {
    headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=30" },
  });
}
