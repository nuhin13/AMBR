import Link from "next/link";
import Image from "next/image";
import { requirePermission } from "@/modules/auth/rbac";
import { listProductsAdmin, productFormOptions } from "@/modules/catalog/admin-queries";
import { TranslationBadge } from "@/components/admin/translation-editor";
import { trStatus } from "@/modules/translations/admin-queries";
import { setProductStatusAction } from "@/modules/catalog/admin-actions";
import { formatBDT } from "@/lib/money";
import { PageHeader, Table, Th, Td, EmptyRow, Pagination, FilterBar, FilterInput, FilterSelect } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/action-form";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Products" };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requirePermission("catalog:manage");
  const sp = await searchParams;
  const [{ products, total, page, pages }, { categories }] = await Promise.all([listProductsAdmin(sp), productFormOptions()]);
  return (
    <>
      <PageHeader title="Products" description="Create fragrances, set sizes and prices, and publish them to the store." actions={<ButtonLink href="/admin/products/new" size="sm">New product</ButtonLink>} />
      <FilterBar basePath="/admin/products">
        <FilterInput label="Search" name="q" defaultValue={sp.q} placeholder="Name or SKU" className="flex-1" />
        <FilterSelect label="Category" name="category" defaultValue={sp.category} options={categories.map((c) => ({ value: c.id, label: c.name }))} />
        <FilterSelect label="Status" name="status" defaultValue={sp.status} options={[{ value: "PUBLISHED", label: "Published" }, { value: "DRAFT", label: "Draft" }, { value: "ARCHIVED", label: "Archived" }]} />
        <FilterSelect label="Stock" name="stock" defaultValue={sp.stock} options={[{ value: "low", label: "Low stock" }, { value: "out", label: "Has sold-out sizes" }]} />
        <FilterSelect label="Demo" name="demo" defaultValue={sp.demo} options={[{ value: "1", label: "Demo only" }]} />
      </FilterBar>
      <Table>
        <thead><tr><Th>Product</Th><Th>Category</Th><Th>Status</Th><Th>বাংলা</Th><Th align="right">Price</Th><Th align="right">Sellable</Th><Th /></tr></thead>
        <tbody>
          {products.length === 0 && <EmptyRow colSpan={7}>No products found. <Link href="/admin/products/new" className="text-burgundy underline">Create one</Link>.</EmptyRow>}
          {products.map((p) => (
            <tr key={p.id} className="hover:bg-cream-light">
              <Td>
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-10 shrink-0 bg-beige">{p.images[0] && <Image src={p.images[0].url} alt="" fill sizes="40px" className="object-cover" />}</div>
                  <div>
                    <Link href={`/admin/products/${p.id}`} className="font-medium text-burgundy hover:underline">{p.name}</Link>
                    <div className="mt-0.5 flex flex-wrap gap-1">
                      {p.families[0] && <span className="text-[11.5px] text-muted">{p.families[0].family.name}</span>}
                      {p.isDemo && <Badge tone="gold">Demo</Badge>}
                      {p.isBestSeller && <Badge tone="beige">Best seller</Badge>}
                      {p.isNewArrival && <Badge tone="beige">New</Badge>}
                    </div>
                  </div>
                </div>
              </Td>
              <Td>{p.category.name}{p.category.status !== "ACTIVE" && <span className="ml-1 text-[11px] text-muted">(hidden)</span>}</Td>
              <Td><Badge tone={p.status === "PUBLISHED" ? "success" : p.status === "DRAFT" ? "gold" : "outline"}>{p.status.toLowerCase()}</Badge></Td>
              <Td><TranslationBadge status={trStatus(p.translations[0])} /></Td>
              <Td align="right">{p.minPrice === null ? "—" : p.minPrice === p.maxPrice ? formatBDT(p.minPrice) : `${formatBDT(p.minPrice)}–${formatBDT(p.maxPrice!)}`}</Td>
              <Td align="right">
                {p.sellable}
                {(p.soldOutSizes > 0 || p.lowSizes > 0) && <div className="text-[11px] text-error">{p.soldOutSizes ? `${p.soldOutSizes} sold out` : `${p.lowSizes} low`}</div>}
              </Td>
              <Td align="right">
                {p.status === "PUBLISHED" ? (
                  <ActionButton action={setProductStatusAction} fields={{ id: p.id, status: "DRAFT" }} variant="ghost" confirm={`Unpublish ${p.name}? It will disappear from the site.`}>Unpublish</ActionButton>
                ) : p.status === "DRAFT" ? (
                  <ActionButton action={setProductStatusAction} fields={{ id: p.id, status: "PUBLISHED" }} variant="ghost">Publish</ActionButton>
                ) : null}
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Pagination page={page} pages={pages} total={total} params={sp} basePath="/admin/products" />
    </>
  );
}
