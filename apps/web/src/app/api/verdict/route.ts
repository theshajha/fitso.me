import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { QuickWinAnswers, QuickWinProfile, Door } from "@fitso/core";
import { itemVerdict } from "@/lib/ai";
import { getDb } from "@/lib/supabase";
import { isShareToken } from "@/lib/ids";
import { ownerCookieName } from "@/lib/owner-cookie";
import { hashEmail, trackServer } from "@/lib/posthog-server";
import { isOwner } from "@/features/profile/owner";
import { parseVerdictForm } from "@/features/verdict/schema";
import { canSpendCredit, creditsAfterSpend } from "@/features/verdict/credits";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: code, message }, { status });
}

export async function POST(request: Request) {
  let fd: FormData;
  try {
    fd = await request.formData();
  } catch {
    return err("invalid_body", "That upload did not come through. Try again.", 400);
  }
  const parsed = parseVerdictForm(fd);
  if (!parsed.ok) return err(parsed.error.code, parsed.error.message, parsed.error.status);
  const input = parsed.data;
  const token = input.token;
  if (!isShareToken(token)) return err("not_found", "We could not find that result.", 404);

  const jar = await cookies();
  if (!isOwner(token, jar.get(ownerCookieName(token))?.value)) {
    return err("not_owner", "Only the person who made this result can use its verdict.", 403);
  }

  const db = getDb();
  const { data } = await db
    .from("quick_wins")
    .select("id, door, email, answers, profile, verdict_credits")
    .eq("share_token", token)
    .maybeSingle();
  const row = data as {
    id: string;
    door: string;
    email: string;
    answers: unknown;
    profile: unknown;
    verdict_credits: number;
  } | null;
  if (!row) return err("not_found", "We could not find that result.", 404);

  const door = Door.safeParse(row.door);
  const profile = QuickWinProfile.safeParse(row.profile);
  const answers = QuickWinAnswers.safeParse(row.answers);
  if (!door.success || !profile.success || !answers.success) {
    return err("bad_result", "This result is damaged. Make a new one.", 500);
  }

  if (!canSpendCredit(row.verdict_credits)) {
    return err("no_credits", "You used your free verdict. The Style Report comes with ten.", 402);
  }

  // Reserve the credit first, compare-and-set on the old value, so two requests cannot both pass.
  const next = creditsAfterSpend(row.verdict_credits);
  const { data: reserved } = await db
    .from("quick_wins")
    .update({ verdict_credits: next })
    .eq("id", row.id)
    .eq("verdict_credits", row.verdict_credits)
    .select("id");
  if (!Array.isArray(reserved) || reserved.length !== 1) {
    return err("no_credits", "You used your free verdict. The Style Report comes with ten.", 402);
  }
  const refund = () =>
    db.from("quick_wins").update({ verdict_credits: row.verdict_credits }).eq("id", row.id);

  // PRIVACY: screenshot bytes stay in this local variable and go to the model only.
  let verdict;
  try {
    verdict = await itemVerdict(
      input.kind === "screenshot"
        ? {
            profile: profile.data,
            answers: answers.data,
            door: door.data,
            imageBytes: new Uint8Array(await input.file.arrayBuffer()),
            mimeType: input.file.type,
          }
        : { profile: profile.data, answers: answers.data, door: door.data, link: input.link },
    );
  } catch (e) {
    await refund();
    console.error("[fitso] verdict model call failed:", e instanceof Error ? e.message.slice(0, 200) : "");
    return err("ai_failed", "We could not read that item right now. Your free verdict is still there. Try again.", 502);
  }

  const { error } = await db.from("verdicts").insert({
    quick_win_id: row.id,
    input_kind: input.kind,
    input_url: input.kind === "link" ? input.link : null,
    verdict: verdict.verdict,
    reasons: verdict.reasons,
    item: verdict.item,
    condition: verdict.verdict === "yes_if" ? verdict.condition : null,
    saved_amount_inr: verdict.verdict === "no" ? verdict.saved_amount_inr : null,
  });
  if (error) {
    await refund();
    console.error("[fitso] verdicts insert failed:", error.message);
    return err("save_failed", "We could not save your verdict. Your free verdict is still there. Try again.", 500);
  }

  await trackServer(await hashEmail(row.email), "verdict_created", { verdict: verdict.verdict });

  return NextResponse.json({ verdict, credits_left: next });
}
