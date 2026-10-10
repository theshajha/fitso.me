"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { Currency, Product } from "@fitso/core";
import { Button, Counter, Stamp } from "@/components/brand";
import { track } from "@/lib/posthog";
import { FOUNDING, LIST, formatMoney } from "@/lib/pricing";

type CounterData = { founding_usd_cents: number; cap_usd_cents: number; founding_active: boolean };

const money = (units: number, c: Currency) => formatMoney(units * 100, c);

function guessCurrency(): Currency {
  try {
    return /-IN\b/i.test(navigator.language) ? "INR" : "USD";
  } catch {
    return "USD";
  }
}

function BuyForm({ product, currency, tier }: { product: Product; currency: Currency; tier: string }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    track("checkout_started", { product, tier, currency });
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, product, currency }),
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
        Your email
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
        {busy ? "Opening checkout" : product === "report" ? "Get the Style Report" : "Lock the Pro price"}
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
  borderRadius: 20,
  padding: 24,
  background: "#fff",
  display: "flex",
  flexDirection: "column",
  gap: 14,
};

export function PricingTiers() {
  const [currency, setCurrency] = useState<Currency>("USD");
  const [counter, setCounter] = useState<CounterData | null>(null);

  useEffect(() => {
    let alive = true;
    // Deferred so the first paint matches the static HTML (USD), then switches for Indian locales.
    queueMicrotask(() => {
      if (alive) setCurrency(guessCurrency());
    });
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
  const priceOf = (p: Product) => money(founding ? FOUNDING[p][currency] : LIST[p][currency], currency);
  const listOf = (p: Product) => money(LIST[p][currency], currency);

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <div role="group" aria-label="Currency" style={{ display: "inline-flex", border: "2px solid var(--ink)", borderRadius: 999, overflow: "hidden" }}>
          {(["INR", "USD"] as const).map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={currency === c}
              onClick={() => setCurrency(c)}
              className="label"
              style={{
                padding: "8px 18px",
                border: 0,
                cursor: "pointer",
                background: currency === c ? "var(--ink)" : "transparent",
                color: currency === c ? "var(--paper)" : "var(--ink)",
              }}
            >
              {c}
            </button>
          ))}
        </div>
        {founding ? (
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <Stamp kind="founding" />
            <span>
              Founding price until fitso has earned its first USD 1,000.
            </span>
            <Counter />
          </div>
        ) : (
          <span>The founding price has ended. These are the list prices.</span>
        )}
      </div>

      <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        <article style={card}>
          <h3 style={{ margin: 0 }}>Quick win</h3>
          <p className="label" style={{ margin: 0 }}>Free</p>
          <p style={{ margin: 0, fontSize: "2rem", fontWeight: 700 }}>{money(0, currency)}</p>
          <p style={{ margin: 0 }}>
            Your colour season, your style archetype, three things working for you, one thing to stop buying, and one
            free verdict on an item.
          </p>
          <Button href="/app/quick-win" variant="secondary" className="mt-auto">
            Run the free quick win
          </Button>
        </article>

        <article style={card}>
          <h3 style={{ margin: 0 }}>Style Report</h3>
          <p className="label" style={{ margin: 0 }}>One time</p>
          <p style={{ margin: 0, fontSize: "2rem", fontWeight: 700 }}>
            {priceOf("report")}
            {founding ? (
              <span style={{ fontSize: "1rem", fontWeight: 400, marginLeft: 10, textDecoration: "line-through", color: "var(--ink-2)" }}>
                {listOf("report")}
              </span>
            ) : null}
          </p>
          <p style={{ margin: 0 }}>
            Your full report: palette, fit, and what your wardrobe needs. It ships in month 2 (by 2026-12-14). We email you the moment it is ready.
          </p>
          <BuyForm product="report" currency={currency} tier={tier} />
        </article>

        <article style={card}>
          <h3 style={{ margin: 0 }}>Pro</h3>
          <p className="label" style={{ margin: 0 }}>Per year</p>
          <p style={{ margin: 0, fontSize: "2rem", fontWeight: 700 }}>
            {priceOf("pro")}
            {founding ? (
              <span style={{ fontSize: "1rem", fontWeight: 400, marginLeft: 10, textDecoration: "line-through", color: "var(--ink-2)" }}>
                {listOf("pro")}
              </span>
            ) : null}
          </p>
          <p style={{ margin: 0 }}>
            Everything in the Report, plus ongoing verdicts and wardrobe planning. Pro opens in month 3. A founding member keeps the founding price on every renewal.
          </p>
          <BuyForm product="pro" currency={currency} tier={tier} />
        </article>
      </div>
    </div>
  );
}
