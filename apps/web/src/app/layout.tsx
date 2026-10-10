import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, Spline_Sans_Mono, Unbounded } from "next/font/google";
import "./globals.css";
import { PostHogProvider } from "@/components/analytics/PostHogProvider";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

const unbounded = Unbounded({
  subsets: ["latin"],
  weight: ["700", "900"],
  variable: "--font-unbounded",
  display: "swap",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hanken",
  display: "swap",
});

const splineMono = Spline_Sans_Mono({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-spline-mono",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const description =
  "Upload one selfie. Find out which colours and clothes are actually working for you. A clear yes or no before you buy.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "fitso: know what's working for you", template: "%s · fitso" },
  description,
  applicationName: "fitso",
  openGraph: {
    type: "website",
    siteName: "fitso",
    locale: "en_IN",
    title: "fitso: know what's working for you",
    description,
    url: "/",
  },
  twitter: { card: "summary_large_image", title: "fitso", description },
};

export const viewport: Viewport = {
  themeColor: "#FFFDF8",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${unbounded.variable} ${hanken.variable} ${splineMono.variable}`}
    >
      <body className="flex min-h-screen flex-col">
        <PostHogProvider>
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </PostHogProvider>
      </body>
    </html>
  );
}
