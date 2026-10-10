"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { Currency, Product } from "@fitso/core";
import { Button } from "@/components/brand";
import { track } from "@/lib/posthog";
import { FOUNDING, LIST } from "@/lib/pricing";

type CounterData = { founding_usd_cents: number; cap_usd_cents: number; founding_active: boolean };

const CURRENCY: Currency = "USD";
const money = (units: number) => `$${units}`;

function BuyForm({ product, tier }: { product: Product; tier: string }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    track("checkout_started", { product, tier, currency: CURRENCY });
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, product, currency: CURRENCY }),
      });
      const json = (await res.json().catch(() => ({}))) as { url?: string };
      if (!res.ok || !json.url) throw new Error("checkout failed");
      window.location.assign(json.url);
    } catch {
      setError("Checkout did not start. Check your email and try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 10, marginTop: "auto" }}>
      <label className="label" htmlFor={`email-${product}`}>
        Email for your receipt
      </label>
      <input
        id={`email-${product}`}
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        style={{ border: "2px solid var(--line)", borderRadius: 12, padding: "12px 14px", font: "inherit", background: "#fff" }}
      />
      <Button type="submit" disabled={busy}>
        {busy ? "Opening checkout" : "Get my Style Report"}
      </Button>
      {error ? (
        <p role="alert" style={{ margin: 0, color: "var(--bad)" }}>
          {error}
        </p>
      ) : null}
    </form>
  );
}

const card: React.CSSProperties = {
  border: "2px solid var(--ink)",
  borderRadius: 24,
  padding: 24,
  background: "var(--paper)",
  display: "flex",
  flexDirection: "column",
  gap: 14,
};

export function PricingTiers() {
  const [counter, setCounter] = useState<CounterData | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/counter")
      .then((r) => (r.ok ? (r.json() as Promise<CounterData>) : null))
      .then((d) => {
        if (!alive) return;
        setCounter(d);
        track("pricing_viewed", { tier: d && !d.founding_active ? "list" : "founding" });
      })
      .catch(() => {
        if (alive) track("pricing_viewed", { tier: "founding" });
      });
    return () => {
      alive = false;
    };
  }, []);

  const founding = counter ? counter.founding_active : true;
  const tier = founding ? "founding" : "list";
  const priceOf = (p: Product) => money(founding ? FOUNDING[p].USD : LIST[p].USD);
  const listOf = (p: Product) => money(LIST[p].USD);

  const price: React.CSSProperties = { margin: 0, fontSize: "2.5rem", fontFamily: "var(--font-display)", fontWeight: 900 };

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <article style={card}>
        <h3 style={{ margin: 0 }}>Your personal style</h3>
        <p style={price}>Free</p>
        <p style={{ margin: 0 }}>
          Your palette, three things that already work on you, and the one thing to change. From one photo, in about a minute.
        </p>
        <Button href="/start" variant="secondary" className="mt-auto">
          Generate my personal style
        </Button>
      </article>

      <article style={{ ...card, boxShadow: "0 8px 0 var(--ink)" }}>
        <h3 style={{ margin: 0 }}>Style Report</h3>
        <p style={price}>
          {priceOf("report")}
          {founding ? (
            <span style={{ fontSize: "1.25rem", marginLeft: 10, textDecoration: "line-through", color: "var(--ink-2)" }}>
              {listOf("report")}
            </span>
          ) : null}
        </p>
        <p className="label" style={{ margin: 0 }}>One time</p>
        <p style={{ margin: 0 }}>
          Three parts: about you, about your style, and what works and what does not, with the reason for each. Opens as soon as you pay.
        </p>
        <BuyForm product="report" tier={tier} />
      </article>
    </div>
  );
}
