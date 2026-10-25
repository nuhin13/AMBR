import type { Metadata } from "next";
import { CatalogView } from "@/components/catalog/catalog-view";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "Shop All Fragrances",
  description: "Shop AMBR inspired perfumes and attars. Filter by fragrance family, occasion, season and price. Cash on delivery across Bangladesh.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage(props: PageProps<"/shop">) {
  const sp = await props.searchParams;
  return (
    <>
      <PageHeader crumbs={[{ label: "Shop" }]} eyebrow="The collection" title="Shop all fragrances" description="Inspired perfumes and attars, composed for every day and every you." />
      <div className="container-x py-10 md:py-14">
        <CatalogView searchParams={sp} basePath="/shop" showCategories />
      </div>
    </>
  );
}
