import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReadReport } from "@fitso/core";
import { Button } from "@/components/brand/Button";
import { ReportCover, StyleReport } from "@/features/report/StyleReport";
import her from "../../../../content/samples/her.json";
import him from "../../../../content/samples/him.json";

/** Two full Style Reports the engine wrote for the example photos on the home page. */
const SAMPLES = { her: her as unknown as ReadReport, him: him as unknown as ReadReport } as const;
type Who = keyof typeof SAMPLES;

export function generateStaticParams() {
  return [{ who: "her" }, { who: "him" }];
}

export async function generateMetadata({ params }: { params: Promise<{ who: string }> }): Promise<Metadata> {
  const { who } = await params;
  const r = SAMPLES[who as Who];
  if (!r) return { title: "Sample not found" };
  return {
    title: `Sample Style Report: ${r.decisions.archetype}`,
    description: "A full fitso Style Report, made from one photo: colours, style, fit rules, outfits and a shopping list.",
  };
}

export default async function Page({ params }: { params: Promise<{ who: string }> }) {
  const { who } = await params;
  const report = SAMPLES[who as Who];
  if (!report) notFound();
  const other: Who = who === "her" ? "him" : "her";

  return (
    <div>
      <div style={{ background: "var(--ink)", color: "var(--paper)" }}>
        <div className="container py-3">
          <p style={{ margin: 0, fontWeight: 600 }}>
            Sample Style Report, made from one photo.{" "}
            <Link href={`/sample/${other}`} style={{ color: "var(--paper)", fontWeight: 700 }}>
              See {other === "her" ? "her" : "his"} report →
            </Link>
          </p>
        </div>
      </div>
      <ReportCover report={report} />
      <StyleReport report={report} />
      <div className="container flex justify-center pb-24">
        <Button href="/#start" size="lg">
          Generate my personal style
        </Button>
      </div>
    </div>
  );
}
