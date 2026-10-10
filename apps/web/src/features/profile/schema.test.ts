import { describe, expect, it } from "vitest";
import { parseQuickWinForm } from "./schema";
import { headlineFor } from "./questions";
import { isOwner, shouldCountOpen } from "./owner";
import { signOwner } from "@/lib/owner-cookie";

const answers = {
  life: "office",
  climate: "hot and humid",
  occasions: ["travel", "formal work"],
  budget_per_item: "1,500 to 4,000",
  vibe: "sharp and tailored",
};

function form(over: Record<string, unknown> = {}): FormData {
  const fd = new FormData();
  const base: Record<string, unknown> = {
    door: "men",
    answers: JSON.stringify(answers),
    email: " Test@Example.com ",
    selfie: new File([new Uint8Array([1, 2, 3])], "s.jpg", { type: "image/jpeg" }),
    ...over,
  };
  for (const [k, v] of Object.entries(base)) if (v !== undefined) fd.set(k, v as string | Blob);
  return fd;
}

describe("parseQuickWinForm", () => {
  it("accepts a valid form and normalises the email", () => {
    const r = parseQuickWinForm(form());
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.email).toBe("test@example.com");
  });
  it("rejects a bad door", () => {
    const r = parseQuickWinForm(form({ door: "kids" }));
    expect(!r.ok && r.error.code).toBe("invalid_door");
  });
  it("rejects a vibe that belongs to the other door", () => {
    const r = parseQuickWinForm(form({ door: "women" }));
    expect(!r.ok && r.error.code).toBe("invalid_answers");
  });
  it("accepts empty or missing answers, rejects broken JSON", () => {
    expect(parseQuickWinForm(form({ answers: JSON.stringify({ ...answers, occasions: [] }) })).ok).toBe(true);
    expect(parseQuickWinForm(form({ answers: "{}" })).ok).toBe(true);
    expect(parseQuickWinForm(form({ answers: "{" })).ok).toBe(false);
  });
  it("rejects a bad email", () => {
    const r = parseQuickWinForm(form({ email: "nope" }));
    expect(!r.ok && r.error.code).toBe("invalid_email");
  });
  it("rejects a missing, oversized or wrong-type selfie", () => {
    const missing = parseQuickWinForm(form({ selfie: undefined }));
    expect(!missing.ok && missing.error.code).toBe("missing_image");
    const big = parseQuickWinForm(
      form({ selfie: new File([new Uint8Array(6 * 1024 * 1024 + 1)], "b.jpg", { type: "image/jpeg" }) }),
    );
    expect(!big.ok && big.error.code).toBe("file_too_big");
    const gif = parseQuickWinForm(form({ selfie: new File([new Uint8Array(4)], "a.gif", { type: "image/gif" }) }));
    expect(!gif.ok && gif.error.code).toBe("bad_image_type");
  });
});

describe("headlineFor", () => {
  it("maps tools and falls back", () => {
    expect(headlineFor("colour-season")).toBe("Find your season");
    expect(headlineFor("style-archetype")).toBe("Find your archetype");
    expect(headlineFor("does-this-suit-me")).toBe("Check it against your face first");
    expect(headlineFor(undefined)).toBe("Let's look at you.");
    expect(headlineFor("wardrobe-gap")).toBe("Let's look at you.");
  });
});

describe("owner check", () => {
  it("accepts only the signed cookie for the same token", () => {
    const good = signOwner("abc");
    expect(isOwner("abc", good)).toBe(true);
    expect(isOwner("abd", good)).toBe(false);
    expect(isOwner("abc", "garbage")).toBe(false);
    expect(isOwner("abc", undefined)).toBe(false);
  });
  it("counts an open once for a non-owner", () => {
    expect(shouldCountOpen({ owner: false, seen: false })).toBe(true);
    expect(shouldCountOpen({ owner: false, seen: true })).toBe(false);
    expect(shouldCountOpen({ owner: true, seen: false })).toBe(false);
  });
});
