import type { Metadata } from "next";
import { DoorLanding } from "@/components/brand/DoorLanding";

export const metadata: Metadata = {
  title: "Your palette, your shape, your occasions. For women",
  description:
    "Upload one selfie and answer five questions. Get your colour season, your three strengths and an honest answer before you buy. Photos deleted after the result.",
  alternates: { canonical: "/women" },
  openGraph: { url: "/women", title: "fitso for women: your palette, your shape, your occasions" },
};

export default function Page() {
  return <DoorLanding door="women" />;
}
