"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/brand";

type Item = { category: string; item: string };
type Checklist = { men: Item[]; women: Item[] };
type Door = "men" | "women";
type Owned = Record<Door, string[]>;

const STORAGE_KEY = "fitso.wardrobe-gap.v1";
const key = (i: Item) => `${i.category}|${i.item}`;

function readStored(): Owned {
  const empty: Owned = { men: [], women: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    const v = JSON.parse(raw) as Partial<Owned>;
    return {
      men: Array.isArray(v.men) ? v.men.filter((x) => typeof x === "string") : [],
      women: Array.isArray(v.women) ? v.women.filter((x) => typeof x === "string") : [],
    };
  } catch {
    return empty;
  }
}

function writeStored(v: Owned) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
  } catch {
    // Storage can be blocked. The checklist still works for this visit.
  }
}

function groupByCategory(items: Item[]): [string, Item[]][] {
  const m = new Map<string, Item[]>();
  for (const i of items) m.set(i.category, [...(m.get(i.category) ?? []), i]);
  return [...m.entries()];
}

export function WardrobeChecklist({
  checklist,
  cta,
}: {
  checklist: Checklist;
  cta: { label: string; href: string };
}) {
  const [owned, setOwned] = useState<Owned>({ men: [], women: [] });

  useEffect(() => {
    // Read once after mount so server and first client render match.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOwned(readStored());
  }, []);

  function toggle(door: Door, k: string) {
    setOwned((prev) => {
      const has = prev[door].includes(k);
      const next = { ...prev, [door]: has ? prev[door].filter((x) => x !== k) : [...prev[door], k] };
      writeStored(next);
      return next;
    });
  }

  const doors: { door: Door; label: string }[] = [
    { door: "men", label: "Men" },
    { door: "women", label: "Women" },
  ];

  return (
    <div className="grid gap-8" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
      {doors.map(({ door, label }) => {
        const items = checklist[door];
        const keys = new Set(items.map(key));
        const count = owned[door].filter((k) => keys.has(k)).length;
        const href = cta.href.replace(/door=(men|women)/, `door=${door}`);
        return (
          <section
            key={door}
            data-door={door}
            className="rounded-2xl p-5"
            style={{ border: "2px solid var(--line)", background: "#fff" }}
          >
            <h3>{label}</h3>
            <p className="label" aria-live="polite" style={{ color: "var(--accent)", margin: "0.5rem 0 1rem", fontSize: "0.9375rem" }}>
              You have {count} of {items.length}
            </p>
            {groupByCategory(items).map(([cat, list]) => (
              <fieldset key={cat} style={{ border: 0, padding: 0, margin: "0 0 1rem" }}>
                <legend className="label" style={{ color: "var(--ink-2)", marginBottom: 6 }}>
                  {cat}
                </legend>
                {list.map((i) => {
                  const k = key(i);
                  return (
                    <label key={k} className="flex items-start gap-3 py-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={owned[door].includes(k)}
                        onChange={() => toggle(door, k)}
                        style={{ width: 20, height: 20, marginTop: 3, accentColor: "var(--accent)" }}
                      />
                      <span>{i.item}</span>
                    </label>
                  );
                })}
              </fieldset>
            ))}
            <Button door={door} href={href} className="mt-2">
              {cta.label}
            </Button>
          </section>
        );
      })}
    </div>
  );
}
