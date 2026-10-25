import Link from "next/link";
import { requirePermission } from "@/modules/auth/rbac";
import { inventoryReport } from "@/modules/reports/queries";
import { formatBDT } from "@/lib/money";
import { PageHeader, Table, Th, Td, EmptyRow, FilterBar, FilterInput, FilterSelect, StatCard } from "@/components/admin/ui";
import { StockAdjustButton } from "@/components/admin/stock-adjust";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Inventory" };

export default async function InventoryPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requirePermission("inventory:manage");
  const sp = await searchParams;
  let rows = await inventoryReport();
  const q = sp.q?.trim().toLowerCase();
  if (q) rows = rows.filter((r) => r.product.toLowerCase().includes(q) || r.sku.toLowerCase().includes(q));
  if (sp.state === "low") rows = rows.filter((r) => r.state !== "OK");
  if (sp.state === "out") rows = rows.filter((r) => r.state === "Out of stock");
  if (!sp.archived) rows = rows.filter((r) => r.variantStatus === "ACTIVE" && r.productStatus !== "ARCHIVED");
  const totals = rows.reduce((t, r) => ({ units: t.units + r.onHand, reserved: t.reserved + r.reserved, value: t.value + r.stockValue }), { units: 0, reserved: 0, value: 0 });
  return (
    <>
      <PageHeader title="Inventory" description="Stock is tracked per size. Orders reserve stock when placed and deduct it when shipped; cancellations release it." actions={<ButtonLink href="/admin/export/inventory" variant="secondary" size="sm" prefetch={false}>Export CSV</ButtonLink>} />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Units on hand" value={totals.units} />
        <StatCard label="Reserved" value={totals.reserved} hint="Held for open orders" />
        <StatCard label="Low / out" value={rows.filter((r) => r.state !== "OK").length} hint="Sizes needing attention" />
        <StatCard label="Retail value" value={formatBDT(totals.value)} hint="On hand × price" />
      </div>
      <FilterBar basePath="/admin/inventory">
        <FilterInput label="Search" name="q" defaultValue={sp.q} placeholder="Product or SKU" className="flex-1" />
        <FilterSelect label="Stock" name="state" defaultValue={sp.state} options={[{ value: "low", label: "Low or out" }, { value: "out", label: "Out of stock" }]} />
        <FilterSelect label="Include" name="archived" defaultValue={sp.archived} options={[{ value: "1", label: "Archived sizes too" }]} />
      </FilterBar>
      <Table>
        <thead><tr><Th>Product · size</Th><Th>SKU</Th><Th align="right">On hand</Th><Th align="right">Reserved</Th><Th align="right">Sellable</Th><Th align="right">Alert at</Th><Th>State</Th><Th /></tr></thead>
        <tbody>
          {rows.length === 0 && <EmptyRow colSpan={8}>No sizes match.</EmptyRow>}
          {rows.map((r) => (
            <tr key={r.variantId} className="hover:bg-cream-light">
              <Td>
                <Link href={`/admin/products/${r.productId}`} className="text-burgundy hover:underline">{r.product}</Link> · {r.size}
                {r.isDemo && <Badge tone="gold" className="ml-2">Demo</Badge>}
              </Td>
              <Td className="text-[12px] text-muted">{r.sku}</Td>
              <Td align="right">{r.onHand}</Td>
              <Td align="right">{r.reserved}</Td>
              <Td align="right" className="font-medium">{r.sellable}</Td>
              <Td align="right">{r.threshold}</Td>
              <Td><Badge tone={r.state === "OK" ? "success" : r.state === "Low" ? "gold" : "error"}>{r.state}</Badge></Td>
              <Td align="right">
                <div className="flex justify-end gap-2">
                  <ButtonLink href={`/admin/inventory/${r.variantId}`} variant="ghost" size="sm">Log</ButtonLink>
                  <StockAdjustButton variantId={r.variantId} label={`${r.product} · ${r.size}`} onHand={r.onHand} reserved={r.reserved} />
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
