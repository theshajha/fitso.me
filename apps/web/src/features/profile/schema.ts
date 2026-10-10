import { z } from "zod";
import { Door } from "@fitso/core";
import {
  ALLOWED_IMAGE_TYPES,
  BUDGET,
  CLIMATE,
  LIFE,
  MAX_SELFIE_BYTES,
  OCCASIONS,
  VIBE,
} from "./questions";

export type FormError = { code: string; message: string; status: number };
export type ParseResult<T> = { ok: true; data: T } | { ok: false; error: FormError };

const values = (opts: { value: string }[]) => opts.map((o) => o.value) as [string, ...string[]];

/** Answers for one door. The vibe options differ by door. */
export function answersSchema(door: Door) {
  return z.object({
    life: z.enum(values(LIFE)).optional(),
    climate: z.enum(values(CLIMATE)).optional(),
    occasions: z.array(z.enum(values(OCCASIONS))).max(OCCASIONS.length).optional(),
    budget_per_item: z.enum(values(BUDGET)).optional(),
    vibe: z.enum(values(VIBE[door])).optional(),
    heritage: z.string().trim().max(80).optional(),
    height_cm: z.coerce.number().min(120).max(230).optional(),
    waist_cm: z.coerce.number().min(50).max(160).optional(),
  });
}

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email().max(254));

export type QuickWinForm = {
  door: Door;
  answers: z.infer<ReturnType<typeof answersSchema>>;
  /** Optional since the read engine: asked on the result page. */
  email: string | null;
  /** One to four photos of the same person. */
  photos: File[];
};

/** Four photos from the person, plus up to two face close-ups the app cuts itself. */
export const MAX_PHOTOS = 6;

const fail = (code: string, message: string, status = 400): { ok: false; error: FormError } => ({
  ok: false,
  error: { code, message, status },
});

/** Shared image checks for the selfie and the verdict screenshot. */
export function checkImage(file: unknown, label: string): ParseResult<File> {
  if (!(file instanceof File) || file.size === 0) {
    return fail("missing_image", `Add a ${label} first.`);
  }
  if (file.size > MAX_SELFIE_BYTES) {
    return fail("file_too_big", `That ${label} is over 6 MB. Pick a smaller one or take a new one.`, 413);
  }
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return fail("bad_image_type", `Use a JPEG, PNG or WebP ${label}.`, 415);
  }
  return { ok: true, data: file };
}

/** Validate the multipart body of POST /api/quick-win. No image bytes are read here. */
export function parseQuickWinForm(fd: FormData): ParseResult<QuickWinForm> {
  const door = Door.safeParse(fd.get("door"));
  if (!door.success) return fail("invalid_door", "Pick men or women to start.");

  // Answers are optional since the flow asks nothing. An absent or empty field means {}.
  let rawAnswers: unknown = {};
  const rawField = fd.get("answers");
  if (typeof rawField === "string" && rawField.trim() !== "") {
    try {
      rawAnswers = JSON.parse(rawField);
    } catch {
      return fail("invalid_answers", "Your answers did not come through. Try again.");
    }
  }
  const answers = answersSchema(door.data).safeParse(rawAnswers);
  if (!answers.success) {
    return fail("invalid_answers", "One of your answers did not come through. Try again.");
  }

  const rawEmail = fd.get("email");
  let email: string | null = null;
  if (typeof rawEmail === "string" && rawEmail.trim() !== "") {
    const parsedEmail = emailSchema.safeParse(rawEmail);
    if (!parsedEmail.success) return fail("invalid_email", "That email does not look right. Check it and try again.");
    email = parsedEmail.data;
  }

  // Accept `photos` (one entry per file) and the older single `selfie` field.
  const raw = [...fd.getAll("photos"), ...fd.getAll("selfie")].filter((f) => f instanceof File && f.size > 0);
  if (raw.length === 0) return fail("missing_image", "Add a photo first.");
  if (raw.length > MAX_PHOTOS) return fail("too_many_images", `Up to ${MAX_PHOTOS} photos. Remove one and try again.`);
  const photos: File[] = [];
  for (const f of raw) {
    const checked = checkImage(f, "photo");
    if (!checked.ok) return checked;
    photos.push(checked.data);
  }

  return { ok: true, data: { door: door.data, answers: answers.data, email, photos } };
}
