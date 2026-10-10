import type { NextConfig } from "next";
import { oldGuideSlugs } from "./src/features/content/redirects";

const nextConfig: NextConfig = {
  // @fitso/core is built to dist/ by tsc (root postinstall), so no transpilePackages needed.
  // cacheComponents and partialPrefetching are left off: the product routes read cookies
  // and params at request time, and later tasks rely on classic route segment config.
  async redirects() {
    // Old closet guide slugs (21) land on the men's page. The old app used /guides/:slug.
    return [
      ...oldGuideSlugs.map((slug) => ({
        source: `/guides/${slug}`,
        destination: `/guides/${slug}-men`,
        statusCode: 301,
      })),
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
