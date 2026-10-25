import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { ToastProvider } from "@/components/ui/toast";
import { I18nProvider } from "@/i18n/client";
import { isLocale, LOCALES } from "@/i18n/config";
import { getDictionary } from "@/i18n/server";
import { ogLocale } from "@/i18n/meta";
import { fontVariables } from "../fonts";
import "../globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata(props: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await props.params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return {
    metadataBase: new URL(siteUrl),
    title: { default: t.meta.defaultTitle, template: "%s · AMBR" },
    description: t.meta.defaultDescription,
    applicationName: "AMBR",
    openGraph: { type: "website", siteName: "AMBR", ...ogLocale(locale), images: [{ url: "/images/og-default.jpg", width: 1200, height: 628, alt: "AMBR — Above Ordinary" }] },
    twitter: { card: "summary_large_image" },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = { themeColor: "#4A1022", width: "device-width", initialScale: 1 };

export default async function LocaleRootLayout(props: LayoutProps<"/[locale]">) {
  const { locale } = await props.params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  return (
    <html lang={locale === "bn" ? "bn-BD" : "en"} className={fontVariables}>
      <body className="flex min-h-dvh flex-col">
        <I18nProvider locale={locale} t={t}>
          <ToastProvider>{props.children}</ToastProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
