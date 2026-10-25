import type { ReactNode } from "react";
import { getT } from "@/i18n/server";
import { localePath } from "@/i18n/config";
import { siteUrl } from "@/lib/env";
import { JsonLd } from "@/components/seo/json-ld";
import { LLink } from "@/components/i18n/llink";
import { Kicker } from "@/components/editorial/kicker";
import { cn } from "@/lib/utils";

export type Crumb = { href?: string; label: string };

export async function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  const { t, locale } = await getT();
  const all: Crumb[] = [{ href: "/", label: t.common.home }, ...items];
  return (
    <>
      <nav aria-label="Breadcrumb" className={cn("text-[12px] text-muted", className)}>
        <ol className="flex flex-wrap items-center gap-1.5">
          {all.map((c, i) => (
            <li key={i} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden className="text-rose">/</span>}
              {c.href && i < all.length - 1 ? (
                <LLink href={c.href} className="hover:text-burgundy">{c.label}</LLink>
              ) : (
                <span aria-current="page" className="text-charcoal">{c.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: all.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.label, ...(c.href ? { item: `${siteUrl}${localePath(locale, c.href)}` } : {}) })),
        }}
      />
    </>
  );
}

/**
 * Editorial page opener: no band, no border — oversized title with breathing room.
 * `aside` renders to the right on desktop (e.g. a count or a CTA).
 */
export async function PageIntro({
  kicker,
  title,
  text,
  crumbs,
  aside,
  children,
  lang,
}: {
  kicker?: ReactNode;
  title: ReactNode;
  text?: ReactNode;
  crumbs?: Crumb[];
  aside?: ReactNode;
  children?: ReactNode;
  lang?: string;
}) {
  return (
    <div className="container-wide pb-8 pt-6 md:pb-14 md:pt-8" lang={lang}>
      {crumbs && <Breadcrumbs items={crumbs} />}
      <div className="mt-10 grid gap-6 md:mt-16 md:grid-cols-12 md:items-end">
        <div className="md:col-span-8">
          {kicker && <Kicker className="mb-5">{kicker}</Kicker>}
          <h1 className="t-h1">{title}</h1>
          {text && <div className="t-lead measure mt-5 text-muted">{text}</div>}
          {children}
        </div>
        {aside && <div className="md:col-span-4 md:text-right">{aside}</div>}
      </div>
    </div>
  );
}
