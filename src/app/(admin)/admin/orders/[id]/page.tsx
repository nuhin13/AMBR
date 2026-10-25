import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/modules/auth/rbac";
import { getOrderForAdmin } from "@/modules/orders/admin-queries";
import { TRANSITIONS, transitionBlocker, STATUS_LABEL, PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL } from "@/modules/orders/status";
import { courierAvailability } from "@/modules/couriers/service";
import { saveOrderNotesAction, markRefundedAction, updateTrackingAction } from "@/modules/orders/admin-actions";
import { formatBDT } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";
import { formatBDPhone } from "@/lib/phone";
import { Card, PageHeader, DefinitionList, OrderStatusBadge, PaymentStatusBadge, Table, Th, Td } from "@/components/admin/ui";
import { StatusControl, DispatchForm } from "@/components/admin/order-controls";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { Textarea, Input, Checkbox } from "@/components/ui/field";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Order" };

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("orders:manage");
  const { id } = await params;
  const o = await getOrderForAdmin(id);
  if (!o) notFound();

  const options = TRANSITIONS[o.status];
  const blockers = Object.fromEntries(options.map((s) => [s, transitionBlocker(o, s)]).filter(([, b]) => b)) as Record<string, string>;
  const couriers = courierAvailability();
  let cities: { city_id: number; city_name: string }[] = [];
  if (couriers.PATHAO && ["CONFIRMED", "PROCESSING"].includes(o.status)) {
    try {
      const { pathaoCities } = await import("@/modules/couriers/pathao");
      cities = await pathaoCities();
    } catch {
      cities = [];
    }
  }
  const canDispatch = ["CONFIRMED", "PROCESSING"].includes(o.status) && !o.shipment;
  const wa = `https://wa.me/${o.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hello ${o.customerName.split(" ")[0]}, this is AMBR about your order ${o.orderNumber}.`)}`;

  return (
    <>
      <PageHeader
        back={{ href: "/admin/orders", label: "Orders" }}
        title={`Order ${o.orderNumber}`}
        description={<>Placed {formatDateTime(o.placedAt)} {o.isDemo && <Badge tone="gold" className="ml-2">Demo order</Badge>}</>}
        actions={
          <>
            <ButtonLink href={`/admin/orders/${o.id}/invoice`} variant="secondary" size="sm" target="_blank">Print invoice</ButtonLink>
            <a href={`tel:${o.phone}`} className="inline-flex h-9 items-center border border-beige bg-white px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-burgundy hover:border-burgundy">Call</a>
            <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center border border-beige bg-white px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-burgundy hover:border-burgundy">WhatsApp</a>
          </>
        }
      />
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <OrderStatusBadge status={o.status} />
        <PaymentStatusBadge status={o.paymentStatus} />
        <Badge tone="outline">{PAYMENT_METHOD_LABEL[o.paymentMethod]}</Badge>
        {o.reservationExpiresAt && o.paymentStatus !== "PAID" && <span className="text-[12.5px] text-muted">Stock held until {formatDateTime(o.reservationExpiresAt)}</span>}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Card title="Items" padded={false}>
            <Table className="border-0">
              <thead><tr><Th>Product</Th><Th>SKU</Th><Th align="right">Price</Th><Th align="right">Qty</Th><Th align="right">Total</Th></tr></thead>
              <tbody>
                {o.items.map((i) => (
                  <tr key={i.id}>
                    <Td><Link href={`/admin/products/${i.productId}`} className="text-burgundy hover:underline">{i.productName}</Link> · {i.variantLabel}</Td>
                    <Td className="text-[12px] text-muted">{i.sku}</Td>
                    <Td align="right">{formatBDT(i.unitPrice)}</Td>
                    <Td align="right">{i.quantity}</Td>
                    <Td align="right">{formatBDT(i.lineTotal)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <dl className="ml-auto max-w-xs space-y-1 p-4 text-[13.5px]">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatBDT(o.subtotal)}</dd></div>
              {o.discountTotal > 0 && <div className="flex justify-between"><dt className="text-muted">Discount {o.couponCode && `(${o.couponCode})`}</dt><dd>−{formatBDT(o.discountTotal)}</dd></div>}
              <div className="flex justify-between"><dt className="text-muted">Delivery ({o.shippingZoneName})</dt><dd>{o.shippingFee ? formatBDT(o.shippingFee) : "Free"}</dd></div>
              <div className="flex justify-between border-t border-beige pt-1 font-semibold text-burgundy"><dt>Total</dt><dd>{formatBDT(o.total)}</dd></div>
              {o.paymentStatus !== "PAID" && <div className="flex justify-between text-[12.5px]"><dt className="text-muted">To collect on delivery</dt><dd>{o.paymentMethod === "COD" ? formatBDT(o.total) : "—"}</dd></div>}
            </dl>
          </Card>

          <Card title="Status history">
            <ol className="relative space-y-4 border-l border-beige pl-5">
              {o.history.map((h) => (
                <li key={h.id} className="relative">
                  <span className="absolute -left-[25px] top-1.5 size-2.5 rounded-full border-2 border-white bg-burgundy" aria-hidden />
                  <p className="text-[13.5px]">
                    <span className="font-medium text-burgundy">{h.fromStatus && h.fromStatus !== h.toStatus ? `${STATUS_LABEL[h.fromStatus]} → ${STATUS_LABEL[h.toStatus]}` : STATUS_LABEL[h.toStatus]}</span>
                    {h.note && <span className="text-charcoal"> — {h.note}</span>}
                  </p>
                  <p className="text-[11.5px] text-muted">{formatDateTime(h.createdAt)} · {h.changedBy?.name ?? "System / customer"}</p>
                </li>
              ))}
            </ol>
          </Card>

          <Card title="Payments" padded={false}>
            <Table className="border-0">
              <thead><tr><Th>Provider</Th><Th>Status</Th><Th>Reference</Th><Th align="right">Amount</Th><Th>When</Th></tr></thead>
              <tbody>
                {o.payments.length === 0 && <tr><Td className="text-muted">No payment attempts.</Td></tr>}
                {o.payments.map((p) => (
                  <tr key={p.id}>
                    <Td>{p.provider}</Td>
                    <Td><PaymentStatusBadge status={p.status} /></Td>
                    <Td className="text-[12px] text-muted">{p.providerTrxId ?? p.providerPaymentId ?? "—"}</Td>
                    <Td align="right">{formatBDT(p.amount)}</Td>
                    <Td className="text-[12px] text-muted">{formatDateTime(p.verifiedAt ?? p.createdAt)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            {o.paymentStatus === "PAID" && ["CANCELLED", "RETURNED"].includes(o.status) && (
              <div className="border-t border-beige p-4">
                <p className="mb-3 text-[13px] text-muted">This paid order was {o.status.toLowerCase()}. Make the refund in the gateway dashboard (or by bKash/Nagad send-money for COD), then record it here.</p>
                <ActionForm action={markRefundedAction} className="flex flex-wrap items-end gap-3">
                  <input type="hidden" name="orderId" value={o.id} />
                  <Input name="note" label="Reference / note" className="min-w-[220px] flex-1" />
                  <Checkbox name="partial" label="Partial refund" />
                  <SubmitButton size="sm" variant="secondary">Mark refunded</SubmitButton>
                </ActionForm>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Update status">
            <StatusControl orderId={o.id} options={options} blockers={blockers} hasEmail={Boolean(o.email)} />
          </Card>

          <Card title="Delivery">
            <DefinitionList
              items={[
                ["Customer", <>{o.customerName}{o.user && <> · <Link href={`/admin/customers/${o.user.id}`} className="text-burgundy underline">account</Link></>}</>],
                ["Phone", <a key="p" href={`tel:${o.phone}`} className="text-burgundy">{formatBDPhone(o.phone)}</a>],
                ["Email", o.email ?? "—"],
                ["Address", o.addressLine],
                ["Area", [o.upazilaName, o.districtName].filter(Boolean).join(", ")],
                ["Zone", o.shippingZoneName],
                ["Instructions", o.deliveryInstructions ?? "—"],
                ["Payment", `${PAYMENT_METHOD_LABEL[o.paymentMethod]} · ${PAYMENT_STATUS_LABEL[o.paymentStatus]}`],
              ]}
            />
          </Card>

          <Card title="Courier">
            {o.shipment ? (
              <div className="space-y-4">
                <DefinitionList
                  items={[
                    ["Courier", o.shipment.courier],
                    ["Consignment", o.shipment.consignmentId ?? "—"],
                    ["Tracking", o.shipment.trackingUrl ? <a key="t" href={o.shipment.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-burgundy underline">{o.shipment.trackingCode ?? "Open"}</a> : o.shipment.trackingCode ?? "—"],
                    ["Courier status", o.shipment.status ?? "—"],
                    ["COD amount", o.shipment.codAmount !== null ? formatBDT(o.shipment.codAmount) : "—"],
                  ]}
                />
                <ActionForm action={updateTrackingAction} className="space-y-3 border-t border-beige pt-4" success="Tracking updated">
                  <input type="hidden" name="orderId" value={o.id} />
                  <Input name="trackingCode" label="Tracking number" defaultValue={o.shipment.trackingCode ?? ""} />
                  <Input name="trackingUrl" label="Tracking link" defaultValue={o.shipment.trackingUrl ?? ""} />
                  <SubmitButton size="sm" variant="secondary">Save tracking</SubmitButton>
                </ActionForm>
              </div>
            ) : canDispatch ? (
              <DispatchForm orderId={o.id} available={couriers} pathaoCities={cities} />
            ) : (
              <p className="text-[13px] text-muted">{o.status === "PENDING" ? "Confirm the order before booking a courier." : "No shipment recorded."}</p>
            )}
          </Card>

          <Card title="Internal notes">
            <ActionForm action={saveOrderNotesAction} className="space-y-3" success="Notes saved">
              <input type="hidden" name="orderId" value={o.id} />
              <Textarea name="adminNotes" defaultValue={o.adminNotes ?? ""} rows={3} placeholder="Only visible to staff" />
              <SubmitButton size="sm" variant="secondary">Save notes</SubmitButton>
            </ActionForm>
          </Card>
        </div>
      </div>
    </>
  );
}
