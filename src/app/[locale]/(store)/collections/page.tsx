import type { Metadata } from "next";
import Image from "next/image";
import { PageIntro } from "@/components/layout/page-intro";
import { EmptyState } from "@/components/ui/empty-state";
import { LLink } from "@/components/i18n/llink";
import { getPublishedCollections } from "@/modules/catalog/queries";
import { getT } from "@/i18n/server";
import { fmt } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { localeAlternates } from "@/i18n/meta";
import { cn } from "@/lib/utils";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const { t, locale } = await getT();
  return { title: t.meta.collections, description: t.meta.collectionsDescription, alternates: localeAlternates(locale, "/collections") };
}

/** Collections as an editorial index: alternating image/typographic rows, no tiles-in-a-grid. */
export default async function CollectionsPage() {
  const { t, locale } = await getT();
  const collections = (await getPublishedCollections(locale)).filter((c) => c._count.products > 0);
  return (
    <>
      <PageIntro crumbs={[{ label: t.nav.collections }]} kicker={t.catalog.collectionsKicker} title={t.meta.collections} text={t.catalog.collectionsIntro} />
      <div className="container-wide pb-28">
        {collections.length === 0 ? (
          <EmptyState title={t.catalog.collectionsEmpty} />
        ) : (
          <ol className="border-t border-burgundy/12">
            {collections.map((c, i) => (
              <li key={c.id} className="reveal border-b border-burgundy/12">
                <LLink href={`/collections/${c.slug}`} className="group grid items-center gap-5 py-8 md:grid-cols-12 md:gap-8 md:py-10">
                  <span className="font-serif text-[15px] italic text-rose md:col-span-1">{formatNumber(i + 1, locale).padStart(2, locale === "bn" ? "০" : "0")}</span>
                  <span className="md:col-span-6">
                    <span className="t-h2 block transition-colors group-hover:text-burgundy-soft">{c.name}</span>
                    {c.description && <span className="mt-2 block text-[15px] text-muted">{c.description}</span>}
                  </span>
                  <span className="eyebrow text-burgundy/60 md:col-span-2">{fmt(c._count.products === 1 ? t.common.fragrances_one : t.common.fragrances_other, { count: formatNumber(c._count.products, locale) })}</span>
                  <span className={cn("relative hidden aspect-[3/2] overflow-hidden md:col-span-3 md:block", !c.imageUrl && (i % 2 ? "bg-beige" : "bg-burgundy"))}>
                    {c.imageUrl && <Image src={c.imageUrl} alt={c.imageAlt ?? c.name} fill sizes="25vw" className="img-zoom object-cover" />}
                  </span>
                </LLink>
              </li>
            ))}
          </ol>
        )}
      </div>
    </>
  );
}
