"use client";

import { useEffect, useState } from "react";
import type { Door, Verdict } from "@fitso/core";
import { Button } from "@/components/brand/Button";
import { DrapeFan } from "@/components/brand/DrapeFan";
import { track } from "@/lib/posthog";
import { prepareImage } from "@/features/profile/image-client";
import { VerdictView } from "./VerdictView";

export function VerdictFlow({ token, door }: { token: string; door: Door }) {
  const [link, setLink] = useState("");
  const [shot, setShot] = useState<{ blob: Blob; url: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);

  useEffect(() => {
    track("verdict_started");
  }, []);

  async function onFile(file: File) {
    setError(null);
    try {
      const p = await prepareImage(file);
      setShot((old) => {
        if (old) URL.revokeObjectURL(old.url);
        return { blob: p.blob, url: p.previewUrl };
      });
    } catch {
      setError("We could not open that image. Try a JPEG or PNG screenshot.");
    }
  }

  async function submit() {
    setError(null);
    if (!shot && !link.trim()) {
      setError("Add a screenshot or paste a link.");
      return;
    }
    setBusy(true);
    const fd = new FormData();
    fd.set("token", token);
    if (shot) fd.set("screenshot", shot.blob, "item.jpg");
    else fd.set("link", link.trim());
    try {
      const res = await fetch("/api/verdict", { method: "POST", body: fd });
      const json = (await res.json().catch(() => ({}))) as { verdict?: Verdict; message?: string };
      if (res.ok && json.verdict) {
        setVerdict(json.verdict);
        track("verdict_viewed", { verdict: json.verdict.verdict });
      } else {
        setError(json.message ?? "Something went wrong. Try again.");
      }
    } catch {
      setError("We lost the connection. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (busy) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: "24px 0" }}>
        <DrapeFan door={door} state="thinking" size={140} />
        <p role="status" className="label" style={{ margin: 0 }}>
          Holding it up against your colours
        </p>
      </div>
    );
  }

  if (verdict) {
    return (
      <div>
        <VerdictView verdict={verdict} />
        <p style={{ marginTop: 32, color: "var(--ink-2)" }}>You used your free verdict.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <label
          style={{
            display: "inline-flex",
            padding: "14px 28px",
            borderRadius: 999,
            border: "2px solid var(--ink)",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {shot ? "Change screenshot" : "Upload a screenshot"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ position: "absolute", width: 1, height: 1, opacity: 0 }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void onFile(f);
            }}
          />
        </label>
        {shot && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shot.url} alt="Your screenshot" style={{ height: 96, borderRadius: 12, border: "2px solid var(--ink)" }} />
        )}
      </div>
      {!shot && (
        <div style={{ marginTop: 20 }}>
          <label htmlFor="item-link" className="label" style={{ display: "block", marginBottom: 8 }}>
            Or paste a link
          </label>
          <input
            id="item-link"
            type="url"
            inputMode="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://"
            style={{
              width: "100%",
              padding: "14px 16px",
              fontSize: 17,
              border: "2px solid var(--ink)",
              borderRadius: 14,
              background: "var(--paper)",
            }}
          />
        </div>
      )}
      {error && (
        <p role="alert" style={{ color: "var(--bad)", marginTop: 12 }}>
          {error}
        </p>
      )}
      <div style={{ marginTop: 24 }}>
        <Button door={door} size="lg" onClick={() => void submit()}>
          Get my verdict
        </Button>
      </div>
    </div>
  );
}
