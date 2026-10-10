import type { MetadataRoute } from "next";
import { siteUrl } from "@/features/content/meta";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/app/", "/r/", "/api/", "/checkout/"] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
