import { NextResponse } from "next/server";
import { gatePhoto } from "@/features/read/pipeline";
import { checkImage } from "@/features/profile/schema";
import { LIMITS, clientIp, hasAccess, rateLimit } from "@/lib/guard";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST multipart { selfie } -> the photo gate. Runs before the questions so the
 * person fixes the photo first and the flow learns the door without asking.
 * The photo is read once and dropped; nothing is stored.
 */
export async function POST(request: Request) {
  if (!(await hasAccess())) {
    return NextResponse.json({ error: "access_code", message: "fitso is in private testing. Enter your access code at /access." }, { status: 403 });
  }
  const rl = rateLimit(`gate:${clientIp(request.headers)}`, LIMITS.gate.limit, LIMITS.gate.windowMs);
  if (!rl.ok) {
    return NextResponse.json({ error: "rate_limited", message: `Too many photo checks. Try again in ${Math.ceil(rl.retryAfterS / 60)} minutes.` }, { status: 429, headers: { "retry-after": String(rl.retryAfterS) } });
  }
  let fd: FormData;
  try {
    fd = await request.formData();
  } catch {
    return NextResponse.json({ error: "invalid_body", message: "That upload did not come through. Try again." }, { status: 400 });
  }
  const checked = checkImage(fd.get("selfie"), "photo");
  if (!checked.ok) return NextResponse.json({ error: checked.error.code, message: checked.error.message }, { status: checked.error.status });

  const bytes = new Uint8Array(await checked.data.arrayBuffer());
  try {
    const gate = await gatePhoto({ bytes, mimeType: checked.data.type as "image/jpeg" | "image/png" | "image/webp" });
    return NextResponse.json({
      usable: gate.usable,
      ask: gate.ask,
      issues: gate.issues,
      door: gate.presented_as === "man" ? "men" : gate.presented_as === "woman" ? "women" : null,
      full_length: gate.full_length,
      face_box: gate.face_box,
      heritage: gate.heritage,
    });
  } catch (e) {
    console.error("[fitso] photo gate failed:", e instanceof Error ? e.message.slice(0, 200) : e);
    return NextResponse.json({ error: "ai_failed", message: "We could not check that photo right now. Try again." }, { status: 502 });
  }
}
