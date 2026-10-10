import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { Button } from "@/components/brand/Button";

export const NAV_LINKS = [
  { href: "/guides", label: "Guides" },
  { href: "/tools", label: "Tools" },
  { href: "/#pricing", label: "Pricing" },
] as const;

export function SiteHeader() {
  return (
    <header style={{ borderBottom: "1px solid var(--line)", background: "var(--paper)" }}>
      <div className="container flex items-center justify-between gap-4 py-4">
        <Link href="/" aria-label="fitso home" className="no-underline">
          <Wordmark size={26} />
        </Link>

        <nav aria-label="Main" className="flex items-center gap-4 md:gap-6">
          <Link href="/#pricing" className="text-sm font-medium no-underline hover:underline md:text-base">
            Pricing
          </Link>
          <Button href="/start" size="sm" style={{ background: "var(--ink)", border: "2px solid var(--ink)", color: "var(--paper)" }}>
            <span className="md:hidden">Start</span>
            <span className="hidden md:inline">Generate my personal style</span>
          </Button>
        </nav>
      </div>
    </header>
  );
}
