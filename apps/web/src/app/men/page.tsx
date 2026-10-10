import type { Metadata } from "next";
import { DoorLanding } from "@/components/brand/DoorLanding";

export const metadata: Metadata = {
  title: "Fewer decisions. Better clothes. For men",
  description:
    "Upload one selfie and answer five questions. Get your colour season, your three strengths and an honest answer before you buy. Photos deleted after the result.",
  alternates: { canonical: "/men" },
  openGraph: { url: "/men", title: "fitso for men: fewer decisions, better clothes" },
};

export default function Page() {
  return <DoorLanding door="men" />;
}
