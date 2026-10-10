import { NextResponse, after } from "next/server";
import type { Decisions, Observation } from "@fitso/core";
import { finishReport, runRead } from "@/features/read/pipeline";
import type { ClaimCheck } from "@/features/read/verify";
import { getDb } from "@/lib/supabase";
import { newShareToken } from "@/lib/ids";
import { ownerCookieName, ownerCookieOptions, signOwner } from "@/lib/owner-cookie";
import { hashEmail, trackServer } from "@/lib/posthog-server";
import { LIMITS, clientIp, hasAccess, rateLimit, takeDailyRead } from "@/lib/guard";
import { parseQuickWinForm } from "@/features/profile/schema";
import { archetypeNames } from "@/features/profile/content";

export const dynamic = "force-dynamic";
/** The read runs several model calls in series. Needs Fluid compute on Vercel for anything over 60s. */
export const maxDuration = 300;

const DAY_MS = 24 * 60 * 60 * 1000;

function err(code: string, message: string, status: number, headers?: Record<string, string>) {
  return NextResponse.json({ error: code, message }, { status, headers });
}

/** What the processing screen may see from each stage. Small, no raw notes, no photo. */
function stageData(stage: string, data: unknown): unknown {
  if (stage === "observe") {
    const obs = data as Observation[];
    const o = obs[0];
    return {
      photos: new Set(obs.map((x) => x.photo_index ?? 1)).size,
      skin: { depth: o.skin.depth, undertone: o.skin.apparent_undertone },
      hair: { colour: o.hair.colour, texture: o.hair.texture, length: o.hair.length },
      eyes: o.eyes.colour,
      contrast: o.contrast,
      face_shape: o.face.shape,
      features: o.face.notable_features,
      build: { frame: o.build.frame, shoulders_vs_hips: o.build.shoulders_vs_hips, torso_vs_legs: o.build.torso_vs_legs },
      // One chip per garment: a face close-up repeats the top the full photo already listed.
      outfit: obs
        .flatMap((x) => x.outfit.items)
        .filter((it, i, all) => all.findIndex((o) => o.colour_hex_estimate === it.colour_hex_estimate && o.garment.split(" ").slice(-1)[0] === it.garment.split(" ").slice(-1)[0]) === i)
        .map((it) => ({ garment: it.garment, colour_name: it.colour_name, hex: it.colour_hex_estimate }))
        .slice(0, 8),
      lighting: o.photo.lighting,
      colour_read_confidence: o.photo.colour_read_confidence,
    };
  }
  if (stage === "colour") {
    const c = data as { season: string; season_depth: string; undertone: string; contrast: string; clarity: string; agreement: number; votes: number };
    return { season: c.season, season_depth: c.season_depth, undertone: c.undertone, contrast: c.contrast, clarity: c.clarity, agreement: c.agreement, votes: c.votes };
  }
  if (stage === "judge" || stage === "judge_after_verify" || stage === "judge_retry") {
    const d = data as Decisions;
    return {
      season: d.season,
      season_depth: d.season_depth,
      undertone: d.undertone,
      contrast: d.contrast,
      palette: d.palette.map((p) => ({ name: p.name, hex: p.hex })),
      avoid: d.avoid.map((p) => ({ name: p.name, hex: p.hex })),
      archetype: d.archetype,
      working: d.working.map((w) => w.claim),
      change: { swap_out: d.change.swap_out, swap_in: d.change.swap_in },
    };
  }
  if (stage === "verify" || stage === "verify_2") {
    return { checks: (data as ClaimCheck[]).map((c) => ({ claim: c.claim, relation: c.relation, confidence: c.confidence })) };
  }
  if (stage === "write_free") return data;
  return undefined;
}

export async function POST(request: Request) {
  if (!(await hasAccess())) {
    return err("access_code", "fitso is in private testing. Enter your access code at /access.", 403);
  }
  const ip = clientIp(request.headers);
  const rl = rateLimit(`read:${ip}`, LIMITS.read.limit, LIMITS.read.windowMs);
  if (!rl.ok) {
    return err("rate_limited", `You have run a few reads already. Try again in ${Math.ceil(rl.retryAfterS / 60)} minutes.`, 429, { "retry-after": String(rl.retryAfterS) });
  }

  let fd: FormData;
  try {
    fd = await request.formData();
  } catch {
    return err("invalid_body", "That upload did not come through. Try again.", 400);
  }

  const parsed = parseQuickWinForm(fd);
  if (!parsed.ok) return err(parsed.error.code, parsed.error.message, parsed.error.status);
  const { door, answers, email, photos } = parsed.data;

  if (!(await takeDailyRead())) {
    return err("daily_cap", "fitso has done all the reads it can today. Come back tomorrow.", 503);
  }

  // PRIVACY: the photo bytes live only in this one local array. They are passed to the
  // read engine (gate and observer) and nowhere else. Never log, write, store or return them.
  const images = await Promise.all(
    photos.map(async (f) => ({ bytes: new Uint8Array(await f.arrayBuffer()), mimeType: f.type as "image/jpeg" | "image/png" | "image/webp" })),
  );

  // Mint the token up front so the owner cookie can go out in the response headers.
  const token = newShareToken();
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(encoder.encode(`${JSON.stringify(obj)}\n`));

      let out;
      try {
        out = await runRead({
          door,
          answers,
          images,
          archetypes: archetypeNames(door),
          withReport: false,
          onStart: (stage) => send({ type: "stage", stage, status: "start" }),
          onStage: (stage, data, ms) => {
            console.log(`[fitso] read ${stage} ${ms}ms`);
            send({ type: "stage", stage, status: "done", data: stageData(stage, data) });
          },
        });
      } catch (e) {
        const message = e instanceof Error ? e.message : "";
        console.error("[fitso] read failed:", message.slice(0, 300));
        send({ type: "error", code: "ai_failed", message: "We could not read that photo right now. Try again in a moment." });
        controller.close();
        return;
      }

      const { error } = await getDb()
        .from("quick_wins")
        .insert({
          door,
          email: email ?? null,
          answers,
          profile: out.profile,
          report: out.report,
          presented_as: out.report.presented_as,
          confidence: out.profile.confidence,
          share_token: token,
          finish_today_expires_at: new Date(Date.now() + DAY_MS).toISOString(),
          verdict_credits: 0,
        });
      if (error) {
        console.error("[fitso] quick_wins insert failed:", error.message);
        send({ type: "error", code: "save_failed", message: "We could not save your result. Try again." });
        controller.close();
        return;
      }

      // The plan, the prose and the card are made after the response; the result page polls for them.
      const decisions = out.report.decisions;
      const observations = out.observations;
      after(async () => {
        try {
          const finished = await finishReport(door, decisions, observations, answers, images[0]);
          const row = { ...out.report, plan: finished.plan, card: finished.card, visuals: finished.visuals, text: { ...out.report.text, report: finished.text } };
          await getDb().from("quick_wins").update({ report: row }).eq("share_token", token);
          console.log(`[fitso] report written for ${token}`);
        } catch (e) {
          console.error("[fitso] report write failed:", e instanceof Error ? e.message.slice(0, 300) : e);
        }
      });

      await trackServer(email ? await hashEmail(email) : `anon:${token}`, "quick_win_created", {
        door,
        photos: images.length,
        confidence: out.profile.confidence,
        took_s: out.report.took_s,
        verified: out.report.verification.filter((v) => v.relation === "supports").length,
      });

      send({ type: "done", token });
      controller.close();
    },
  });

  const res = new NextResponse(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store",
      "x-accel-buffering": "no",
    },
  });
  // The owner cookie goes out with the headers, before the body streams.
  res.cookies.set(ownerCookieName(token), signOwner(token), ownerCookieOptions);
  return res;
}

