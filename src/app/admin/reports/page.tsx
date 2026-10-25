import Link from "next/link";
import { requirePermission } from "@/modules/auth/rbac";
import { categoryPerformance, inventoryReport, orderBreakdown, productPerformance, rangeFrom, salesSeries, type Bucket } from "@/modules/reports/queries";
import { STATUS_LABEL, PAYMENT_METHOD_LABEL } from "@/modules/orders/status";
import { formatBDT } from "@/lib/money";
import { PageHeader, Card, Table, Th, Td, EmptyRow, StatCard, FilterBar, FilterInput } from "@/components/admin/ui";
import { TrendChart, RankBars } from "@/components/admin/charts";
import { cn } from "@/lib/utils";

export const metadata = { title: "Reports" };

export default async function ReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requirePermission("reports:view");
  const sp = await searchParams;
  const bucket = (["day", "week", "month"].includes(sp.bucket ?? "") ? sp.bucket : "day") as Bucket;
  const range = rangeFrom(sp, bucket === "month" ? 365 : bucket === "week" ? 84 : 30);
  const [series, products, categories, breakdown, inventory] = await Promise.all([
    salesSeries(range.from, range.to, bucket),
    productPerformance(range.from, range.to, 20),
    categoryPerformance(range.from, range.to),
    orderBreakdown(range.from, range.to),
    inventoryReport(),
  ]);
  const qs = new URLSearchParams({ from: range.fromStr, to: range.toStr, bucket }).toString();
  const revenue = series.reduce((s, d) => s + d.revenue, 0);
  const paid = series.reduce((s, d) => s + d.paidOrders, 0);
  const orders = series.reduce((s, d) => s + d.orders, 0);
  const active = inventory.filter((i) => i.variantStatus === "ACTIVE" && i.productStatus !== "ARCHIVED");
  const exportLink = (kind: string, label: string) => <Link href={`/admin/export/${kind}?${qs}`} prefetch={false} className="text-[12px] text-burgundy underline underline-offset-4">{label}</Link>;
  return (
    <>
      <PageHeader title="Reports" description="Revenue counts paid, non-cancelled, non-returned orders (COD counts once delivered). Dates are Bangladesh time." />
      <div className="mb-3 flex gap-2">
        {(["day", "week", "month"] as const).map((b) => (
          <Link key={b} href={`/admin/reports?bucket=${b}`} className={cn("border px-3 py-1.5 text-[12px] capitalize", bucket === b ? "border-burgundy bg-burgundy text-cream" : "border-beige bg-white")}>{b === "day" ? "Daily" : b === "week" ? "Weekly" : "Monthly"}</Link>
        ))}
      </div>
      <FilterBar basePath="/admin/reports">
        <input type="hidden" name="bucket" value={bucket} />
        <FilterInput label="From" name="from" type="date" defaultValue={range.fromStr} />
        <FilterInput label="To" name="to" type="date" defaultValue={range.toStr} />
      </FilterBar>
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Revenue" value={formatBDT(revenue)} />
        <StatCard label="Paid orders" value={paid} />
        <StatCard label="Orders placed" value={orders} hint="Excluding cancelled" />
        <StatCard label="Average paid order" value={paid ? formatBDT(Math.round(revenue / paid)) : "—"} />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title={`Revenue · ${bucket === "day" ? "daily" : bucket === "week" ? "weekly" : "monthly"}`} actions={exportLink("sales", "CSV")}>
          <TrendChart kind="money" data={series.map((d) => ({ label: d.label, value: d.revenue }))} />
        </Card>
        <Card title={`Orders · ${bucket === "day" ? "daily" : bucket === "week" ? "weekly" : "monthly"}`} actions={exportLink("sales", "CSV")}>
          <TrendChart kind="count" data={series.map((d) => ({ label: d.label, value: d.orders }))} />
        </Card>
        <Card title="Category performance" actions={exportLink("categories", "CSV")}>
          <RankBars data={categories.map((c) => ({ label: `${c.category} · ${c.units} units`, value: c.revenue }))} />
        </Card>
        <Card title="Order breakdown">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="eyebrow mb-2 text-[10px] text-muted">By status</p>
              <ul className="space-y-1 text-[13.5px]">{breakdown.byStatus.length === 0 ? <li className="text-muted">No orders.</li> : breakdown.byStatus.map((s) => <li key={s.status} className="flex justify-between"><span>{STATUS_LABEL[s.status]}</span><span className="tabular-nums">{s._count._all}</span></li>)}</ul>
            </div>
            <div>
              <p className="eyebrow mb-2 text-[10px] text-muted">By payment method</p>
              <ul className="space-y-1 text-[13.5px]">{breakdown.byMethod.map((s) => <li key={s.paymentMethod} className="flex justify-between"><span>{PAYMENT_METHOD_LABEL[s.paymentMethod]}</span><span className="tabular-nums">{s._count._all} · {formatBDT(s._sum.total ?? 0)}</span></li>)}</ul>
              <p className="eyebrow mb-2 mt-4 text-[10px] text-muted">By delivery zone</p>
              <ul className="space-y-1 text-[13.5px]">{breakdown.byZone.map((s) => <li key={s.shippingZoneName} className="flex justify-between"><span>{s.shippingZoneName}</span><span className="tabular-nums">{s._count._all}</span></li>)}</ul>
            </div>
          </div>
        </Card>
      </div>
      <Card title="Product performance" actions={<span className="flex gap-3">{exportLink("products", "Products CSV")}{exportLink("variants", "Sizes CSV")}</span>} className="mt-6" padded={false}>
        <Table className="border-0">
          <thead><tr><Th>Product</Th><Th align="right">Orders</Th><Th align="right">Units</Th><Th align="right">Revenue</Th></tr></thead>
          <tbody>
            {products.length === 0 && <EmptyRow colSpan={4}>No sales in this period.</EmptyRow>}
            {products.map((p) => (
              <tr key={p.productId}><Td>{p.productName}</Td><Td align="right">{p.orders}</Td><Td align="right">{p.units}</Td><Td align="right">{formatBDT(p.revenue)}</Td></tr>
            ))}
          </tbody>
        </Table>
      </Card>
      <Card title="Inventory snapshot" actions={<Link href="/admin/export/inventory" prefetch={false} className="text-[12px] text-burgundy underline underline-offset-4">Inventory CSV</Link>} className="mt-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Active sizes" value={active.length} />
          <StatCard label="Units on hand" value={active.reduce((s, i) => s + i.onHand, 0)} />
          <StatCard label="Low / out of stock" value={active.filter((i) => i.state !== "OK").length} href="/admin/inventory?state=low" />
          <StatCard label="Retail value" value={formatBDT(active.reduce((s, i) => s + i.stockValue, 0))} />
        </div>
      </Card>
    </>
  );
}
