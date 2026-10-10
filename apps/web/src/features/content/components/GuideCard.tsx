import Link from "next/link";
import type { ContentPage } from "../load";
import { DoorChip, PillarChip, formatDate } from "./Chips";

export function GuideCard({ page, showDescription = true }: { page: ContentPage; showDescription?: boolean }) {
  return (
    <article
      data-door={page.door === "both" ? undefined : page.door}
      className="flex flex-col gap-3 rounded-2xl p-5"
      style={{ border: "2px solid var(--line)", background: "#fff" }}
    >
      <div className="flex flex-wrap gap-2">
        <DoorChip door={page.door} />
        <PillarChip pillar={page.pillar} />
      </div>
      <h3>
        <Link href={`/guides/${page.slug}`} className="no-underline hover:underline">
          {page.title}
        </Link>
      </h3>
      {showDescription && <p style={{ color: "var(--ink-2)", margin: 0 }}>{page.description}</p>}
      <p className="label" style={{ color: "var(--ink-2)", margin: "auto 0 0" }}>
        Updated {formatDate(page.updated)}
      </p>
    </article>
  );
}
