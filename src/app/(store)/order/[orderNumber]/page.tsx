import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderTimeline } from "@/components/checkout/order-timeline";
import { OrderSummary } from "@/components/checkout/order-summary";
import { Breadcrumbs } from "@/components/layout/page-header";
import { findOrderForCustomer } from "@/modules/orders/service";
import { getCurrentUser } from "@/modules/auth/session";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Order status", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function OrderStatusPage(props: PageProps<"/order/[orderNumber]">) {
  const { orderNumber } = await props.params;
  const sp = await props.searchParams;
  const user = await getCurrentUser();
  const order = await findOrderForCustomer(orderNumber, { token: typeof sp.t === "string" ? sp.t : undefined, userId: user?.id });
  if (!order) notFound();
  const awaitingPayment = order.paymentMethod !== "COD" && order.paymentStatus !== "PAID" && order.status === "PENDING";
  return (
    <div className="container-x max-w-4xl pb-20 pt-6 md:pt-8">
      <Breadcrumbs items={[{ href: "/track-order", label: "Track order" }, { label: order.orderNumber }]} />
      <h1 className="mt-6 text-[32px] md:text-[44px]">Order {order.orderNumber}</h1>
      <p className="mt-1 text-[14px] text-muted">Placed {formatDateTime(order.placedAt)}</p>
      {awaitingPayment && (
        <p className="mt-4 border border-gold bg-gold/10 p-4 text-[14px]">
          Payment not completed yet. <Link href={`/checkout/payment/${order.orderNumber}?t=${order.guestAccessToken}`} className="font-medium text-burgundy underline">Complete payment</Link>
        </p>
      )}
      <div className="mt-10">
        <OrderTimeline status={order.status} history={order.history} />
      </div>
      <div className="mt-12">
        <OrderSummary order={order} items={order.items} shipment={order.shipment} />
      </div>
      <p className="mt-10 text-[14px] text-muted">
        Need help? <Link href="/contact" className="text-burgundy underline underline-offset-4">Contact us</Link> with your order number.
      </p>
    </div>
  );
}
