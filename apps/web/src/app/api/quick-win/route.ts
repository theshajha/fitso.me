import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { quickWinProfile } from "@/lib/ai";
import { getDb } from "@/lib/supabase";
import { newShareToken } from "@/lib/ids";
import { ownerCookieName, ownerCookieOptions, signOwner } from "@/lib/owner-cookie";
import { hashEmail, trackServer } from "@/lib/posthog-server";
import { parseQuickWinForm } from "@/features/profile/schema";
import { archetypeNames } from "@/features/profile/content";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DAY_MS = 24 * 60 * 60 * 1000;

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

  const parsed = parseQuickWinForm(fd);
  if (!parsed.ok) return err(parsed.error.code, parsed.error.message, parsed.error.status);
  const { door, answers, email, selfie } = parsed.data;

  // PRIVACY: the selfie bytes live only in this one local variable. They are passed to the
  // model call below and nowhere else. Never log, write, store or return them.
  const imageBytes = new Uint8Array(await selfie.arrayBuffer());

  let profile;
  try {
    profile = await quickWinProfile({
      door,
      answers,
      imageBytes,
      mimeType: selfie.type,
      archetypes: archetypeNames(door),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    if (/no face|face not|no person/i.test(message)) {
      return err("no_face", "We could not find a face in that photo. Face the camera in daylight and try again.", 422);
    }
    console.error("[fitso] quick win model call failed:", message.slice(0, 200));
    return err("ai_failed", "We could not read that photo right now. Try again in a moment.", 502);
  }

  const token = newShareToken();
  const { error } = await getDb()
    .from("quick_wins")
    .insert({
      door,
      email,
      answers,
      profile,
      confidence: Math.round(profile.confidence * 100) / 100,
      share_token: token,
      finish_today_expires_at: new Date(Date.now() + DAY_MS).toISOString(),
      verdict_credits: 1,
    });
  if (error) {
    console.error("[fitso] quick_wins insert failed:", error.message);
    return err("save_failed", "We could not save your result. Try again.", 500);
  }

  const jar = await cookies();
  jar.set(ownerCookieName(token), signOwner(token), ownerCookieOptions);

  await trackServer(await hashEmail(email), "quick_win_created", { door, confidence: profile.confidence });

  return NextResponse.json({ token });
}
