import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { ProductGrid } from "@/components/product/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { getCollectionBySlug, getCollectionProducts } from "@/modules/catalog/queries";

export const revalidate = 300;

export async function generateMetadata(props: PageProps<"/collections/[slug]">) {
  const { slug } = await props.params;
  const c = await getCollectionBySlug(slug);
  if (!c) return { title: "Not found" };
  return { title: c.name, description: c.description ?? `The ${c.name} by AMBR.`, alternates: { canonical: `/collections/${slug}` } };
}

export default async function CollectionPage(props: PageProps<"/collections/[slug]">) {
  const { slug } = await props.params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) notFound();
  const products = await getCollectionProducts(collection.id);
  return (
    <>
      <PageHeader crumbs={[{ href: "/collections", label: "Collections" }, { label: collection.name }]} eyebrow="Collection" title={collection.name} description={collection.description} />
      <div className="container-x py-12 md:py-16">
        {products.length ? <ProductGrid products={products} priorityCount={4} /> : <EmptyState title="Nothing here yet" description="This collection is being refreshed. Please check back soon." />}
      </div>
    </>
  );
}
