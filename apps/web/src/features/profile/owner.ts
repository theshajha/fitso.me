import { verifyOwner } from "@/lib/owner-cookie";

/** True when the cookie value proves this browser created the quick win. */
export function isOwner(token: string, cookieValue: string | undefined | null): boolean {
  return verifyOwner(token, cookieValue);
}

export const seenCookieName = (token: string) => `fitso_seen_${token}`;
export const SEEN_MAX_AGE_SECONDS = 60 * 60;

/** A visit counts as "opened by others" only for a non-owner who has not been counted recently. */
export function shouldCountOpen(input: { owner: boolean; seen: boolean }): boolean {
  return !input.owner && !input.seen;
}
