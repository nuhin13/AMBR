"use server";

import { toActionError, type ActionResult } from "@/lib/action-result";
import { enforceRateLimit } from "@/lib/rate-limit";
import { requestMeta } from "@/lib/request";
import { getCurrentUser } from "@/modules/auth/session";
import { startOnlinePayment, switchToCashOnDelivery } from "@/modules/payments/service";
import { db } from "@/lib/db";
import { UserFacingError } from "@/lib/action-result";
import { checkoutSchema } from "./schema";
import { placeOrder } from "./service";

/** Returns the URL to send the customer to: the gateway for online payments, otherwise the confirmation page. */
export async function placeOrderAction(raw: unknown): Promise<ActionResult<{ redirectUrl: string }>> {
  try {
    const { ip } = await requestMeta();
    await enforceRateLimit(`checkout:${ip}`, 8, 600);
    const input = checkoutSchema.parse(raw);
    const user = await getCurrentUser();
    const order = await placeOrder(input, user?.id ?? null);
    const confirmation = `/order/${order.orderNumber}/confirmation?t=${order.token}`;
    if (order.paymentMethod === "COD") return { ok: true, data: { redirectUrl: confirmation } };
    try {
      return { ok: true, data: { redirectUrl: await startOnlinePayment(order.orderId, ip) } };
    } catch {
      // The order exists and stock is held; send them to the payment page to retry or switch to COD.
      return { ok: true, data: { redirectUrl: `/checkout/payment/${order.orderNumber}?t=${order.token}&error=gateway` } };
    }
  } catch (e) {
    return toActionError(e);
  }
}

async function orderByToken(orderNumber: string, token: string) {
  const o = await db.order.findUnique({ where: { orderNumber } });
  if (!o || o.guestAccessToken !== token) throw new UserFacingError("Order not found.");
  return o;
}

export async function retryPaymentAction(orderNumber: string, token: string): Promise<ActionResult<{ redirectUrl: string }>> {
  try {
    const { ip } = await requestMeta();
    await enforceRateLimit(`payretry:${ip}`, 10, 600);
    const o = await orderByToken(orderNumber, token);
    return { ok: true, data: { redirectUrl: await startOnlinePayment(o.id, ip) } };
  } catch (e) {
    return toActionError(e);
  }
}

export async function switchToCodAction(orderNumber: string, token: string): Promise<ActionResult<{ redirectUrl: string }>> {
  try {
    const o = await orderByToken(orderNumber, token);
    const { availableMethods } = await import("@/modules/payments/availability");
    if (!(await availableMethods()).includes("COD")) throw new UserFacingError("Cash on delivery isn't available right now.");
    await switchToCashOnDelivery(o.id);
    const { sendOrderConfirmation } = await import("./notify");
    sendOrderConfirmation(o.id).catch(() => {});
    return { ok: true, data: { redirectUrl: `/order/${o.orderNumber}/confirmation?t=${o.guestAccessToken}` } };
  } catch (e) {
    return toActionError(e);
  }
}
