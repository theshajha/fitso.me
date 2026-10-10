import type { Advice, ReadReport } from "@fitso/core";
import { textOn } from "@/features/profile/content";
import { ChapterNav, Rule, ShowMore } from "./ReportBits";
import { ReportPoll } from "./ReportPoll";

/**
 * The paid Style Report, as a lookbook. Built from the engine's structured
 * decisions and plan, so the page stays short however much prose the engine writes.
 * Order: cover, three moves, colours, style, fit rules, outfits, shopping list.
 */

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const words = (s: string) => s.replace(/_/g, " ");

/** The first sentence is the rule; the rest belongs behind "Why?". */
function split(text: string): [string, string] {
  const m = text.match(/^(.+?[.!?])\s+(.*)$/s);
  return m ? [m[1], m[2]] : [text, ""];
}

const low = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);

/** Keep a phrase short: cut at the first comma, semicolon or " or " once it runs past ~40 characters. */
function short(s: string): string {
  const t = s.trim().replace(/\.$/, "");
  if (t.length <= 48) return t;
  const m = t.slice(24).search(/[,;]| or | and | with /);
  return m === -1 ? t : t.slice(0, 24 + m).trim();
}

function adviceRule(a: Advice) {
  const [rule, rest] = split(a.what);
  return { rule, why: [rest, a.why].filter(Boolean).join(" "), seen: a.evidence };
}

function shopUrl(q: string) {
  return `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(q)}`;
}

const AXIS: Record<string, string> = { undertone: "Undertone", depth: "Depth", clarity: "Clarity", contrast: "Contrast" };

export const CHAPTERS = [
  { id: "start", label: "Start here" },
  { id: "colours", label: "Colours" },
  { id: "style", label: "Style" },
  { id: "fit", label: "Fit" },
  { id: "outfits", label: "Outfits" },
  { id: "shop", label: "Shopping list" },
];

/** Cover band: season headline, style name, the palette. Shown locked and unlocked. */
export function ReportCover({ report }: { report: ReadReport }) {
  const d = report.decisions;
  const lead = d.palette[0]?.hex ?? "#c2185b";
  const on = textOn(lead);
  const strip = [...d.palette, ...d.neutrals].slice(0, 12);
  return (
    <header className="sr-cover" style={{ background: lead, color: on }}>
      <div className="container sr-cover-grid">
        <div className="sr-fan" aria-hidden="true">
          {d.palette.slice(0, 5).map((s, i) => (
            <span key={`${s.hex}-${i}`} style={{ background: s.hex, transform: `rotate(${(i - 2) * 11}deg)` }} />
          ))}
        </div>
        <div className="flex min-w-0 flex-col">
          <p style={{ margin: 0, fontWeight: 700, color: on, opacity: 0.9 }}>Your Style Report</p>
          <h1 style={{ margin: "10px 0 0", color: on, fontSize: "clamp(2.5rem, 6.2vw, 5rem)" }}>
            You&apos;re a {d.season_depth} {d.season}.
          </h1>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="sr-badge" style={{ background: on, color: lead, borderColor: on }}>
              Your style: {d.archetype}
            </span>
            <span className="sr-badge" style={{ borderColor: on, color: on }}>
              {d.style_words.join(" · ")}
            </span>
          </div>
          <div className="sr-strip" aria-label="Your palette">
            {strip.map((s, i) => (
              <span key={`${s.hex}-${i}`} title={s.name} style={{ background: s.hex }} />
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}

export function StyleReport({ report }: { report: ReadReport }) {
  const d = report.decisions;
  const plan = report.plan;
  const prose = report.text.report;
  const obs = report.observations?.[0];

  // Start here: the writer's top lines when present. Otherwise: the one change (as written for the free
  // result), the first buy that is not the same item, and the colour rule.
  const buysSorted = plan ? [...plan.buy].sort((a, b) => a.priority - b.priority) : [];
  const overlap = (a: string, b: string) => {
    const wa = new Set(a.toLowerCase().match(/[a-z]{4,}/g) ?? []);
    const wb = b.toLowerCase().match(/[a-z]{4,}/g) ?? [];
    return wb.filter((w) => wa.has(w)).length >= 2;
  };
  const firstBuy = buysSorted.find((b) => !overlap(d.change.swap_in, b.item)) ?? null;
  const [changeTitle, changeSub] = split(report.text.free.change_line || `Swap ${d.change.swap_out} for ${d.change.swap_in}.`);
  const lines = prose?.summary?.five_lines ?? [];
  const moves: { title: string; sub?: string }[] =
    lines.length >= 3
      ? lines.slice(0, 3).map((l) => {
          const [t, rest] = split(l);
          return { title: t, sub: rest || undefined };
        })
      : [
          { title: changeTitle, sub: changeSub || undefined },
          ...(firstBuy ? [{ title: `Buy ${low(short(firstBuy.item))}.`, sub: `Unlocks ${low(firstBuy.unlocks)}` }] : []),
          { title: split(d.must_axis_why)[0] },
        ].slice(0, 3);

  const facts = [
    `${cap(d.season_depth)} ${d.season}`,
    obs ? `${cap(words(obs.skin.depth))} skin` : null,
    `${cap(d.undertone)} undertone`,
    `${cap(d.contrast)} contrast`,
    `${cap(d.clarity)} colouring`,
    obs && obs.face.shape !== "unknown" ? `${cap(obs.face.shape)} face` : null,
    obs && obs.build.frame !== "unknown" ? `${cap(obs.build.frame)} frame` : null,
    obs?.build.torso_vs_legs === "longer_legs" ? "Legs longer than torso" : obs?.build.torso_vs_legs === "longer_torso" ? "Torso longer than legs" : null,
  ].filter((f): f is string => !!f);

  const face = [...d.line.face.necklines, ...d.line.face.collars.slice(0, 1), d.line.face.earrings_or_scale].slice(0, 5).map(adviceRule);
  const shape = [...d.line.body.silhouettes.slice(0, 2), ...d.line.body.rise_and_lengths.slice(0, 2), d.line.body.print_scale].slice(0, 5).map(adviceRule);
  const finish = [
    adviceRule(d.line.face.hair),
    ...d.grooming
      .filter((g) => g.area !== "hair")
      .slice(0, 2)
      .map((g) => {
        const [rule, rest] = split(g.what);
        return { rule, why: [rest, g.why].filter(Boolean).join(" "), seen: g.evidence };
      }),
  ];
  const ruleCount = face.length + shape.length + finish.length;

  const keep = plan?.audit.keep ?? d.working.map((w) => ({ item: w.claim, why: w.why }));
  const retire = plan?.audit.retire ?? [{ item: d.change.swap_out, why: d.change.why, instead: d.change.swap_in }];
  const buys = buysSorted;

  return (
    <div className="sr">
      <style>{CSS}</style>
      <ChapterNav chapters={CHAPTERS} />

      <div className="container">
        <section className="sr-ch" id="start">
          <div className="sr-head">
            <h2>Start here</h2>
            <p className="sr-lede">Three moves, in this order. Everything below explains them.</p>
          </div>
          <ol className="sr-moves">
            {moves.map((m, i) => (
              <li key={i} className={i === 0 ? "first" : undefined}>
                <span className="display sr-num">{i + 1}</span>
                <b>{m.title}</b>
                {m.sub && <small>{m.sub}</small>}
              </li>
            ))}
          </ol>
        </section>

        <section className="sr-ch" id="colours">
          <div className="sr-head">
            <p className="sr-k">Part 1 · About you</p>
            <h2>Your colours</h2>
            {report.text.free.palette_caption && <p className="sr-lede">{report.text.free.palette_caption}</p>}
          </div>
          <ul className="sr-facts" aria-label="What your photo shows">
            {facts.map((f, i) => (
              <li key={f} className={i === 0 ? "key" : undefined}>
                {f}
              </li>
            ))}
          </ul>
          <div className="sr-cgrid">
            <div className="sr-group">
              <p className="sr-lbl">Near your face</p>
              <ul className="sr-sws">
                {d.palette.slice(0, 8).map((s, i) => (
                  <li key={`${s.hex}-${i}`} className="sr-sw" title={s.use}>
                    <span className="chip" style={{ background: s.hex }} />
                    <b>{s.name}</b>
                  </li>
                ))}
              </ul>
            </div>
            <div className="sr-group">
              <p className="sr-lbl">Your base</p>
              <ul className="sr-sws">
                {d.neutrals.slice(0, 4).map((s, i) => (
                  <li key={`${s.hex}-${i}`} className="sr-sw">
                    <span className="chip" style={{ background: s.hex }} />
                    <b>{s.name}</b>
                    <small className="clamp2">{cap(short(split(s.use)[0]))}</small>
                  </li>
                ))}
              </ul>
              <p className="sr-lbl" style={{ marginTop: 10 }}>
                Keep away from your face
              </p>
              <ul className="sr-sws avoid">
                {d.avoid.slice(0, 4).map((s, i) => (
                  <li key={`${s.hex}-${i}`} className="sr-sw" title={s.why}>
                    <span className="chip" style={{ background: s.hex }} />
                    <b>{s.name}</b>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="sr-cgrid" style={{ marginTop: 36 }}>
            <div className="sr-rulecard">
              <b>{AXIS[d.must_axis]} is the rule you can&apos;t bend.</b>
              <p>
                {split(d.must_axis_why)[0]} {split(d.flexible_axis_why)[0]}
              </p>
              <p>
                <b style={{ fontSize: "1rem" }}>Metal:</b> {d.metal === "both" ? "silver or gold" : words(d.metal)}. {split(d.metal_why)[0]}
              </p>
            </div>
            <div className="sr-tip">
              <b>The changing-room test</b>
              <p>{d.changing_room_test}</p>
            </div>
          </div>
        </section>

        <section className="sr-ch" id="style">
          <div className="sr-head">
            <p className="sr-k">Part 2 · About your style</p>
            <h2>Your style</h2>
          </div>
          <div className="sr-style">
            <div className="sr-persona">
              <p className="display">{d.archetype}</p>
              <div className="sr-words">
                {d.style_words.map((w) => (
                  <span key={w}>{w}</span>
                ))}
              </div>
              <p>{split(d.archetype_why)[0]}</p>
            </div>
            <div>
              <h3 style={{ marginBottom: 12 }}>From your photo</h3>
              <ul className="sr-board">
                {keep.slice(0, 5).map((k) => (
                  <li key={k.item}>
                    <span className="mk">✓</span>
                    <span>{cap(k.item)}</span>
                  </li>
                ))}
                {retire.slice(0, 2).map((r) => (
                  <li key={r.item} className="retire">
                    <span className="mk">×</span>
                    <span>
                      {cap(r.item)}
                      <span className="sr-swapto">→ {cap(r.instead)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="sr-ch" id="fit">
          <div className="sr-head">
            <p className="sr-k">Part 3 · What works</p>
            <h2>Fit rules</h2>
            <p className="sr-lede">{ruleCount} rules. Tap Why to see what in your photo led to each one.</p>
          </div>
          <div className="sr-fit">
            {[
              ["Neckline and face", face],
              ["Shape", shape],
              ["Hair and finish", finish],
            ].map(([title, rules]) => (
              <div key={title as string} className="sr-fitcol">
                <h3>{title as string}</h3>
                <ul>
                  {(rules as ReturnType<typeof adviceRule>[]).map((r) => (
                    <Rule key={r.rule} rule={r.rule} why={r.why} seen={r.seen} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="sr-ch" id="outfits">
          <div className="sr-head">
            <h2>{plan ? `${plan.outfits.length} outfits` : "Your outfits"}</h2>
            <p className="sr-lede">For the week you actually have. Pieces marked yours are already in your photo.</p>
          </div>
          {plan ? (
            <ShowMore count={3} label={`Show ${plan.outfits.length - 3} more outfits`} className="sr-looks">
              {plan.outfits.map((o) => (
                <article key={o.name} className="sr-look">
                  <div className="strip">
                    {o.pieces.map((p, i) => (
                      <span key={i} style={{ background: p.hex }} />
                    ))}
                  </div>
                  <p className="tag">{cap(o.occasion)}</p>
                  <h3>{o.name}</h3>
                  <ul>
                    {o.pieces.slice(0, 5).map((p, i) => (
                      <li key={i}>
                        <span className="dot" style={{ background: p.hex }} title={p.colour_name} />
                        <span>{cap(p.item)}</span>
                        {p.from_photo && <em>yours</em>}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </ShowMore>
          ) : (
            <Pending what="Your outfits" />
          )}
        </section>

        <section className="sr-ch" id="shop">
          <div className="sr-head">
            <h2>Shopping list</h2>
            <p className="sr-lede">Buy in this order. Stop when your week feels covered.</p>
          </div>
          {plan && buys.length > 0 ? (
            <div className="sr-shop">
              <div className="sr-first">
                <p className="sr-lbl">Buy first</p>
                <p className="display">{cap(buys[0].item)}</p>
                <p>{buys[0].unlocks}</p>
                <a className="go" href={shopUrl(buys[0].search_terms)} target="_blank" rel="noopener noreferrer">
                  Search for it
                </a>
              </div>
              <div>
                <ShowMore count={4} label={`Show ${Math.max(0, buys.length - 5)} more`} className="sr-list">
                  {buys.slice(1).map((b, i) => (
                    <div key={b.item} className="sr-buy">
                      <span className="n display">{i + 2}</span>
                      <span className="chip" style={{ background: b.hex }} title={b.colour_name} />
                      <span className="what">
                        <b>{cap(b.item)}</b>
                        <small>{[b.fabric, b.cut].filter(Boolean).join(", ")}</small>
                      </span>
                      <span className="tier">{cap(b.budget_tier)}</span>
                      <a href={shopUrl(b.search_terms)} target="_blank" rel="noopener noreferrer">
                        Search
                      </a>
                    </div>
                  ))}
                </ShowMore>
                <div className="sr-stop">
                  <p className="sr-lbl">Stop buying</p>
                  <ul>
                    {plan.stop_buying.map((s) => (
                      <li key={s.item} title={s.why}>
                        {cap(s.item)}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <Pending what="Your shopping list" />
          )}
        </section>

        <div className="sr-end">
          <h2>That&apos;s your report.</h2>
          <a href="#start">Back to the three moves</a>
        </div>
      </div>
    </div>
  );
}

function Pending({ what }: { what: string }) {
  return (
    <div className="sr-tip">
      <b>{what} is still being put together.</b>
      <p>It usually takes a minute or two. This page updates on its own.</p>
      <ReportPoll />
    </div>
  );
}

const CSS = `
.sr-cover{border-bottom:3px solid var(--ink)}
.sr-cover-grid{display:grid;grid-template-columns:minmax(0,260px) minmax(0,1fr);gap:48px;align-items:center;padding-block:56px}
.sr-fan{position:relative;height:300px}
.sr-fan span{position:absolute;left:50%;bottom:10px;width:92px;height:250px;margin-left:-46px;border-radius:18px;border:3px solid var(--ink);box-shadow:0 6px 0 var(--ink);transform-origin:50% 100%}
.sr-badge{font-weight:700;padding:6px 14px;border-radius:999px;border:2px solid}
.sr-strip{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:6px;margin-top:28px;max-width:620px}
.sr-strip span{aspect-ratio:1/1.4;border-radius:9px;border:2px solid var(--ink)}
.sr-nav{position:sticky;top:0;z-index:20;background:var(--paper);border-bottom:2px solid var(--ink)}
.sr-nav-row{display:flex;gap:6px;overflow-x:auto;padding-block:10px;scrollbar-width:none}
.sr-nav a{flex:none;text-decoration:none;font-weight:700;font-size:.9375rem;padding:7px 14px;border-radius:999px;border:2px solid transparent}
.sr-nav a.on{background:var(--ink);color:var(--paper)}
.sr-nav a:hover{border-color:var(--ink)}
.sr-ch{padding-block:72px;border-bottom:2px solid var(--line);scroll-margin-top:64px}
.sr-head{display:flex;flex-direction:column;gap:8px;margin-bottom:32px}
.sr-k{margin:0;font-weight:700;color:var(--ink-2)}
.sr-lede{margin:0;font-size:1.1875rem;color:var(--ink-2)}
.sr-lbl{margin:0;font-weight:800}
.sr-moves{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}
.sr-moves li{border:3px solid var(--ink);border-radius:24px;padding:22px;display:flex;flex-direction:column;gap:10px}
.sr-moves li.first{background:var(--lime);box-shadow:0 8px 0 var(--ink)}
.sr-num{font-size:2.4rem;line-height:1}
.sr-moves b{font-size:1.25rem;line-height:1.25}
.sr-moves small{font-size:.9375rem;color:var(--ink-2)}
.sr-facts{list-style:none;margin:0 0 36px;padding:0;display:flex;flex-wrap:wrap;gap:8px}
.sr-facts li{border:2px solid var(--ink);border-radius:999px;padding:5px 14px;font-weight:600;font-size:.9375rem}
.sr-facts li.key{background:var(--ink);color:var(--paper)}
.sr-cgrid{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:40px}
.sr-group{display:flex;flex-direction:column;gap:14px}
.sr-sws{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
.sr-sw{display:flex;flex-direction:column;gap:6px;min-width:0}
.sr-sw .chip{display:block;aspect-ratio:1/1.15;border-radius:14px;border:2px solid var(--ink);box-shadow:0 4px 0 var(--ink)}
.sr-sw b{font-size:.875rem;line-height:1.2}
.sr-sw small{font-size:.8125rem;color:var(--ink-2);line-height:1.25}
.clamp2{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.sr-sws.avoid .chip{position:relative;box-shadow:none;opacity:.85}
.sr-sws.avoid .chip::after{content:"";position:absolute;left:-4px;right:-4px;top:50%;height:3px;background:var(--bad);transform:rotate(-35deg)}
.sr-rulecard{background:var(--ink);color:var(--paper);border-radius:22px;padding:22px;display:flex;flex-direction:column;gap:8px}
.sr-rulecard b{font-size:1.2rem}
.sr-rulecard p{margin:0}
.sr-tip{background:color-mix(in srgb,var(--line) 45%,var(--paper));border-radius:22px;padding:22px;display:flex;flex-direction:column;gap:6px}
.sr-tip p{margin:0}
.sr-style{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:40px;align-items:start}
.sr-persona{border:3px solid var(--ink);border-radius:26px;padding:28px;display:flex;flex-direction:column;gap:14px;box-shadow:0 8px 0 var(--magenta)}
.sr-persona .display{margin:0;font-size:clamp(2rem,4vw,3rem);color:var(--magenta)}
.sr-persona p{margin:0}
.sr-words{display:flex;flex-wrap:wrap;gap:8px}
.sr-words span{background:var(--magenta);color:#fff;font-weight:700;padding:6px 14px;border-radius:999px}
.sr-board{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px}
.sr-board li{display:flex;gap:12px;align-items:flex-start;padding:12px 14px;border-radius:16px;background:color-mix(in srgb,var(--line) 45%,var(--paper))}
.sr-board .mk{flex:none;width:26px;height:26px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;font-weight:800;color:#fff;background:var(--good);font-size:.875rem}
.sr-board li.retire{background:var(--paper);border:2px solid var(--ink)}
.sr-board li.retire .mk{background:var(--bad)}
.sr-swapto{display:block;margin-top:4px;font-weight:700}
.sr-fit{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}
.sr-fitcol{border:2px solid var(--ink);border-radius:22px;padding:22px;display:flex;flex-direction:column;gap:14px;min-width:0}
.sr-fitcol ul{list-style:none;margin:0;padding:0}
.sr-rule{border-top:2px solid var(--line);padding-block:12px}
.sr-rule-row{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;font-weight:600;line-height:1.4}
.sr-why{flex:none;border:2px solid var(--ink);background:var(--paper);border-radius:999px;padding:2px 10px;font:inherit;font-size:.8125rem;font-weight:700;cursor:pointer}
.sr-why[aria-expanded="true"]{background:var(--ink);color:var(--paper)}
.sr-why-text{margin:8px 0 0;font-size:.9375rem;color:var(--ink-2)}
.sr-seen{display:block;margin-top:4px;font-weight:600;color:var(--ink)}
.sr-looks{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}
.sr-look{border:2px solid var(--ink);border-radius:22px;overflow:hidden;display:flex;flex-direction:column}
.sr-look .strip{display:flex;height:54px;border-bottom:2px solid var(--ink)}
.sr-look .strip span{flex:1}
.sr-look .tag{margin:0;font-weight:700;color:var(--ink-2);font-size:.875rem;padding:16px 18px 0}
.sr-look h3{margin:0;padding:2px 18px 10px}
.sr-look ul{list-style:none;margin:0;display:flex;flex-direction:column;gap:8px;padding:0 18px 18px}
.sr-look li{display:flex;gap:10px;align-items:center;font-size:.9375rem;line-height:1.35}
.sr-look .dot{flex:none;width:16px;height:16px;border-radius:5px;border:1.5px solid var(--ink)}
.sr-look em{font-style:normal;font-size:.75rem;font-weight:800;color:var(--good);border:1.5px solid var(--good);border-radius:999px;padding:0 7px;margin-left:auto}
.sr-more{margin-top:20px;border:2px solid var(--ink);background:var(--paper);border-radius:999px;padding:10px 20px;font:inherit;font-weight:700;cursor:pointer}
.sr-shop{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:32px;align-items:start}
.sr-first{background:var(--lime);border:3px solid var(--ink);border-radius:26px;padding:26px;display:flex;flex-direction:column;gap:12px;box-shadow:0 8px 0 var(--ink)}
.sr-first p{margin:0}
.sr-first .display{font-size:clamp(1.5rem,3vw,2.1rem)}
.sr-first .go{align-self:flex-start;background:var(--ink);color:var(--paper);text-decoration:none;font-weight:700;padding:12px 22px;border-radius:999px}
.sr-list{display:flex;flex-direction:column}
.sr-buy{display:grid;grid-template-columns:28px 30px minmax(0,1fr) auto auto;gap:12px;align-items:center;padding-block:12px;border-top:2px solid var(--line)}
.sr-buy .chip{display:block;width:30px;height:30px;border-radius:8px;border:2px solid var(--ink)}
.sr-buy .what{display:flex;flex-direction:column;min-width:0}
.sr-buy small{color:var(--ink-2);font-size:.875rem}
.sr-buy .tier{font-size:.8125rem;font-weight:700;border:1.5px solid var(--ink);border-radius:999px;padding:1px 9px}
.sr-buy a{font-weight:700;font-size:.9375rem}
.sr-stop{margin-top:26px;display:flex;flex-direction:column;gap:10px}
.sr-stop ul{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:8px}
.sr-stop li{border:2px solid var(--bad);color:var(--bad);border-radius:999px;padding:4px 12px;font-weight:600;font-size:.9375rem;text-decoration:line-through;text-decoration-thickness:1.5px}
.sr-end{padding-block:64px 32px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:16px}
.sr-end a{background:var(--ink);color:var(--paper);text-decoration:none;font-weight:700;padding:14px 26px;border-radius:999px}
@media(max-width:860px){
  .sr-cover-grid,.sr-cgrid,.sr-style,.sr-shop{grid-template-columns:minmax(0,1fr);gap:28px}
  .sr-cover-grid{padding-block:36px}
  .sr-fan{height:200px}.sr-fan span{width:64px;height:170px;margin-left:-32px}
  .sr-moves,.sr-fit,.sr-looks{grid-template-columns:minmax(0,1fr)}
  .sr-strip{grid-template-columns:repeat(6,minmax(0,1fr))}
  .sr-ch{padding-block:52px}
  .sr-buy{grid-template-columns:22px 26px minmax(0,1fr) auto}
  .sr-buy .tier{display:none}
}
@media (prefers-reduced-motion:no-preference){html{scroll-behavior:smooth}}
`;
