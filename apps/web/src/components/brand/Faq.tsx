"use client";

import { useState } from "react";

const QA: Array<[string, string]> = [
  ["Which photo works best?", "One photo, head to toe, in daylight facing a window. No filter. A plain wall behind you helps me see your colours true."],
  ["What do I get for free?", "Your palette with a name for every colour, three things that already work on you, and the one thing I'd change first."],
  ["What's in the Style Report?", "Three parts. About you: colouring, face, features, build. About your style: what you wear and what it says. Then what works and what doesn't, with the reason for each. $10, once."],
  ["Is it for men and women?", "Yes. I look at whoever is in the photo. If I can't tell which styles you want, I'll ask."],
  ["What happens to my photo?", "I use it to build your result, then it's deleted."],
  ["Can I get a refund?", "Yes. Email within 7 days and we refund the order."],
];

/** FAQ as a short chat: pick a question, the stylist answers. */
export function Faq() {
  const [open, setOpen] = useState(0);
  const [q, a] = QA[open];
  return (
    <div className="grid gap-10 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-14">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <h2 style={{ margin: 0 }}>Ask your stylist</h2>
          <p className="muted" style={{ margin: 0, fontSize: "1.1875rem" }}>
            The questions people ask first.
          </p>
        </div>
        <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
          {QA.map(([question], i) => (
            <li key={question}>
              <button
                type="button"
                aria-pressed={open === i}
                aria-controls="faq-answer"
                onClick={() => setOpen(i)}
                className="faq-chip"
                style={{
                  padding: "10px 16px",
                  borderRadius: 999,
                  border: "2px solid var(--ink)",
                  background: open === i ? "var(--ink)" : "var(--paper)",
                  color: open === i ? "var(--paper)" : "var(--ink)",
                  fontWeight: 700,
                  fontSize: "0.9375rem",
                  cursor: "pointer",
                }}
              >
                {question}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div id="faq-answer" aria-live="polite" className="flex flex-col gap-4 p-5 md:p-7" style={{ background: "color-mix(in srgb, var(--line) 45%, var(--paper))", borderRadius: 28, minHeight: 280 }}>
        <div key={`q-${open}`} className="bubble flex justify-end">
          <p style={{ margin: 0, maxWidth: "85%", background: "var(--ink)", color: "var(--paper)", padding: "12px 18px", borderRadius: "22px 22px 6px 22px", fontWeight: 600 }}>{q}</p>
        </div>
        <div key={`a-${open}`} className="bubble bubble-late flex items-end gap-3">
          <span aria-hidden="true" className="flex flex-none items-center justify-center" style={{ width: 40, height: 40, borderRadius: 999, background: "var(--magenta)", border: "2px solid var(--ink)" }}>
            <svg width="22" height="22" viewBox="0 0 64 64">
              <g stroke="#14121b" strokeWidth="4" strokeLinejoin="round">
                <rect x="12" y="16" width="16" height="34" rx="4" fill="#2b3df5" transform="rotate(-18 20 52)" />
                <rect x="24" y="12" width="16" height="38" rx="4" fill="#ff6b1a" transform="rotate(-2 32 52)" />
                <rect x="36" y="14" width="16" height="36" rx="4" fill="#fffdf8" transform="rotate(16 44 52)" />
              </g>
            </svg>
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <span className="label muted">Your stylist</span>
            <p style={{ margin: 0, background: "var(--paper)", border: "2px solid var(--ink)", padding: "14px 18px", borderRadius: "22px 22px 22px 6px", fontSize: "1.0625rem", lineHeight: 1.5 }}>{a}</p>
          </div>
        </div>
      </div>
      <style>{`
        .bubble { animation: bubble 380ms cubic-bezier(.2,.9,.25,1.15) both; }
        .bubble-late { animation-delay: 260ms; }
        @keyframes bubble { from { opacity: 0; transform: translateY(10px) scale(.97); } to { opacity: 1; transform: none; } }
        .faq-chip:hover { transform: translateY(-2px); }
        .faq-chip { transition: transform 150ms; }
        @media (prefers-reduced-motion: reduce) { .bubble { animation: none; } }
      `}</style>
    </div>
  );
}
