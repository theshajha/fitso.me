import { randomBytes } from "node:crypto";

// Crockford base32, lowercase. No i, l, o, u.
const ALPHABET = "0123456789abcdefghjkmnpqrstvwxyz";

/** Short share token for /r/[token]: 10 chars of base32 (50 bits). */
export function newShareToken(): string {
  const bytes = randomBytes(10);
  let out = "";
  for (let i = 0; i < 10; i++) out += ALPHABET[bytes[i] & 31];
  return out;
}

export function isShareToken(value: string): boolean {
  return /^[0-9a-hjkmnp-tv-z]{10}$/.test(value);
}
