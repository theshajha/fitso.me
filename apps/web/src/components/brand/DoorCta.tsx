"use client";

import type { ReactNode } from "react";
import type { Door } from "@fitso/core";
import { track } from "@/lib/posthog";
import { Button } from "./Button";

/** A quick-win CTA that fires `door_selected` {door} on click. */
export function DoorCta({
  door,
  children = "Start, it's free",
  tone = "accent",
  size = "lg",
  where,
}: {
  door: Door;
  children?: ReactNode;
  /** "ink" for buttons that sit on a coloured panel. */
  tone?: "accent" | "ink";
  size?: "md" | "lg";
  where?: string;
}) {
  const style =
    tone === "ink"
      ? { background: "var(--ink)", color: "var(--paper)", border: "2px solid var(--ink)" }
      : undefined;
  return (
    <span className="contents" onClick={() => track("door_selected", { door, ...(where ? { where } : {}) })}>
      <Button href={`/app/quick-win?door=${door}`} door={door} size={size} style={style}>
        {children}
        <span aria-hidden="true">&rarr;</span>
      </Button>
    </span>
  );
}
