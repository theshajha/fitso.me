import type { ReactNode } from "react";
import type { Door, Observation, ReadReport } from "@fitso/core";
import { Container } from "@/components/brand/Container";
import { doorTheme } from "@/lib/tokens";
import { ReportPoll } from "./ReportPoll";

/**
 * The Style Report as a full page. Every section carries the facts it rests on.
 * The observation record (what the observer saw) is the derivation; the
 * decisions are the calls; the text is the stylist's words.
 */

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const words = (s: string) => cap(s.replace(/_/g, " "));
/** "The black boots" -> "black boots", so it reads inside a sentence. */
const noArticle = (s: string) => s.replace(/^(the|a|an|your|my)\s+/i, "");

function Fact({ k, v }: { k: string; v: string }) {
  if (!v || v === "Unknown") return null;
  return (
    <div className="flex flex-col gap-1" style={{ minWidth: 0 }}>
      <span className="label" style={{ color: "var(--ink-2)" }}>
        {k}
      </span>
      <span style={{ fontWeight: 600, fontSize: "1.0625rem", lineHeight: 1.3 }}>{v}</span>
    </div>
  );
}

function Evidence({ lines }: { lines: string[] }) {
  const shown = lines.filter(Boolean);
  if (!shown.length) return null;
  return (
    <ul className="m-0 mt-3 flex list-none flex-col gap-1.5 p-0">
      {shown.map((l, i) => (
        <li key={i} className="flex items-start gap-2" style={{ fontSize: "0.9375rem", color: "var(--ink-2)", lineHeight: 1.4 }}>
          <span aria-hidden="true" style={{ flex: "none", marginTop: 7, width: 8, height: 8, borderRadius: 3, background: "var(--accent)" }} />
          <span>{l}</span>
        </li>
      ))}
    </ul>
  );
}

function SectionHead({ n, title, lede }: { n: string; title: string; lede?: string }) {
  return (
    <header className="flex flex-col gap-3">
      <span className="label" style={{ color: "var(--ink-2)" }}>
        Part {n}
      </span>
      <h2 style={{ margin: 0, fontSize: "clamp(1.75rem, 3.6vw, 2.75rem)", letterSpacing: "-0.03em" }}>{title}</h2>
      {lede && <p style={{ margin: 0, fontSize: "1.125rem", color: "var(--ink-2)" }}>{lede}</p>}
    </header>
  );
}

/** Part 0: the analysis the rest rests on. */
export function WhatWeSaw({ obs, report, lede = "Your Style Report starts here. Everything below is built on these facts, taken from your photo." }: { obs: Observation; report: ReadReport; lede?: string }) {
  const d = report.decisions;
  const face = obs.face;
  const build = obs.build;
  return (
    <section id="seen" className="flex flex-col gap-8" style={{ scrollMarginTop: 24 }}>
      <SectionHead n="0" title="What we saw" lede={lede} />
      {report.colour && (
        <p className="label" style={{ margin: "-16px 0 0", color: "var(--ink-2)", textTransform: "none", letterSpacing: 0, fontSize: "0.9rem" }}>
          Season by vote: {Math.round(report.colour.agreement * report.colour.votes)} of {report.colour.votes} colour analysts called {report.colour.season_depth} {report.colour.season}. {report.colour.reasoning}
        </p>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="flex flex-col gap-5 p-6" style={{ border: "2px solid var(--ink)", borderRadius: 24 }}>
          <h3 style={{ margin: 0 }}>Your colouring</h3>
          <div className="grid grid-cols-2 gap-4">
            <Fact k="Skin" v={words(obs.skin.depth)} />
            <Fact k="Undertone" v={cap(d.undertone)} />
            <Fact k="Hair" v={cap(obs.hair.colour)} />
            <Fact k="Eyes" v={cap(obs.eyes.colour)} />
            <Fact k="Contrast" v={cap(d.contrast)} />
            <Fact k="Season" v={`${cap(d.season_depth)} ${d.season}`} />
          </div>
          <Evidence lines={[obs.skin.undertone_evidence]} />
        </div>

        <div className="flex flex-col gap-5 p-6" style={{ border: "2px solid var(--ink)", borderRadius: 24 }}>
          <h3 style={{ margin: 0 }}>Your face</h3>
          <div className="grid grid-cols-2 gap-4">
            <Fact k="Shape" v={words(face.shape)} />
            <Fact k="Glasses" v={face.glasses ? "Yes" : "No"} />
            {face.facial_hair && <Fact k="Facial hair" v={cap(face.facial_hair)} />}
            <Fact k="Hair" v={[words(obs.hair.length), words(obs.hair.texture)].filter(Boolean).join(", ")} />
          </div>
          <Evidence lines={[...face.notable_features.map(cap), face.makeup_or_grooming_notes ?? ""]} />
        </div>

        <div className="flex flex-col gap-5 p-6" style={{ border: "2px solid var(--ink)", borderRadius: 24 }}>
          <h3 style={{ margin: 0 }}>Your build</h3>
          <div className="grid grid-cols-2 gap-4">
            <Fact k="Frame" v={words(build.frame)} />
            <Fact k="Shoulders to hips" v={words(build.shoulders_vs_hips)} />
            <Fact k="Torso to legs" v={words(build.torso_vs_legs)} />
            <Fact k="Height reads as" v={words(build.height_impression)} />
          </div>
          <Evidence lines={[build.posture_notes ?? "", obs.photo.lighting ? `Light: ${obs.photo.lighting}${obs.photo.colour_cast ? `, ${obs.photo.colour_cast}` : ""}.` : ""]} />
        </div>
      </div>

      <div className="flex flex-col gap-4 p-6 md:p-8" style={{ background: "var(--ink)", color: "var(--paper)", borderRadius: 28 }}>
        <p className="label" style={{ margin: 0, color: "var(--paper)", opacity: 0.8 }}>
          Three things working, and the evidence
        </p>
        <ol className="m-0 grid list-none gap-5 p-0 md:grid-cols-3">
          {d.working.map((w, i) => (
            <li key={i} className="flex flex-col gap-2">
              <p style={{ margin: 0, fontWeight: 700, fontSize: "1.0625rem", lineHeight: 1.35, color: "var(--paper)" }}>{w.claim}</p>
              <p style={{ margin: 0, fontSize: "0.95rem", opacity: 0.85, lineHeight: 1.4, color: "var(--paper)" }}>{w.why}</p>
              <p className="label" style={{ margin: 0, fontSize: "0.68rem", opacity: 0.65, color: "var(--paper)", textTransform: "none", letterSpacing: 0 }}>
                Seen: {w.evidence}
              </p>
            </li>
          ))}
        </ol>
        <div style={{ borderTop: "1px solid rgba(255,253,248,0.2)", paddingTop: 16 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: "1.0625rem", color: "var(--paper)" }}>
            The one change: swap the {noArticle(d.change.swap_out)} for {noArticle(d.change.swap_in)}.
          </p>
          <p style={{ margin: "6px 0 0", fontSize: "0.95rem", opacity: 0.85, color: "var(--paper)" }}>{d.change.why}</p>
        </div>
      </div>
    </section>
  );
}

function Prose({ items, facts }: { items: { title: string; body: string }[]; facts: (title: string) => string[] }) {
  return (
    <div className="grid gap-8 md:grid-cols-[1fr_1fr]">
      {items.map((it) => (
        <article key={it.title} className="flex min-w-0 flex-col gap-2">
          <h3 style={{ margin: 0, fontSize: "1.25rem" }}>{it.title}</h3>
          <p style={{ margin: 0, fontSize: "1.0625rem", lineHeight: 1.55 }}>{it.body}</p>
          <Evidence lines={facts(it.title)} />
        </article>
      ))}
    </div>
  );
}

export function ReportBody({ report, door }: { report: ReadReport; door: Door }) {
  const text = report.text.report;
  const obs = report.observations?.[0];
  const d = report.decisions;
  const t = doorTheme[door];

  if (!text) {
    return (
      <div role="status" className="p-8" style={{ border: "2px solid var(--ink)", borderRadius: 24 }}>
        <p style={{ margin: 0, fontSize: "1.125rem", fontWeight: 600 }}>Your report is being written.</p>
        <p style={{ margin: "6px 0 0", color: "var(--ink-2)" }}>About half a minute. This page refreshes on its own.</p>
        <ReportPoll />
      </div>
    );
  }

  const factsFor = (title: string): string[] => {
    const k = title.toLowerCase();
    if (!obs) return [];
    if (k.includes("colour")) return [`${words(obs.skin.depth)} skin, ${d.undertone} undertone, ${d.contrast} contrast`, obs.skin.undertone_evidence];
    if (k.includes("face")) return [`${words(obs.face.shape)} face`, ...obs.face.notable_features.map(cap)];
    if (k.includes("build") || k.includes("body")) return [`${words(obs.build.frame)} frame, shoulders ${obs.build.shoulders_vs_hips} than hips, ${words(obs.build.torso_vs_legs).toLowerCase()}`];
    if (k.includes("hair") || k.includes("groom")) return [obs.hair.style_notes, obs.face.facial_hair ?? "", obs.face.makeup_or_grooming_notes ?? ""].filter(Boolean);
    if (k.includes("wear")) return obs.outfit.items.map((it) => `${cap(it.colour_name)} ${it.garment}, ${it.fit} fit`);
    if (k.includes("archetype")) return [d.archetype_why];
    return [];
  };

  return (
    <div className="flex flex-col" style={{ gap: 72 }}>
      {obs && <WhatWeSaw obs={obs} report={report} />}

      <section id="about-you" className="flex flex-col gap-8" style={{ scrollMarginTop: 24 }}>
        <SectionHead n="1" title="About you" />
        <Prose
          items={[
            { title: text.colours.lead, body: [...text.colours.points, text.colours.detail].filter(Boolean).join(" ") },
            { title: text.face.lead, body: [...text.face.points, text.face.detail].filter(Boolean).join(" ") },
            { title: text.body.lead, body: [...text.body.points, text.body.detail].filter(Boolean).join(" ") },
          ]}
          facts={factsFor}
        />
      </section>

      <section id="about-style" className="flex flex-col gap-8" style={{ scrollMarginTop: 24 }}>
        <SectionHead n="2" title="About your style" />
        <Prose
          items={[
            { title: text.style.lead, body: [...text.style.points, text.style.detail].filter(Boolean).join(" ") },
            { title: text.grooming.lead, body: text.grooming.points.join(" ") },
          ]}
          facts={factsFor}
        />
      </section>

      <section id="works" className="flex flex-col gap-8" style={{ scrollMarginTop: 24 }}>
        <SectionHead n="3" title="What works, what does not" lede="Keep what already works. Change what holds you back. Each line says why." />

        <div className="flex flex-col gap-6 p-6 md:p-8" style={{ background: t.secondary, borderRadius: 28, color: "var(--ink)" }}>
          <div className="flex flex-col gap-1">
            <p className="label" style={{ margin: 0 }}>
              Your palette
            </p>
            <p style={{ margin: 0, color: "var(--ink-2)" }}>{report.text.free.palette_caption}</p>
          </div>
          <ul className="m-0 grid list-none gap-3 p-0" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))" }}>
            {d.palette.map((c) => (
              <li key={c.hex} className="flex flex-col gap-2">
                <span style={{ display: "block", height: 64, borderRadius: 14, background: c.hex, border: "2px solid var(--ink)" }} />
                <span style={{ fontWeight: 700, fontSize: "0.95rem", lineHeight: 1.2 }}>{c.name}</span>
                <span style={{ fontSize: "0.85rem", color: "var(--ink-2)", lineHeight: 1.3 }}>{c.use}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-2" style={{ borderTop: "2px solid var(--ink)", paddingTop: 16 }}>
            <p className="label" style={{ margin: 0 }}>
              Keep away from your face
            </p>
            <ul className="m-0 flex list-none flex-col gap-1 p-0">
              {d.avoid.map((a) => (
                <li key={a.hex} className="flex items-start gap-3" style={{ fontSize: "0.95rem" }}>
                  <span style={{ flex: "none", marginTop: 2, width: 18, height: 18, borderRadius: 6, background: a.hex, border: "1.5px solid var(--ink)" }} />
                  <span>
                    <b>{a.name}.</b> {a.why}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {[
            { title: "Necklines and collars", items: [...d.line.face.necklines, ...d.line.face.collars] },
            { title: "Silhouettes and lengths", items: [...d.line.body.silhouettes, ...d.line.body.rise_and_lengths] },
            { title: "Scale and fabric", items: [d.line.body.print_scale, d.line.body.accessory_scale, d.line.body.fabric_weight] },
            { title: "Fit fixes", items: d.line.body.fit_fixes },
          ].map((w) => (
            <div key={w.title} className="flex flex-col gap-4 p-6" style={{ border: "2px solid var(--ink)", borderRadius: 24 }}>
              <h3 style={{ margin: 0, fontSize: "1.25rem" }}>{w.title}</h3>
              <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                {w.items.map((a, j) => (
                  <li key={j} style={{ lineHeight: 1.4 }}>
                    <b>{a.what}.</b> {a.why}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {report.plan && (
          <div className="flex flex-col gap-6">
            <h3 style={{ margin: 0, fontSize: "1.25rem" }}>Outfits</h3>
            <p style={{ margin: 0, color: "var(--ink-2)" }}>{text.outfits.lead}</p>
            <div className="grid gap-4 md:grid-cols-2">
              {report.plan.outfits.map((o) => (
                <div key={o.name} className="flex flex-col gap-2 p-5" style={{ border: "2px solid var(--ink)", borderRadius: 20 }}>
                  <p className="label" style={{ margin: 0, color: "var(--ink-2)" }}>{o.occasion}</p>
                  <h4 style={{ margin: 0 }}>{o.name}</h4>
                  <ul className="m-0 flex list-none flex-col gap-1 p-0">
                    {o.pieces.map((pc, k) => (
                      <li key={k} className="flex items-center gap-2" style={{ fontSize: "0.95rem" }}>
                        <span style={{ width: 14, height: 14, borderRadius: 4, background: pc.hex, border: "1px solid var(--ink)", flex: "none" }} />
                        {pc.colour_name} {pc.item}, {pc.cut}{pc.from_photo ? " (yours)" : ""}
                      </li>
                    ))}
                  </ul>
                  <p style={{ margin: 0, color: "var(--ink-2)", fontSize: "0.9rem" }}>{o.why}</p>
                </div>
              ))}
            </div>
            <h3 style={{ margin: 0, fontSize: "1.25rem" }}>Buy, in order</h3>
            <p style={{ margin: 0, color: "var(--ink-2)" }}>{text.buy.lead}</p>
            <ol className="m-0 flex flex-col gap-3 p-0 pl-5">
              {report.plan.buy.map((b) => (
                <li key={b.priority} style={{ lineHeight: 1.45 }}>
                  <b>{b.item}</b> ({b.budget_tier}). Search: &ldquo;{b.search_terms}&rdquo;. Wear with {b.wear_with}. {b.unlocks}
                </li>
              ))}
            </ol>
            <p style={{ margin: 0 }}><b>Stop buying:</b> {report.plan.stop_buying.map((s) => s.item).join(", ")}.</p>
            <h3 style={{ margin: 0, fontSize: "1.25rem" }}>Five filters</h3>
            <ol className="m-0 flex flex-col gap-1 p-0 pl-5">
              {report.plan.filters.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ol>
          </div>
        )}
      </section>

      <section id="closing" className="flex flex-col gap-6" style={{ scrollMarginTop: 24 }}>
        <div className="p-7 md:p-9" style={{ background: "var(--ink)", color: "var(--paper)", borderRadius: 28 }}>
          <p className="label" style={{ margin: 0, opacity: 0.8, color: "var(--paper)" }}>
            This week
          </p>
          <p style={{ margin: "10px 0 0", fontSize: "clamp(1.125rem, 2.2vw, 1.5rem)", lineHeight: 1.4, fontWeight: 600, color: "var(--paper)" }}>{text.week.lead} {text.week.detail}</p>
        </div>
        <p className="label" style={{ margin: 0, color: "var(--ink-2)", textTransform: "none", letterSpacing: 0 }}>
          How this was made: {report.photo_count} {report.photo_count === 1 ? "photo" : "photos"} ·{" "}
          {report.verification.filter((v) => v.relation === "supports").length} of {report.verification.length} lines checked against the photo and held ·{" "}
          {Math.round(report.took_s)} seconds
        </p>
      </section>
    </div>
  );
}

/** The page frame: cover on top, a contents rail on desktop, the body beside it. */
export function ReportFrame({
  door,
  headline,
  archetype,
  photoCount,
  createdAt,
  locked,
  children,
}: {
  door: Door;
  headline: string;
  archetype: string;
  photoCount: number;
  createdAt: string;
  locked: boolean;
  children: ReactNode;
}) {
  const t = doorTheme[door];
  const date = new Date(createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const nav = [
    ["#seen", "What we saw"],
    ["#about-you", "About you"],
    ["#about-style", "About your style"],
    ["#works", "What works, what does not"],
    ["#closing", "This week"],
  ];
  return (
    <div data-door={door}>
      <section className="section" style={{ background: t.accent, color: "#fff" }}>
        <Container className="flex flex-col gap-5">
          <p className="label" style={{ margin: 0, color: "#fff", opacity: 0.85 }}>
            Style Report · {date} · made from {photoCount} {photoCount === 1 ? "photo" : "photos"}
          </p>
          <h1 style={{ margin: 0, color: "#fff", fontSize: "clamp(2.25rem, 6vw, 4.75rem)", letterSpacing: "-0.04em" }}>{headline}</h1>
          <p style={{ margin: 0, color: "#fff", fontSize: "1.25rem", fontWeight: 600 }}>{archetype}</p>
        </Container>
      </section>
      <Container className="section">
        <div className="grid gap-12 md:grid-cols-[200px_1fr] md:gap-16">
          <nav aria-label="Report contents" className="hidden md:block">
            <ol className="m-0 flex list-none flex-col gap-3 p-0" style={{ position: "sticky", top: 24 }}>
              {nav.map(([href, label], i) => (
                <li key={href}>
                  <a href={locked ? "#price" : href} className="no-underline" style={{ display: "flex", gap: 10, alignItems: "baseline", fontWeight: 600, color: "var(--ink)", opacity: locked && i > 0 ? 0.5 : 1 }}>
                    <span className="label" style={{ color: "var(--ink-2)" }}>
                      {i}
                    </span>
                    {label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <div className="min-w-0">{children}</div>
        </div>
      </Container>
    </div>
  );
}
