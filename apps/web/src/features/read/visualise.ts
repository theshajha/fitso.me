import type { Outfit } from "@fitso/core";
import type { ImagePart } from "@/lib/anthropic";
import { env } from "@/lib/env";

/**
 * Outfit visuals with Gemini's image model: the person's own photo plus one
 * planned outfit in, a picture of them wearing it out. Runs only while the
 * photo bytes are still in memory (the initial background step), and only
 * when GEMINI_API_KEY is set. Returns data URLs; the row stores them.
 *
 * Meant for the higher tier. Each image costs a Gemini image call.
 */

export type OutfitVisual = { outfit: string; image: string; model: string };

const MODEL = "gemini-2.5-flash-image";
const ENDPOINT = (model: string) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

function outfitPrompt(o: Outfit): string {
  const pieces = o.pieces.map((p) => `${p.colour_name} ${p.item} (${p.cut}, ${p.fabric}, colour ${p.hex})`).join("; ");
  return [
    "Edit this photo so the same person is wearing a different outfit. Keep their face, hair, skin tone, body, pose, the camera angle and the background exactly as they are. Change only the clothes, shoes and accessories.",
    `The outfit, "${o.name}" for ${o.occasion}: ${pieces}.`,
    "Fabrics should look real and the colours should match the hex values given. Natural daylight, no filter, no text, no logo. Photorealistic.",
  ].join(" ");
}

export async function visualiseOutfits(photo: ImagePart, outfits: Outfit[], max = 3): Promise<OutfitVisual[]> {
  if (!env.geminiKey) return [];
  const out: OutfitVisual[] = [];
  for (const o of outfits.slice(0, max)) {
    try {
      const res = await fetch(ENDPOINT(MODEL), {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": env.geminiKey },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { inline_data: { mime_type: photo.mimeType, data: Buffer.from(photo.bytes).toString("base64") } },
                { text: outfitPrompt(o) },
              ],
            },
          ],
          generationConfig: { responseModalities: ["IMAGE"] },
        }),
      });
      if (!res.ok) {
        console.error(`[fitso] gemini ${res.status}: ${(await res.text()).slice(0, 200)}`);
        continue;
      }
      const json = (await res.json()) as { candidates?: { content?: { parts?: { inlineData?: { mimeType: string; data: string } }[] } }[] };
      const part = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
      if (!part?.inlineData) continue;
      out.push({ outfit: o.name, image: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`, model: MODEL });
    } catch (e) {
      console.error("[fitso] gemini failed:", e instanceof Error ? e.message.slice(0, 200) : e);
    }
  }
  return out;
}
