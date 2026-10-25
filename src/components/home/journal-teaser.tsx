import { getArticles } from "@/modules/content/queries";
import { getT } from "@/i18n/server";
import { fmt, localePath } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { SectionIntro } from "@/components/editorial/kicker";
import { ButtonLink } from "@/components/ui/button";
import { LLink } from "@/components/i18n/llink";

/** Typographic journal teaser: numbered entries separated by hairlines. Hidden without articles. */
export async function JournalTeaser({ title }: { title?: string | null }) {
  const { t, locale } = await getT();
  const articles = await getArticles(locale, 3);
  if (articles.length === 0) return null;
  return (
    <section className="section-y border-t border-burgundy/10" aria-labelledby="journal-title">
      <div className="container-wide">
        <SectionIntro id="journal-title" kicker={t.home.journalKicker} title={title ?? t.home.journalTitle} action={<ButtonLink href={localePath(locale, "/journal")} variant="quiet">{t.common.viewAll}</ButtonLink>} className="reveal" />
        <ol className="mt-12 md:mt-16">
          {articles.map((a, i) => (
            <li key={a.slug} className="reveal border-t border-burgundy/12 last:border-b" lang={a.lang !== locale ? a.lang : undefined}>
              <LLink href={`/journal/${a.slug}`} className="group grid gap-3 py-8 md:grid-cols-12 md:items-baseline md:gap-8 md:py-10">
                <span className="font-serif text-[15px] italic text-rose md:col-span-1" lang={locale}>{formatNumber(i + 1, locale).padStart(2, locale === "bn" ? "০" : "0")}</span>
                <span className="t-h3 transition-colors group-hover:text-burgundy-soft md:col-span-6">{a.title}</span>
                <span className="text-[14.5px] leading-relaxed text-muted md:col-span-4">{a.excerpt}</span>
                <span className="eyebrow text-burgundy/60 md:col-span-1 md:text-right" lang={locale}>{fmt(t.pages.minRead, { count: formatNumber(a.readMinutes, locale) })}</span>
              </LLink>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
