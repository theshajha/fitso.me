import { READS } from "./reads";

const EXTRA = [
  { name: "Cobalt", hex: "#2b3df5" },
  { name: "Blush", hex: "#e8b4b8" },
  { name: "Ice grey", hex: "#d9dde3" },
  { name: "Lime", hex: "#c8f031" },
  { name: "Coral", hex: "#ff6b5a" },
  { name: "Navy", hex: "#1f2a52" },
];

/** A slow strip of named swatches: the palettes people get, moving past. */
export function SwatchRibbon() {
  const all = [...READS.women.palette, ...EXTRA.slice(0, 3), ...READS.men.palette, ...EXTRA.slice(3)];
  const row = [...all, ...all];
  return (
    <div className="ribbon overflow-hidden py-5" style={{ borderBlock: "3px solid var(--ink)", background: "var(--ink)" }} aria-hidden="true">
      <ul className="ribbon-track m-0 flex w-max list-none gap-3 p-0">
        {row.map((s, i) => (
          <li key={`${s.hex}-${i}`} className="flex items-center gap-2.5 py-1.5 pr-4 pl-1.5" style={{ background: "var(--paper)", borderRadius: 999 }}>
            <span style={{ width: 30, height: 30, borderRadius: 999, background: s.hex, border: "2px solid var(--ink)" }} />
            <span style={{ fontWeight: 700, whiteSpace: "nowrap", fontSize: "0.9375rem" }}>{s.name}</span>
          </li>
        ))}
      </ul>
      <style>{`
        .ribbon-track { animation: ribbon 60s linear infinite; }
        .ribbon:hover .ribbon-track { animation-play-state: paused; }
        @keyframes ribbon { to { transform: translateX(-50%); } }
        @media (prefers-reduced-motion: reduce) { .ribbon-track { animation: none; } }
      `}</style>
    </div>
  );
}
