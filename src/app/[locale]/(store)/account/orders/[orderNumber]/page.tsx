import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/modules/auth/session";
import { OrderTimeline } from "@/components/checkout/order-timeline";
import { OrderSummary } from "@/components/checkout/order-summary";
import { ReviewForm } from "@/components/reviews/review-form";
import { getT } from "@/i18n/server";
import { fmt } from "@/i18n/config";
import { formatDateTimeL } from "@/i18n/format";

export default async function AccountOrderPage(props: PageProps<"/[locale]/account/orders/[orderNumber]">) {
  const { orderNumber } = await props.params;
  const user = await requireUser(`/account/orders/${orderNumber}`);
  const { t, locale } = await getT();
  const order = await db.order.findFirst({ where: { orderNumber, userId: user.id }, include: { items: { include: { review: true } }, history: { orderBy: { createdAt: "asc" } }, shipment: true } });
  if (!order) notFound();
  return (
    <div className="space-y-14">
      <div>
        <h2 className="t-h2">{fmt(t.order.orderNumber, { number: order.orderNumber })}</h2>
        <p className="mt-1 text-[13.5px] text-muted">{fmt(t.order.placed, { date: formatDateTimeL(order.placedAt, locale) })}</p>
      </div>
      <OrderTimeline status={order.status} history={order.history} />
      <OrderSummary order={order} items={order.items} shipment={order.shipment} />
      {order.status === "DELIVERED" && (
        <section className="border-t border-burgundy/12 pt-12">
          <h3 className="t-h3">{t.account.reviewTitle}</h3>
          <p className="mt-2 max-w-xl text-[14px] text-muted">{t.account.reviewIntro}</p>
          <div className="mt-8 divide-y divide-burgundy/10 border-y border-burgundy/10">
            {order.items.map((i) => (
              <div key={i.id} className="py-7">
                <p className="font-serif text-[19px] text-burgundy">{i.productName} <span className="font-sans text-[13px] text-muted">· {i.variantLabel}</span></p>
                {i.review ? (
                  <p className="mt-2 text-[14px] text-muted">{fmt(t.account.reviewed, { status: t.account.reviewStatus[i.review.status] })}</p>
                ) : (
                  <ReviewForm orderItemId={i.id} />
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
