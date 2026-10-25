import "server-only";
import { db } from "@/lib/db";
import { sendEmail } from "@/modules/notifications/email";
import { orderConfirmationEmail } from "@/modules/notifications/templates";
import { trackingUrl } from "@/modules/orders/service";

export async function sendOrderConfirmation(orderId: string) {
  const o = await db.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!o?.email) return;
  const locale = o.locale === "bn" ? "bn" : "en";
  const mail = orderConfirmationEmail(o, trackingUrl(o.orderNumber, o.guestAccessToken, locale), locale);
  await sendEmail({ to: o.email, ...mail });
}
