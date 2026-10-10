"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Currency, Door, PriceTier, Product } from "@fitso/core";
import { Button } from "@/components/brand/Button";
import { Stamp } from "@/components/brand/Stamp";
import { track } from "@/lib/posthog";

export type PriceView = {
  tier: PriceTier;
  amountLabel: string;
  listLabel: string | null; // set when the shown price is lower than list
  expiresAt: string | null;
  endedLine: string | null;
};

function Countdown({ expiresAt }: { expiresAt: string }) {
  const router = useRouter();
  const target = new Date(expiresAt).getTime();
  // null until mounted, so server and client render the same markup.
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setLeft(Math.max(0, target - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  useEffect(() => {
    if (left === 0) router.refresh(); // the server will show the list price and the ended line
  }, [left, router]);

  if (left === null || left <= 0) return null;
  const s = Math.floor(left / 1000);
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return (
    <p className="label" style={{ margin: 0, fontSize: "0.9rem" }} aria-label="Time left at this price">
      Ends in {hh}:{mm}:{ss}
    </p>
  );
}

export function PriceBlock({
  token,
  door,
  currency,
  price,
  otherCurrencyHref,
}: {
  token: string;
  door: Door;
  currency: Currency;
  price: PriceView;
  otherCurrencyHref: string;
}) {
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState<Product | null>(null);

  async function checkout(product: Product) {
    setBusy(product);
    setToast(null);
    track("checkout_started", { product, tier: price.tier, currency });
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, product, currency }),
      });
      if (res.status === 404) {
        setToast("Checkout coming");
        return;
      }
      const json = (await res.json().catch(() => ({}))) as { url?: string; message?: string };
      if (res.ok && json.url) {
        window.location.href = json.url;
        return;
      }
      setToast(json.message ?? "Checkout hit a problem. Try again in a moment.");
    } catch {
      setToast("We lost the connection. Try again.");
    } finally {
      setBusy(null);
    }
  }

  const label =
    price.tier === "founding" ? "FOUNDING" : price.tier === "finish_today" ? "FINISH TODAY" : null;

  return (
    <div
      data-door={door}
      style={{ border: "2px solid var(--ink)", borderRadius: 24, padding: 28, background: "var(--paper)" }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <h2 style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", margin: 0 }}>The Style Report</h2>
        <a
          href={otherCurrencyHref}
          className="label"
          style={{ textDecoration: "underline" }}
          aria-label={`Show prices in ${currency === "INR" ? "USD" : "INR"}`}
        >
          {currency === "INR" ? "Show in USD" : "Show in INR"}
        </a>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 20, flexWrap: "wrap" }}>
        {label && <Stamp kind="founding">{label}</Stamp>}
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(2rem, 5vw, 3rem)" }}>
          {price.amountLabel}
        </span>
        {price.listLabel && (
          <span style={{ color: "var(--ink-2)", textDecoration: "line-through", fontSize: 20 }}>{price.listLabel}</span>
        )}
      </div>

      {price.tier === "finish_today" && price.expiresAt && (
        <div style={{ marginTop: 12 }}>
          <Countdown expiresAt={price.expiresAt} />
        </div>
      )}
      {price.endedLine && <p style={{ color: "var(--ink-2)", marginTop: 12, marginBottom: 0 }}>{price.endedLine}</p>}

      <div style={{ marginTop: 20 }}>
        <Button door={door} size="lg" disabled={busy !== null} onClick={() => void checkout("report")}>
          Get the Style Report
        </Button>
      </div>

      <hr style={{ border: 0, borderTop: "1px solid var(--line)", margin: "28px 0 20px" }} />
      <p style={{ margin: "0 0 12px" }}>Pro opens in January 2027. Founding members lock their price.</p>
      <Button door={door} variant="secondary" disabled={busy !== null} onClick={() => void checkout("pro")}>
        Lock my Pro price
      </Button>

      {toast && (
        <p role="status" className="label" style={{ marginTop: 16, fontSize: "0.9rem" }}>
          {toast}
        </p>
      )}
    </div>
  );
}
