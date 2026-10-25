import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";
import { requireUser } from "@/modules/auth/session";
import { OrderTimeline } from "@/components/checkout/order-timeline";
import { OrderSummary } from "@/components/checkout/order-summary";
import { ReviewForm } from "@/components/reviews/review-form";

export default async function AccountOrderPage(props: PageProps<"/account/orders/[orderNumber]">) {
  const { orderNumber } = await props.params;
  const user = await requireUser(`/account/orders/${orderNumber}`);
  const order = await db.order.findFirst({
    where: { orderNumber, userId: user.id },
    include: { items: { include: { review: true } }, history: { orderBy: { createdAt: "asc" } }, shipment: true },
  });
  if (!order) notFound();
  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-[26px]">Order {order.orderNumber}</h2>
        <p className="text-[13.5px] text-muted">Placed {formatDateTime(order.placedAt)}</p>
      </div>
      <OrderTimeline status={order.status} history={order.history} />
      <OrderSummary order={order} items={order.items} shipment={order.shipment} />
      {order.status === "DELIVERED" && (
        <section>
          <h3 className="mb-2 text-[22px]">Review your fragrances</h3>
          <p className="mb-6 text-[14px] text-muted">Your review helps others choose. It appears on the product page as a verified purchase after a quick check.</p>
          <div className="space-y-6">
            {order.items.map((i) => (
              <div key={i.id} className="border border-beige bg-cream-light p-5">
                <p className="font-serif text-[18px] text-burgundy">{i.productName} <span className="font-sans text-[13px] text-muted">· {i.variantLabel}</span></p>
                {i.review ? (
                  <p className="mt-2 text-[14px] text-muted">Thanks — you reviewed this ({i.review.status === "APPROVED" ? "published" : i.review.status === "PENDING" ? "awaiting approval" : "not published"}).</p>
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
