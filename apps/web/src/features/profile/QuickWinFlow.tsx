"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Door } from "@fitso/core";
import { Button } from "@/components/brand/Button";
import { Container } from "@/components/brand/Container";
import { DrapeFan } from "@/components/brand/DrapeFan";
import { track } from "@/lib/posthog";
import { identifyByEmail } from "@/lib/posthog";
import { doorTheme } from "@/lib/tokens";
import { prepareImage, type ImageSource, type PreparedImage } from "./image-client";
import {
  BUDGET,
  CLIMATE,
  LIFE,
  MAX_SELFIE_BYTES,
  OCCASIONS,
  QUESTION_COPY,
  VIBE,
  headlineFor,
  type Option,
} from "./questions";
import { emailSchema } from "./schema";

type Step = "door" | "life" | "climate" | "occasions" | "budget_per_item" | "vibe" | "selfie" | "email";

type Answers = {
  life?: string;
  climate?: string;
  occasions: string[];
  budget_per_item?: string;
  vibe?: string;
};

const THINKING_LINES = [
  "Reading your undertone",
  "Checking what the light is doing",
  "Finding your three strengths",
  "Matching you to an archetype",
  "Picking colours that suit you",
];

const MAX_RAW_BYTES = 20 * 1024 * 1024;

const GUIDANCE = [
  "Daylight, facing a window",
  "No filter",
  "Plain background",
  "Hair back from your face",
  "Face centred in the frame",
];

export function QuickWinFlow({ initialDoor, from }: { initialDoor: Door | null; from: string | null }) {
  const router = useRouter();
  const [door, setDoor] = useState<Door | null>(initialDoor);
  const steps: Step[] = [
    ...(initialDoor ? [] : (["door"] as Step[])),
    "life",
    "climate",
    "occasions",
    "budget_per_item",
    "vibe",
    "selfie",
    "email",
  ];
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({ occasions: [] });
  const [selfie, setSelfie] = useState<PreparedImage | null>(null);
  const [selfieError, setSelfieError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const step = steps[Math.min(index, steps.length - 1)];
  const progress = ((index + 1) / steps.length) * 100;
  const accentDoor = door ?? undefined;

  useEffect(() => {
    track("quick_win_started", { door: initialDoor, from });
    if (initialDoor) track("door_selected", { door: initialDoor, preselected: true });
  }, [initialDoor, from]);

  useEffect(() => {
    track("quick_win_step", { step });
  }, [step]);

  const next = () => setIndex((i) => Math.min(i + 1, steps.length - 1));
  const back = () => {
    setSubmitError(null);
    setIndex((i) => Math.max(i - 1, 0));
  };
  const goTo = (s: Step) => setIndex(Math.max(0, steps.indexOf(s)));

  function chooseDoor(d: Door) {
    setDoor(d);
    track("door_selected", { door: d, preselected: false });
    next();
  }

  function pick(key: "life" | "climate" | "budget_per_item" | "vibe", value: string) {
    setAnswers((a) => ({ ...a, [key]: value }));
    setTimeout(next, 140);
  }

  function toggleOccasion(value: string) {
    setAnswers((a) => ({
      ...a,
      occasions: a.occasions.includes(value) ? a.occasions.filter((v) => v !== value) : [...a.occasions, value],
    }));
  }

  const onSelfie = useCallback(async (source: ImageSource, via: "camera" | "upload") => {
    setSelfieError(null);
    try {
      if (source instanceof File && source.size > MAX_RAW_BYTES) {
        setSelfieError("That file is over 20 MB. Pick a smaller photo or take a new one.");
        return;
      }
      const prepared = await prepareImage(source);
      if (prepared.blob.size > MAX_SELFIE_BYTES) {
        setSelfieError("That photo is still over 6 MB after shrinking. Try a different one.");
        return;
      }
      if (prepared.tooDark) {
        URL.revokeObjectURL(prepared.previewUrl);
        setSelfieError("That photo is too dark. Face a window or step into daylight and try again.");
        return;
      }
      setSelfie((old) => {
        if (old) URL.revokeObjectURL(old.previewUrl);
        return prepared;
      });
      track("selfie_captured", { source: via });
    } catch {
      setSelfieError("We could not open that image. Try a JPEG or PNG photo.");
    }
  }, []);

  async function submit() {
    setEmailError(null);
    setSubmitError(null);
    const parsedEmail = emailSchema.safeParse(email);
    if (!parsedEmail.success) {
      setEmailError("That email does not look right. Check it and try again.");
      return;
    }
    if (!door || !selfie || !answers.life || !answers.climate || !answers.budget_per_item || !answers.vibe) {
      setSubmitError("Something is missing. Go back and finish every step.");
      return;
    }
    setSubmitting(true);
    track("quick_win_submitted", { door });
    const fd = new FormData();
    fd.set("door", door);
    fd.set("answers", JSON.stringify(answers));
    fd.set("email", parsedEmail.data);
    fd.set("selfie", selfie.blob, "selfie.jpg");
    try {
      const res = await fetch("/api/quick-win", { method: "POST", body: fd });
      const json = (await res.json().catch(() => ({}))) as { token?: string; error?: string; message?: string };
      if (res.ok && json.token) {
        void identifyByEmail(parsedEmail.data);
        router.push(`/r/${json.token}`);
        return; // keep the waiting screen up during navigation
      }
      setSubmitting(false);
      const message = json.message ?? "Something went wrong. Try again.";
      if (json.error === "invalid_email") {
        setEmailError(message);
      } else if (["file_too_big", "bad_image_type", "missing_image", "no_face"].includes(json.error ?? "")) {
        setSelfie(null);
        setSelfieError(message);
        goTo("selfie");
      } else {
        setSubmitError(message);
      }
    } catch {
      setSubmitting(false);
      setSubmitError("We lost the connection. Check your signal and try again.");
    }
  }

  if (submitting) return <Waiting door={accentDoor} />;

  const headline = headlineFor(from);

  return (
    <div data-door={door ?? undefined}>
      <div style={{ height: 4, background: "var(--line)" }} aria-hidden="true">
        <div style={{ width: `${progress}%`, height: "100%", background: "var(--accent)", transition: "width 240ms ease" }} />
      </div>
      <Container className="section">
        <p className="label" style={{ margin: 0, color: "var(--ink-2)" }}>
          Step {index + 1} of {steps.length}
        </p>
        {index === 0 && (
          <h1 style={{ marginTop: 12, fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>{headline}</h1>
        )}

        <div style={{ marginTop: 24 }}>
          {step === "door" && <DoorStep onChoose={chooseDoor} />}
          {step === "life" && (
            <Question title={QUESTION_COPY.life} options={LIFE} value={answers.life} onPick={(v) => pick("life", v)} />
          )}
          {step === "climate" && (
            <Question title={QUESTION_COPY.climate} options={CLIMATE} value={answers.climate} onPick={(v) => pick("climate", v)} />
          )}
          {step === "occasions" && (
            <div>
              <h2 style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)" }}>{QUESTION_COPY.occasions}</h2>
              <OptionGrid>
                {OCCASIONS.map((o) => (
                  <OptionButton
                    key={o.value}
                    option={o}
                    selected={answers.occasions.includes(o.value)}
                    onClick={() => toggleOccasion(o.value)}
                    multi
                  />
                ))}
              </OptionGrid>
              <div style={{ marginTop: 24 }}>
                <Button door={accentDoor} disabled={answers.occasions.length === 0} onClick={next}>
                  Continue
                </Button>
              </div>
            </div>
          )}
          {step === "budget_per_item" && (
            <Question
              title={QUESTION_COPY.budget_per_item}
              options={BUDGET}
              value={answers.budget_per_item}
              onPick={(v) => pick("budget_per_item", v)}
            />
          )}
          {step === "vibe" && (
            <Question
              title={QUESTION_COPY.vibe}
              options={VIBE[door ?? "women"]}
              value={answers.vibe}
              onPick={(v) => pick("vibe", v)}
            />
          )}
          {step === "selfie" && (
            <SelfieStep
              door={accentDoor}
              selfie={selfie}
              error={selfieError}
              onImage={onSelfie}
              onClear={() => {
                setSelfie(null);
                setSelfieError(null);
              }}
              onContinue={next}
            />
          )}
          {step === "email" && (
            <div>
              <h2 style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)" }}>Where should we keep your result?</h2>
              <p style={{ color: "var(--ink-2)" }}>
                One email. We save your result to it. Your photo is deleted as soon as we have read it.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void submit();
                }}
                noValidate
                style={{ marginTop: 16 }}
              >
                <label htmlFor="email" className="label" style={{ display: "block", marginBottom: 8 }}>
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  aria-invalid={emailError ? true : undefined}
                  aria-describedby={emailError ? "email-error" : undefined}
                  style={{
                    width: "100%",
                    padding: "16px 18px",
                    fontSize: 18,
                    border: "2px solid var(--ink)",
                    borderRadius: 14,
                    background: "var(--paper)",
                  }}
                />
                {emailError && (
                  <p id="email-error" role="alert" style={{ color: "var(--bad)", marginTop: 8 }}>
                    {emailError}
                  </p>
                )}
                {submitError && (
                  <p role="alert" style={{ color: "var(--bad)", marginTop: 8 }}>
                    {submitError}
                  </p>
                )}
                <div style={{ marginTop: 20 }}>
                  <Button door={accentDoor} size="lg" type="submit">
                    Show my result
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>

        {index > 0 && step !== "door" && (
          <div style={{ marginTop: 32 }}>
            <button
              type="button"
              onClick={back}
              className="label"
              style={{ background: "none", border: 0, padding: 0, cursor: "pointer", textDecoration: "underline" }}
            >
              Back
            </button>
          </div>
        )}
      </Container>
    </div>
  );
}

function Waiting({ door }: { door?: Door }) {
  const [line, setLine] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setLine((l) => (l + 1) % THINKING_LINES.length), 2200);
    return () => clearInterval(id);
  }, []);
  return (
    <div data-door={door}>
      <Container className="section">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 24 }}>
          <DrapeFan door={door} state="thinking" size={180} />
          <p role="status" aria-live="polite" className="label" style={{ fontSize: "1rem", margin: 0 }}>
            {THINKING_LINES[line]}
          </p>
          <p style={{ color: "var(--ink-2)", margin: 0 }}>This takes about 15 seconds.</p>
        </div>
      </Container>
    </div>
  );
}

function DoorStep({ onChoose }: { onChoose: (d: Door) => void }) {
  return (
    <div>
      <h2 style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)" }}>Which door are you shopping at?</h2>
      <div className="grid gap-4 sm:grid-cols-2" style={{ marginTop: 16 }}>
        {(["men", "women"] as Door[]).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => onChoose(d)}
            style={{
              textAlign: "left",
              padding: "40px 28px",
              minHeight: 180,
              borderRadius: 24,
              border: "2px solid var(--ink)",
              background: doorTheme[d].accent,
              color: "#fff",
              cursor: "pointer",
            }}
          >
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 36 }}>
              {doorTheme[d].label}
            </span>
            <span style={{ display: "block", marginTop: 8, opacity: 0.95 }}>
              {d === "men" ? "Shirts, kurtas, chinos, sneakers" : "Kurtas, dresses, separates, festive"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Question({
  title,
  options,
  value,
  onPick,
}: {
  title: string;
  options: Option[];
  value?: string;
  onPick: (v: string) => void;
}) {
  return (
    <div>
      <h2 style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)" }}>{title}</h2>
      <OptionGrid>
        {options.map((o) => (
          <OptionButton key={o.value} option={o} selected={value === o.value} onClick={() => onPick(o.value)} />
        ))}
      </OptionGrid>
    </div>
  );
}

function OptionGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2" style={{ marginTop: 16 }} role="group">
      {children}
    </div>
  );
}

function OptionButton({
  option,
  selected,
  onClick,
  multi = false,
}: {
  option: Option;
  selected: boolean;
  onClick: () => void;
  multi?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      role={multi ? "checkbox" : undefined}
      aria-checked={multi ? selected : undefined}
      style={{
        textAlign: "left",
        padding: "20px 22px",
        minHeight: 72,
        borderRadius: 16,
        border: `2px solid ${selected ? "var(--accent)" : "var(--ink)"}`,
        background: selected ? "var(--accent)" : "var(--paper)",
        color: selected ? "#fff" : "var(--ink)",
        cursor: "pointer",
        fontSize: 18,
        fontWeight: 600,
      }}
    >
      {option.label}
      {option.hint && (
        <span style={{ display: "block", fontSize: 14, fontWeight: 400, opacity: 0.85 }}>{option.hint}</span>
      )}
    </button>
  );
}

function SelfieStep({
  door,
  selfie,
  error,
  onImage,
  onClear,
  onContinue,
}: {
  door?: Door;
  selfie: PreparedImage | null;
  error: string | null;
  onImage: (b: ImageSource, via: "camera" | "upload") => void | Promise<void>;
  onClear: () => void;
  onContinue: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }, []);

  useEffect(() => () => streamRef.current?.getTracks().forEach((t) => t.stop()), []);

  useEffect(() => {
    if (cameraOn && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      void videoRef.current.play().catch(() => undefined);
    }
  }, [cameraOn]);

  async function startCamera() {
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("This browser cannot open the camera. Upload a photo instead.");
      return;
    }
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      });
      setCameraOn(true);
    } catch {
      setCameraError("We could not open the camera. Allow camera access, or upload a photo instead.");
    }
  }

  async function capture() {
    const video = videoRef.current;
    if (!video) return;
    await onImage(video, "camera");
    stopCamera();
  }

  return (
    <div>
      <h2 style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)" }}>Now one selfie</h2>
      <ul className="label" style={{ listStyle: "none", padding: 0, margin: "12px 0 0", display: "flex", flexWrap: "wrap", gap: 8 }}>
        {GUIDANCE.map((g) => (
          <li key={g} style={{ border: "1.5px solid var(--ink)", borderRadius: 999, padding: "4px 12px" }}>
            {g}
          </li>
        ))}
      </ul>

      <div style={{ marginTop: 20 }}>
        {selfie ? (
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selfie.previewUrl}
              alt="Your selfie, shown only on this device"
              style={{ width: 240, maxWidth: "100%", borderRadius: 20, border: "2px solid var(--ink)" }}
            />
            <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
              <Button door={door} onClick={onContinue}>
                Use this photo
              </Button>
              <Button variant="secondary" onClick={onClear}>
                Retake
              </Button>
            </div>
          </div>
        ) : cameraOn ? (
          <div>
            <video
              ref={videoRef}
              muted
              playsInline
              style={{
                width: 320,
                maxWidth: "100%",
                borderRadius: 20,
                border: "2px solid var(--ink)",
                transform: "scaleX(-1)",
                background: "var(--ink)",
              }}
            />
            <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
              <Button door={door} onClick={() => void capture()}>
                Capture
              </Button>
              <Button variant="secondary" onClick={stopCamera}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Button door={door} size="lg" onClick={() => void startCamera()}>
              Take a selfie
            </Button>
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "16px 32px",
                borderRadius: 999,
                border: "2px solid var(--ink)",
                fontWeight: 600,
                fontSize: 18,
                cursor: "pointer",
              }}
            >
              Upload a photo
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ position: "absolute", width: 1, height: 1, opacity: 0 }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (f) void onImage(f, "upload");
                }}
              />
            </label>
          </div>
        )}
        {(error || cameraError) && (
          <p role="alert" style={{ color: "var(--bad)", marginTop: 12 }}>
            {error ?? cameraError}
          </p>
        )}
      </div>
    </div>
  );
}
