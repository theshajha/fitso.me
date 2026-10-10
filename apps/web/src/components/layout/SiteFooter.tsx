import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";

export function SiteFooter() {
  return (
    <footer>
      <div className="container flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between">
        <Link href="/" aria-label="fitso home" className="no-underline">
          <Wordmark size={28} />
        </Link>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 font-semibold">
          <Link href="/#pricing">Pricing</Link>
          <Link href="/guides">Guides</Link>
          <Link href="/tools">Tools</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </nav>
      </div>
    </footer>
  );
}
