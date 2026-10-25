import type { Metadata } from "next";
import { CatalogView } from "@/components/catalog/catalog-view";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Search", robots: { index: false, follow: true } };

export default async function SearchPage(props: PageProps<"/search">) {
  const sp = await props.searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim() ?? "";
  return (
    <>
      <PageHeader crumbs={[{ label: "Search" }]} eyebrow="Search" title={q ? <>Results for “{q}”</> : "Search"}>
        <form action="/search" role="search" className="mt-6 flex max-w-lg">
          <label htmlFor="q" className="sr-only">Search fragrances</label>
          <input id="q" name="q" defaultValue={q} placeholder="Name, note or family" className="h-12 flex-1 border border-r-0 border-beige bg-white px-4 focus:border-burgundy focus:outline-none" />
          <button className="h-12 bg-burgundy px-6 text-[12px] font-semibold uppercase tracking-[0.16em] text-cream">Search</button>
        </form>
      </PageHeader>
      <div className="container-x py-10 md:py-14">
        <CatalogView searchParams={sp} base={{ q }} basePath="/search" showCategories />
      </div>
    </>
  );
}
