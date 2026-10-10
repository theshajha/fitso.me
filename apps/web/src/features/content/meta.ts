import type { Metadata } from "next";

/** Shared page metadata. The site has no default OG image yet, so none is set here. */
export function pageMetadata(opts: { title: string; description: string; path: string }): Metadata {
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: opts.path },
    openGraph: {
      type: "article",
      siteName: "fitso",
      locale: "en_IN",
      title: opts.title,
      description: opts.description,
      url: opts.path,
    },
    twitter: { card: "summary_large_image", title: opts.title, description: opts.description },
  };
}

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}
