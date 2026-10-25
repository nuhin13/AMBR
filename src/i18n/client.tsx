"use client";

import { createContext, useContext, type ReactNode } from "react";
import { fmt, localePath, type Locale } from "./config";
import { formatPrice, formatSizeLabel } from "./format";
import type { Dictionary } from "./dictionaries/en";

type Ctx = { locale: Locale; t: Dictionary };
const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ locale, t, children }: Ctx & { children: ReactNode }) {
  return <I18nContext.Provider value={{ locale, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  const { locale, t } = ctx;
  return {
    locale,
    t,
    fmt,
    href: (path: string) => localePath(locale, path),
    price: (poisha: number) => formatPrice(poisha, locale),
    size: (label: string) => formatSizeLabel(label, locale),
  };
}
