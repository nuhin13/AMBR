import { Suspense } from "react";
import { ProductGrid } from "@/components/product/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { getFamilies, getOccasions, getPriceBounds, listProducts, type ProductFilters } from "@/modules/catalog/queries";
import { parseFilters, type RawSearchParams } from "@/modules/catalog/params";
import { getT } from "@/i18n/server";
import { fmt, localePath } from "@/i18n/config";
import { ActiveFilters, CatalogToolbar, FilterSidebar, type FilterOptions } from "./filter-panel";
import { Pagination } from "./pagination";

/** Shared catalogue listing for /shop, categories, collections, discover and search. */
export async function CatalogView({ searchParams, base = {}, basePath, hide }: { searchParams: RawSearchParams; base?: Partial<ProductFilters>; basePath: string; hide?: FilterOptions["hide"] }) {
  const { t, locale } = await getT();
  const filters = parseFilters(searchParams);
  const merged = { ...filters, ...base, families: base.families ?? filters.families, occasions: base.occasions ?? filters.occasions, genders: base.genders ?? filters.genders };
  const [result, families, occasions, bounds] = await Promise.all([listProducts(merged, locale), getFamilies(locale), getOccasions(locale), getPriceBounds()]);
  const options: FilterOptions = {
    families: families.map((f) => ({ slug: f.slug, name: f.name, count: f._count.products })),
    occasions: occasions.map((o) => ({ slug: o.slug, name: o.name, count: o._count.products })),
    priceBounds: { min: Math.floor(bounds.min / 100), max: Math.ceil(bounds.max / 100) },
    hide,
  };
  const genderSlug = { MASCULINE: "him", FEMININE: "her", UNISEX: "unisex" } as const;
  const labels = [
    ...filters.genders!.map((g) => ({ key: "for", value: genderSlug[g], label: t.labels.gender[g] })),
    ...filters.families!.map((s) => ({ key: "family", value: s, label: families.find((f) => f.slug === s)?.name ?? s })),
    ...filters.occasions!.map((s) => ({ key: "occasion", value: s, label: occasions.find((o) => o.slug === s)?.name ?? s })),
    ...filters.intensities!.map((i) => ({ key: "presence", value: { LIGHT: "soft", MODERATE: "moderate", STRONG: "bold" }[i], label: t.labels.intensity[i] })),
    ...filters.formats!.map((f) => ({ key: "format", value: f === "ROLL_ON" ? "roll-on" : f.toLowerCase(), label: t.labels.format[f] })),
    ...(filters.minPrice !== undefined ? [{ key: "min", value: "", label: fmt(t.catalog.fromPrice, { amount: filters.minPrice / 100 }) }] : []),
    ...(filters.maxPrice !== undefined ? [{ key: "max", value: "", label: fmt(t.catalog.upToPrice, { amount: filters.maxPrice / 100 }) }] : []),
    ...(filters.inStock ? [{ key: "stock", value: "", label: t.catalog.inStockOnly }] : []),
    ...(filters.newArrivals ? [{ key: "new", value: "", label: t.catalog.newArrivals }] : []),
  ].filter((l) => !(hide ?? []).includes(l.key as "family" | "occasion" | "for"));

  return (
    <div className="grid gap-10 lg:grid-cols-[220px_1fr] lg:gap-16 xl:grid-cols-[240px_1fr] xl:gap-20">
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
            <ProductGrid products={result.items} layout={filters.view} priorityCount={4} columns="three" />
            <Pagination page={result.page} pages={result.pages} basePath={localePath(locale, basePath)} params={searchParams} />
          </>
        ) : (
          <EmptyState title={t.catalog.emptyTitle} description={t.catalog.emptyText} action={<ButtonLink href={localePath(locale, "/discover")} variant="secondary">{t.nav.discover}</ButtonLink>} />
        )}
      </div>
    </div>
  );
}
