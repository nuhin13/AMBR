import Link from "next/link";
import type { Order, OrderItem, Shipment } from "@prisma/client";
import { formatBDT } from "@/lib/money";
import { formatBDPhone } from "@/lib/phone";
import { PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL } from "@/modules/orders/status";

export function OrderSummary({ order, items, shipment }: { order: Order; items: OrderItem[]; shipment?: Shipment | null }) {
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <section className="bg-cream-light p-6">
        <h2 className="text-[20px]">Items</h2>
        <ul className="mt-4 divide-y divide-beige text-[14.5px]">
          {items.map((i) => (
            <li key={i.id} className="flex justify-between gap-4 py-3">
              <span>
                <Link href={`/product/${i.productSlug}`} className="font-serif text-[16px] text-burgundy hover:underline">{i.productName}</Link>
                <span className="block text-muted">{i.variantLabel} × {i.quantity}</span>
              </span>
              <span className="tabular-nums">{formatBDT(i.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1.5 border-t border-beige pt-3 text-[14.5px]">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="tabular-nums">{formatBDT(order.subtotal)}</dd></div>
          {order.discountTotal > 0 && <div className="flex justify-between text-success"><dt>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</dt><dd className="tabular-nums">−{formatBDT(order.discountTotal)}</dd></div>}
          <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd className="tabular-nums">{order.shippingFee ? formatBDT(order.shippingFee) : "Free"}</dd></div>
          <div className="flex justify-between pt-1 text-[16px] font-medium"><dt>Total</dt><dd className="tabular-nums text-burgundy">{formatBDT(order.total)}</dd></div>
        </dl>
      </section>
      <section className="space-y-6 text-[14.5px]">
        <div>
          <h2 className="eyebrow text-burgundy/80">Delivering to</h2>
          <p className="mt-2 font-medium">{order.customerName}</p>
          <p>{formatBDPhone(order.phone)}</p>
          <p className="text-muted">{order.addressLine}, {order.upazilaName ? `${order.upazilaName}, ` : ""}{order.districtName}</p>
          {order.deliveryInstructions && <p className="mt-1 text-muted">Note: {order.deliveryInstructions}</p>}
        </div>
        <div>
          <h2 className="eyebrow text-burgundy/80">Payment</h2>
          <p className="mt-2">{PAYMENT_METHOD_LABEL[order.paymentMethod]} · <span className="text-muted">{PAYMENT_STATUS_LABEL[order.paymentStatus]}</span></p>
        </div>
        {shipment && (shipment.trackingCode || shipment.trackingUrl) && (
          <div>
            <h2 className="eyebrow text-burgundy/80">Courier</h2>
            <p className="mt-2">
              {shipment.courier === "MANUAL" ? "Courier" : shipment.courier.charAt(0) + shipment.courier.slice(1).toLowerCase()}
              {shipment.trackingCode && <> · {shipment.trackingCode}</>}
            </p>
            {shipment.trackingUrl && <a href={shipment.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-burgundy underline underline-offset-4">Track with courier</a>}
          </div>
        )}
      </section>
    </div>
  );
}
