import { Button } from "./Button";

const DOTS = [
  { c: "#c8f031", x: "6%", y: "18%", r: -14 },
  { c: "#2b3df5", x: "14%", y: "68%", r: 10 },
  { c: "#ff6b1a", x: "84%", y: "16%", r: 16 },
  { c: "#fffdf8", x: "91%", y: "62%", r: -8 },
  { c: "#14121b", x: "76%", y: "80%", r: 22 },
];

/** Last screen of the page: one line, one button. */
export function ClosingCta() {
  return (
    <section className="relative overflow-hidden" style={{ background: "var(--magenta)", color: "#fff", borderBlock: "3px solid var(--ink)" }}>
      {DOTS.map((d) => (
        <span
          key={d.c + d.x}
          aria-hidden="true"
          className="absolute hidden md:block"
          style={{ left: d.x, top: d.y, width: 46, height: 60, borderRadius: 12, background: d.c, border: "3px solid var(--ink)", transform: `rotate(${d.r}deg)`, boxShadow: "0 5px 0 var(--ink)" }}
        />
      ))}
      <div className="container relative flex flex-col items-center gap-7 py-20 text-center md:py-28">
        <h2 className="display" style={{ margin: 0, color: "#fff", fontSize: "clamp(2.25rem, 6vw, 4.5rem)" }}>
          One photo.
          <br />
          About a minute.
        </h2>
        <Button href="#start" size="lg" style={{ background: "var(--paper)", color: "var(--ink)", border: "3px solid var(--ink)", boxShadow: "0 5px 0 var(--ink)" }}>
          Generate my personal style
        </Button>
      </div>
    </section>
  );
}
