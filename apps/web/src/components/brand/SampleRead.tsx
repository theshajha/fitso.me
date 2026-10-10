"use client";

import Link from "next/link";
import { useState } from "react";
import type { Door } from "@fitso/core";
import { ReadPhoto } from "./ReadPhoto";
import { READS } from "./reads";
import { Swatches } from "./Swatches";

const PEOPLE: { door: Door; label: string }[] = [
  { door: "women", label: "Her result" },
  { door: "men", label: "His result" },
];

/** One example result, laid out like the real result page. A toggle swaps the person. */
export function SampleRead() {
  const [door, setDoor] = useState<Door>("women");
  const r = READS[door];

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-3">
          <h2 style={{ margin: 0 }}>What you get, free</h2>
          <p className="muted" style={{ margin: 0, fontSize: "1.1875rem" }}>
            An example result, from one photo.
          </p>
        </div>
        <div role="group" aria-label="Choose an example" className="inline-flex self-start p-1" style={{ border: "2px solid var(--ink)", borderRadius: 999 }}>
          {PEOPLE.map((p) => (
            <button
              key={p.door}
              type="button"
              aria-pressed={door === p.door}
              onClick={() => setDoor(p.door)}
              style={{
                padding: "8px 18px",
                borderRadius: 999,
                border: 0,
                fontWeight: 700,
                cursor: "pointer",
                background: door === p.door ? "var(--ink)" : "transparent",
                color: door === p.door ? "var(--paper)" : "var(--ink)",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div key={door} className="grid gap-10 md:grid-cols-[minmax(0,520px)_1fr] md:gap-16">
        {/* Left chips reach past the photo's left edge, so the photo sits inset on desktop. */}
        <div className="mx-auto w-full md:mx-0 md:ml-36" style={{ maxWidth: 370 }}>
          <ReadPhoto person={r.person} callouts={r.callouts} />
        </div>

        <div className="flex min-w-0 flex-col gap-8">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <span className="label" style={{ background: "var(--ink)", color: "var(--paper)", borderRadius: 999, padding: "4px 12px" }}>
                {r.season}
              </span>
              <span className="label" style={{ border: "2px solid var(--ink)", borderRadius: 999, padding: "2px 12px" }}>
                Your style: {r.archetype}
              </span>
            </div>
            <p className="display" style={{ margin: 0, fontSize: "clamp(1.6rem, 3vw, 2.4rem)" }}>
              {r.headline}
            </p>
          </div>

          <Swatches colors={r.palette} animate />

          <div className="flex flex-col gap-3">
            <h3 style={{ margin: 0 }}>What already works on you</h3>
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {r.working.map((w) => (
                <li key={w} className="flex items-start gap-3" style={{ fontSize: "1.0625rem", lineHeight: 1.45 }}>
                  <span aria-hidden="true" style={{ flex: "none", color: "var(--good)", fontWeight: 800 }}>
                    ✓
                  </span>
                  {w}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-2 p-6" style={{ background: "var(--ink)", color: "var(--paper)", borderRadius: 22 }}>
            <h3 style={{ margin: 0, color: "var(--paper)" }}>Change one thing</h3>
            <p style={{ margin: 0, fontSize: "1.0625rem", lineHeight: 1.45 }}>{r.change}</p>
          </div>

          <Link
            href={`/sample/${door === "women" ? "her" : "him"}`}
            className="sr-cta inline-flex items-center gap-2 self-start no-underline"
            style={{ border: "3px solid var(--ink)", borderRadius: 999, padding: "12px 22px", fontWeight: 700, background: "var(--lime)", color: "var(--ink)", boxShadow: "0 4px 0 var(--ink)" }}
          >
            See {door === "women" ? "her" : "his"} full Style Report <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
