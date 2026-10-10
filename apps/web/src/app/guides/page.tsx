import Link from "next/link";
import { Section } from "@/components/brand";
import { getAllPages, type ContentPage } from "@/features/content";
import { PILLAR_LABEL } from "@/features/content/components/Chips";
import { GuideCard } from "@/features/content/components/GuideCard";
import { pageMetadata } from "@/features/content/meta";

export const metadata = pageMetadata({
  title: "Style guides for India and the Gulf",
  description: "Outfit ideas, colour guides and packing lists for men and women. Local brands, INR and AED prices, honest advice.",
  path: "/guides",
});

type SP = { door?: string; pillar?: string };

const PILLARS = ["A", "B", "D"] as const;

function href(door?: string, pillar?: string) {
  const q = new URLSearchParams();
  if (door) q.set("door", door);
  if (pillar) q.set("pillar", pillar);
  const s = q.toString();
  return s ? `/guides?${s}` : "/guides";
}

function FilterLink({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={to}
      aria-current={active ? "true" : undefined}
      className="label rounded-full px-4 py-2 no-underline"
      style={{
        border: "2px solid var(--ink)",
        background: active ? "var(--ink)" : "transparent",
        color: active ? "var(--paper)" : "var(--ink)",
      }}
    >
      {children}
    </Link>
  );
}

export default async function GuidesIndex({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const door = sp.door === "men" || sp.door === "women" ? sp.door : undefined;
  const pillar = PILLARS.find((p) => p === sp.pillar);

  const pages = getAllPages().filter(
    (p) => (!door || p.door === door || p.door === "both") && (!pillar || p.pillar === pillar),
  );
  const groups = PILLARS.map((p) => ({ pillar: p, pages: pages.filter((x) => x.pillar === p) })).filter(
    (g) => g.pages.length > 0,
  );

  return (
    <>
      <Section>
        <h1>Guides that say what works</h1>
        <p style={{ fontSize: "1.25rem", color: "var(--ink-2)", margin: "1.5rem 0 0" }}>
          Festive looks, trip packing lists, colour advice and capsule wardrobes. Written for Indian skin, Indian weather and Indian prices.
        </p>
        <div className="flex flex-col gap-3 mt-8" aria-label="Filters">
          <div className="flex flex-wrap gap-2">
            <FilterLink to={href(undefined, pillar)} active={!door}>All</FilterLink>
            <FilterLink to={href("men", pillar)} active={door === "men"}>Men</FilterLink>
            <FilterLink to={href("women", pillar)} active={door === "women"}>Women</FilterLink>
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterLink to={href(door)} active={!pillar}>Every type</FilterLink>
            {PILLARS.map((p) => (
              <FilterLink key={p} to={href(door, p)} active={pillar === p}>
                {PILLAR_LABEL[p]} {p}
              </FilterLink>
            ))}
          </div>
        </div>
      </Section>
      {groups.length === 0 && (
        <Section className="!pt-0">
          <p>No guides match. <Link href="/guides">Clear the filters</Link>.</p>
        </Section>
      )}
      {groups.map((g: { pillar: string; pages: ContentPage[] }) => (
        <Section key={g.pillar} className="!pt-0">
          <h2 style={{ marginBottom: "1.5rem" }}>
            {PILLAR_LABEL[g.pillar]} <span className="label">({g.pages.length})</span>
          </h2>
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
            {g.pages.map((p) => (
              <GuideCard key={p.slug} page={p} />
            ))}
          </div>
        </Section>
      ))}
    </>
  );
}
