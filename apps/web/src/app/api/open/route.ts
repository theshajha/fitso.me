import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { getDb } from "@/lib/supabase";
import { ownerCookieName } from "@/lib/owner-cookie";
import { SEEN_MAX_AGE_SECONDS, isOwner, seenCookieName, shouldCountOpen } from "@/features/profile/owner";

export const dynamic = "force-dynamic";

const Body = z.object({ token: z.string().min(1).max(32) });

/** Counts one open by a non-owner. A short-lived cookie stops one visitor counting twice. */
export async function POST(request: Request) {
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  const { token } = body.data;

  const jar = await cookies();
  const owner = isOwner(token, jar.get(ownerCookieName(token))?.value);
  const seen = Boolean(jar.get(seenCookieName(token)));
  if (!shouldCountOpen({ owner, seen })) return NextResponse.json({ ok: true, counted: false });

  const db = getDb();
  let counted = false;
  for (let attempt = 0; attempt < 3 && !counted; attempt++) {
    const { data } = await db
      .from("quick_wins")
      .select("id, opened_by_others")
      .eq("share_token", token)
      .maybeSingle();
    const row = data as { id: string; opened_by_others: number } | null;
    if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
    // Compare-and-set on the old value: no atomic increment without an RPC.
    const { data: updated } = await db
      .from("quick_wins")
      .update({ opened_by_others: row.opened_by_others + 1 })
      .eq("id", row.id)
      .eq("opened_by_others", row.opened_by_others)
      .select("id");
    counted = Array.isArray(updated) && updated.length === 1;
  }

  jar.set(seenCookieName(token), "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SEEN_MAX_AGE_SECONDS,
  });
  return NextResponse.json({ ok: true, counted });
}
