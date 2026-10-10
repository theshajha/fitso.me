import { Stamp } from "@/components/brand";
import type { ToolContent } from "../load";

type Sample = Record<string, unknown>;

const strs = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
const str = (v: unknown): string => (typeof v === "string" ? v : "");

const SEASON_VAR: Record<string, string> = {
  spring: "var(--spring)",
  summer: "var(--summer)",
  autumn: "var(--autumn)",
  winter: "var(--winter)",
};

function Strip({ hexes }: { hexes: string[] }) {
  return (
    <div className="flex" aria-hidden style={{ height: 28, borderRadius: 8, overflow: "hidden" }}>
      {hexes.map((h) => (
        <span key={h} style={{ background: h, flex: 1 }} />
      ))}
    </div>
  );
}

/** A small preview of the tool's sample result, in the sample door's chrome. */
export function SamplePreview({ tool }: { tool: ToolContent }) {
  const s = (tool as Record<string, unknown>).sample as Sample | undefined;
  if (!s) return null;
  const door = s.door === "women" ? "women" : "men";
  const accent2 = door === "men" ? "var(--lime)" : "var(--tangerine)";

  let body: React.ReactNode = null;
  if (tool.slug === "colour-season") {
    const season = str(s.season);
    body = (
      <>
        <div className="rounded-xl p-4" style={{ background: SEASON_VAR[season] ?? "var(--line)" }}>
          <p className="label" style={{ margin: 0, color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,.5)" }}>
            {season} · {str(s.season_depth)} · {str(s.undertone)}
          </p>
        </div>
        <h3>{str(s.archetype)}</h3>
        <ul className="list-disc pl-5 m-0 flex flex-col gap-1">
          {strs(s.working_for_you).slice(0, 3).map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
        <Strip hexes={strs(s.palette)} />
      </>
    );
  } else if (tool.slug === "style-archetype") {
    body = (
      <>
        <h3>{str(s.archetype)}</h3>
        <p style={{ margin: 0 }}>{str(s.one_line)}</p>
        <ul className="list-disc pl-5 m-0 flex flex-col gap-1">
          {strs(s.signature_pieces).slice(0, 3).map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
        <p style={{ margin: 0, color: "var(--ink-2)" }}>{str(s.famous_for)}</p>
      </>
    );
  } else if (tool.slug === "does-this-suit-me") {
    const item = (s.item ?? {}) as Record<string, unknown>;
    const kind = s.verdict === "yes" ? "yes" : s.verdict === "no" ? "no" : "yes-if";
    body = (
      <>
        <div className="flex items-center gap-3">
          <Stamp kind={kind} />
          <h3>{str(item.name)}</h3>
        </div>
        <ul className="list-disc pl-5 m-0 flex flex-col gap-1">
          {strs(s.reasons).map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
        {str(s.condition) && <p style={{ margin: 0, color: "var(--ink-2)" }}>{str(s.condition)}</p>}
      </>
    );
  } else if (tool.slug === "wardrobe-gap") {
    body = (
      <>
        <h3>You have {String(s.owned ?? "")} of {door === "women" ? 30 : 20}</h3>
        <ul className="list-disc pl-5 m-0 flex flex-col gap-1">
          {strs(s.gaps).map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
        <p style={{ margin: 0, color: "var(--ink-2)" }}>{str(s.note)}</p>
      </>
    );
  } else {
    return null;
  }

  return (
    <aside
      data-door={door}
      aria-label="Sample result"
      className="rounded-2xl p-6 flex flex-col gap-4"
      style={{ border: "2px solid var(--accent)", background: "#fff", boxShadow: `8px 8px 0 ${accent2}` }}
    >
      <p className="label" style={{ margin: 0, color: "var(--accent)" }}>
        Sample · {door === "men" ? "men's door" : "women's door"}
      </p>
      {body}
    </aside>
  );
}
