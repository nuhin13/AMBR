import { Suspense } from "react";
import { ProductGrid } from "@/components/product/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { getActiveCategories, getFamilies, getOccasions, getPriceBounds, listProducts, type ProductFilters } from "@/modules/catalog/queries";
import { parseFilters, type RawSearchParams } from "@/modules/catalog/params";
import { ActiveFilters, CatalogToolbar, FilterSidebar, type FilterOptions } from "./filter-panel";
import { Pagination } from "./pagination";

/** Shared listing used by /shop, category, collection, discover and search pages. */
export async function CatalogView({
  searchParams,
  base = {},
  basePath,
  hide,
  showCategories,
}: {
  searchParams: RawSearchParams;
  base?: Partial<ProductFilters>;
  basePath: string;
  hide?: FilterOptions["hide"];
  showCategories?: boolean;
}) {
  const filters = parseFilters(searchParams);
  const merged = { ...filters, ...base, families: base.families ?? filters.families, occasions: base.occasions ?? filters.occasions };
  const [result, families, occasions, bounds, categories] = await Promise.all([
    listProducts(merged),
    getFamilies(),
    getOccasions(),
    getPriceBounds(),
    showCategories ? getActiveCategories() : Promise.resolve([]),
  ]);
  const options: FilterOptions = {
    families: families.map((f) => ({ slug: f.slug, name: f.name, count: f._count.products })),
    occasions: occasions.map((o) => ({ slug: o.slug, name: o.name, count: o._count.products })),
    categories: categories.filter((c) => c.slug === "perfumes" || c.slug === "attar").map((c) => ({ slug: c.slug, name: c.name, count: c._count.products })),
    priceBounds: { min: Math.floor(bounds.min / 100), max: Math.ceil(bounds.max / 100) },
    hide,
  };
  const labels = [
    ...filters.families!.map((s) => ({ key: "family", value: s, label: families.find((f) => f.slug === s)?.name ?? s })),
    ...filters.occasions!.map((s) => ({ key: "occasion", value: s, label: occasions.find((o) => o.slug === s)?.name ?? s })),
    ...(filters.minPrice !== undefined ? [{ key: "min", value: "", label: `From ৳${filters.minPrice / 100}` }] : []),
    ...(filters.maxPrice !== undefined ? [{ key: "max", value: "", label: `Up to ৳${filters.maxPrice / 100}` }] : []),
    ...(filters.inStock ? [{ key: "stock", value: "", label: "In stock" }] : []),
    ...(filters.newArrivals ? [{ key: "new", value: "", label: "New arrivals" }] : []),
  ].filter((l) => !(hide ?? []).includes(l.key as "family" | "occasion"));

  return (
    <div className="grid gap-10 lg:grid-cols-[240px_1fr] lg:gap-14">
      <Suspense>
        <FilterSidebar options={options} />
      </Suspense>
      <div>
        <Suspense>
          <CatalogToolbar options={options} total={result.total} />
          <ActiveFilters labels={labels} />
        </Suspense>
        {result.items.length > 0 ? (
          <>
            <ProductGrid products={result.items} layout={filters.view} priorityCount={4} />
            <Pagination page={result.page} pages={result.pages} basePath={basePath} params={searchParams} />
          </>
        ) : (
          <EmptyState
            title="No fragrances match"
            description="Try removing a filter or two — or let us help you find something you'll love."
            action={<ButtonLink href="/discover" variant="secondary">Find your fragrance</ButtonLink>}
          />
        )}
      </div>
    </div>
  );
}
