import { QuickWinProfile, Door, ReadReport } from "@fitso/core";
import { env } from "@/lib/env";
import { getDb } from "@/lib/supabase";
import { isShareToken } from "@/lib/ids";

/** What a public page may see. No email, no answers. */
export type PublicQuickWin = {
  id: string;
  door: Door;
  profile: QuickWinProfile;
  confidence: number;
  share_token: string;
  shared_at: string | null;
  finish_today_expires_at: string;
  verdict_credits: number;
  created_at: string;
  report: ReadReport | null;
  /** True when an email is saved. The address itself never leaves the server. */
  has_email: boolean;
};

const PUBLIC_COLUMNS =
  "id, created_at, door, profile, confidence, share_token, shared_at, finish_today_expires_at, verdict_credits, report, email";

export async function loadPublicQuickWin(token: string): Promise<PublicQuickWin | null> {
  if (!isShareToken(token)) return null;
  const { data, error } = await getDb()
    .from("quick_wins")
    .select(PUBLIC_COLUMNS)
    .eq("share_token", token)
    .maybeSingle();
  if (error) throw new Error(`quick_wins read failed: ${error.message}`);
  if (!data) return null;
  const row = data as Record<string, unknown>;
  const door = Door.safeParse(row.door);
  const profile = QuickWinProfile.safeParse(row.profile);
  if (!door.success || !profile.success) return null;
  return {
    id: String(row.id),
    created_at: String(row.created_at ?? new Date().toISOString()),
    door: door.data,
    profile: profile.data,
    confidence: Number(row.confidence),
    share_token: String(row.share_token),
    shared_at: (row.shared_at as string | null) ?? null,
    finish_today_expires_at: new Date(row.finish_today_expires_at as string).toISOString(),
    verdict_credits: Number(row.verdict_credits),
    report: row.report ? (() => { const r = ReadReport.safeParse(row.report); return r.success ? r.data : null; })() : null,
    has_email: typeof row.email === "string" && row.email.length > 0,
  };
}

/** Founding counter, read straight from the counters table (T2 owns /api/counter). */
export async function readFoundingCents(): Promise<number> {
  const { data } = await getDb()
    .from("counters")
    .select("value_minor")
    .eq("key", "founding_revenue_usd_cents")
    .maybeSingle();
  return Number((data as { value_minor?: number } | null)?.value_minor ?? 0);
}

/** True when this quick win has a paid report order (or a test order outside production). */
export async function loadReportUnlock(quickWinId: string): Promise<boolean> {
  const { data, error } = await getDb()
    .from("orders")
    .select("id, status")
    .eq("quick_win_id", quickWinId)
    .eq("product", "report");
  if (error) throw new Error(`orders read failed: ${error.message}`);
  const rows = (data ?? []) as { status: string }[];
  return rows.some((r) => r.status === "paid" || (!env.isProd && r.status === "test"));
}

export async function setQuickWinEmail(token: string, email: string): Promise<boolean> {
  if (!isShareToken(token)) return false;
  const { error } = await getDb().from("quick_wins").update({ email }).eq("share_token", token);
  return !error;
}
