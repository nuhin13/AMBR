import { notFound } from "next/navigation";
import { CatalogView } from "@/components/catalog/catalog-view";
import { PageHeader } from "@/components/layout/page-header";
import { getFamilies } from "@/modules/catalog/queries";

async function family(slug: string) {
  return (await getFamilies()).find((f) => f.slug === slug) ?? null;
}

export async function generateMetadata(props: PageProps<"/discover/[family]">) {
  const f = await family((await props.params).family);
  if (!f) return { title: "Not found" };
  return { title: `${f.name} Fragrances`, description: `${f.description} Shop ${f.name.toLowerCase()} perfumes and attars by AMBR.`, alternates: { canonical: `/discover/${f.slug}` } };
}

export default async function FamilyPage(props: PageProps<"/discover/[family]">) {
  const f = await family((await props.params).family);
  if (!f) notFound();
  return (
    <>
      <PageHeader crumbs={[{ href: "/discover", label: "Find your fragrance" }, { label: f.name }]} eyebrow="Fragrance family" title={f.name} description={f.description} />
      <div className="container-x py-10 md:py-14">
        <CatalogView searchParams={await props.searchParams} base={{ families: [f.slug] }} basePath={`/discover/${f.slug}`} hide={["family"]} showCategories />
      </div>
    </>
  );
}
