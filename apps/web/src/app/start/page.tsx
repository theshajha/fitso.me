import type { Metadata } from "next";
import { Door } from "@fitso/core";
import { QuickWinFlow } from "@/features/profile/QuickWinFlow";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ door?: string | string[]; from?: string | string[] }>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export const metadata: Metadata = { title: "Generate your personal style", robots: { index: false } };

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const door = Door.safeParse(first(sp.door));
  const from = first(sp.from) ?? null;
  return <QuickWinFlow initialDoor={door.success ? door.data : null} from={from} />;
}
