import type { Metadata } from "next";
import Image from "next/image";
import { PageIntro } from "@/components/layout/page-intro";
import { EmptyState } from "@/components/ui/empty-state";
import { LLink } from "@/components/i18n/llink";
import { getArticles } from "@/modules/content/queries";
import { getT } from "@/i18n/server";
import { fmt } from "@/i18n/config";
import { formatDateL, formatNumber } from "@/i18n/format";
import { localeAlternates } from "@/i18n/meta";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const { t, locale } = await getT();
  return { title: t.meta.journal, description: t.meta.journalDescription, alternates: localeAlternates(locale, "/journal") };
}

export default async function JournalPage() {
  const { t, locale } = await getT();
  const articles = await getArticles(locale);
  return (
    <>
      <PageIntro crumbs={[{ label: t.nav.journal }]} kicker={t.pages.journalKicker} title={t.pages.journalTitle} text={t.pages.journalIntro} />
      <div className="container-wide pb-28">
        {articles.length === 0 ? (
          <EmptyState title={t.pages.journalEmpty} />
        ) : (
          <ol className="border-t border-burgundy/12">
            {articles.map((a) => (
              <li key={a.slug} className="reveal border-b border-burgundy/12" lang={a.lang !== locale ? a.lang : undefined}>
                <LLink href={`/journal/${a.slug}`} className="group grid gap-6 py-10 md:grid-cols-12 md:gap-10 md:py-14">
                  <span className="md:col-span-7">
                    <span className="eyebrow block text-burgundy/60" lang={locale}>
                      {a.publishedAt && formatDateL(a.publishedAt, locale)} · {fmt(t.pages.minRead, { count: formatNumber(a.readMinutes, locale) })}
                    </span>
                    <span className="t-h2 mt-4 block transition-colors group-hover:text-burgundy-soft">{a.title}</span>
                    <span className="t-lead mt-4 block text-muted">{a.excerpt}</span>
                  </span>
                  {a.coverImage && (
                    <span className="relative block aspect-[3/2] overflow-hidden md:col-span-4 md:col-start-9">
                      <Image src={a.coverImage} alt={a.coverAlt ?? ""} fill sizes="(min-width: 768px) 33vw, 100vw" className="img-zoom object-cover" />
                    </span>
                  )}
                </LLink>
              </li>
            ))}
          </ol>
        )}
      </div>
    </>
  );
}
