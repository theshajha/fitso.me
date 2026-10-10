import { JsonLd } from "./JsonLd";

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  if (items.length === 0) return null;
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: items.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }}
      />
      <div className="flex flex-col" style={{ borderTop: "2px solid var(--line)" }}>
        {items.map((f) => (
          <details key={f.q} className="py-4" style={{ borderBottom: "2px solid var(--line)" }}>
            <summary className="cursor-pointer font-semibold">{f.q}</summary>
            <p style={{ margin: "0.75rem 0 0", color: "var(--ink-2)" }}>{f.a}</p>
          </details>
        ))}
      </div>
    </>
  );
}
