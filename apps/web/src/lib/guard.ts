import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { env } from "./env";
import { getDb } from "./supabase";

/**
 * Guardrails around the two routes that spend model money.
 *
 * 1. Access code (optional, env ACCESS_CODE): while the site is in private testing, the
 *    photo-check and quick-win routes refuse requests without a signed access cookie.
 *    The cookie is set at /access with the code.
 * 2. Per-IP rate limit, sliding window, in process memory. Good enough for one server
 *    instance; Vercel's firewall rate limit sits in front of it in production.
 * 3. Daily cap on full reads, stored in the counters table, so a leaked link cannot run
 *    the key dry overnight (env MAX_READS_PER_DAY, default 200).
 */

export const ACCESS_COOKIE = "fitso_access";

function accessSig(code: string): string {
  return createHmac("sha256", env.ownerCookieSecret ?? "dev-secret").update(`access:${code}`).digest("hex");
}

export function accessCookieValue(): string | null {
  return env.accessCode ? accessSig(env.accessCode) : null;
}

export function codeMatches(input: string): boolean {
  if (!env.accessCode) return true;
  const a = Buffer.from(input.trim());
  const b = Buffer.from(env.accessCode);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** True when no access code is configured, or the request carries the signed cookie. */
export async function hasAccess(): Promise<boolean> {
  const expected = accessCookieValue();
  if (!expected) return true;
  const jar = await cookies();
  const got = jar.get(ACCESS_COOKIE)?.value ?? "";
  const a = Buffer.from(got);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// ---------- per-IP rate limit ----------

type Bucket = number[]; // timestamps of recent hits
const g = globalThis as { __fitsoRate?: Map<string, Bucket> };
function buckets(): Map<string, Bucket> {
  if (!g.__fitsoRate) g.__fitsoRate = new Map();
  return g.__fitsoRate;
}

export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "local";
}

/** Allow `limit` hits per `windowMs` for this key. Returns seconds to wait when blocked. */
export function rateLimit(key: string, limit: number, windowMs: number): { ok: true } | { ok: false; retryAfterS: number } {
  const now = Date.now();
  const b = buckets();
  const hits = (b.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    return { ok: false, retryAfterS: Math.ceil((hits[0] + windowMs - now) / 1000) };
  }
  hits.push(now);
  b.set(key, hits);
  if (b.size > 5000) {
    // drop stale keys so memory stays bounded
    for (const [k, v] of b) if (v.every((t) => now - t >= windowMs)) b.delete(k);
  }
  return { ok: true };
}

export const LIMITS = {
  /** photo checks per IP per hour */
  gate: { limit: env.isProd ? 30 : 300, windowMs: 60 * 60 * 1000 },
  /** full reads per IP per hour (loose outside production so local testing is not blocked) */
  read: { limit: env.isProd ? 5 : 60, windowMs: 60 * 60 * 1000 },
} as const;

// ---------- daily cap ----------

function todayKey(): string {
  return `reads:${new Date().toISOString().slice(0, 10)}`;
}

/** Count one read for today. Returns false when the day's cap is already used. */
export async function takeDailyRead(): Promise<boolean> {
  const db = getDb();
  const key = todayKey();
  const { data } = await db.from("counters").select("value_minor").eq("key", key).maybeSingle();
  const used = Number((data as { value_minor?: number } | null)?.value_minor ?? 0);
  if (used >= env.maxReadsPerDay) return false;
  await db.from("counters").upsert({ key, value_minor: used + 1 }, { onConflict: "key" });
  return true;
}
