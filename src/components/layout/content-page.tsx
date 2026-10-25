import { notFound } from "next/navigation";
import { PageIntro } from "./page-intro";
import { getPage } from "@/modules/content/queries";
import { getT } from "@/i18n/server";
import { fmt, type Locale } from "@/i18n/config";
import { formatDateL } from "@/i18n/format";
import { localeAlternates } from "@/i18n/meta";

/** Prefix internal links in CMS HTML with the current locale (href="/shop" → href="/bn/shop"). */
export function localizeHtmlLinks(html: string, locale: Locale) {
  return html.replace(/href="\/(?!en\/|bn\/|en"|bn"|\/)/g, `href="/${locale}/`);
}

/** Renders an admin-editable ContentPage in the current language (English fallback, marked lang="en"). */
export async function ContentPageView({ slug, crumbs, kicker }: { slug: string; crumbs: { href?: string; label: string }[]; kicker?: string }) {
  const { t, locale } = await getT();
  const page = await getPage(slug, locale);
  if (!page) notFound();
  const fallback = page.lang !== locale;
  return (
    <>
      <PageIntro crumbs={crumbs} kicker={kicker} title={page.title} lang={fallback ? page.lang : undefined} />
      <div className="container-wide pb-24">
        <div className="md:grid md:grid-cols-12">
          <div className="md:col-span-8 md:col-start-4" lang={fallback ? page.lang : undefined}>
            {fallback && <p className="mb-8 text-[13px] italic text-muted" lang={locale}>{t.common.englishOnlyNote}</p>}
            <article className="prose-ambr prose-lg" dangerouslySetInnerHTML={{ __html: localizeHtmlLinks(page.body, locale) }} />
            <p className="mt-14 text-[12.5px] text-muted" lang={locale}>{fmt(t.pages.lastUpdated, { date: formatDateL(page.updatedAt, locale) })}</p>
          </div>
        </div>
      </div>
    </>
  );
}

export async function contentMetadata(slug: string, path: string) {
  const { locale } = await getT();
  const page = await getPage(slug, locale);
  return page ? { title: page.title, description: page.seoDescription ?? undefined, alternates: localeAlternates(locale, path) } : { title: "Not found" };
}
