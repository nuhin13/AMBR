import type { Metadata } from "next";
import { PageIntro } from "@/components/layout/page-intro";
import { SignatureFinder } from "@/components/home/signature-finder";
import { LLink } from "@/components/i18n/llink";
import { getFamilies, getOccasions } from "@/modules/catalog/queries";
import { getT } from "@/i18n/server";
import { fmt } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { localeAlternates } from "@/i18n/meta";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const { t, locale } = await getT();
  return { title: t.meta.discover, description: t.meta.discoverDescription, alternates: localeAlternates(locale, "/discover") };
}

export default async function DiscoverPage() {
  const { t, locale } = await getT();
  const [families, occasions] = await Promise.all([getFamilies(locale), getOccasions(locale)]);
  return (
    <>
      <PageIntro crumbs={[{ label: t.nav.discover }]} kicker={t.finder.kicker} title={t.finder.title} text={t.finder.intro} />
      <div className="container-wide pb-24">
        <SignatureFinder
          families={families.filter((f) => f._count.products > 0).map((f) => ({ value: f.slug, label: f.name }))}
          occasions={occasions.filter((o) => o._count.products > 0).map((o) => ({ value: o.slug, label: o.name }))}
        />
        <section className="mt-28 border-t border-burgundy/12 pt-16" aria-labelledby="families-title">
          <h2 id="families-title" className="t-h2">{t.catalog.familiesTitle}</h2>
          <ul className="mt-10 grid gap-x-12 sm:grid-cols-2 lg:grid-cols-3">
            {families.map((f) => (
              <li key={f.id} className="border-b border-burgundy/12">
                <LLink href={`/discover/${f.slug}`} className="group block py-6">
                  <span className="flex items-baseline justify-between gap-4">
                    <span className="font-serif text-[26px] text-burgundy transition-colors group-hover:text-burgundy-soft">{f.name}</span>
                    <span className="eyebrow text-burgundy/50">{fmt(f._count.products === 1 ? t.common.fragrances_one : t.common.fragrances_other, { count: formatNumber(f._count.products, locale) })}</span>
                  </span>
                  <span className="mt-2 block text-[14px] leading-relaxed text-muted">{f.description}</span>
                </LLink>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
