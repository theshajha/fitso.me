"use client";

import { useState } from "react";
import type { Currency, Door, PriceTier, Product } from "@fitso/core";
import { Button } from "@/components/brand/Button";
import { track } from "@/lib/posthog";

export type PriceView = {
  tier: PriceTier;
  amountLabel: string;
  listLabel: string | null; // set when the shown price is lower than list
  expiresAt: string | null;
  endedLine: string | null;
};

export function PriceBlock({
  token,
  currency,
  price,
  hasEmail,
}: {
  token: string;
  door?: Door;
  currency: Currency;
  price: PriceView;
  hasEmail: boolean;
}) {
  const [email, setEmail] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState<Product | null>(null);

  async function checkout(product: Product) {
    const needEmail = !hasEmail;
    if (needEmail && !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setToast("Add your email so we can send your receipt.");
      return;
    }
    setBusy(product);
    setToast(null);
    track("checkout_started", { product, tier: price.tier, currency });
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, product, currency, ...(needEmail ? { email: email.trim() } : {}) }),
      });
      if (res.status === 404) {
        setToast("Checkout is not open yet. Try again soon.");
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

  return (
    <div className="flex flex-col gap-6 p-7 md:flex-row md:items-center md:justify-between md:p-10" style={{ background: "var(--ink)", color: "var(--paper)", borderRadius: 32 }}>
      <div className="flex flex-col gap-2">
        <p className="display" style={{ margin: 0, fontSize: "clamp(2.25rem, 5vw, 3.25rem)", color: "var(--paper)" }}>
          {price.amountLabel.replace(/^US\$|^USD\s?/, "$")}{" "}
          {price.listLabel && <s style={{ fontSize: "0.5em", fontWeight: 700, opacity: 0.6 }}>{price.listLabel.replace(/^US\$|^USD\s?/, "$")}</s>}
        </p>
        <p style={{ margin: 0, opacity: 0.9, fontSize: "1.0625rem" }}>Pay once. It opens right away.</p>
      </div>

      <form
        className="flex w-full flex-col gap-3 md:w-auto md:min-w-[360px]"
        onSubmit={(e) => {
          e.preventDefault();
          void checkout("report");
        }}
      >
        {!hasEmail && (
          <>
            <label htmlFor="receipt-email" className="label" style={{ color: "var(--paper)" }}>
              Email for your receipt
            </label>
            <input
              id="receipt-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{ display: "block", width: "100%", border: "2px solid var(--paper)", borderRadius: 999, padding: "12px 18px", background: "transparent", color: "var(--paper)" }}
            />
          </>
        )}
        <Button size="lg" type="submit" disabled={busy !== null} style={{ background: "var(--paper)", color: "var(--ink)", border: "2px solid var(--paper)" }}>
          {busy ? "Opening checkout" : "Get my Style Report"}
        </Button>
        {toast && (
          <p role="status" style={{ margin: 0, fontSize: "0.9375rem", color: "var(--paper)" }}>
            {toast}
          </p>
        )}
      </form>
    </div>
  );
}
