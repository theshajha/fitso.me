"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/brand/Button";
import { Container } from "@/components/brand/Container";

/** Private-testing door. Enter the access code once; the cookie lasts 30 days. */
export default function AccessPage() {
  return (
    <Suspense>
      <AccessForm />
    </Suspense>
  );
}

function AccessForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/start";
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/access", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code }) });
      const json = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        setError(json.message ?? "That code is not right.");
        return;
      }
      router.push(next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Container className="section">
      <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>Private test</h1>
      <p style={{ color: "var(--ink-2)", fontSize: "1.125rem" }}>fitso is in private testing. Enter the access code to generate your personal style.</p>
      <form onSubmit={submit} noValidate style={{ marginTop: 24, maxWidth: 420 }}>
        <label htmlFor="code" className="label" style={{ display: "block", marginBottom: 8 }}>
          Access code
        </label>
        <input
          id="code"
          type="password"
          autoComplete="one-time-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          style={{ width: "100%", padding: "16px 18px", fontSize: 18, border: "2px solid var(--ink)", borderRadius: 14, background: "var(--paper)" }}
        />
        {error && (
          <p role="alert" style={{ color: "var(--bad)", marginTop: 8 }}>
            {error}
          </p>
        )}
        <div style={{ marginTop: 20 }}>
          <Button size="lg" type="submit" disabled={busy || code.length === 0}>
            Continue
          </Button>
        </div>
      </form>
    </Container>
  );
}
