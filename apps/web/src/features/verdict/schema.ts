import { z } from "zod";
import { checkImage, type ParseResult } from "@/features/profile/schema";

export type VerdictForm =
  | { kind: "screenshot"; token: string; file: File }
  | { kind: "link"; token: string; link: string };

const linkSchema = z.url({ protocol: /^https?$/ }).max(2000);

/** Validate the multipart body of POST /api/verdict. */
export function parseVerdictForm(fd: FormData): ParseResult<VerdictForm> {
  const token = String(fd.get("token") ?? "");
  if (!token) return { ok: false, error: { code: "invalid_token", message: "This result link is not valid.", status: 400 } };

  const shot = fd.get("screenshot");
  if (shot instanceof File && shot.size > 0) {
    const checked = checkImage(shot, "screenshot");
    if (!checked.ok) return checked;
    return { ok: true, data: { kind: "screenshot", token, file: checked.data } };
  }

  const rawLink = String(fd.get("link") ?? "").trim();
  if (rawLink) {
    const link = linkSchema.safeParse(rawLink);
    if (!link.success) {
      return { ok: false, error: { code: "invalid_link", message: "That link does not look right. Paste the full product link, starting with https.", status: 400 } };
    }
    return { ok: true, data: { kind: "link", token, link: link.data } };
  }
  return { ok: false, error: { code: "missing_input", message: "Add a screenshot or paste a link.", status: 400 } };
}

export const VERDICT_LABEL = {
  yes: { stamp: "yes", text: "YES" },
  yes_if: { stamp: "yes-if", text: "YES-IF" },
  no: { stamp: "no", text: "NO" },
} as const;
