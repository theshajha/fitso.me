"use client";

import { useState } from "react";
import type { Door } from "@fitso/core";
import { Button } from "@/components/brand/Button";

export function EmailSave({ token }: { token: string; door?: Door }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setState("busy");
    setError(null);
    try {
      const res = await fetch("/api/result-email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, email }),
      });
      if (res.ok) {
        setState("saved");
        return;
      }
      setError(res.status === 400 ? "That email does not look right." : "Could not save. Try again.");
    } catch {
      setError("We lost the connection. Try again.");
    }
    setState("idle");
  }

  return (
    <div style={{ border: "2px solid var(--ink)", borderRadius: 24, padding: 22, background: "var(--paper)" }}>
      <h2 style={{ margin: 0, fontSize: "1.125rem" }}>Email me this page</h2>
      <p className="muted" style={{ margin: "4px 0 0" }}>So you can find it later.</p>
      {state === "saved" ? (
        <p role="status" style={{ margin: "10px 0 0", fontWeight: 700, color: "var(--good)" }}>
          ✓ Sent. Check your inbox.
        </p>
      ) : (
        <form onSubmit={save} style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            aria-label="Email"
            style={{ flex: "1 1 220px", border: "2px solid var(--ink)", borderRadius: 999, padding: "10px 16px", background: "transparent", color: "var(--ink)" }}
          />
          <Button size="md" type="submit" disabled={state === "busy"}>
            {state === "busy" ? "Sending" : "Email me"}
          </Button>
        </form>
      )}
      {error && (
        <p role="status" style={{ margin: "8px 0 0", color: "var(--bad)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
