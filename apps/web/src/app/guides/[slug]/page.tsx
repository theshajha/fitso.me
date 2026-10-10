import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllPages, getPage } from "@/features/content";
import { GuideView } from "@/features/content/components/GuideView";
import { JsonLd } from "@/features/content/components/JsonLd";
import { pageMetadata, siteUrl } from "@/features/content/meta";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPages().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = getPage(slug);
  if (!page) return {};
  return pageMetadata({ title: page.title, description: page.description, path: `/guides/${page.slug}` });
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getPage(slug);
  if (!page) notFound();
  const url = `${siteUrl()}/guides/${page.slug}`;
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: page.title,
          description: page.description,
          dateModified: page.updated,
          datePublished: page.updated,
          mainEntityOfPage: url,
          keywords: page.keywords.join(", "),
          publisher: { "@type": "Organization", name: "fitso", url: siteUrl() },
        }}
      />
      <GuideView page={page} />
    </>
  );
}
