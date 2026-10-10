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
    life: z.enum(values(LIFE)),
    climate: z.enum(values(CLIMATE)),
    occasions: z.array(z.enum(values(OCCASIONS))).min(1).max(OCCASIONS.length),
    budget_per_item: z.enum(values(BUDGET)),
    vibe: z.enum(values(VIBE[door])),
  });
}

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email().max(254));

export type QuickWinForm = {
  door: Door;
  answers: z.infer<ReturnType<typeof answersSchema>>;
  email: string;
  selfie: File;
};

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

  let rawAnswers: unknown;
  try {
    rawAnswers = JSON.parse(String(fd.get("answers") ?? ""));
  } catch {
    return fail("invalid_answers", "Your answers did not come through. Go back and answer again.");
  }
  const answers = answersSchema(door.data).safeParse(rawAnswers);
  if (!answers.success) {
    return fail("invalid_answers", "One of your answers is missing. Go back and answer again.");
  }

  const email = emailSchema.safeParse(fd.get("email"));
  if (!email.success) return fail("invalid_email", "That email does not look right. Check it and try again.");

  const selfie = checkImage(fd.get("selfie"), "selfie");
  if (!selfie.ok) return selfie;

  return { ok: true, data: { door: door.data, answers: answers.data, email: email.data, selfie: selfie.data } };
}
