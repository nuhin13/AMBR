import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { formatBDT } from "@/lib/money";
import { PAYMENT_METHOD_LABEL } from "@/modules/orders/status";
import { availableMethods } from "@/modules/payments/availability";
import { PaymentRetry } from "@/components/checkout/payment-retry";

export const metadata: Metadata = { title: "Complete payment", robots: { index: false } };
export const dynamic = "force-dynamic";

const minutesUntil = (d: Date | null) => (d ? Math.max(0, Math.ceil((d.getTime() - new Date().getTime()) / 60000)) : 0);

export default async function PaymentPage(props: PageProps<"/checkout/payment/[orderNumber]">) {
  const { orderNumber } = await props.params;
  const sp = await props.searchParams;
  const token = typeof sp.t === "string" ? sp.t : "";
  const order = await db.order.findUnique({ where: { orderNumber } });
  if (!order || order.guestAccessToken !== token) notFound();
  if (order.paymentStatus === "PAID" || order.paymentMethod === "COD") redirect(`/order/${order.orderNumber}/confirmation?t=${token}`);

  const expired = order.status === "CANCELLED" || (order.reservationExpiresAt !== null && order.reservationExpiresAt < new Date());
  const codAvailable = (await availableMethods()).includes("COD");
  const minutesLeft = minutesUntil(order.reservationExpiresAt);
  const reason = sp.error === "gateway" ? "We couldn't reach the payment gateway." : order.paymentStatus === "FAILED" ? "Your payment wasn't completed." : null;

  return (
    <div className="container-x max-w-xl py-14 text-center md:py-24">
      <p className="eyebrow text-burgundy/80">Order {order.orderNumber}</p>
      {expired ? (
        <>
          <h1 className="mt-4 text-[32px] md:text-[42px]">This payment window has closed</h1>
          <p className="mt-4 text-muted">
            The order was cancelled because payment wasn&apos;t completed within 30 minutes, and the items were returned to stock. No money was taken. Please place a new order.
          </p>
          <a href="/shop" className="mt-8 inline-block bg-burgundy px-8 py-3.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-cream">Back to shop</a>
        </>
      ) : (
        <>
          <h1 className="mt-4 text-[32px] md:text-[42px]">{reason ? "Payment not completed" : "Complete your payment"}</h1>
          <p className="mt-4 text-muted">
            {reason ? `${reason} No money has been taken for this attempt. ` : ""}
            Your items are held for you for another {minutesLeft} minute{minutesLeft === 1 ? "" : "s"}.
          </p>
          <p className="mt-6 font-serif text-[28px] text-burgundy">{formatBDT(order.total)}</p>
          <PaymentRetry orderNumber={order.orderNumber} token={token} methodLabel={PAYMENT_METHOD_LABEL[order.paymentMethod]} codAvailable={codAvailable} />
        </>
      )}
    </div>
  );
}
