import { ImageResponse } from "next/og";
import { ResultCard, CARD_SIZE, type CardVariant } from "@/components/brand/ResultCard";
import { loadPublicQuickWin } from "./repo";
import { seasonLabel } from "./content";

type FontSpec = { name: string; data: ArrayBuffer; weight: 400 | 600 | 700 | 900; style: "normal" };

const fontCache = new Map<string, Promise<ArrayBuffer | null>>();

/** Google Fonts CSS with no user agent returns TTF, which Satori reads. */
function googleFont(family: string, weight: number): Promise<ArrayBuffer | null> {
  const key = `${family}:${weight}`;
  if (!fontCache.has(key)) {
    fontCache.set(
      key,
      (async () => {
        try {
          const css = await (
            await fetch(`https://fonts.googleapis.com/css2?family=${family}:wght@${weight}`, {
              headers: { "user-agent": "" },
            })
          ).text();
          const url = css.match(/src: url\((https:[^)]+)\) format\('(?:truetype|opentype)'\)/)?.[1];
          if (!url) return null;
          return await (await fetch(url)).arrayBuffer();
        } catch {
          return null;
        }
      })().then((v) => {
        if (!v) fontCache.delete(key); // retry on the next request
        return v;
      }),
    );
  }
  return fontCache.get(key)!;
}

async function fonts(): Promise<FontSpec[]> {
  const [unbounded, hanken600, hanken700] = await Promise.all([
    googleFont("Unbounded", 900),
    googleFont("Hanken+Grotesk", 600),
    googleFont("Hanken+Grotesk", 700),
  ]);
  const out: FontSpec[] = [];
  if (unbounded) out.push({ name: "Unbounded", data: unbounded, weight: 900, style: "normal" });
  if (hanken600) out.push({ name: "Hanken", data: hanken600, weight: 600, style: "normal" });
  if (hanken700) out.push({ name: "Hanken", data: hanken700, weight: 700, style: "normal" });
  return out;
}

const CACHE = "public, max-age=86400, s-maxage=86400, stale-while-revalidate=86400";

export async function renderResultImage(token: string, variant: CardVariant): Promise<Response> {
  const qw = await loadPublicQuickWin(token);
  if (!qw) return new Response("Not found", { status: 404 });
  const size = CARD_SIZE[variant];
  return new ImageResponse(
    (
      <ResultCard
        variant={variant}
        data={{
          door: qw.door,
          season: qw.profile.season,
          seasonLabel: seasonLabel(qw.profile),
          archetype: qw.profile.archetype,
          strengths: qw.profile.working_for_you,
          stopBuying: qw.profile.stop_buying,
          palette: qw.profile.palette,
        }}
      />
    ),
    { ...size, fonts: await fonts(), headers: { "cache-control": CACHE } },
  );
}
