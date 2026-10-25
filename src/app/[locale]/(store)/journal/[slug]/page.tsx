import Image from "next/image";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/page-intro";
import { localizeHtmlLinks } from "@/components/layout/content-page";
import { JsonLd } from "@/components/seo/json-ld";
import { getArticle } from "@/modules/content/queries";
import { getT } from "@/i18n/server";
import { fmt, localePath } from "@/i18n/config";
import { formatDateL, formatNumber } from "@/i18n/format";
import { localeAlternates } from "@/i18n/meta";
import { siteUrl } from "@/lib/env";

export const revalidate = 300;

export async function generateMetadata(props: PageProps<"/[locale]/journal/[slug]">) {
  const { slug } = await props.params;
  const { locale } = await getT();
  const a = await getArticle(slug, locale);
  if (!a) return { title: "Not found" };
  return { title: a.seoTitle ?? a.title, description: a.seoDescription ?? a.excerpt, alternates: localeAlternates(locale, `/journal/${slug}`), openGraph: { type: "article", images: a.coverImage ? [a.coverImage] : undefined } };
}

export default async function ArticlePage(props: PageProps<"/[locale]/journal/[slug]">) {
  const { slug } = await props.params;
  const { t, locale } = await getT();
  const a = await getArticle(slug, locale);
  if (!a) notFound();
  const fallback = a.lang !== locale;
  return (
    <article className="pb-28">
      <div className="container-wide pt-6 md:pt-8">
        <Breadcrumbs items={[{ href: "/journal", label: t.nav.journal }, { label: a.title }]} />
        <header className="mt-12 md:mt-20 md:grid md:grid-cols-12" lang={fallback ? a.lang : undefined}>
          <div className="md:col-span-9 md:col-start-2">
            <p className="eyebrow text-burgundy/60" lang={locale}>
              {a.publishedAt && formatDateL(a.publishedAt, locale)} · {fmt(t.pages.minRead, { count: formatNumber(a.readMinutes, locale) })}
              {a.authorName && ` · ${fmt(t.pages.by, { name: a.authorName })}`}
            </p>
            <h1 className="t-display mt-6">{a.title}</h1>
            <p className="t-lead mt-6 max-w-2xl text-muted">{a.excerpt}</p>
          </div>
        </header>
      </div>
      {a.coverImage && (
        <div className="container-wide mt-14">
          <div className="relative aspect-[16/9] overflow-hidden"><Image src={a.coverImage} alt={a.coverAlt ?? ""} fill priority sizes="100vw" className="object-cover" /></div>
        </div>
      )}
      <div className="container-wide mt-14 md:grid md:grid-cols-12" lang={fallback ? a.lang : undefined}>
        <div className="md:col-span-7 md:col-start-4">
          {fallback && <p className="mb-8 text-[13px] italic text-muted" lang={locale}>{t.common.englishOnlyNote}</p>}
          <div className="prose-ambr prose-lg" dangerouslySetInnerHTML={{ __html: localizeHtmlLinks(a.body, locale) }} />
        </div>
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: a.title,
          description: a.excerpt,
          inLanguage: a.lang === "bn" ? "bn-BD" : "en",
          datePublished: a.publishedAt?.toISOString(),
          dateModified: a.updatedAt.toISOString(),
          author: { "@type": "Organization", name: a.authorName ?? "AMBR" },
          publisher: { "@type": "Organization", name: "AMBR", logo: { "@type": "ImageObject", url: `${siteUrl}/brand/ambr-logo-cream-720.png` } },
          mainEntityOfPage: `${siteUrl}${localePath(locale, `/journal/${slug}`)}`,
          ...(a.coverImage ? { image: a.coverImage } : {}),
        }}
      />
    </article>
  );
}
