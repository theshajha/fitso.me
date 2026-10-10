"use client";

import { useEffect } from "react";
import { track } from "@/lib/posthog";

type Props =
  | { event: "guide_viewed"; slug: string; door: string; pillar: string }
  | { event: "tool_viewed"; tool: string };

/** Fires one analytics event on mount. Renders nothing. */
export function Beacon(props: Props) {
  const key = JSON.stringify(props);
  useEffect(() => {
    const { event, ...rest } = JSON.parse(key) as Props;
    track(event, rest);
  }, [key]);
  return null;
}
