import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { availableMethods } from "@/modules/payments/availability";
import { PaymentRetry } from "@/components/checkout/payment-retry";
import { ButtonLink } from "@/components/ui/button";
import { getT } from "@/i18n/server";
import { fmt, localePath } from "@/i18n/config";
import { formatNumber, formatPrice } from "@/i18n/format";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.payment.title, robots: { index: false } };
}

const minutesUntil = (d: Date | null) => (d ? Math.max(0, Math.ceil((d.getTime() - new Date().getTime()) / 60000)) : 0);

export default async function PaymentPage(props: PageProps<"/[locale]/checkout/payment/[orderNumber]">) {
  const { t, locale } = await getT();
  const { orderNumber } = await props.params;
  const sp = await props.searchParams;
  const token = typeof sp.t === "string" ? sp.t : "";
  const order = await db.order.findUnique({ where: { orderNumber } });
  if (!order || order.guestAccessToken !== token) notFound();
  if (order.paymentStatus === "PAID" || order.paymentMethod === "COD") redirect(localePath(locale, `/order/${order.orderNumber}/confirmation?t=${token}`));

  const expired = order.status === "CANCELLED" || (order.reservationExpiresAt !== null && order.reservationExpiresAt < new Date());
  const codAvailable = (await availableMethods()).includes("COD");
  const minutesLeft = minutesUntil(order.reservationExpiresAt);
  const reason = sp.error === "gateway" ? t.payment.gatewayError : order.paymentStatus === "FAILED" ? t.payment.failed : null;

  return (
    <div className="container-wide max-w-2xl py-16 md:py-28">
      <p className="eyebrow text-burgundy/70">{fmt(t.order.orderNumber, { number: order.orderNumber })}</p>
      {expired ? (
        <>
          <h1 className="t-h1 mt-5">{t.payment.expiredTitle}</h1>
          <p className="t-lead mt-5 text-muted">{t.payment.expiredText}</p>
          <ButtonLink href={localePath(locale, "/shop")} className="mt-10">{t.payment.backToShop}</ButtonLink>
        </>
      ) : (
        <>
          <h1 className="t-h1 mt-5">{reason ? t.payment.notCompleted : t.payment.title}</h1>
          <p className="t-lead mt-5 text-muted">
            {reason ? `${reason} ${t.payment.noMoney} ` : ""}
            {fmt(t.payment.heldFor, { minutes: formatNumber(minutesLeft, locale) })}
          </p>
          <p className="mt-8 font-serif text-[34px] text-burgundy">{formatPrice(order.total, locale)}</p>
          <PaymentRetry orderNumber={order.orderNumber} token={token} methodLabel={t.labels.paymentMethod[order.paymentMethod]} codAvailable={codAvailable} />
        </>
      )}
    </div>
  );
}
