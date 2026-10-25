import type { Metadata, Viewport } from "next";
import { ToastProvider } from "@/components/ui/toast";
import { I18nProvider } from "@/i18n/client";
import { getDictionary } from "@/i18n/server";
import { fontVariables } from "../fonts";
import "../globals.css";

/** Separate root layout: the admin stays in English and keeps its own visual design. */
export const metadata: Metadata = { robots: { index: false, follow: false } };
export const viewport: Viewport = { themeColor: "#4A1022", width: "device-width", initialScale: 1 };

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariables}>
      <body className="flex min-h-dvh flex-col">
        <I18nProvider locale="en" t={getDictionary("en")}>
          <ToastProvider>{children}</ToastProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
