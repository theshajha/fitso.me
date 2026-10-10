"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Door } from "@fitso/core";
import Image from "next/image";
import { Button } from "@/components/brand/Button";
import { Container } from "@/components/brand/Container";
import { track } from "@/lib/posthog";
import { Processing, type ReadEvent } from "./Processing";
import { cropFace, prepareImage, type FaceBox, type ImageSource } from "./image-client";
import { MAX_SELFIE_BYTES } from "./questions";

type Check = {
  usable: boolean;
  ask: string | null;
  issues: string[];
  door: Door | null;
  full_length: boolean;
  face_box: FaceBox | null;
  heritage: { guess: string; confidence: number };
};

type Photo = {
  id: number;
  blob: Blob;
  /** The original file or frame, kept so a face close-up can be cut at full resolution. */
  source: ImageSource;
  /** Face close-up cut from the original when the face is small in the frame. Sent as an extra photo. */
  faceBlob?: Blob;
  previewUrl: string;
  status: "checking" | "ok" | "bad" | "error";
  check?: Check;
  message?: string;
};

const MAX_RAW_BYTES = 20 * 1024 * 1024;
/** Photos the person adds. The app may add up to two face close-ups on top. */
const MAX_PHOTOS = 4;
const PHOTO_ERRORS = ["file_too_big", "bad_image_type", "missing_image", "no_face"];

const GUIDANCE = ["Head to toe", "Daylight, facing a window", "No filter"];

export function QuickWinFlow({
  initialDoor,
  from,
  embedded = false,
}: {
  initialDoor: Door | null;
  from: string | null;
  embedded?: boolean;
}) {
  const router = useRouter();
  const [chosenDoor, setChosenDoor] = useState<Door | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"photos" | "processing">("photos");
  const [events, setEvents] = useState<ReadEvent[]>([]);
  const [readError, setReadError] = useState<string | null>(null);
  const nextId = useRef(1);
  const urlsRef = useRef<string[]>([]);

  const usable = photos.filter((p) => p.status === "ok" && p.check);
  const checking = photos.some((p) => p.status === "checking");
  const detectedDoor = usable.map((p) => p.check?.door).find((d): d is Door => !!d) ?? null;
  const door: Door | null = chosenDoor ?? initialDoor ?? detectedDoor;
  const accentDoor = door ?? undefined;
  // Ask only when at least one photo is usable and none of them told us the door.
  const needDoor = usable.length > 0 && !door;

  useEffect(() => {
    track("quick_win_started", { door: initialDoor, from });
    if (initialDoor) track("door_selected", { door: initialDoor, preselected: true });
  }, [initialDoor, from]);

  useEffect(() => {
    const urls = urlsRef;
    return () => urls.current.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  function chooseDoor(d: Door) {
    setChosenDoor(d);
    track("door_selected", { door: d, preselected: false });
  }

  const patchPhoto = useCallback((id: number, patch: Partial<Photo>) => {
    setPhotos((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  const checkPhoto = useCallback(
    async (id: number, blob: Blob, source?: ImageSource) => {
      patchPhoto(id, { status: "checking", message: undefined });
      try {
        const fd = new FormData();
        fd.set("selfie", blob, "photo.jpg");
        const res = await fetch("/api/photo-check", { method: "POST", body: fd });
        const json = (await res.json().catch(() => ({}))) as Partial<Check> & { error?: string; message?: string };
        if (!res.ok || json.error) {
          patchPhoto(id, { status: "error", message: json.message ?? "We could not check that photo. Try again." });
          return;
        }
        const check = json as Check;
        patchPhoto(id, { status: check.usable ? "ok" : "bad", check });
        // Self-correct a small face: cut a close-up from the original and send both.
        if (check.usable && check.face_box && source) {
          try {
            const faceBlob = await cropFace(source, check.face_box);
            if (faceBlob) patchPhoto(id, { faceBlob });
          } catch {
            /* the full photo still goes through */
          }
        }
      } catch {
        patchPhoto(id, { status: "error", message: "We lost the connection. Try again." });
      }
    },
    [patchPhoto],
  );

  const onPhoto = useCallback(
    async (source: ImageSource, via: "camera" | "upload") => {
      setPhotoError(null);
      try {
        if (source instanceof File && source.size > MAX_RAW_BYTES) {
          setPhotoError("That file is over 20 MB. Choose a smaller photo or take a new one.");
          return;
        }
        const prepared = await prepareImage(source);
        if (prepared.blob.size > MAX_SELFIE_BYTES) {
          URL.revokeObjectURL(prepared.previewUrl);
          setPhotoError("That photo is too large, even after shrinking. Try a different one.");
          return;
        }
        if (prepared.tooDark) {
          URL.revokeObjectURL(prepared.previewUrl);
          setPhotoError("That photo is too dark. Stand facing a window and take it again.");
          return;
        }
        const id = nextId.current++;
        urlsRef.current.push(prepared.previewUrl);
        // A video frame is gone once the camera stops; keep the prepared blob as its source instead.
        const keep: ImageSource = source instanceof HTMLVideoElement ? prepared.blob : source;
        setPhotos((ps) => [...ps, { id, blob: prepared.blob, source: keep, previewUrl: prepared.previewUrl, status: "checking" }]);
        track("selfie_captured", { source: via });
        void checkPhoto(id, prepared.blob, keep);
      } catch {
        setPhotoError("We could not open that file. Use a JPEG or PNG photo.");
      }
    },
    [checkPhoto],
  );

  const removePhoto = (id: number) => {
    setPhotos((ps) => ps.filter((p) => p.id !== id));
    setPhotoError(null);
  };
  function backToPhotos(message: string | null) {
    setPhase("photos");
    setEvents([]);
    setReadError(null);
    setPhotoError(message);
  }

  const openResult = useCallback((token: string) => router.push(`/r/${token}`), [router]);

  async function submit() {
    if (!door || usable.length === 0 || checking) return;
    setEvents([]);
    setReadError(null);
    setPhase("processing");
    track("quick_win_submitted", { door, photos: usable.length });
    const fd = new FormData();
    fd.set("door", door);
    fd.set("answers", "{}");
    // Full photos first, then face close-ups (at most two), within the server's limit of six.
    const blobs = [...usable.map((p) => p.blob), ...usable.flatMap((p) => (p.faceBlob ? [p.faceBlob] : [])).slice(0, 2)].slice(0, 6);
    blobs.forEach((b, i) => fd.append("photos", b, `photo-${i + 1}.jpg`));

    let finished = false;
    try {
      const res = await fetch("/api/quick-win", { method: "POST", body: fd });
      if (!res.ok || !res.body) {
        const json = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
        const message = json.message ?? "Something went wrong. Try again.";
        if (PHOTO_ERRORS.includes(json.error ?? "")) backToPhotos(message);
        else setReadError(message);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      const handle = (line: string) => {
        if (!line.trim()) return;
        let ev: ReadEvent;
        try {
          ev = JSON.parse(line) as ReadEvent;
        } catch {
          return;
        }
        if (ev.type === "stage") {
          if (ev.status === "done") track("read_stage", { stage: ev.stage });
          setEvents((es) => [...es, ev]);
        } else if (ev.type === "done") {
          finished = true;
          setEvents((es) => [...es, ev]);
        } else if (ev.type === "error") {
          finished = true;
          if (PHOTO_ERRORS.includes(ev.code ?? "")) backToPhotos(ev.message);
          else setReadError(ev.message || "Something went wrong. Try again.");
        }
      };
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        lines.forEach(handle);
      }
      buf += decoder.decode();
      handle(buf);
      if (!finished) setReadError("We lost the connection before your result was ready. Try again.");
    } catch {
      if (!finished) setReadError("We lost the connection. Check your signal and try again.");
    }
  }

  if (phase === "processing") {
    return (
      <Processing
        door={accentDoor}
        photoUrls={usable.map((p) => p.previewUrl)}
        events={events}
        error={readError}
        onRetry={() => backToPhotos(null)}
        onOpen={openResult}
        embedded={embedded}
      />
    );
  }

  const step = (
    <PhotoStep
      photos={photos}
      error={photoError}
      needDoor={needDoor}
      chosenDoor={chosenDoor}
      checking={checking}
      canSubmit={usable.length > 0 && !checking && !!door}
      onChooseDoor={chooseDoor}
      onImage={onPhoto}
      onRemove={removePhoto}
      onRecheck={(p) => void checkPhoto(p.id, p.blob, p.source)}
      onSubmit={() => void submit()}
    />
  );

  if (embedded) return step;

  return (
    <Container className="section">
      <div className="grid gap-10 md:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] md:gap-16">
        <div className="flex min-w-0 flex-col gap-6">
          <h1 style={{ margin: 0, fontSize: "clamp(2.25rem, 5.5vw, 4rem)" }}>Upload one full-length photo.</h1>
          <p style={{ margin: 0, fontSize: "1.1875rem" }}>In about a minute, you see your colours, what already works on you, and the one thing to change. Free.</p>
          <div className="mt-2 p-5 md:p-7" style={{ border: "3px solid var(--ink)", borderRadius: 28, boxShadow: "0 10px 0 var(--magenta)" }}>
            {step}
          </div>
        </div>
        <aside className="flex min-w-0 flex-col gap-4 md:pt-4" aria-label="A good photo">
          <h2 style={{ margin: 0, fontSize: "1.375rem" }}>A good photo looks like this</h2>
          <div className="flex gap-5 md:flex-col">
            <div className="overflow-hidden" style={{ flex: "none", width: "min(42%, 220px)", borderRadius: 20, border: "3px solid var(--ink)" }}>
              <Image src="/people/woman-1.jpg" alt="Example: a woman photographed head to toe against a plain wall in daylight" width={768} height={1376} sizes="220px" style={{ width: "100%", height: "auto", display: "block" }} />
            </div>
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {[...GUIDANCE, "Plain background"].map((g) => (
                <li key={g} className="flex items-center gap-3" style={{ fontWeight: 600 }}>
                  <span aria-hidden="true" style={{ color: "var(--good)", fontWeight: 800 }}>
                    ✓
                  </span>
                  {g}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </Container>
  );
}

function PhotoStep({
  photos,
  error,
  needDoor,
  chosenDoor,
  checking,
  canSubmit,
  onChooseDoor,
  onImage,
  onRemove,
  onRecheck,
  onSubmit,
}: {
  photos: Photo[];
  error: string | null;
  needDoor: boolean;
  chosenDoor: Door | null;
  checking: boolean;
  canSubmit: boolean;
  onChooseDoor: (d: Door) => void;
  onImage: (b: ImageSource, via: "camera" | "upload") => void | Promise<void>;
  onRemove: (id: number) => void;
  onRecheck: (p: Photo) => void;
  onSubmit: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const pickRef = useRef<HTMLInputElement>(null);
  const full = photos.length >= MAX_PHOTOS;
  const room = Math.max(0, MAX_PHOTOS - photos.length);

  function take(files: FileList | null, via: "camera" | "upload") {
    Array.from(files ?? [])
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, room)
      .forEach((f) => void onImage(f, via));
  }

  // With no photo yet, the main button opens the picker instead of sitting disabled.
  const empty = photos.length === 0;
  const blocked = !empty && !canSubmit;
  const hint = checking
    ? "Checking your photo"
    : needDoor && !chosenDoor
      ? "Choose who the styles are for"
      : !empty && !canSubmit
        ? "Add a photo we can use"
        : null;

  const pickInput = (via: "upload") => (
    <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(e) => (take(e.target.files, via), (e.target.value = ""))} />
  );

  return (
    <div className="flex flex-col gap-4">
      {photos.length > 0 && (
        <ul className="m-0 flex list-none flex-wrap gap-3 p-0">
          {photos.map((p, i) => {
            const bad = p.status === "bad" || p.status === "error";
            return (
              <li key={p.id} className="flex min-w-0 items-center gap-3 py-2 pr-4 pl-2" style={{ border: `2px solid ${bad ? "var(--bad)" : "var(--line)"}`, borderRadius: 16, flex: "1 1 260px", background: "var(--paper)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.previewUrl} alt={`Your photo ${i + 1}`} style={{ width: 48, height: 64, objectFit: "cover", borderRadius: 10, flex: "none" }} />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5" style={{ fontSize: "0.9375rem" }}>
                  {p.status === "checking" && (
                    <p className="label" style={{ margin: 0 }}>
                      <span className="checking-dot" aria-hidden="true" /> Checking your photo
                    </p>
                  )}
                  {p.status === "ok" && (
                    <p className="label" style={{ margin: 0, color: "var(--good)" }}>
                      ✓ Good photo
                    </p>
                  )}
                  {p.status === "ok" && p.check?.ask && <p className="muted" style={{ margin: 0 }}>{p.check.ask}</p>}
                  {p.status === "bad" && (
                    <p role="alert" style={{ margin: 0, color: "var(--bad)" }}>
                      {p.check?.ask ?? "We can't use this photo. Try another."}
                    </p>
                  )}
                  {p.status === "error" && (
                    <p role="alert" style={{ margin: 0, color: "var(--bad)" }}>
                      {p.message}
                    </p>
                  )}
                </div>
                <div className="flex flex-none gap-3">
                  {p.status === "error" && (
                    <button type="button" onClick={() => onRecheck(p)} style={linkBtn}>
                      Check again
                    </button>
                  )}
                  <button type="button" onClick={() => onRemove(p.id)} style={linkBtn}>
                    Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* One object: the drop zone holds the main button. */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!full) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!full) take(e.dataTransfer.files, "upload");
        }}
        className={`drop-zone flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-6 md:p-5 ${empty ? "is-empty" : "p-4"}`}
        style={{
          border: `2px dashed ${dragging ? "var(--magenta)" : "color-mix(in srgb, var(--ink) 35%, transparent)"}`,
          background: dragging ? "color-mix(in srgb, var(--magenta) 8%, var(--paper))" : "color-mix(in srgb, var(--line) 35%, var(--paper))",
          borderRadius: 20,
          transition: "background 150ms, border-color 150ms",
        }}
      >
        {!full ? (
          <div className={`min-w-0 items-center gap-4 ${empty ? "hidden md:flex" : "flex"}`}>
            <span aria-hidden="true" className="hidden flex-none items-center justify-center md:inline-flex" style={{ width: 48, height: 48, borderRadius: 14, background: "var(--ink)", color: "var(--paper)" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 16V4M6 10l6-6 6 6M4 20h16" />
              </svg>
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="hidden md:inline" style={{ fontWeight: 700, fontSize: "1.0625rem", lineHeight: 1.3 }}>
                {empty ? "Drop a full-length photo" : "Add another photo (optional)"}
              </span>
              <span className="muted" style={{ fontSize: "0.9375rem" }}>
                <span className="hidden md:inline">or </span>
                <label style={{ textDecoration: "underline", cursor: "pointer", color: "var(--ink)", fontWeight: 600 }}>
                  <span className="hidden md:inline">choose a file</span>
                  <span className="md:hidden">Add another photo (optional)</span>
                  {pickInput("upload")}
                </label>
              </span>
            </div>
          </div>
        ) : (
          <span style={{ fontWeight: 700 }}>Four photos added</span>
        )}
        <input ref={pickRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => (take(e.target.files, "upload"), (e.target.value = ""))} />
        <Button size="lg" disabled={blocked} onClick={() => (empty ? pickRef.current?.click() : onSubmit())} className="w-full flex-none md:w-auto">
          Generate my personal style
        </Button>
      </div>

      {needDoor && (
        <div role="group" aria-label="Show me styles for" className="flex flex-wrap items-center gap-3">
          <span style={{ fontWeight: 700 }}>Show me styles for</span>
          {(["women", "men"] as Door[]).map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={chosenDoor === d}
              onClick={() => onChooseDoor(d)}
              style={{
                padding: "8px 18px",
                borderRadius: 999,
                border: "2px solid var(--ink)",
                background: chosenDoor === d ? "var(--ink)" : "var(--paper)",
                color: chosenDoor === d ? "var(--paper)" : "var(--ink)",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {d === "women" ? "Women" : "Men"}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p role="alert" style={{ color: "var(--bad)", margin: 0, fontWeight: 600 }}>
          {error}
        </p>
      )}

      <ul className="m-0 flex list-none flex-wrap items-center gap-x-5 gap-y-1 p-0" style={{ fontSize: "0.9375rem", fontWeight: 600 }}>
        {hint ? (
          <li className="muted">{hint}</li>
        ) : (
          <>
            {GUIDANCE.map((g) => (
              <li key={g} className="flex items-center gap-2">
                <span aria-hidden="true" style={{ color: "var(--good)" }}>
                  ✓
                </span>
                {g}
              </li>
            ))}
            <li className="muted" style={{ fontWeight: 500 }}>
              Free · about a minute
            </li>
          </>
        )}
      </ul>
    </div>
  );
}

const linkBtn = { background: "none", border: 0, padding: 0, cursor: "pointer", textDecoration: "underline", fontWeight: 600, color: "var(--ink)" } as const;
