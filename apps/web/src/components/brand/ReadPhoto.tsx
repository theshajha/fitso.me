import Image from "next/image";
import type { Callout, Person } from "./reads";

function Chip({ c }: { c: Callout }) {
  const works = c.kind === "works";
  return (
    <span
      className="inline-flex items-center gap-2 whitespace-nowrap"
      style={{
        background: works ? "var(--good)" : "var(--paper)",
        color: works ? "#fff" : "var(--ink)",
        border: `2px solid ${works ? "var(--good)" : "var(--magenta)"}`,
        borderRadius: 999,
        padding: "6px 14px 6px 10px",
        fontSize: "0.9375rem",
        fontWeight: 600,
        boxShadow: "0 3px 0 var(--ink)",
        lineHeight: 1.2,
      }}
    >
      <span aria-hidden="true" style={{ fontWeight: 800, color: works ? "#fff" : "var(--magenta)" }}>
        {works ? "✓" : "→"}
      </span>
      <span className="sr-only">{works ? "Works: " : "Change: "}</span>
      {c.text}
    </span>
  );
}

/**
 * A full-length person with the stylist's notes pinned to the photo.
 * Pins sit on the photo from md up; on small screens the chips stack below.
 */
export function ReadPhoto({
  person,
  callouts,
  priority = false,
}: {
  person: Person;
  callouts: Callout[];
  priority?: boolean;
}) {
  return (
    <figure className="m-0 flex flex-col gap-4">
      <div className="relative" style={{ borderRadius: 28, border: "3px solid var(--ink)", boxShadow: "0 10px 0 var(--ink)", background: "var(--ink)" }}>
        <div className="relative overflow-hidden" style={{ borderRadius: 25 }}>
          <Image
            src={person.src}
            alt={person.alt}
            width={person.width}
            height={person.height}
            priority={priority}
            sizes="(min-width: 768px) 380px, 100vw"
            style={{ display: "block", width: "100%", height: "auto" }}
          />
        </div>
        <ul className="m-0 hidden list-none p-0 md:block" aria-hidden="true">
          {callouts.map((c) => (
            <li
              key={c.text}
              className="absolute flex items-center gap-2"
              style={{
                left: `${c.x}%`,
                top: `${c.y}%`,
                transform: c.side === "left" ? "translate(-100%, -50%)" : "translateY(-50%)",
                flexDirection: c.side === "left" ? "row-reverse" : "row",
              }}
            >
              <span
                style={{
                  flex: "none",
                  width: 14,
                  height: 14,
                  borderRadius: 999,
                  background: c.kind === "works" ? "var(--good)" : "var(--magenta)",
                  border: "3px solid var(--paper)",
                  boxShadow: "0 0 0 2px var(--ink)",
                }}
              />
              <Chip c={c} />
            </li>
          ))}
        </ul>
      </div>
      <figcaption className="flex flex-wrap gap-2 md:sr-only">
        {callouts.map((c) => (
          <Chip key={c.text} c={c} />
        ))}
      </figcaption>
    </figure>
  );
}
