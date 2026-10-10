import Link from "next/link";
import { Button } from "./Button";

/** Hang-tag outline in a 100×100 box: clipped top corners, rounded bottom. */
const TAG = "M16 0 H84 L100 8 V95 Q100 100 95 100 H5 Q0 100 0 95 V8 Z";

const FREE = ["Your palette, with a name for every colour", "Three things that already work on you", "The one thing to change"];
const REPORT = [
  ["About you", "Colouring, face, features and build, in plain words."],
  ["About your style", "What you wear now, what it says, and the version that fits your life."],
  ["What works, what does not", "Colours, cuts, fabrics and details, each with the reason."],
] as const;

/** Pricing on the home page: a plain free card and the Style Report as a garment hang tag. */
export function Pricing() {
  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-3">
        <h2 style={{ margin: 0 }}>Pricing</h2>
        <p className="muted" style={{ margin: 0, fontSize: "1.1875rem" }}>
          Start free. Pay once if you want the whole picture.
        </p>
      </div>

      <div className="grid items-start gap-10 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-12">
        {/* Free */}
        <div className="flex flex-col gap-6 p-7 md:mt-14 md:p-8" style={{ border: "3px solid var(--ink)", borderRadius: 28, background: "var(--paper)" }}>
          <div className="flex items-baseline justify-between gap-4">
            <h3 style={{ margin: 0, fontSize: "1.375rem" }}>Your personal style</h3>
            <span className="display" style={{ fontSize: "2rem" }}>Free</span>
          </div>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {FREE.map((f) => (
              <li key={f} className="flex items-start gap-3" style={{ fontSize: "1.0625rem" }}>
                <span aria-hidden="true" style={{ color: "var(--good)", fontWeight: 800 }}>
                  ✓
                </span>
                {f}
              </li>
            ))}
          </ul>
          <Button href="#start" variant="secondary" size="lg" className="self-start">
            Generate my personal style
          </Button>
        </div>

        {/* Style Report: a hang tag on a string */}
        <div className="relative pt-16">
          <div className="tag relative flex flex-col gap-6 px-7 pt-14 pb-8 md:px-10" style={{ color: "var(--ink)" }}>
            {/* The tag shape: shadow, then lime body with an ink outline. */}
            <svg aria-hidden="true" className="absolute inset-0 h-full w-full" style={{ transform: "translateY(10px)", zIndex: -2 }} viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d={TAG} fill="var(--ink)" />
            </svg>
            <svg aria-hidden="true" className="absolute inset-0 h-full w-full" style={{ zIndex: -1, overflow: "visible" }} viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d={TAG} fill="var(--lime)" stroke="var(--ink)" strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
            </svg>
            <span aria-hidden="true" className="absolute" style={{ left: "50%", top: 22, width: 22, height: 22, marginLeft: -11, borderRadius: 999, background: "var(--paper)", border: "3px solid var(--ink)" }} />
            {/* The string runs down through the hole. */}
            <svg aria-hidden="true" className="absolute" style={{ left: "50%", top: -64, width: 80, height: 100, marginLeft: -40, overflow: "visible" }} viewBox="0 0 80 100">
              <path d="M40 97 C 30 70, 74 40, 56 0" fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="label">One time · opens right away</span>
                <h3 style={{ margin: 0, fontSize: "1.75rem" }}>Style Report</h3>
              </div>
              <p className="display" style={{ margin: 0, fontSize: "clamp(3rem, 7vw, 4.5rem)" }}>
                $10 <s style={{ fontSize: "0.4em", fontWeight: 700, opacity: 0.55 }}>$29</s>
              </p>
            </div>
            <ol className="m-0 flex list-none flex-col p-0" style={{ borderTop: "2px dashed var(--ink)" }}>
              {REPORT.map(([t, d], i) => (
                <li key={t} className="flex items-start gap-4 py-4" style={{ borderBottom: "2px dashed var(--ink)" }}>
                  <span className="display flex-none" style={{ fontSize: "1.25rem", width: 24 }}>
                    {i + 1}
                  </span>
                  <span className="flex flex-col">
                    <strong style={{ fontSize: "1.0625rem" }}>{t}</strong>
                    <span style={{ fontSize: "0.9375rem", opacity: 0.8 }}>{d}</span>
                  </span>
                </li>
              ))}
            </ol>
            <div className="flex flex-col gap-2">
              <Button href="#start" size="lg" className="self-start" style={{ background: "var(--ink)", border: "2px solid var(--ink)", color: "var(--paper)" }}>
                Start with my free result
              </Button>
              <span style={{ fontSize: "0.9375rem", opacity: 0.8 }}>
                You can get the report from your result page.{" "}
                <Link href="/sample/her" style={{ fontWeight: 700, color: "var(--ink)" }}>
                  See a sample report
                </Link>
              </span>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .tag {
          isolation: isolate;
          transform: rotate(-1.5deg);
        }
      `}</style>
    </div>
  );
}
