import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Container } from "@/components/brand/Container";
import { loadPublicQuickWin, loadReportUnlock, readFoundingCents } from "@/features/profile/repo";
import { isOwner } from "@/features/profile/owner";
import { plainHeadline, seasonLabel, textOn } from "@/features/profile/content";
import { ResultTracker } from "@/features/profile/ResultTracker";
import { ShareBlock } from "@/features/profile/ShareBlock";
import { PriceBlock, type PriceView } from "@/features/profile/PriceBlock";
import { EmailSave } from "@/features/report/EmailSave";
import { LockedReport } from "@/features/report/LockedReport";
import { env } from "@/lib/env";
import { ownerCookieName } from "@/lib/owner-cookie";
import { finishTodayEndedLine, finishTodayExpired, formatMoney, priceFor } from "@/lib/pricing";
import { Swatches } from "@/components/brand/Swatches";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ view?: string | string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const qw = await loadPublicQuickWin(token);
  if (!qw) return { title: "Result not found" };
  const title = `${plainHeadline(qw.profile).replace(/^Your/, "My").replace(/\.$/, "")}`;
  const description = qw.report?.text.free.working_lines[0] ?? qw.profile.working_for_you[0];
  const image = `/r/${token}/card.png`;
  return {
    title,
    description,
    openGraph: { title: `${title} · fitso`, description, images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title: `${title} · fitso`, description, images: [image] },
  };
}

export default async function Page({ params, searchParams }: Props) {
  const { token } = await params;
  const sp = await searchParams;
  const qw = await loadPublicQuickWin(token);
  if (!qw) notFound();

  const jar = await cookies();
  const owner = isOwner(token, jar.get(ownerCookieName(token))?.value);

  const viewParam = Array.isArray(sp.view) ? sp.view[0] : sp.view;
  // Dev builds (localhost) always count as paid. ?view=free previews the locked state.
  const unlocked = env.isProd ? owner && (await loadReportUnlock(qw.id)) : viewParam !== "free";

  const currency = "USD" as const;
  const now = new Date();
  const founding = await readFoundingCents();
  const p = priceFor("report", currency, qw, { founding_usd_cents: founding }, now);
  const price: PriceView = {
    tier: p.tier,
    amountLabel: formatMoney(p.amount_minor, currency),
    listLabel: p.amount_minor < p.list_amount_minor ? formatMoney(p.list_amount_minor, currency) : null,
    expiresAt: p.expires_at,
    endedLine: p.tier === "list" && finishTodayExpired(qw, now) ? finishTodayEndedLine(qw.finish_today_expires_at) : null,
  };

  const { profile, report } = qw;
  const free = report?.text.free ?? null;
  const label = seasonLabel(profile);
  const headline = plainHeadline(profile);
  const workingLines = (free?.working_lines ?? profile.working_for_you).slice(0, 3);
  const changeLine = free?.change_line ?? profile.stop_buying;
  const swatches = report
    ? report.decisions.palette.map((c) => ({ hex: c.hex, name: c.name }))
    : profile.palette.map((hex) => ({ hex, name: hex.toUpperCase() }));
  const avoid = report?.decisions.avoid ?? [];
  const paletteCaption = free?.palette_caption ?? null;
  const hero = swatches[0]?.hex ?? "#f0127a";
  const onHero = textOn(hero);
  const lowConfidence = qw.confidence < 0.6;
  const retakeHref = "/start";

  return (
    <div>
      <ResultTracker token={token} owner={owner} />

      {!owner && (
        <div style={{ background: "var(--ink)", color: "var(--paper)" }}>
          <Container className="py-3">
            <p style={{ margin: 0, fontWeight: 600 }}>
              This is someone else&apos;s personal style.{" "}
              <Link href={retakeHref} style={{ color: "var(--paper)" }}>
                Generate yours, free
              </Link>
            </p>
          </Container>
        </div>
      )}

      {/* Hero band, painted in the person's own lead colour. */}
      <section className="py-14 md:py-20" style={{ background: hero, color: onHero }}>
        <Container className="grid items-center gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:gap-14">
          <div className="flex min-w-0 flex-col gap-5">
            <p className="label" style={{ margin: 0, color: onHero }}>
              Your personal style
            </p>
            <h1 style={{ margin: 0, fontSize: "clamp(2.5rem, 6.4vw, 5rem)", color: onHero }}>{headline}</h1>
            <div className="flex flex-wrap gap-2">
              <span className="label" style={{ background: onHero, color: hero, borderRadius: 999, padding: "5px 14px" }}>
                {label}
              </span>
              <span className="label" style={{ border: `2px solid ${onHero}`, borderRadius: 999, padding: "3px 14px", color: onHero }}>
                Your style: {profile.archetype}
              </span>
            </div>
          </div>
          <div className="flex min-w-0 flex-col gap-4 p-5 md:p-6" style={{ background: "var(--paper)", color: "var(--ink)", border: "3px solid var(--ink)", borderRadius: 28, boxShadow: "0 10px 0 var(--ink)" }}>
            <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Your palette</h2>
            <Swatches colors={swatches} animate />
            {paletteCaption && <p style={{ margin: 0, fontWeight: 500 }}>{paletteCaption}</p>}
          </div>
        </Container>
      </section>

      <Container className="section">
        <div className="grid gap-10 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] md:gap-14">
          <section aria-labelledby="working" className="flex flex-col gap-5">
            <h2 id="working" style={{ margin: 0, fontSize: "clamp(1.5rem, 3vw, 2rem)" }}>
              What already works on you
            </h2>
            <ul className="m-0 flex list-none flex-col gap-4 p-0">
              {workingLines.map((line, i) => (
                <li key={i} className="flex items-start gap-4" style={{ borderTop: "2px solid var(--line)", paddingTop: 16 }}>
                  <span
                    aria-hidden="true"
                    className="inline-flex flex-none items-center justify-center"
                    style={{ width: 32, height: 32, borderRadius: 999, background: "var(--good)", color: "#fff", fontWeight: 800 }}
                  >
                    ✓
                  </span>
                  <p style={{ margin: 0, fontSize: "clamp(1.125rem, 2vw, 1.3125rem)", lineHeight: 1.45, fontWeight: 500 }}>{line}</p>
                </li>
              ))}
            </ul>
          </section>

          <div className="flex flex-col gap-5">
            <section aria-labelledby="change" className="flex flex-col gap-3 p-6 md:p-7" style={{ background: "var(--ink)", color: "var(--paper)", borderRadius: 26 }}>
              <h2 id="change" style={{ margin: 0, color: "var(--paper)", fontSize: "1.375rem" }}>
                Change one thing
              </h2>
              <p style={{ margin: 0, fontSize: "1.1875rem", lineHeight: 1.45, fontWeight: 500 }}>{changeLine}</p>
            </section>
            {avoid.length > 0 && (
              <section aria-labelledby="avoid" className="flex flex-col gap-3 p-6" style={{ border: "2px solid var(--ink)", borderRadius: 26 }}>
                <h2 id="avoid" style={{ margin: 0, fontSize: "1.125rem" }}>
                  Keep these away from your face
                </h2>
                <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                  {avoid.map((a) => (
                    <li key={a.hex} className="inline-flex items-center gap-2" style={{ border: "2px solid var(--line)", borderRadius: 999, padding: "5px 14px 5px 6px", fontWeight: 600 }}>
                      <span style={{ width: 22, height: 22, borderRadius: 999, background: a.hex, border: "2px solid var(--ink)" }} />
                      {a.name}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>

        {lowConfidence && (
          <p className="muted" style={{ marginTop: 32 }}>
            {profile.retake_hint ?? "The light in this photo made some colours hard to judge."}{" "}
            <Link href={retakeHref} style={{ fontWeight: 700, color: "var(--ink)" }}>
              Try again with a daylight photo
            </Link>
          </p>
        )}

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <ShareBlock token={token} door={qw.door} title={`${headline} · fitso`} />
          {owner && !qw.has_email && <EmailSave token={token} door={qw.door} />}
        </div>
      </Container>

      <section id="report" className="section" style={{ background: "color-mix(in srgb, var(--line) 45%, var(--paper))", scrollMarginTop: 24 }} aria-labelledby="report-h">
        <Container className="flex flex-col gap-10">
          <div className="flex flex-col gap-3">
            <h2 id="report-h" style={{ margin: 0 }}>
              {unlocked ? "Your Style Report is ready" : "Your full Style Report"}
            </h2>
            <p className="muted" style={{ margin: 0, fontSize: "1.1875rem" }}>
              {unlocked
                ? "Everything your stylist saw, in three parts."
                : "Everything your stylist saw in your photo, in three parts, with the reason behind every line."}
            </p>
          </div>
          <LockedReport />
          {unlocked ? (
            <div>
              <Link
                href={`/r/${token}/report`}
                className="inline-flex items-center gap-2 rounded-full no-underline"
                style={{ background: "var(--magenta)", color: "#fff", padding: "16px 32px", fontWeight: 700, fontSize: "1.125rem" }}
              >
                Open my Style Report <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          ) : (
            <div id="price" style={{ scrollMarginTop: 24 }}>
              <PriceBlock token={token} door={qw.door} currency={currency} price={price} hasEmail={qw.has_email} />
            </div>
          )}
        </Container>
      </section>

      {!env.isProd && (
        <div
          className="label"
          style={{ position: "fixed", right: 12, bottom: 12, zIndex: 50, display: "flex", gap: 12, alignItems: "center", padding: "8px 12px", borderRadius: 12, background: "var(--ink)", color: "#fff", fontSize: "0.7rem" }}
        >
          <Link href={`/r/${token}?view=free`} style={{ color: "#fff", textDecoration: "underline" }}>
            View free
          </Link>
          <Link href={`/r/${token}?view=full`} style={{ color: "#fff", textDecoration: "underline" }}>
            View full
          </Link>
          <span>{!report ? "no report" : report.text.report ? "report text ready" : "report being written"}</span>
        </div>
      )}
    </div>
  );
}
