import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission } from "@/modules/auth/rbac";
import { formatDateTime } from "@/lib/utils";
import { PageHeader, Table, Th, Td, EmptyRow, StatCard } from "@/components/admin/ui";
import { StockAdjustButton } from "@/components/admin/stock-adjust";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Stock log" };

const TYPE_LABEL: Record<string, string> = {
  PURCHASE_IN: "Stock received", ADJUSTMENT: "Count correction", ORDER_RESERVE: "Reserved for order", RESERVE_RELEASE: "Reservation released",
  ORDER_FULFIL: "Shipped", RETURN_IN: "Returned to stock", DAMAGE: "Damaged / lost",
};

export default async function StockLogPage({ params }: { params: Promise<{ variantId: string }> }) {
  await requirePermission("inventory:manage");
  const { variantId } = await params;
  const v = await db.productVariant.findUnique({
    where: { id: variantId },
    include: {
      inventory: true,
      product: { select: { id: true, name: true } },
      movements: { orderBy: { createdAt: "desc" }, take: 200, include: { user: { select: { name: true } }, order: { select: { id: true, orderNumber: true } } } },
    },
  });
  if (!v) notFound();
  const onHand = v.inventory?.onHand ?? 0;
  const reserved = v.inventory?.reserved ?? 0;
  return (
    <>
      <PageHeader back={{ href: "/admin/inventory", label: "Inventory" }} title={`${v.product.name} · ${v.label}`} description={`SKU ${v.sku}`} actions={<StockAdjustButton variantId={v.id} label={`${v.product.name} · ${v.label}`} onHand={onHand} reserved={reserved} />} />
      <div className="mb-6 grid grid-cols-3 gap-3">
        <StatCard label="On hand" value={onHand} />
        <StatCard label="Reserved" value={reserved} />
        <StatCard label="Sellable" value={Math.max(0, onHand - reserved)} />
      </div>
      <Table>
        <thead><tr><Th>When</Th><Th>Change</Th><Th align="right">Qty</Th><Th align="right">On hand after</Th><Th align="right">Reserved after</Th><Th>Reference</Th><Th>By</Th></tr></thead>
        <tbody>
          {v.movements.length === 0 && <EmptyRow colSpan={7}>No stock movements yet.</EmptyRow>}
          {v.movements.map((m) => (
            <tr key={m.id}>
              <Td className="text-[12.5px]">{formatDateTime(m.createdAt)}</Td>
              <Td><Badge tone={m.quantity >= 0 && !["ORDER_RESERVE"].includes(m.type) ? "beige" : "outline"}>{TYPE_LABEL[m.type] ?? m.type}</Badge></Td>
              <Td align="right">{m.quantity > 0 ? `+${m.quantity}` : m.quantity}</Td>
              <Td align="right">{m.onHandAfter}</Td>
              <Td align="right">{m.reservedAfter}</Td>
              <Td className="text-[12.5px]">{m.order ? <Link href={`/admin/orders/${m.order.id}`} className="text-burgundy underline">{m.order.orderNumber}</Link> : m.reason ?? "—"}{m.order && m.reason ? ` · ${m.reason}` : ""}</Td>
              <Td className="text-[12.5px] text-muted">{m.user?.name ?? "System"}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
      <p className="mt-3 text-[12px] text-muted">The stock log is append-only. Reservation rows change “reserved”; shipping, receiving, corrections and damage change “on hand”.</p>
    </>
  );
}
