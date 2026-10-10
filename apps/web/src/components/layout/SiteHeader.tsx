import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { Button } from "@/components/brand/Button";

export const NAV_LINKS = [
  { href: "/men", label: "Men" },
  { href: "/women", label: "Women" },
  { href: "/guides", label: "Guides" },
  { href: "/tools", label: "Tools" },
  { href: "/pricing", label: "Pricing" },
] as const;

export function SiteHeader() {
  return (
    <header style={{ borderBottom: "1px solid var(--line)", background: "var(--paper)" }}>
      <div className="container flex items-center justify-between gap-4 py-4">
        <Link href="/" aria-label="fitso home" className="no-underline">
          <Wordmark size={26} />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="font-medium no-underline hover:underline">
              {l.label}
            </Link>
          ))}
          <Button href="/app/quick-win" size="sm">
            Find your season
          </Button>
        </nav>

        {/* Mobile: no-JS disclosure menu */}
        <details className="relative md:hidden">
          <summary
            className="label cursor-pointer list-none rounded-full px-4 py-2"
            style={{ border: "2px solid var(--ink)" }}
          >
            Menu
          </summary>
          <nav
            aria-label="Main"
            className="absolute right-0 z-20 mt-2 flex w-56 flex-col gap-1 rounded-2xl p-3"
            style={{ background: "var(--paper)", border: "1px solid var(--line)", boxShadow: "0 12px 32px rgba(20,18,27,0.12)" }}
          >
            {NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="rounded-lg px-3 py-2 font-medium no-underline hover:bg-black/5">
                {l.label}
              </Link>
            ))}
            <Button href="/app/quick-win" size="sm" className="mt-2">
              Find your season
            </Button>
          </nav>
        </details>
      </div>
    </header>
  );
}
