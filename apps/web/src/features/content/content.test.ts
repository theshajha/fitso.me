import { describe, expect, it } from "vitest";
import {
  allContentRoutes,
  getAllPages,
  getArchetypes,
  getColourPages,
  getGuides,
  getSeasons,
  getTools,
  oldGuideSlugs,
} from "./index";

describe("content loader", () => {
  it("validates every file", () => {
    expect(getGuides()).toHaveLength(42);
    expect(getColourPages()).toHaveLength(8);
    expect(getTools()).toHaveLength(4);
    expect(getArchetypes().men.length).toBeGreaterThan(0);
    expect(Object.keys(getSeasons())).toHaveLength(4);
  });

  it("has unique slugs", () => {
    const slugs = getAllPages().map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    const tools = getTools().map((t) => t.slug);
    expect(new Set(tools).size).toBe(tools.length);
  });

  it("resolves every related slug", () => {
    const slugs = new Set(getAllPages().map((p) => p.slug));
    const missing = getAllPages().flatMap((p) => p.related.filter((r) => !slugs.has(r)).map((r) => `${p.slug} -> ${r}`));
    expect(missing).toEqual([]);
  });

  it("gives colour pages their palette rows and every old slug a men's page", () => {
    expect(getColourPages().filter((c) => c.palette_blocks.length > 0).length).toBeGreaterThan(0);
    const slugs = new Set(getGuides().map((g) => g.slug));
    for (const old of oldGuideSlugs) expect(slugs.has(`${old}-men`)).toBe(true);
    expect(oldGuideSlugs).toHaveLength(21);
  });

  it("lists 54 content routes", () => {
    expect(allContentRoutes()).toHaveLength(54);
  });
});
