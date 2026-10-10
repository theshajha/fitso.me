import { describe, expect, it } from "vitest";
import { PhotoGate, QuickWinProfile, ReadReport, Verdict } from "@fitso/core";
import { itemVerdict } from "./ai";
import { gatePhoto, runRead } from "@/features/read/pipeline";
import { newShareToken } from "./ids";
import { signOwner, verifyOwner } from "./owner-cookie";
import { getDb, resetFakeDb } from "./supabase";

const answers = { life: "office", climate: "hot and humid", occasions: ["travel"], budget_per_item: "1,500 to 4,000", vibe: "polished" };

describe("stub AI", () => {
  it("returns schema-valid, deterministic fixtures", async () => {
    const image = { bytes: new Uint8Array(10), mimeType: "image/jpeg" as const };
    const gate = await gatePhoto(image);
    expect(PhotoGate.safeParse(gate).success).toBe(true);
    const input = { door: "women" as const, answers, images: [image], archetypes: ["A", "B", "C"] };
    const a = await runRead(input);
    expect(QuickWinProfile.safeParse(a.profile).success).toBe(true);
    expect(ReadReport.safeParse(a.report).success).toBe(true);
    expect((await runRead(input)).profile).toEqual(a.profile);
    const v = await itemVerdict({ profile: a.profile, answers, link: "https://example.com/x" });
    expect(Verdict.safeParse(v).success).toBe(true);
  });
});

describe("fake supabase", () => {
  it("inserts, selects by token, updates", async () => {
    resetFakeDb();
    const db = getDb();
    const token = newShareToken();
    expect(token).toMatch(/^[0-9a-z]{10}$/);
    const ins = await db.from("quick_wins").insert({ door: "men", email: "a@b.c", share_token: token }).select().single();
    expect(ins.error).toBeNull();
    const got = await db.from("quick_wins").select("*").eq("share_token", token).single();
    expect((got.data as { verdict_credits: number }).verdict_credits).toBe(1);
    await db.from("quick_wins").update({ verdict_credits: 0 }).eq("share_token", token);
    const after = await db.from("quick_wins").select().eq("share_token", token).maybeSingle();
    expect((after.data as { verdict_credits: number }).verdict_credits).toBe(0);
    const c = await db.from("counters").select().eq("key", "founding_revenue_usd_cents").single();
    expect((c.data as { value_minor: number }).value_minor).toBe(0);
  });
});

describe("owner cookie", () => {
  it("verifies only its own signature", () => {
    expect(verifyOwner("abc", signOwner("abc"))).toBe(true);
    expect(verifyOwner("abc", signOwner("abd"))).toBe(false);
    expect(verifyOwner("abc", undefined)).toBe(false);
  });
});
