import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { OrderSummary } from "@/components/checkout/order-summary";
import { PurchaseTracker } from "@/components/checkout/purchase-tracker";
import { findOrderForCustomer } from "@/modules/orders/service";
import { getCurrentUser } from "@/modules/auth/session";

export const metadata: Metadata = { title: "Order confirmed", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ConfirmationPage(props: PageProps<"/order/[orderNumber]/confirmation">) {
  const { orderNumber } = await props.params;
  const sp = await props.searchParams;
  const token = typeof sp.t === "string" ? sp.t : undefined;
  const user = await getCurrentUser();
  const order = await findOrderForCustomer(orderNumber, { token, userId: user?.id });
  if (!order) notFound();
  // Online orders that aren't paid yet belong on the payment page, not the "thank you" page.
  if (order.paymentMethod !== "COD" && order.paymentStatus !== "PAID" && order.status === "PENDING") {
    redirect(`/checkout/payment/${order.orderNumber}?t=${order.guestAccessToken}`);
  }
  const trackHref = `/order/${order.orderNumber}?t=${order.guestAccessToken}`;
  return (
    <div className="container-x max-w-4xl py-12 md:py-20">
      <PurchaseTracker
        orderNumber={order.orderNumber}
        total={order.total}
        items={order.items.map((i) => ({ id: i.productId, name: i.productName, variant: i.variantLabel, price: i.unitPrice, quantity: i.quantity }))}
      />
      <div className="text-center">
        <CheckCircle2 className="mx-auto size-12 text-burgundy" strokeWidth={1.2} />
        <p className="eyebrow mt-6 text-burgundy/80">Order {order.orderNumber}</p>
        <h1 className="mt-3 text-[36px] md:text-[52px]">Thank you, {order.customerName.split(" ")[0]}.</h1>
        <p className="mx-auto mt-4 max-w-lg text-muted">
          {order.paymentMethod === "COD"
            ? "We've received your order. Our team will call or message you to confirm it before dispatch — please keep your phone nearby."
            : "Your payment was confirmed and your order is being prepared."}
          {order.email && " A receipt is on its way to your email."}
        </p>
        <p className="mt-3 text-[13.5px] text-muted">Save your order number <strong className="text-burgundy">{order.orderNumber}</strong> to track your delivery.</p>
      </div>
      <div className="mt-12">
        <OrderSummary order={order} items={order.items} />
      </div>
      <div className="mt-12 flex flex-col justify-center gap-3 sm:flex-row">
        <ButtonLink href={trackHref} variant="secondary">Track this order</ButtonLink>
        <ButtonLink href="/shop">Continue shopping</ButtonLink>
      </div>
    </div>
  );
}
