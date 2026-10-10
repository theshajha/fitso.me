import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { getDb } from "@/lib/supabase";
import { ownerCookieName } from "@/lib/owner-cookie";
import { isOwner } from "@/features/profile/owner";

export const dynamic = "force-dynamic";

const Body = z.object({ token: z.string().min(1).max(32) });

/** Sets shared_at once, when the owner first shares. */
export async function POST(request: Request) {
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  const { token } = body.data;

  const jar = await cookies();
  if (!isOwner(token, jar.get(ownerCookieName(token))?.value)) {
    return NextResponse.json({ ok: true, set: false });
  }

  const db = getDb();
  const { data } = await db.from("quick_wins").select("id, shared_at").eq("share_token", token).maybeSingle();
  const row = data as { id: string; shared_at: string | null } | null;
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (row.shared_at) return NextResponse.json({ ok: true, set: false });

  const { error } = await db.from("quick_wins").update({ shared_at: new Date().toISOString() }).eq("id", row.id);
  if (error) return NextResponse.json({ error: "save_failed" }, { status: 500 });
  return NextResponse.json({ ok: true, set: true });
}
