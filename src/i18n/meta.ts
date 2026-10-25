import "server-only";
import type { Metadata } from "next";
import { siteUrl } from "@/lib/env";
import { LOCALES, OG_LOCALE, localePath, type Locale } from "./config";

/** Canonical + hreflang alternates for a storefront path (without locale prefix). */
export function localeAlternates(locale: Locale, path: string): Metadata["alternates"] {
  const languages: Record<string, string> = {};
  for (const l of LOCALES) languages[l === "bn" ? "bn-BD" : "en"] = `${siteUrl}${localePath(l, path)}`;
  languages["x-default"] = `${siteUrl}${localePath("en", path)}`;
  return { canonical: `${siteUrl}${localePath(locale, path)}`, languages };
}

export const ogLocale = (locale: Locale) => ({ locale: OG_LOCALE[locale], alternateLocale: LOCALES.filter((l) => l !== locale).map((l) => OG_LOCALE[l]) });
