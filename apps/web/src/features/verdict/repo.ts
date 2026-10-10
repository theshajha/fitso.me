import { Verdict } from "@fitso/core";
import { getDb } from "@/lib/supabase";

/** The most recent verdict for a quick win. The condition text is not stored, so it comes back null. */
export async function loadLastVerdict(quickWinId: string): Promise<Verdict | null> {
  const { data } = await getDb()
    .from("verdicts")
    .select("verdict, reasons, item, saved_amount_inr")
    .eq("quick_win_id", quickWinId)
    .order("created_at", { ascending: false })
    .limit(1);
  const row = (data as Record<string, unknown>[] | null)?.[0];
  if (!row) return null;
  const parsed = Verdict.safeParse({
    verdict: row.verdict,
    reasons: row.reasons,
    condition: null,
    item: row.item,
    saved_amount_inr: row.saved_amount_inr ?? null,
  });
  return parsed.success ? parsed.data : null;
}
