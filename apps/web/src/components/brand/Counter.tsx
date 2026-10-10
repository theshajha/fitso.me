"use client";

import { useEffect, useState } from "react";

type CounterData = {
  founding_usd_cents: number;
  cap_usd_cents: number;
  founding_active: boolean;
};

const POLL_MS = 30_000;

/** "First wave: 61% claimed" with a thin progress bar. The number is real founding revenue against the cap, shown as a share. Renders nothing at cap. */
export function Counter({ className = "" }: { className?: string }) {
  const [data, setData] = useState<CounterData | null>(null);

  useEffect(() => {
    let stop = false;
    async function load() {
      try {
        const res = await fetch("/api/counter", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as CounterData;
        if (!stop) setData(json);
      } catch {
        // keep the last value
      }
    }
    load();
    const id = setInterval(load, POLL_MS);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, []);

  if (!data || !data.founding_active || data.founding_usd_cents >= data.cap_usd_cents) return null;

  const raised = data.founding_usd_cents;
  const cap = data.cap_usd_cents;
  const pct = Math.min(100, Math.max(0, (data.founding_usd_cents / data.cap_usd_cents) * 100));

  return (
    <div className={className}>
      <p className="label" style={{ margin: 0 }}>
        First wave: {Math.floor(pct)}% claimed
      </p>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={cap}
        aria-valuenow={raised}
        aria-label="First wave claimed"
        style={{ height: 4, borderRadius: 2, background: "var(--line)", marginTop: 8, overflow: "hidden" }}
      >
        <div style={{ width: `${pct}%`, height: "100%", background: "var(--accent)" }} />
      </div>
    </div>
  );
}
