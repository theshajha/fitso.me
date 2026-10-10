"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { Door } from "@fitso/core";
import { READS } from "./reads";

type Pin = { text: string; x: number; y: number };

/** Hero-only notes, placed for the cropped card (not the full photo). */
const CARDS: Record<Door, { pins: Pin[]; change: string; label: string }> = {
  women: {
    label: "her",
    pins: [
      { text: "Magenta at your neckline", x: 54, y: 25 },
      { text: "Wide leg on long legs", x: 46, y: 46 },
    ],
    change: "silver jewellery for gold",
  },
  men: {
    label: "his",
    pins: [
      { text: "Camel and olive near your face", x: 50, y: 27 },
      { text: "Tapered dark jeans", x: 40, y: 50 },
    ],
    change: "silver watch for gold on cognac",
  },
};

/** Where each card sits. Front: big and straight. Back: smaller, tilted, peeking top-right. */
const FRONT = { left: "0%", top: "11%", width: "72%", height: "86%", transform: "rotate(0deg)", zIndex: 2 };
const BACK = { left: "44%", top: "1%", width: "56%", height: "64%", transform: "rotate(5deg)", zIndex: 1 };

function PinChip({ pin, shown, delay }: { pin: Pin; shown: boolean; delay: number }) {
  return (
    <span
      className="absolute flex items-center gap-2"
      style={{
        left: `${pin.x}%`,
        top: `${pin.y}%`,
        opacity: shown ? 1 : 0,
        transform: `translateY(-50%) scale(${shown ? 1 : 0.85})`,
        transformOrigin: "left center",
        transition: `opacity 260ms ${shown ? delay : 0}ms, transform 360ms cubic-bezier(.2,.9,.25,1.2) ${shown ? delay : 0}ms`,
        pointerEvents: "none",
      }}
    >
      <span style={{ flex: "none", width: 12, height: 12, borderRadius: 999, background: "var(--good)", border: "3px solid var(--paper)", boxShadow: "0 0 0 2px var(--ink)" }} />
      <span className="whitespace-nowrap" style={{ background: "var(--good)", color: "#fff", borderRadius: 999, padding: "5px 12px", fontSize: "0.875rem", fontWeight: 700, boxShadow: "0 3px 0 var(--ink)" }}>
        <span aria-hidden="true" style={{ marginRight: 6 }}>
          ✓
        </span>
        {pin.text}
      </span>
    </span>
  );
}

/**
 * Hero art: what a result looks like, as a two-card deck (her and him).
 * Tap the back card to bring it forward. Until someone taps, the deck swaps on its own.
 */
export function HeroPeople() {
  const [front, setFront] = useState<Door>("women");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (touched || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setFront((d) => (d === "women" ? "men" : "women")), 5200);
    return () => window.clearInterval(id);
  }, [touched]);

  return (
    <div className="relative mx-auto h-full w-full" style={{ minHeight: 480, maxWidth: 500 }}>
      {(["women", "men"] as Door[]).map((door) => {
        const r = READS[door];
        const c = CARDS[door];
        const isFront = front === door;
        const pos = isFront ? FRONT : BACK;
        return (
          <button
            key={door}
            type="button"
            tabIndex={isFront ? -1 : 0}
            aria-label={isFront ? `Example: ${c.label} result` : `Show ${c.label} result`}
            onClick={() => {
              setTouched(true);
              setFront(door);
            }}
            className="deck-card absolute p-0 text-left"
            style={{
              ...pos,
              cursor: isFront ? "default" : "pointer",
              borderRadius: 28,
              border: "3px solid var(--ink)",
              boxShadow: isFront ? "0 10px 0 var(--ink)" : "0 7px 0 var(--ink)",
              background: "var(--ink)",
              transition: "left 650ms cubic-bezier(.65,0,.25,1), top 650ms cubic-bezier(.65,0,.25,1), width 650ms cubic-bezier(.65,0,.25,1), height 650ms cubic-bezier(.65,0,.25,1), transform 650ms cubic-bezier(.65,0,.25,1)",
            }}
          >
            <span className="absolute inset-0 block overflow-hidden" style={{ borderRadius: 25 }}>
              <Image src={r.person.src} alt="" fill priority sizes="380px" style={{ objectFit: "cover", objectPosition: "50% 18%" }} />
            </span>

            {c.pins.map((p, i) => (
              <PinChip key={p.text} pin={p} shown={isFront} delay={450 + i * 120} />
            ))}

            {/* The result panel. On the back card it shrinks to a hint. */}
            <span
              className="absolute flex flex-col gap-2"
              style={{
                left: 12,
                right: 12,
                bottom: 12,
                padding: 12,
                background: "var(--paper)",
                color: "var(--ink)",
                borderRadius: 18,
                border: "2px solid var(--ink)",
                opacity: isFront ? 1 : 0,
                transform: isFront ? "none" : "translateY(10px)",
                transition: `opacity 300ms ${isFront ? 380 : 0}ms, transform 300ms ${isFront ? 380 : 0}ms`,
              }}
            >
              <span style={{ fontWeight: 800, fontSize: "0.9375rem", lineHeight: 1.2 }}>{r.headline}</span>
              <span className="flex gap-1">
                {r.palette.map((s) => (
                  <span key={s.hex} style={{ flex: 1, height: 22, borderRadius: 6, background: s.hex, border: "1.5px solid var(--ink)" }} />
                ))}
              </span>
              <span className="flex items-start gap-2" style={{ fontSize: "0.875rem", fontWeight: 600, lineHeight: 1.3 }}>
                <span aria-hidden="true" style={{ color: "var(--magenta)", fontWeight: 800 }}>
                  →
                </span>
                Change one thing: {c.change}
              </span>
            </span>

            <span
              className="deck-hint absolute"
              style={{
                left: 12,
                bottom: 12,
                background: "var(--paper)",
                color: "var(--ink)",
                border: "2px solid var(--ink)",
                borderRadius: 999,
                padding: "5px 12px",
                fontSize: "0.8125rem",
                fontWeight: 700,
                opacity: isFront ? 0 : 1,
                transition: "opacity 250ms",
              }}
            >
              See {c.label} result ↺
            </span>
          </button>
        );
      })}
      <style>{`
        .deck-card:not([tabindex="-1"]):hover { transform: rotate(3deg) translateY(-6px) !important; }
        .deck-card:focus-visible { outline: 3px solid var(--cobalt); outline-offset: 4px; }
        @media (prefers-reduced-motion: reduce) { .deck-card, .deck-card * { transition: none !important; } }
      `}</style>
    </div>
  );
}

/** Phone version: one compact result card under the uploader. Tap to swap person. */
export function HeroResultCard() {
  const [door, setDoor] = useState<Door>("women");
  const r = READS[door];
  const c = CARDS[door];
  return (
    <button
      type="button"
      onClick={() => setDoor((d) => (d === "women" ? "men" : "women"))}
      aria-label={`Example result. Tap to see ${door === "women" ? "his" : "her"} result.`}
      className="flex w-full items-stretch gap-3 p-3 text-left"
      style={{ border: "3px solid var(--ink)", borderRadius: 22, boxShadow: "0 6px 0 var(--ink)", background: "var(--paper)", color: "var(--ink)", cursor: "pointer" }}
    >
      <span className="relative block flex-none overflow-hidden" style={{ width: 92, borderRadius: 14 }}>
        <Image src={r.person.src} alt="" fill sizes="92px" style={{ objectFit: "cover", objectPosition: "50% 15%" }} />
      </span>
      <span className="flex min-w-0 flex-col gap-2 py-1">
        <span className="label muted">Example result · tap to swap</span>
        <span style={{ fontWeight: 800, lineHeight: 1.2 }}>{r.headline}</span>
        <span className="flex gap-1">
          {r.palette.map((s) => (
            <span key={s.hex} style={{ flex: 1, height: 18, borderRadius: 5, background: s.hex, border: "1.5px solid var(--ink)" }} />
          ))}
        </span>
        <span style={{ fontSize: "0.875rem", fontWeight: 600, lineHeight: 1.3 }}>
          <span style={{ color: "var(--magenta)" }}>→</span> {c.change}
        </span>
      </span>
    </button>
  );
}
