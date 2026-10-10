import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @fitso/core is built to dist/ by tsc (root postinstall), so no transpilePackages needed.
  // cacheComponents and partialPrefetching are left off: the product routes read cookies
  // and params at request time, and later tasks rely on classic route segment config.
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
