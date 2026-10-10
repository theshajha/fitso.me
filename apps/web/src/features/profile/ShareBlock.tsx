"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/brand/Button";
import { track } from "@/lib/posthog";
import type { Door } from "@fitso/core";

export function ShareBlock({
  token,
  title,
}: {
  token: string;
  door?: Door;
  title: string;
}) {
  const [note, setNote] = useState<string | null>(null);
  const posted = useRef(false);

  const url = () => `${window.location.origin}/r/${token}`;

  function markShared() {
    if (posted.current) return;
    posted.current = true;
    void fetch("/api/share", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
      keepalive: true,
    }).catch(() => undefined);
  }

  async function copy(channel: "copy" | "share_fallback") {
    try {
      await navigator.clipboard.writeText(url());
      setNote("Link copied");
    } catch {
      setNote(url());
    }
    track("card_shared", { channel });
    markShared();
  }

  async function share() {
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    if (!nav.share) return copy("share_fallback");
    try {
      let files: File[] | undefined;
      try {
        const res = await fetch(`/r/${token}/story.png`);
        const blob = await res.blob();
        const f = new File([blob], "fitso-result.png", { type: "image/png" });
        if (nav.canShare?.({ files: [f] })) files = [f];
      } catch {
        files = undefined;
      }
      await nav.share({ title, text: title, url: url(), ...(files ? { files } : {}) });
      track("card_shared", { channel: files ? "native_image" : "native_link" });
      markShared();
    } catch (e) {
      if ((e as DOMException)?.name !== "AbortError") await copy("share_fallback");
    }
  }

  return (
    <div style={{ border: "2px solid var(--ink)", borderRadius: 24, padding: 22, background: "var(--paper)" }}>
      <h2 style={{ margin: 0, fontSize: "1.125rem" }}>Share your palette</h2>
      <p className="muted" style={{ margin: "4px 0 0" }}>Send it to a friend, or post the card.</p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginTop: 12 }}>
        <Button onClick={() => void share()}>Share</Button>
        <button type="button" onClick={() => void copy("copy")} style={{ background: "none", border: 0, padding: 0, fontWeight: 700, textDecoration: "underline", cursor: "pointer", color: "var(--ink)" }}>
          Copy link
        </button>
      </div>
      {note && (
        <p role="status" style={{ margin: "10px 0 0", fontWeight: 600, overflowWrap: "anywhere" }}>
          {note}
        </p>
      )}
    </div>
  );
}
