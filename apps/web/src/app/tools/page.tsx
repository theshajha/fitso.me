import Link from "next/link";
import { Section } from "@/components/brand";
import { getTools } from "@/features/content";
import { pageMetadata } from "@/features/content/meta";

export const metadata = pageMetadata({
  title: "Free style tools",
  description: "Four free tools: colour season, style archetype, does this suit me, and a wardrobe gap checklist.",
  path: "/tools",
});

export default function ToolsIndex() {
  const tools = getTools();
  return (
    <Section>
      <h1>Free style tools</h1>
      <p style={{ fontSize: "1.25rem", color: "var(--ink-2)", margin: "1.5rem 0 2.5rem" }}>
        Four ways to find out what is working for you. Each one starts free.
      </p>
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
        {tools.map((t) => (
          <article
            key={t.slug}
            className="flex flex-col gap-3 rounded-2xl p-5"
            style={{ border: "2px solid var(--line)", background: "#fff" }}
          >
            <h3>
              <Link href={`/tools/${t.slug}`} className="no-underline hover:underline">
                {t.headline}
              </Link>
            </h3>
            <p style={{ margin: 0, color: "var(--ink-2)" }}>{t.sub ?? t.description}</p>
            <p className="label" style={{ margin: "auto 0 0", color: "var(--accent)" }}>
              Open the tool
            </p>
          </article>
        ))}
      </div>
    </Section>
  );
}
