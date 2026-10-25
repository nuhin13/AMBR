import Link from "next/link";
import { requirePermission } from "@/modules/auth/rbac";
import { listOrders, orderStatusCounts } from "@/modules/orders/admin-queries";
import { STATUS_LABEL, PAYMENT_STATUS_LABEL, PAYMENT_METHOD_LABEL } from "@/modules/orders/status";
import { formatBDT } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";
import { formatBDPhone } from "@/lib/phone";
import { PageHeader, Table, Th, Td, EmptyRow, OrderStatusBadge, PaymentStatusBadge, Pagination, FilterBar, FilterInput, FilterSelect } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = { title: "Orders" };

type SP = Promise<Record<string, string | undefined>>;

export default async function OrdersPage({ searchParams }: { searchParams: SP }) {
  await requirePermission("orders:manage");
  const sp = await searchParams;
  const [{ orders, total, page, pages }, counts] = await Promise.all([listOrders(sp), orderStatusCounts()]);
  const exportQs = new URLSearchParams(Object.entries(sp).filter(([k, v]) => v && k !== "page") as [string, string][]).toString();
  return (
    <>
      <PageHeader title="Orders" description="Confirm cash-on-delivery orders by phone, then book a courier. Online orders can be confirmed once payment is verified." actions={<ButtonLink href={`/admin/export/orders?${exportQs}`} variant="secondary" size="sm" prefetch={false}>Export CSV</ButtonLink>} />
      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
        {[undefined, "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"].map((s) => (
          <Link
            key={s ?? "all"}
            href={s ? `/admin/orders?status=${s}` : "/admin/orders"}
            className={cn("shrink-0 border px-3 py-1.5 text-[12px]", sp.status === s || (!sp.status && !s) ? "border-burgundy bg-burgundy text-cream" : "border-beige bg-white text-charcoal hover:border-burgundy")}
          >
            {s ? STATUS_LABEL[s as keyof typeof STATUS_LABEL] : "All"}
            {s && counts[s as keyof typeof counts] ? <span className="ml-1.5 opacity-70">{counts[s as keyof typeof counts]}</span> : null}
          </Link>
        ))}
      </div>
      <FilterBar basePath="/admin/orders">
        <FilterInput label="Search" name="q" defaultValue={sp.q} placeholder="Order no, phone, name" className="flex-1" />
        {sp.status && <input type="hidden" name="status" value={sp.status} />}
        <FilterSelect label="Payment" name="payment" defaultValue={sp.payment} options={Object.entries(PAYMENT_STATUS_LABEL).map(([value, label]) => ({ value, label }))} />
        <FilterSelect label="Method" name="method" defaultValue={sp.method} options={Object.entries(PAYMENT_METHOD_LABEL).map(([value, label]) => ({ value, label }))} />
        <FilterInput label="From" name="from" type="date" defaultValue={sp.from} />
        <FilterInput label="To" name="to" type="date" defaultValue={sp.to} />
      </FilterBar>
      <Table>
        <thead>
          <tr><Th>Order</Th><Th>Customer</Th><Th>Delivery</Th><Th>Status</Th><Th>Payment</Th><Th align="right">Total</Th></tr>
        </thead>
        <tbody>
          {orders.length === 0 && <EmptyRow colSpan={6}>No orders match these filters.</EmptyRow>}
          {orders.map((o) => (
            <tr key={o.id} className="hover:bg-cream-light">
              <Td>
                <Link href={`/admin/orders/${o.id}`} className="font-medium text-burgundy hover:underline">{o.orderNumber}</Link>
                <div className="text-[11.5px] text-muted">{formatDateTime(o.placedAt)} · {o._count.items} item{o._count.items === 1 ? "" : "s"}{o.isDemo ? " · demo" : ""}</div>
              </Td>
              <Td>
                {o.customerName}
                <div className="text-[11.5px] text-muted">{formatBDPhone(o.phone)}</div>
              </Td>
              <Td>
                {o.districtName}
                <div className="text-[11.5px] text-muted">{o.shipment?.trackingCode ? `${o.shipment.courier} · ${o.shipment.trackingCode}` : o.shippingZoneName}</div>
              </Td>
              <Td><OrderStatusBadge status={o.status} /></Td>
              <Td>
                <div className="text-[12px] text-muted">{PAYMENT_METHOD_LABEL[o.paymentMethod]}</div>
                <PaymentStatusBadge status={o.paymentStatus} />
              </Td>
              <Td align="right">{formatBDT(o.total)}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Pagination page={page} pages={pages} total={total} params={sp} basePath="/admin/orders" />
    </>
  );
}
