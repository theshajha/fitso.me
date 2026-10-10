"use client";

import { useEffect, type CSSProperties, type ReactNode } from "react";
import type { Door } from "@fitso/core";
import { Container } from "@/components/brand/Container";
import { Swatches } from "@/components/brand/Swatches";

export type StageName = "observe" | "colour" | "judge" | "judge_retry" | "verify" | "judge_after_verify" | "verify_2" | "write_free";

export type ReadEvent =
  | { type: "stage"; stage: StageName; status: "start" | "done"; data?: Record<string, unknown> }
  | { type: "done"; token: string }
  | { type: "error"; code?: string; message: string };

type Swatch = { name?: string; hex: string };

/** The visible steps, in the person's words. Several engine stages fold into one step. */
const ROWS: { key: "look" | "colour" | "decide" | "finish"; title: string }[] = [
  { key: "look", title: "Reading your colouring" },
  { key: "colour", title: "Finding your season" },
  { key: "decide", title: "Building your palette and picking what works" },
  { key: "finish", title: "Choosing your one change" },
];

const STAGE_TO_ROW: Record<StageName, (typeof ROWS)[number]["key"]> = {
  observe: "look",
  colour: "colour",
  judge: "decide",
  judge_retry: "decide",
  verify: "finish",
  judge_after_verify: "finish",
  verify_2: "finish",
  write_free: "finish",
};

const PROGRESS: Record<StageName, number> = { observe: 25, colour: 40, judge: 65, judge_retry: 65, verify: 75, judge_after_verify: 85, verify_2: 90, write_free: 97 };

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

function lastDone(events: ReadEvent[], stage: StageName): Record<string, unknown> | null {
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i];
    if (e.type === "stage" && e.stage === stage && e.status === "done") return obj(e.data);
  }
  return null;
}

function rowState(events: ReadEvent[], row: (typeof ROWS)[number]["key"]): "pending" | "running" | "done" {
  let state: "pending" | "running" | "done" = "pending";
  for (const e of events) {
    if (e.type !== "stage" || STAGE_TO_ROW[e.stage] !== row) continue;
    state = e.status === "start" ? "running" : "done";
  }
  return state;
}

/** The result takes the whole viewport. Nothing else competes with it. */
function Wrap({ children }: { children: ReactNode }) {
  return (
    <div className="proc-take">
      <Container className="section">{children}</Container>
    </div>
  );
}

export function Processing({
  photoUrls,
  events,
  error,
  onRetry,
  onOpen,
}: {
  door?: Door;
  photoUrls: string[];
  events: ReadEvent[];
  error: string | null;
  onRetry: () => void;
  /** Called with the token when the result is ready. */
  onOpen: (token: string) => void;
  embedded?: boolean;
}) {
  const doneEvent = events.find((e): e is Extract<ReadEvent, { type: "done" }> => e.type === "done");
  const finished = !!doneEvent;

  // Go straight to the result. A short beat lets the last step tick over first.
  const token = doneEvent?.token;
  useEffect(() => {
    if (!token) return;
    const id = setTimeout(() => onOpen(token), 900);
    return () => clearTimeout(id);
  }, [token, onOpen]);

  let progress = 6;
  for (const e of events) {
    if (e.type === "stage" && e.status === "done") progress = Math.max(progress, PROGRESS[e.stage]);
    if (e.type === "stage" && e.status === "start") progress = Math.max(progress, PROGRESS[e.stage] - 12);
  }
  if (finished) progress = 100;

  const observe = lastDone(events, "observe");
  const colour = lastDone(events, "colour");
  const judge = lastDone(events, "judge_after_verify") ?? lastDone(events, "judge_retry") ?? lastDone(events, "judge");
  const palette = arr<Swatch>(judge?.palette);
  const blur = Math.max(0, 18 - (progress / 100) * 18);

  const skin = obj(observe?.skin);
  const facts = [
    str(skin.depth) && `${cap(str(skin.depth).replace("_", " "))} skin`,
    str(skin.undertone) && `${cap(str(skin.undertone))} undertone`,
    str(observe?.contrast) && `${cap(str(observe?.contrast))} contrast`,
  ].filter(Boolean) as string[];

  return (
    <div className="proc">
      <style>{CSS}</style>
      <Wrap>
        <div className="proc-grid">
          <div className="proc-left">
            <div className="scan" style={{ "--blur": `${blur}px` } as CSSProperties}>
              <div className={`scan-photos n${Math.min(photoUrls.length, 4)}`}>
                {photoUrls.map((u) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={u} src={u} alt="" />
                ))}
              </div>
              {!finished && !error && <div className="scan-line" aria-hidden="true" />}
            </div>
          </div>

          <div className="proc-right">
            <div className="flex flex-col gap-3">
              <h1 style={{ margin: 0, fontSize: "clamp(2rem, 4.6vw, 3.25rem)" }}>
                {error ? "We couldn't finish" : finished ? "Your personal style is ready" : "Building your personal style"}
              </h1>
              <p role="status" aria-live="polite" className="muted" style={{ margin: 0, fontSize: "1.125rem" }}>
                {error ? error : finished ? "Opening it now." : "About a minute. Keep this tab open."}
              </p>
            </div>

            <div className="proc-bar" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Progress">
              <div style={{ width: `${progress}%` }} />
            </div>

            {error && (
              <button type="button" onClick={onRetry} className="proc-retry">
                Try again
              </button>
            )}

            <ol className="rows">
              {ROWS.map((row) => {
                const raw = finished ? "done" : rowState(events, row.key);
                const state = error && raw === "running" ? "pending" : raw;
                return (
                  <li key={row.key} className={`row ${state}`}>
                    <span className="n" aria-hidden="true">
                      {state === "done" ? "✓" : ""}
                    </span>
                    <div className="body">
                      <p className="title">
                        {row.title}
                        <span className="sr-only">{state === "done" ? " (done)" : state === "running" ? " (in progress)" : ""}</span>
                      </p>
                      {row.key === "look" && facts.length > 0 && (
                        <div className="facts">
                          {facts.map((f, k) => (
                            <span key={f} className="fact pop" style={{ "--i": k } as CSSProperties}>
                              {f}
                            </span>
                          ))}
                        </div>
                      )}
                      {row.key === "colour" && colour && (
                        <div className="facts">
                          <span className="fact strong pop">
                            {cap(str(colour.season_depth))} {str(colour.season)}
                          </span>
                        </div>
                      )}
                      {row.key === "decide" && palette.length > 0 && (
                        <div className="mt-3">
                          <Swatches colors={palette.map((p) => ({ name: p.name ?? "", hex: p.hex }))} size="sm" showNames={false} animate />
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </Wrap>
    </div>
  );
}

const CSS = `
.proc-take{position:fixed;inset:0;z-index:60;overflow:auto;background:var(--paper);color:var(--ink)}
.proc-grid{display:grid;gap:28px;grid-template-columns:1fr}
@media(min-width:900px){.proc-grid{grid-template-columns:minmax(0,400px) 1fr;gap:64px;align-items:start}.proc-left{position:sticky;top:24px}}
@media(max-width:899px){.scan{max-width:260px;aspect-ratio:3/4}}
.proc-right{display:flex;flex-direction:column;gap:22px;min-width:0}
.proc-bar{height:8px;border-radius:999px;background:var(--line);overflow:hidden}
.proc-bar>div{height:100%;background:var(--magenta);transition:width 700ms ease}
.scan{position:relative;overflow:hidden;border-radius:28px;border:3px solid var(--ink);background:var(--ink);aspect-ratio:4/5;box-shadow:0 10px 0 var(--ink)}
.scan-photos{position:absolute;inset:0;display:grid;gap:2px}
.scan-photos.n1{grid-template-columns:1fr}.scan-photos.n2{grid-template-columns:1fr 1fr}
.scan-photos.n3,.scan-photos.n4{grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr}
.scan-photos img{width:100%;height:100%;object-fit:cover;filter:blur(var(--blur,18px));transform:scale(1.08);transition:filter 900ms ease}
.scan-line{position:absolute;left:0;right:0;height:3px;background:var(--magenta);box-shadow:0 0 24px 6px color-mix(in srgb,var(--magenta) 70%,transparent);animation:scan 3.2s ease-in-out infinite}
@keyframes scan{0%{top:2%}50%{top:96%}100%{top:2%}}
@keyframes pop{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.pop{animation:pop 380ms ease both;animation-delay:calc(var(--i,0) * 110ms)}
.rows{list-style:none;margin:0;padding:0;display:flex;flex-direction:column}
.row{display:grid;grid-template-columns:32px 1fr;gap:14px;padding:16px 0;border-top:2px solid var(--line);transition:opacity 300ms}
.row.pending{opacity:.4}
.row .n{width:28px;height:28px;border-radius:50%;border:2px solid var(--ink-2);display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;margin-top:1px}
.row.done .n{background:var(--good);border-color:var(--good);color:#fff}
.row.running .n{border-color:var(--magenta);border-top-color:transparent;animation:spin 900ms linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.row .title{margin:0;font-size:1.1875rem;font-weight:700;line-height:1.35}
.facts{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.fact{border:2px solid var(--ink);border-radius:999px;padding:3px 12px;font-size:.9375rem;font-weight:600}
.fact.strong{background:var(--ink);color:var(--paper)}
.proc-retry{align-self:flex-start;padding:14px 30px;border-radius:999px;border:2px solid var(--magenta);background:var(--magenta);color:#fff;font-weight:700;font-size:17px;cursor:pointer}
@media(prefers-reduced-motion:reduce){.scan-line{animation:none;display:none}.pop{animation:none}.row.running .n{animation:none}}
`;
