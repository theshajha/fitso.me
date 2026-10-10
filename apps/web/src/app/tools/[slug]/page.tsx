import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Button, Container, Section } from "@/components/brand";
import { getTool, getTools } from "@/features/content";
import { Beacon } from "@/features/content/components/Beacon";
import { Faq } from "@/features/content/components/Faq";
import { SamplePreview } from "@/features/content/components/SamplePreview";
import { WardrobeChecklist } from "@/features/content/components/WardrobeChecklist";
import { pageMetadata } from "@/features/content/meta";

export const dynamicParams = false;

export function generateStaticParams() {
  return getTools().map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const t = getTool(slug);
  if (!t) return {};
  return pageMetadata({ title: t.title, description: t.description, path: `/tools/${t.slug}` });
}

type Item = { category: string; item: string };

function doorOf(href: string): "men" | "women" | undefined {
  const m = /door=(men|women)/.exec(href);
  return m ? (m[1] as "men" | "women") : undefined;
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) notFound();
  const raw = tool as Record<string, unknown>;
  const checklist = raw.checklist as { men: Item[]; women: Item[] } | undefined;
  const door = doorOf(tool.cta.href);

  return (
    <div data-door={door}>
      <Beacon event="tool_viewed" tool={tool.slug} />
      <Section>
        <p className="label mb-4" style={{ color: "var(--accent)" }}>Free tool</p>
        <h1>{tool.headline}</h1>
        {tool.sub && <p style={{ fontSize: "1.375rem", color: "var(--ink-2)", margin: "1.5rem 0 0" }}>{tool.sub}</p>}
        {tool.intro && <p style={{ marginTop: "2rem", fontSize: "1.125rem" }}>{tool.intro}</p>}
        {!checklist && (
          <div className="mt-8">
            <Button size="lg" href={tool.cta.href}>{tool.cta.label}</Button>
          </div>
        )}
      </Section>

      {checklist && (
        <Section className="!pt-0">
          <WardrobeChecklist checklist={checklist} cta={tool.cta} />
        </Section>
      )}

      {tool.how_it_works && tool.how_it_works.length > 0 && (
        <Section className="!pt-0">
          <h2 style={{ marginBottom: "1.5rem" }}>How it works</h2>
          <ol className="grid gap-4 p-0 m-0" style={{ listStyle: "none", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
            {tool.how_it_works.map((step, i) => (
              <li key={step} className="rounded-2xl p-5" style={{ border: "2px solid var(--line)", background: "#fff" }}>
                <span className="label" style={{ color: "var(--accent)" }}>Step {i + 1}</span>
                <p style={{ margin: "0.5rem 0 0" }}>{step}</p>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {(Boolean(tool.what_you_get?.length) || Boolean(raw.sample)) && (
        <Section className="!pt-0">
          <div className="grid gap-8 items-start" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
            {tool.what_you_get && tool.what_you_get.length > 0 && (
              <div>
                <h2 style={{ marginBottom: "1rem" }}>What you get</h2>
                <ul className="list-disc pl-6 m-0 flex flex-col gap-2">
                  {tool.what_you_get.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
            <SamplePreview tool={tool} />
          </div>
        </Section>
      )}

      {tool.tips && tool.tips.length > 0 && (
        <Section className="!pt-0">
          <h2 style={{ marginBottom: "1rem" }}>Tips</h2>
          <ul className="list-disc pl-6 m-0 flex flex-col gap-2">
            {tool.tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </Section>
      )}

      {tool.honesty && (
        <Section className="!pt-0">
          <div className="rounded-2xl p-6" style={{ border: "2px solid var(--ink)", background: "#fff" }}>
            <p className="label" style={{ margin: 0, color: "var(--ink-2)" }}>What this tool will and will not tell you</p>
            <p style={{ margin: "0.5rem 0 0", fontSize: "1.125rem" }}>{tool.honesty}</p>
          </div>
        </Section>
      )}

      {tool.faq.length > 0 && (
        <Section className="!pt-0">
          <h2 style={{ marginBottom: "1.5rem" }}>Questions</h2>
          <Faq items={tool.faq} />
        </Section>
      )}

      <section className="section" style={{ borderTop: "2px solid var(--line)", background: "#fff" }}>
        <Container>
          <Button size="lg" href={tool.cta.href}>{tool.cta.label}</Button>
        </Container>
      </section>
    </div>
  );
}
