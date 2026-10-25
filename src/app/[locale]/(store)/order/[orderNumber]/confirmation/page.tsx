import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { Kicker } from "@/components/editorial/kicker";
import { OrderSummary } from "@/components/checkout/order-summary";
import { PurchaseTracker } from "@/components/checkout/purchase-tracker";
import { findOrderForCustomer } from "@/modules/orders/service";
import { getCurrentUser } from "@/modules/auth/session";
import { getT } from "@/i18n/server";
import { fmt, localePath } from "@/i18n/config";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.order.trackThis, robots: { index: false } };
}

export default async function ConfirmationPage(props: PageProps<"/[locale]/order/[orderNumber]/confirmation">) {
  const { t, locale } = await getT();
  const { orderNumber } = await props.params;
  const sp = await props.searchParams;
  const token = typeof sp.t === "string" ? sp.t : undefined;
  const user = await getCurrentUser();
  const order = await findOrderForCustomer(orderNumber, { token, userId: user?.id });
  if (!order) notFound();
  if (order.paymentMethod !== "COD" && order.paymentStatus !== "PAID" && order.status === "PENDING") {
    redirect(localePath(locale, `/checkout/payment/${order.orderNumber}?t=${order.guestAccessToken}`));
  }
  return (
    <div className="container-wide pb-24 pt-14 md:pt-24">
      <PurchaseTracker orderNumber={order.orderNumber} total={order.total} items={order.items.map((i) => ({ id: i.productId, name: i.productName, variant: i.variantLabel, price: i.unitPrice, quantity: i.quantity }))} />
      <div className="max-w-3xl">
        <Kicker>{fmt(t.order.orderNumber, { number: order.orderNumber })}</Kicker>
        <h1 className="t-display mt-6">{fmt(t.order.thanks, { name: order.customerName.split(" ")[0] })}</h1>
        <p className="t-lead mt-6 max-w-xl text-muted">
          {order.paymentMethod === "COD" ? t.order.codConfirm : t.order.paidConfirm}
          {order.email && ` ${t.order.emailOnWay}`}
        </p>
        <p className="mt-4 text-[14px] text-muted">{fmt(t.order.saveNumber, { number: order.orderNumber })}</p>
      </div>
      <div className="mt-16 border-t border-burgundy/12 pt-12">
        <OrderSummary order={order} items={order.items} />
      </div>
      <div className="mt-14 flex flex-wrap items-center gap-8">
        <ButtonLink href={localePath(locale, "/shop")}>{t.common.continueShopping}</ButtonLink>
        <ButtonLink href={localePath(locale, `/order/${order.orderNumber}?t=${order.guestAccessToken}`)} variant="quiet">{t.order.trackThis}</ButtonLink>
      </div>
    </div>
  );
}
