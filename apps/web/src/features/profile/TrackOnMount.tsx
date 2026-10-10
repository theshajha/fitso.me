"use client";

import { useEffect } from "react";
import { track } from "@/lib/posthog";

/** Fires one analytics event when it mounts. */
export function TrackOnMount({ event, props }: { event: string; props?: Record<string, unknown> }) {
  const key = JSON.stringify(props ?? {});
  useEffect(() => {
    track(event, props);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, key]);
  return null;
}
