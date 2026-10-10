import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "./env";

/**
 * Owner cookie: proves the browser that created a quick win. One cookie per
 * token. The value is an HMAC of the token, so it cannot be forged without the secret.
 */
const DEV_SECRET = "fitso-dev-owner-secret-do-not-use-in-prod";

function secret(): string {
  if (env.ownerCookieSecret) return env.ownerCookieSecret;
  if (env.isProd) {
    console.warn("[fitso] OWNER_COOKIE_SECRET is not set. Using an insecure fallback.");
  }
  return DEV_SECRET;
}

export function ownerCookieName(token: string): string {
  return `fitso_owner_${token}`;
}

export function signOwner(token: string): string {
  return createHmac("sha256", secret()).update(token).digest("hex");
}

export function verifyOwner(token: string, value: string | undefined | null): boolean {
  if (!value) return false;
  const expected = Buffer.from(signOwner(token));
  const given = Buffer.from(value);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** Options for `cookies().set(name, value, ownerCookieOptions)`. */
export const ownerCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: env.isProd,
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};
