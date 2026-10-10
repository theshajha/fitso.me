import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Container } from "@/components/brand/Container";
import { Button } from "@/components/brand/Button";
import { loadPublicQuickWin } from "@/features/profile/repo";
import { isOwner } from "@/features/profile/owner";
import { TrackOnMount } from "@/features/profile/TrackOnMount";
import { ownerCookieName } from "@/lib/owner-cookie";
import { loadLastVerdict } from "@/features/verdict/repo";
import { canSpendCredit } from "@/features/verdict/credits";
import { VerdictFlow } from "@/features/verdict/VerdictFlow";
import { VerdictView } from "@/features/verdict/VerdictView";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your free verdict", robots: { index: false } };

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const qw = await loadPublicQuickWin(token);
  if (!qw) notFound();
  const jar = await cookies();
  const owner = isOwner(token, jar.get(ownerCookieName(token))?.value);

  if (!owner) {
    return (
      <div data-door={qw.door}>
        <Container className="section">
          <p className="label" style={{ margin: 0 }}>
            This is someone&apos;s fitso result.
          </p>
          <h1 style={{ marginTop: 12 }}>Get yours</h1>
          <p>The free verdict belongs to the person who made this result. Make your own, then check what you plan to buy.</p>
          <Button door={qw.door} size="lg" href={`/start?door=${qw.door}`}>
            Generate my personal style
          </Button>
        </Container>
      </div>
    );
  }

  const last = canSpendCredit(qw.verdict_credits) ? null : await loadLastVerdict(qw.id);

  return (
    <div data-door={qw.door}>
      <Container className="section">
        <p className="label" style={{ margin: 0 }}>
          <Link href={`/r/${token}`}>Back to your result</Link>
        </p>
        <h1 style={{ marginTop: 12, fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>One free verdict</h1>
        <p style={{ color: "var(--ink-2)" }}>
          Screenshot something you&apos;re thinking of buying. We check it against your face and your colours.
        </p>
        <div style={{ marginTop: 24 }}>
          {canSpendCredit(qw.verdict_credits) ? (
            <VerdictFlow token={token} door={qw.door} />
          ) : last ? (
            <>
              <TrackOnMount event="verdict_viewed" props={{ verdict: last.verdict }} />
              <VerdictView verdict={last} />
              <p style={{ marginTop: 24, color: "var(--ink-2)" }}>You used your free verdict.</p>
            </>
          ) : (
            <p>You used your free verdict.</p>
          )}
        </div>
        <p style={{ marginTop: 40, fontWeight: 600 }}>
          Want this on everything you&apos;re about to buy? The Style Report comes with ten.{" "}
          <Link href={`/r/${token}#price`}>See the price</Link>
        </p>
      </Container>
    </div>
  );
}
