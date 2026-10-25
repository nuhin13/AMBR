"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { LOCALE_LABEL, LOCALE_SHORT, LOCALES, localePath, stripLocale, fmt } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/utils";

type Props = { className?: string; tone?: "light" | "dark"; full?: boolean };

/** Switches language while staying on the equivalent page (path, filters and query preserved). */
export function LanguageSwitch(props: Props) {
  // useSearchParams needs a Suspense boundary on statically rendered pages; the fallback keeps the path only.
  return (
    <Suspense fallback={<Switch {...props} search="" />}>
      <SwitchWithQuery {...props} />
    </Suspense>
  );
}

function SwitchWithQuery(props: Props) {
  const search = useSearchParams()?.toString() ?? "";
  return <Switch {...props} search={search} />;
}

function Switch({ className, tone = "light", full, search }: Props & { search: string }) {
  const { locale, t } = useI18n();
  const pathname = usePathname() ?? "/";
  const base = stripLocale(pathname);
  return (
    <nav aria-label={t.common.language} className={cn("flex items-center gap-1 text-[12px]", className)}>
      {LOCALES.map((l, i) => (
        <span key={l} className="flex items-center gap-1">
          {i > 0 && <span aria-hidden className={tone === "light" ? "text-cream/40" : "text-burgundy/30"}>/</span>}
          {l === locale ? (
            <span aria-current="true" lang={l} className={cn("px-0.5 font-semibold", tone === "light" ? "text-cream" : "text-burgundy")}>
              {full ? LOCALE_LABEL[l] : LOCALE_SHORT[l]}
            </span>
          ) : (
            <Link
              href={`${localePath(l, base)}${search ? `?${search}` : ""}`}
              hrefLang={l === "bn" ? "bn-BD" : "en"}
              lang={l}
              title={fmt(t.common.switchTo, { language: LOCALE_LABEL[l] })}
              className={cn("px-0.5 transition-colors", tone === "light" ? "text-cream/65 hover:text-cream" : "text-burgundy/60 hover:text-burgundy")}
            >
              {full ? LOCALE_LABEL[l] : LOCALE_SHORT[l]}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
