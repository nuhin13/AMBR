import { notFound } from "next/navigation";
import { CatalogView } from "@/components/catalog/catalog-view";
import { PageHeader } from "@/components/layout/page-header";
import { getCategoryBySlug } from "@/modules/catalog/queries";
import type { RawSearchParams } from "@/modules/catalog/params";

/** Shared body for /perfumes, /attar and /category/[slug]. Hidden categories 404. */
export async function CategoryPage({ slug, basePath, searchParams }: { slug: string; basePath: string; searchParams: RawSearchParams }) {
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();
  return (
    <>
      <PageHeader crumbs={[{ href: "/shop", label: "Shop" }, { label: category.name }]} eyebrow={category.tagline ?? undefined} title={category.name} description={category.description} />
      <div className="container-x py-10 md:py-14">
        <CatalogView searchParams={searchParams} base={{ category: slug }} basePath={basePath} />
      </div>
    </>
  );
}

export async function categoryMetadata(slug: string, path: string) {
  const c = await getCategoryBySlug(slug);
  if (!c) return { title: "Not found" };
  return {
    title: c.name,
    description: c.description ?? `Shop AMBR ${c.name.toLowerCase()} — ${c.tagline ?? "thoughtfully composed fragrances"}. Cash on delivery across Bangladesh.`,
    alternates: { canonical: path },
  };
}
