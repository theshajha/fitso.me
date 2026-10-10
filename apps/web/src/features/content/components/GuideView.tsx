import Link from "next/link";
import { Button, Container, Section } from "@/components/brand";
import type { ContentPage } from "../load";
import { getPage } from "../load";
import { Beacon } from "./Beacon";
import { DoorChip, PillarChip, formatDate } from "./Chips";
import { Faq } from "./Faq";
import { GuideCard } from "./GuideCard";

function Swatches({ blocks }: { blocks: ContentPage["palette_blocks"] }) {
  return (
    <div className="flex flex-col gap-6">
      {blocks.map((b) => (
        <div key={b.label}>
          <h3 style={{ marginBottom: 12 }}>{b.label}</h3>
          <ul className="flex flex-wrap gap-3" style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {b.hexes.map((hex) => (
              <li key={hex} style={{ width: 88 }}>
                <span
                  aria-hidden
                  className="block rounded-xl"
                  style={{ background: hex, height: 64, border: "2px solid var(--line)" }}
                />
                <span className="label block mt-1" style={{ color: "var(--ink-2)" }}>
                  {hex.toUpperCase()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function GuideView({ page }: { page: ContentPage }) {
  const related = page.related.map((s) => getPage(s)).filter((p): p is ContentPage => Boolean(p));
  const doors = page.door === "both" ? (["men", "women"] as const) : ([page.door] as const);
  const from = `guide-${page.slug}`;
  // Palette rows sit after the first section on colour pages.
  const showPaletteAt = page.palette_blocks.length > 0 ? 0 : -1;

  return (
    <div data-door={page.door === "both" ? undefined : page.door}>
      <Beacon event="guide_viewed" slug={page.slug} door={page.door} pillar={page.pillar} />
      <Section>
        <nav aria-label="Breadcrumb" className="label mb-6" style={{ color: "var(--ink-2)" }}>
          <Link href="/guides">Guides</Link> / <span>{page.title}</span>
        </nav>
        <div className="flex flex-wrap gap-2 mb-4">
          <DoorChip door={page.door} />
          <PillarChip pillar={page.pillar} />
        </div>
        <h1>{page.title}</h1>
        <p style={{ fontSize: "1.375rem", color: "var(--ink-2)", margin: "1.5rem 0 0" }}>{page.description}</p>
        <p className="label mt-4" style={{ color: "var(--ink-2)" }}>
          Updated {formatDate(page.updated)}
        </p>
        <p style={{ marginTop: "2rem", fontSize: "1.125rem" }}>{page.intro}</p>
      </Section>

      {page.sections.map((s, i) => (
        <Section key={s.heading} className="!pt-0">
          <h2 style={{ marginBottom: "1rem" }}>{s.heading}</h2>
          <p style={{ margin: 0 }}>{s.body}</p>
          {s.looks && s.looks.length > 0 && (
            <div
              className="grid gap-4 mt-6"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}
            >
              {s.looks.map((l) => (
                <article
                  key={l.name}
                  className="rounded-2xl p-5 flex flex-col gap-3"
                  style={{ border: "2px solid var(--line)", background: "#fff" }}
                >
                  <h3>{l.name}</h3>
                  <ul className="list-disc pl-5 m-0">
                    {l.pieces.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                  <p className="label" style={{ margin: 0, color: "var(--accent)" }}>
                    Budget {l.budget_inr}
                  </p>
                  <p style={{ margin: 0, color: "var(--ink-2)" }}>{l.why}</p>
                </article>
              ))}
            </div>
          )}
          {s.tips && s.tips.length > 0 && (
            <ul className="list-disc pl-6 mt-4 flex flex-col gap-2">
              {s.tips.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          )}
          {i === showPaletteAt && (
            <div className="mt-8">
              <Swatches blocks={page.palette_blocks} />
            </div>
          )}
        </Section>
      ))}

      {page.faq.length > 0 && (
        <Section className="!pt-0">
          <h2 style={{ marginBottom: "1.5rem" }}>Questions</h2>
          <Faq items={page.faq} />
        </Section>
      )}

      {related.length > 0 && (
        <Section className="!pt-0">
          <h2 style={{ marginBottom: "1.5rem" }}>Related guides</h2>
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
            {related.map((r) => (
              <GuideCard key={r.slug} page={r} showDescription={false} />
            ))}
          </div>
        </Section>
      )}

      <section className="section" style={{ borderTop: "2px solid var(--line)", background: "#fff" }}>
        <Container>
          <h2>{page.cta.headline}</h2>
          <p style={{ margin: "1rem 0 2rem", fontSize: "1.125rem" }}>{page.cta.sub}</p>
          <div className="flex flex-wrap gap-3">
            {doors.map((d) => (
              <Button
                key={d}
                door={d}
                size="lg"
                href={`/start?door=${d}&from=${from}`}
              >
                {page.door === "both" ? `Start with the ${d === "men" ? "men's" : "women's"} door` : "Generate my personal style"}
              </Button>
            ))}
          </div>
        </Container>
      </section>
    </div>
  );
}
