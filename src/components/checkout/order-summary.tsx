import type { Order, OrderItem, Shipment } from "@prisma/client";
import { formatBDPhone } from "@/lib/phone";
import { getT } from "@/i18n/server";
import { fmt } from "@/i18n/config";
import { formatPrice } from "@/i18n/format";
import { LLink } from "@/components/i18n/llink";

export async function OrderSummary({ order, items, shipment }: { order: Order; items: OrderItem[]; shipment?: Shipment | null }) {
  const { t, locale } = await getT();
  const price = (n: number) => formatPrice(n, locale);
  return (
    <div className="grid gap-12 md:grid-cols-12">
      <section className="md:col-span-7">
        <h2 className="eyebrow text-burgundy/75">{t.order.items}</h2>
        <ul className="mt-4 divide-y divide-burgundy/10 border-y border-burgundy/10 text-[14.5px]">
          {items.map((i) => (
            <li key={i.id} className="flex justify-between gap-4 py-4">
              <span>
                <LLink href={`/product/${i.productSlug}`} className="font-serif text-[18px] text-burgundy hover:underline">{i.productName}</LLink>
                <span className="block text-muted">{i.variantLabel} × {i.quantity}</span>
              </span>
              <span className="tabular-nums">{price(i.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1.5 text-[14.5px]">
          <div className="flex justify-between"><dt className="text-muted">{t.cart.subtotal}</dt><dd className="tabular-nums">{price(order.subtotal)}</dd></div>
          {order.discountTotal > 0 && <div className="flex justify-between text-success"><dt>{t.cart.discount}{order.couponCode ? ` (${order.couponCode})` : ""}</dt><dd className="tabular-nums">−{price(order.discountTotal)}</dd></div>}
          <div className="flex justify-between"><dt className="text-muted">{t.cart.delivery}</dt><dd className="tabular-nums">{order.shippingFee ? price(order.shippingFee) : t.cart.free}</dd></div>
          <div className="flex justify-between pt-2 text-[18px]"><dt>{t.cart.total}</dt><dd className="tabular-nums text-burgundy">{price(order.total)}</dd></div>
        </dl>
      </section>
      <section className="space-y-8 text-[14.5px] md:col-span-4 md:col-start-9">
        <div>
          <h2 className="eyebrow text-burgundy/75">{t.order.deliveringTo}</h2>
          <p className="mt-3 font-medium">{order.customerName}</p>
          <p>{formatBDPhone(order.phone)}</p>
          <p className="text-muted">{order.addressLine}, {order.upazilaName ? `${order.upazilaName}, ` : ""}{order.districtName}</p>
          {order.deliveryInstructions && <p className="mt-1 text-muted">{fmt(t.order.note, { note: order.deliveryInstructions })}</p>}
        </div>
        <div>
          <h2 className="eyebrow text-burgundy/75">{t.order.payment}</h2>
          <p className="mt-3">{t.labels.paymentMethod[order.paymentMethod]} · <span className="text-muted">{t.labels.paymentStatus[order.paymentStatus]}</span></p>
        </div>
        {shipment && (shipment.trackingCode || shipment.trackingUrl) && (
          <div>
            <h2 className="eyebrow text-burgundy/75">{t.order.courier}</h2>
            <p className="mt-3">{shipment.courier === "MANUAL" ? t.order.courier : shipment.courier.charAt(0) + shipment.courier.slice(1).toLowerCase()}{shipment.trackingCode && <> · {shipment.trackingCode}</>}</p>
            {shipment.trackingUrl && <a href={shipment.trackingUrl} target="_blank" rel="noopener noreferrer" className="link-quiet text-burgundy">{t.order.trackCourier}</a>}
          </div>
        )}
      </section>
    </div>
  );
}
