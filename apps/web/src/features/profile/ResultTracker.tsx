"use client";

import { useEffect } from "react";
import { track } from "@/lib/posthog";

/** Fires result_viewed. For a non-owner it also counts one open, once per page view. */
export function ResultTracker({ token, owner }: { token: string; owner: boolean }) {
  useEffect(() => {
    track("result_viewed", { owner });
    if (owner) return;
    void fetch("/api/open", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
      keepalive: true,
    }).catch(() => undefined);
  }, [token, owner]);
  return null;
}
