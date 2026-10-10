import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { NAV_LINKS } from "./SiteHeader";

export function SiteFooter() {
  return (
    <footer style={{ borderTop: "1px solid var(--line)", marginTop: "var(--section-gap)" }}>
      <div className="container flex flex-col gap-8 py-12 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-3">
          <Wordmark size={24} />
          <p style={{ margin: 0, color: "var(--ink-2)" }}>
            Photos are deleted after your result. No fake scores.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="font-medium">
              {l.label}
            </Link>
          ))}
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </nav>
      </div>
    </footer>
  );
}
