import type { MetadataRoute } from "next";
import { allContentRoutes, STATIC_ROUTES } from "@/features/content";
import { siteUrl } from "@/features/content/meta";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return [
    ...STATIC_ROUTES.map((p) => ({ url: `${base}${p === "/" ? "" : p}` || base })),
    ...allContentRoutes().map((r) => ({ url: `${base}${r.path}`, lastModified: r.lastModified })),
  ];
}
