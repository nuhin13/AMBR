import "server-only";
import { db } from "@/lib/db";
import { sendEmail } from "@/modules/notifications/email";
import { orderConfirmationEmail } from "@/modules/notifications/templates";
import { trackingUrl } from "@/modules/orders/service";
import { PAYMENT_METHOD_LABEL } from "@/modules/orders/status";

export async function sendOrderConfirmation(orderId: string) {
  const o = await db.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!o?.email) return;
  const mail = orderConfirmationEmail({ ...o, paymentMethod: PAYMENT_METHOD_LABEL[o.paymentMethod] }, trackingUrl(o.orderNumber, o.guestAccessToken));
  await sendEmail({ to: o.email, ...mail });
}
