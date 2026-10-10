import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { loadPublicQuickWin, loadReportUnlock, readFoundingCents } from "@/features/profile/repo";
import { isOwner } from "@/features/profile/owner";
import { seasonLabel } from "@/features/profile/content";
import { PriceBlock, type PriceView } from "@/features/profile/PriceBlock";
import { LockedReport } from "@/features/report/LockedReport";
import { ReportCover, StyleReport } from "@/features/report/StyleReport";
import { env } from "@/lib/env";
import { ownerCookieName } from "@/lib/owner-cookie";
import { finishTodayEndedLine, finishTodayExpired, formatMoney, priceFor } from "@/lib/pricing";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ token: string }>; searchParams: Promise<{ view?: string | string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const qw = await loadPublicQuickWin(token);
  if (!qw) return { title: "Report not found" };
  return { title: `Style Report: ${qw.profile.archetype}, ${seasonLabel(qw.profile).toLowerCase()}`, robots: { index: false } };
}

export default async function Page({ params, searchParams }: Props) {
  const { token } = await params;
  const sp = await searchParams;
  const qw = await loadPublicQuickWin(token);
  if (!qw || !qw.report) notFound();

  const jar = await cookies();
  const viewParam = Array.isArray(sp.view) ? sp.view[0] : sp.view;
  // Dev builds (localhost) always show the full report. ?view=free previews the locked state.
  const owner = isOwner(token, jar.get(ownerCookieName(token))?.value) || !env.isProd;
  const unlocked = env.isProd ? owner && (await loadReportUnlock(qw.id)) : viewParam !== "free";
  if (!owner && !unlocked) {
    // A report is personal. Visitors see the personal style instead.
    return (
      <div className="container section">
        <h1>This report belongs to someone else.</h1>
        <p>
          <Link href={`/r/${token}`}>See their personal style</Link> or <Link href="/start">generate your own</Link>.
        </p>
      </div>
    );
  }

  const { report } = qw;
  const currency = "USD" as const;
  const now = new Date();
  const p = priceFor("report", currency, qw, { founding_usd_cents: await readFoundingCents() }, now);
  const price: PriceView = {
    tier: p.tier,
    amountLabel: formatMoney(p.amount_minor, currency),
    listLabel: p.amount_minor < p.list_amount_minor ? formatMoney(p.list_amount_minor, currency) : null,
    expiresAt: p.expires_at,
    endedLine: p.tier === "list" && finishTodayExpired(qw, now) ? finishTodayEndedLine(qw.finish_today_expires_at) : null,
  };

  return (
    <div>
      <ReportCover report={report} />
      {unlocked ? (
        <StyleReport report={report} />
      ) : (
        <div className="container section flex flex-col gap-10">
          <div className="flex flex-col gap-3">
            <h2 style={{ margin: 0 }}>Your full Style Report</h2>
            <p className="muted" style={{ margin: 0, fontSize: "1.1875rem" }}>
              Three moves to start, your colours, your style, fit rules, outfits and a shopping list. Built from your photo.
            </p>
          </div>
          <LockedReport />
          <div id="price" style={{ scrollMarginTop: 24 }}>
            <PriceBlock token={token} door={qw.door} currency={currency} price={price} hasEmail={qw.has_email} />
          </div>
          <p style={{ margin: 0 }}>
            <Link href={`/r/${token}`}>Back to your personal style</Link>
          </p>
        </div>
      )}
      {!env.isProd && (
        <div className="label" style={{ position: "fixed", right: 12, bottom: 12, zIndex: 50, display: "flex", gap: 12, padding: "8px 12px", borderRadius: 12, background: "var(--ink)", color: "#fff", fontSize: "0.75rem" }}>
          <Link href={`/r/${token}/report?view=free`} style={{ color: "#fff", textDecoration: "underline" }}>
            Locked
          </Link>
          <Link href={`/r/${token}/report`} style={{ color: "#fff", textDecoration: "underline" }}>
            Unlocked
          </Link>
        </div>
      )}
    </div>
  );
}
