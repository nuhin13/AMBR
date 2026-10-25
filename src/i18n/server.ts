import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { locale as rootLocale } from "next/root-params";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, LOCALE_HEADER, type Locale } from "./config";
import { en } from "./dictionaries/en";
import { bn } from "./dictionaries/bn";

const DICTS = { en, bn } as const;

export const getDictionary = (locale: Locale) => DICTS[locale];

/** Locale of the current page (Server Components) — from the [locale] root segment. */
export const getLocale = cache(async (): Promise<Locale> => {
  const l = await rootLocale();
  return isLocale(l) ? l : DEFAULT_LOCALE;
});

/**
 * Locale for Server Actions and Route Handlers, where root params aren't available:
 * the proxy forwards it as a request header; the cookie is the fallback.
 */
export async function getRequestLocale(): Promise<Locale> {
  try {
    const h = (await headers()).get(LOCALE_HEADER);
    if (isLocale(h)) return h;
    const c = (await cookies()).get(LOCALE_COOKIE)?.value;
    if (isLocale(c)) return c;
  } catch {
    /* outside a request */
  }
  return DEFAULT_LOCALE;
}

export async function getT() {
  const locale = await getLocale();
  return { locale, t: getDictionary(locale) };
}
