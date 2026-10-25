import { notFound } from "next/navigation";
import { PageIntro } from "@/components/layout/page-intro";
import { ProductGrid } from "@/components/product/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { getCollectionBySlug, getCollectionProducts } from "@/modules/catalog/queries";
import { getT } from "@/i18n/server";
import { localeAlternates } from "@/i18n/meta";

export const revalidate = 300;

export async function generateMetadata(props: PageProps<"/[locale]/collections/[slug]">) {
  const { slug } = await props.params;
  const { locale } = await getT();
  const c = await getCollectionBySlug(slug, locale);
  if (!c) return { title: "Not found" };
  return { title: c.name, description: c.description ?? undefined, alternates: localeAlternates(locale, `/collections/${slug}`) };
}

export default async function CollectionPage(props: PageProps<"/[locale]/collections/[slug]">) {
  const { slug } = await props.params;
  const { t, locale } = await getT();
  const collection = await getCollectionBySlug(slug, locale);
  if (!collection) notFound();
  const products = await getCollectionProducts(collection.id, locale);
  return (
    <>
      <PageIntro crumbs={[{ href: "/collections", label: t.nav.collections }, { label: collection.name }]} kicker={t.nav.collections} title={collection.name} text={collection.description} lang={collection.lang !== locale ? collection.lang : undefined} />
      <div className="container-wide pb-28">
        {products.length ? <ProductGrid products={products} priorityCount={4} /> : <EmptyState title={t.catalog.collectionEmpty} />}
      </div>
    </>
  );
}
