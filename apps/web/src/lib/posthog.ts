"use client";

import posthog from "posthog-js";
import { hashEmail } from "./identity";

/** Browser analytics. All helpers are safe no-ops when PostHog is not initialised. */
let ready = false;

export function initPosthog(): boolean {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key || typeof window === "undefined") return false;
  if (ready) return true;
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    capture_pageview: false, // the provider captures pageviews on route change
    person_profiles: "identified_only",
  });
  ready = true;
  return true;
}

export function track(event: string, props?: Record<string, unknown>): void {
  if (!ready) return;
  posthog.capture(event, props);
}

/** Identify by sha256 of the lowercased email. The raw email is never sent. */
export async function identifyByEmail(email: string): Promise<void> {
  if (!ready) return;
  posthog.identify(await hashEmail(email));
}
