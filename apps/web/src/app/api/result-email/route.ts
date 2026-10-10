import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { ownerCookieName } from "@/lib/owner-cookie";
import { isOwner } from "@/features/profile/owner";
import { emailSchema } from "@/features/profile/schema";
import { setQuickWinEmail } from "@/features/profile/repo";

export const dynamic = "force-dynamic";

const Body = z.object({ token: z.string().min(1).max(32), email: z.string().max(254) });

/** Saves the owner's email on their result. Owner cookie required. */
export async function POST(request: Request) {
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  const { token } = body.data;

  const jar = await cookies();
  if (!isOwner(token, jar.get(ownerCookieName(token))?.value)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const email = emailSchema.safeParse(body.data.email);
  if (!email.success) return NextResponse.json({ error: "invalid_email" }, { status: 400 });

  const ok = await setQuickWinEmail(token, email.data);
  if (!ok) return NextResponse.json({ error: "save_failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
