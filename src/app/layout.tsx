import type { Metadata, Viewport } from "next";
import { Hind_Siliguri, Montserrat, Playfair_Display } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap", style: ["normal", "italic"] });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat", display: "swap" });
// Fallback for the Taka sign (৳) and future Bangla text — the Latin brand fonts don't include them.
const bengali = Hind_Siliguri({ subsets: ["bengali"], weight: ["400", "500", "600"], variable: "--font-bengali", display: "swap", preload: false });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "AMBR — Inspired Perfumes & Attars in Bangladesh", template: "%s · AMBR" },
  description: "Discover AMBR inspired perfumes and attars — thoughtfully composed fragrances at honest prices. Cash on delivery across Bangladesh.",
  applicationName: "AMBR",
  openGraph: { type: "website", siteName: "AMBR", locale: "en_BD", images: [{ url: "/images/og-default.jpg", width: 1200, height: 628, alt: "AMBR — Above Ordinary" }] },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = { themeColor: "#4A1022", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${montserrat.variable} ${bengali.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
