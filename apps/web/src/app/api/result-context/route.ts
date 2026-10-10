import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { QuickWinAnswers, ReadReport, type Door } from "@fitso/core";
import { finishReport } from "@/features/read/pipeline";
import { isOwner } from "@/features/profile/owner";
import { answersSchema } from "@/features/profile/schema";
import { getDb } from "@/lib/supabase";
import { ownerCookieName } from "@/lib/owner-cookie";
import { LIMITS, clientIp, rateLimit } from "@/lib/guard";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * POST { token, life?, climate?, occasions? } -> rebuilds the plan and the prose
 * for the person's stated settings. Owner only. Meant for the two optional
 * questions after payment; the outfits then target their real week.
 */
const Body = z.object({
  token: z.string().min(1).max(64),
  life: z.string().optional(),
  climate: z.string().optional(),
  occasions: z.array(z.string()).max(6).optional(),
  height_cm: z.number().min(120).max(230).optional(),
  waist_cm: z.number().min(50).max(160).optional(),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  const { token } = parsed.data;

  const jar = await cookies();
  if (!isOwner(token, jar.get(ownerCookieName(token))?.value)) {
    return NextResponse.json({ error: "not_owner" }, { status: 403 });
  }
  const rl = rateLimit(`context:${clientIp(req.headers)}`, LIMITS.read.limit, LIMITS.read.windowMs);
  if (!rl.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const db = getDb();
  const { data } = await db.from("quick_wins").select("id, door, answers, report").eq("share_token", token).maybeSingle();
  if (!data) return NextResponse.json({ error: "unknown_token" }, { status: 404 });
  const row = data as { id: string; door: Door; answers: unknown; report: unknown };
  const report = ReadReport.safeParse(row.report);
  if (!report.success || !report.data.observations) {
    return NextResponse.json({ error: "no_report" }, { status: 409 });
  }

  const merged = answersSchema(row.door).safeParse({
    ...(QuickWinAnswers.safeParse(row.answers).data ?? {}),
    ...(parsed.data.life ? { life: parsed.data.life } : {}),
    ...(parsed.data.climate ? { climate: parsed.data.climate } : {}),
    ...(parsed.data.occasions?.length ? { occasions: parsed.data.occasions } : {}),
    ...(parsed.data.height_cm ? { height_cm: parsed.data.height_cm } : {}),
    ...(parsed.data.waist_cm ? { waist_cm: parsed.data.waist_cm } : {}),
  });
  if (!merged.success) return NextResponse.json({ error: "invalid_answers" }, { status: 400 });

  try {
    const finished = await finishReport(row.door, report.data.decisions, report.data.observations, merged.data);
    const next = { ...report.data, plan: finished.plan, card: finished.card, text: { ...report.data.text, report: finished.text } };
    await db.from("quick_wins").update({ answers: merged.data, report: next }).eq("share_token", token);
    return NextResponse.json({ ok: true, built_for: finished.plan.built_for });
  } catch (e) {
    console.error("[fitso] result-context failed:", e instanceof Error ? e.message.slice(0, 300) : e);
    return NextResponse.json({ error: "ai_failed", message: "We could not rebuild the plan right now. Try again in a moment." }, { status: 502 });
  }
}
