"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/brand/Button";
import { track } from "@/lib/posthog";
import type { Door } from "@fitso/core";

export function ShareBlock({
  token,
  door,
  title,
}: {
  token: string;
  door: Door;
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
    <div data-door={door}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Button door={door} onClick={() => void copy("copy")}>
          Copy link
        </Button>
        <a
          href={`/r/${token}/card.png`}
          download="fitso-result.png"
          onClick={() => {
            track("card_downloaded");
            markShared();
          }}
          className="inline-flex items-center justify-center rounded-full px-6 py-3 font-semibold no-underline"
          style={{ border: "2px solid var(--ink)", color: "var(--ink)" }}
        >
          Download card
        </a>
        <Button door={door} variant="secondary" onClick={() => void share()}>
          Share
        </Button>
      </div>
      {note && (
        <p role="status" className="label" style={{ marginTop: 12 }}>
          {note}
        </p>
      )}
    </div>
  );
}
