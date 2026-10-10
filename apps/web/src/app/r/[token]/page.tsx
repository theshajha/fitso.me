import type { Metadata } from "next";
import Link from "next/link";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Currency } from "@fitso/core";
import { Container } from "@/components/brand/Container";
import { Button } from "@/components/brand/Button";
import { DrapeFan } from "@/components/brand/DrapeFan";
import { Stamp } from "@/components/brand/Stamp";
import { loadPublicQuickWin, readFoundingCents } from "@/features/profile/repo";
import { isOwner } from "@/features/profile/owner";
import { seasonLabel } from "@/features/profile/content";
import { ResultTracker } from "@/features/profile/ResultTracker";
import { ShareBlock } from "@/features/profile/ShareBlock";
import { PriceBlock, type PriceView } from "@/features/profile/PriceBlock";
import { loadLastVerdict } from "@/features/verdict/repo";
import { canSpendCredit } from "@/features/verdict/credits";
import { VerdictView } from "@/features/verdict/VerdictView";
import { ownerCookieName } from "@/lib/owner-cookie";
import { currencyFromHeaders, finishTodayEndedLine, finishTodayExpired, formatMoney, priceFor } from "@/lib/pricing";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ cur?: string | string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const qw = await loadPublicQuickWin(token);
  if (!qw) return { title: "Result not found" };
  const title = `${qw.profile.archetype}, ${seasonLabel(qw.profile).toLowerCase()}`;
  const description = qw.profile.working_for_you[0];
  const image = `/r/${token}/card.png`;
  return {
    title,
    description,
    openGraph: { title: `${title} · fitso`, description, images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title: `${title} · fitso`, description, images: [image] },
  };
}

const SEASON_INDEX = { spring: 1, summer: 2, autumn: 3, winter: 4 } as const;

export default async function Page({ params, searchParams }: Props) {
  const { token } = await params;
  const sp = await searchParams;
  const qw = await loadPublicQuickWin(token);
  if (!qw) notFound();

  const jar = await cookies();
  const owner = isOwner(token, jar.get(ownerCookieName(token))?.value);

  const curParam = Array.isArray(sp.cur) ? sp.cur[0] : sp.cur;
  const currency: Currency =
    curParam === "INR" || curParam === "USD" ? curParam : currencyFromHeaders(await headers());

  const now = new Date();
  const founding = await readFoundingCents();
  const p = priceFor("report", currency, qw, { founding_usd_cents: founding }, now);
  const price: PriceView = {
    tier: p.tier,
    amountLabel: formatMoney(p.amount_minor, currency),
    listLabel: p.amount_minor < p.list_amount_minor ? formatMoney(p.list_amount_minor, currency) : null,
    expiresAt: p.expires_at,
    endedLine:
      p.tier === "list" && finishTodayExpired(qw, now) ? finishTodayEndedLine(qw.finish_today_expires_at) : null,
  };

  const lastVerdict = !canSpendCredit(qw.verdict_credits) ? await loadLastVerdict(qw.id) : null;
  const { profile } = qw;
  const label = seasonLabel(profile);
  const lowConfidence = qw.confidence < 0.6;
  const retakeHref = `/app/quick-win?door=${qw.door}`;
  const otherCur = currency === "INR" ? "USD" : "INR";

  return (
    <div data-door={qw.door}>
      <ResultTracker token={token} owner={owner} />
      {/* Fade the other chips so the person's season stands out in the collapsed fan. */}
      <style>{`.result-fan .fan-chip:not(:nth-child(${SEASON_INDEX[profile.season]})):not(:nth-child(5)){opacity:.4}`}</style>

      {!owner && (
        <div style={{ background: "var(--accent)", color: "#fff" }}>
          <Container className="py-3">
            <p style={{ margin: 0, fontWeight: 600 }}>
              This is someone&apos;s fitso result.{" "}
              <Link href={retakeHref} style={{ color: "#fff" }}>
                Get yours
              </Link>
            </p>
          </Container>
        </div>
      )}

      <Container className="section">
        <div className="result-fan" style={{ marginBottom: 24 }}>
          <DrapeFan door={qw.door} state="collapsed" size={120} />
        </div>
        <p className="label" style={{ margin: 0 }}>
          Your season
        </p>
        <h1 style={{ marginTop: 8, fontSize: "clamp(2.25rem, 7vw, 4.5rem)" }}>{label}</h1>
        <p
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
            letterSpacing: "-0.02em",
            margin: "8px 0 0",
          }}
        >
          {profile.archetype}
        </p>

        <section style={{ marginTop: 40 }} aria-labelledby="working">
          <h2 id="working" className="label" style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
            Working for you
          </h2>
          <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0", display: "grid", gap: 12 }}>
            {profile.working_for_you.map((line, i) => (
              <li key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <Stamp kind="yes" rotate={-3}>
                  {`0${i + 1}`}
                </Stamp>
                <span style={{ fontSize: 18 }}>{line}</span>
              </li>
            ))}
          </ul>
        </section>

        <section style={{ marginTop: 32 }} aria-labelledby="upgrade">
          <h2 id="upgrade" className="label" style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
            One upgrade
          </h2>
          <p style={{ fontSize: 18, margin: "8px 0 0" }}>{profile.stop_buying}</p>
        </section>

        <section style={{ marginTop: 32 }} aria-labelledby="palette">
          <h2 id="palette" className="label" style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
            Your palette
          </h2>
          <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0", display: "flex", gap: 8, flexWrap: "wrap" }}>
            {profile.palette.map((hex) => (
              <li key={hex} className="group" style={{ position: "relative" }}>
                <span
                  tabIndex={0}
                  title={hex.toUpperCase()}
                  aria-label={`Colour ${hex.toUpperCase()}`}
                  style={{
                    display: "block",
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    background: hex,
                    border: "2px solid var(--ink)",
                  }}
                />
                <span
                  className="label pointer-events-none absolute left-0 top-full z-10 mt-1 hidden whitespace-nowrap rounded px-2 py-1 group-hover:block group-focus-within:block"
                  style={{ background: "var(--ink)", color: "#fff" }}
                >
                  {hex.toUpperCase()}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {lowConfidence && (
          <p style={{ marginTop: 24, color: "var(--ink-2)" }}>
            {profile.retake_hint ?? "The light made this read less certain."}{" "}
            <Link href={retakeHref} style={{ fontWeight: 600 }}>
              Retake in daylight
            </Link>
          </p>
        )}

        <section style={{ marginTop: 40 }} aria-label="Share">
          <ShareBlock token={token} door={qw.door} title={`${profile.archetype}, ${label.toLowerCase()} · fitso`} />
        </section>

        <section id="price" style={{ marginTop: 56 }} aria-label="Price">
          <PriceBlock
            token={token}
            door={qw.door}
            currency={currency}
            price={price}
            otherCurrencyHref={`/r/${token}?cur=${otherCur}#price`}
          />
        </section>

        <section style={{ marginTop: 56 }} aria-labelledby="verdict">
          <h2 id="verdict" style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)" }}>
            One free verdict
          </h2>
          {owner && canSpendCredit(qw.verdict_credits) && (
            <>
              <p>One free verdict. Screenshot something you&apos;re thinking of buying.</p>
              <Button door={qw.door} href={`/r/${token}/verdict`}>
                Check an item
              </Button>
            </>
          )}
          {owner && lastVerdict && (
            <div>
              <p style={{ color: "var(--ink-2)" }}>You used your free verdict. Here is what it said.</p>
              <VerdictView verdict={lastVerdict} />
            </div>
          )}
          {!owner && (
            <p>
              One free verdict. Screenshot something you&apos;re thinking of buying.{" "}
              <Link href={retakeHref}>Get yours</Link>
            </p>
          )}
        </section>
      </Container>
    </div>
  );
}
