import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderTimeline } from "@/components/checkout/order-timeline";
import { OrderSummary } from "@/components/checkout/order-summary";
import { Breadcrumbs } from "@/components/layout/page-intro";
import { LLink } from "@/components/i18n/llink";
import { findOrderForCustomer } from "@/modules/orders/service";
import { getCurrentUser } from "@/modules/auth/session";
import { getT } from "@/i18n/server";
import { fmt } from "@/i18n/config";
import { formatDateTimeL } from "@/i18n/format";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.meta.track, robots: { index: false } };
}

export default async function OrderStatusPage(props: PageProps<"/[locale]/order/[orderNumber]">) {
  const { t, locale } = await getT();
  const { orderNumber } = await props.params;
  const sp = await props.searchParams;
  const user = await getCurrentUser();
  const order = await findOrderForCustomer(orderNumber, { token: typeof sp.t === "string" ? sp.t : undefined, userId: user?.id });
  if (!order) notFound();
  const awaitingPayment = order.paymentMethod !== "COD" && order.paymentStatus !== "PAID" && order.status === "PENDING";
  const [before, after] = t.order.needHelp.split("{link}");
  return (
    <div className="container-wide pb-24 pt-6 md:pt-8">
      <Breadcrumbs items={[{ href: "/track-order", label: t.nav.trackOrder }, { label: order.orderNumber }]} />
      <h1 className="t-h1 mt-10">{fmt(t.order.orderNumber, { number: order.orderNumber })}</h1>
      <p className="mt-2 text-[14px] text-muted">{fmt(t.order.placed, { date: formatDateTimeL(order.placedAt, locale) })}</p>
      {awaitingPayment && (
        <p className="mt-6 border-l-2 border-gold pl-4 text-[14.5px]">
          {t.order.paymentPending} <LLink href={`/checkout/payment/${order.orderNumber}?t=${order.guestAccessToken}`} className="link-underline font-medium text-burgundy">{t.order.completePayment}</LLink>
        </p>
      )}
      <div className="mt-14"><OrderTimeline status={order.status} history={order.history} /></div>
      <div className="mt-16 border-t border-burgundy/12 pt-12"><OrderSummary order={order} items={order.items} shipment={order.shipment} /></div>
      <p className="mt-14 text-[14px] text-muted">{before}<LLink href="/contact" className="link-underline text-burgundy">{t.order.contactUs}</LLink>{after}</p>
    </div>
  );
}
