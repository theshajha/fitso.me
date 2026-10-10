import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import {
  ArchetypesFile,
  ColourPage,
  Guide,
  SeasonsFile,
  ToolPage,
} from "@fitso/core";

/** Colour pages carry swatch rows the core schema keeps as loose keys. */
const PaletteBlock = z.object({ label: z.string(), hexes: z.array(z.string()) });
export type PaletteBlock = z.infer<typeof PaletteBlock>;

/** A guide or colour page, ready for the shared guide template. */
export type ContentPage = {
  slug: string;
  kind: "guide" | "colour";
  door: "men" | "women" | "both";
  pillar: string;
  title: string;
  description: string;
  updated: string;
  intro: string;
  sections: Guide["sections"];
  faq: Guide["faq"];
  related: string[];
  cta: { headline: string; sub: string };
  keywords: string[];
  palette_blocks: PaletteBlock[];
};

export type ToolContent = ToolPage;

function contentDir(): string {
  const direct = path.join(process.cwd(), "content");
  if (fs.existsSync(direct)) return direct;
  return path.join(process.cwd(), "apps", "web", "content");
}

function readJson(file: string): unknown {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function readDir(sub: string): { file: string; data: unknown }[] {
  const dir = path.join(contentDir(), sub);
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => ({ file: `${sub}/${f}`, data: readJson(path.join(dir, f)) }));
}

function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown, file: string): T {
  const r = schema.safeParse(data);
  if (!r.success) throw new Error(`Invalid content in ${file}: ${z.prettifyError(r.error)}`);
  return r.data;
}

/** Load and validate everything once per process. Throws on the first invalid file. */
let memo: ReturnType<typeof build> | undefined;
export function loadAll() {
  return (memo ??= build());
}

function build() {
  const guides: ContentPage[] = readDir("guides").map(({ file, data }) => {
    const g = parseOrThrow(Guide, data, file);
    return { ...g, kind: "guide" as const, palette_blocks: [] };
  });
  const colours: ContentPage[] = readDir("colours").map(({ file, data }) => {
    const c = parseOrThrow(ColourPage, data, file);
    const blocks = z.array(PaletteBlock).safeParse((c as Record<string, unknown>).palette_blocks ?? []);
    if (!blocks.success) throw new Error(`Invalid palette_blocks in ${file}: ${z.prettifyError(blocks.error)}`);
    return {
      slug: c.slug,
      kind: "colour" as const,
      door: c.door,
      pillar: c.pillar,
      title: c.title,
      description: c.description,
      updated: c.updated,
      intro: c.intro,
      sections: c.sections,
      faq: c.faq,
      related: c.related,
      cta: c.cta,
      keywords: c.keywords,
      palette_blocks: blocks.data,
    };
  });
  const tools = readDir("tools").map(({ file, data }) => parseOrThrow(ToolPage, data, file));
  const archetypes = parseOrThrow(ArchetypesFile, readJson(path.join(contentDir(), "archetypes.json")), "archetypes.json");
  const seasons = parseOrThrow(SeasonsFile, readJson(path.join(contentDir(), "seasons.json")), "seasons.json");
  return { guides, colours, tools, archetypes, seasons };
}

export function getGuides(): ContentPage[] {
  return loadAll().guides;
}
export function getGuide(slug: string): ContentPage | undefined {
  return getGuides().find((g) => g.slug === slug);
}
export function getColourPages(): ContentPage[] {
  return loadAll().colours;
}
export function getColourPage(slug: string): ContentPage | undefined {
  return getColourPages().find((g) => g.slug === slug);
}
/** Guides and colour pages together: everything served at /guides/[slug]. */
export function getAllPages(): ContentPage[] {
  return [...getGuides(), ...getColourPages()];
}
export function getPage(slug: string): ContentPage | undefined {
  return getAllPages().find((g) => g.slug === slug);
}
export function getTools(): ToolContent[] {
  return loadAll().tools;
}
export function getTool(slug: string): ToolContent | undefined {
  return getTools().find((t) => t.slug === slug);
}
export function getArchetypes() {
  return loadAll().archetypes;
}
export function getSeasons() {
  return loadAll().seasons;
}

export const STATIC_ROUTES = ["/", "/men", "/women", "/guides", "/tools", "/pricing", "/privacy", "/terms"] as const;

/** Every content route with its last-modified date, for the sitemap. */
export function allContentRoutes(): { path: string; lastModified: string }[] {
  return [
    ...getAllPages().map((p) => ({ path: `/guides/${p.slug}`, lastModified: p.updated })),
    ...getTools().map((t) => ({
      path: `/tools/${t.slug}`,
      lastModified: String((t as Record<string, unknown>).updated ?? "2026-10-10"),
    })),
  ];
}
