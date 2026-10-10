import { NextResponse } from "next/server";
import { ACCESS_COOKIE, accessCookieValue, clientIp, codeMatches, rateLimit } from "@/lib/guard";

export const dynamic = "force-dynamic";

/** POST { code } -> sets the signed access cookie when the code matches ACCESS_CODE. */
export async function POST(req: Request) {
  const rl = rateLimit(`access:${clientIp(req.headers)}`, 10, 10 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "rate_limited", message: "Too many tries. Wait a few minutes." }, { status: 429 });

  const body = (await req.json().catch(() => ({}))) as { code?: string };
  const code = typeof body.code === "string" ? body.code : "";
  const value = accessCookieValue();
  if (!value) return NextResponse.json({ ok: true, open: true });
  if (!codeMatches(code)) return NextResponse.json({ error: "bad_code", message: "That code is not right." }, { status: 403 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ACCESS_COOKIE, value, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return res;
}
