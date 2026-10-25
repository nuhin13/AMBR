"use server";

import { db } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";
import { requestMeta } from "@/lib/request";
import type { ActionResult } from "@/lib/action-result";
import { LocalizedError } from "@/lib/i18n-errors";
import { localePath } from "@/i18n/config";
import { getRequestLocale } from "@/i18n/server";
import { localizedAction } from "@/i18n/actions";
import { getCurrentUser } from "@/modules/auth/session";
import { availableMethods } from "@/modules/payments/availability";
import { startOnlinePayment, switchToCashOnDelivery } from "@/modules/payments/service";
import { checkoutSchema } from "./schema";
import { placeOrder } from "./service";
import { sendOrderConfirmation } from "./notify";

type Redirect = ActionResult<{ redirectUrl: string }>;

/** Returns where to send the customer: the gateway for online payments, otherwise the confirmation page. */
export async function placeOrderAction(raw: unknown): Promise<Redirect> {
  return localizedAction(async () => {
    const { ip } = await requestMeta();
    await enforceRateLimit(`checkout:${ip}`, 8, 600);
    const input = checkoutSchema.parse(raw);
    const locale = await getRequestLocale();
    const user = await getCurrentUser();
    const order = await placeOrder(input, user?.id ?? null, locale);
    const confirmation = localePath(locale, `/order/${order.orderNumber}/confirmation?t=${order.token}`);
    if (order.paymentMethod === "COD") return { ok: true as const, data: { redirectUrl: confirmation } };
    try {
      return { ok: true as const, data: { redirectUrl: await startOnlinePayment(order.orderId, ip) } };
    } catch {
      // The order exists and stock is held; send them to the payment page to retry or switch to COD.
      return { ok: true as const, data: { redirectUrl: localePath(locale, `/checkout/payment/${order.orderNumber}?t=${order.token}&error=gateway`) } };
    }
  });
}

async function orderByToken(orderNumber: string, token: string) {
  const o = await db.order.findUnique({ where: { orderNumber } });
  if (!o || o.guestAccessToken !== token) throw new LocalizedError("errors.orderNotFound");
  return o;
}

export async function retryPaymentAction(orderNumber: string, token: string): Promise<Redirect> {
  return localizedAction(async () => {
    const { ip } = await requestMeta();
    await enforceRateLimit(`payretry:${ip}`, 10, 600);
    const o = await orderByToken(orderNumber, token);
    return { ok: true as const, data: { redirectUrl: await startOnlinePayment(o.id, ip) } };
  });
}

export async function switchToCodAction(orderNumber: string, token: string): Promise<Redirect> {
  return localizedAction(async () => {
    const o = await orderByToken(orderNumber, token);
    if (!(await availableMethods()).includes("COD")) throw new LocalizedError("errors.codUnavailable");
    await switchToCashOnDelivery(o.id);
    sendOrderConfirmation(o.id).catch(() => {});
    return { ok: true as const, data: { redirectUrl: localePath(o.locale === "bn" ? "bn" : "en", `/order/${o.orderNumber}/confirmation?t=${o.guestAccessToken}`) } };
  });
}
