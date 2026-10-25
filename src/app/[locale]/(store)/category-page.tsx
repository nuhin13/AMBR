import { notFound } from "next/navigation";
import { CatalogView } from "@/components/catalog/catalog-view";
import { PageIntro } from "@/components/layout/page-intro";
import { getCategoryBySlug } from "@/modules/catalog/queries";
import type { RawSearchParams } from "@/modules/catalog/params";
import { getT } from "@/i18n/server";
import { localeAlternates } from "@/i18n/meta";

/** Shared body for /perfumes, /attar and /category/[slug]. Hidden categories 404. */
export async function CategoryPage({ slug, basePath, searchParams }: { slug: string; basePath: string; searchParams: RawSearchParams }) {
  const { t, locale } = await getT();
  const category = await getCategoryBySlug(slug, locale);
  if (!category) notFound();
  return (
    <>
      <PageIntro
        crumbs={[{ href: "/shop", label: t.nav.shop }, { label: category.name }]}
        kicker={category.tagline ?? undefined}
        title={category.name}
        text={category.description}
        lang={category.lang !== locale ? category.lang : undefined}
      />
      <div className="container-wide pb-24">
        <CatalogView searchParams={searchParams} base={{ category: slug }} basePath={basePath} />
      </div>
    </>
  );
}

export async function categoryMetadata(slug: string, path: string) {
  const { locale } = await getT();
  const c = await getCategoryBySlug(slug, locale);
  if (!c) return { title: "Not found" };
  return { title: c.name, description: c.description ?? c.tagline ?? undefined, alternates: localeAlternates(locale, path) };
}
