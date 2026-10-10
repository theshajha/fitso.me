import type { ContentPage } from "../load";

export const PILLAR_LABEL: Record<string, string> = {
  A: "Occasions",
  B: "Colour",
  D: "Capsule",
};

const chip =
  "label inline-block rounded-full px-3 py-1 border-2 whitespace-nowrap";

export function DoorChip({ door }: { door: ContentPage["door"] }) {
  if (door === "both") {
    return (
      <span className={chip} style={{ borderColor: "var(--ink)", color: "var(--ink)" }}>
        Men and women
      </span>
    );
  }
  const bg = door === "men" ? "var(--cobalt)" : "var(--magenta)";
  return (
    <span className={chip} style={{ background: bg, borderColor: bg, color: "#fff" }}>
      {door === "men" ? "Men" : "Women"}
    </span>
  );
}

export function PillarChip({ pillar }: { pillar: string }) {
  return (
    <span className={chip} style={{ borderColor: "var(--line)", color: "var(--ink-2)" }}>
      {PILLAR_LABEL[pillar] ?? pillar}
    </span>
  );
}

export function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}
