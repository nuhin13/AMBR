import "server-only";
import type { PaymentMethod, PaymentProvider, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { UserFacingError } from "@/lib/action-result";
import { LocalizedError } from "@/lib/i18n-errors";
import { sendOrderConfirmation } from "@/modules/checkout/notify";
import { trackServerPurchase } from "@/modules/analytics/capi";
import { bkashInitiate } from "./providers/bkash";
import { nagadInitiate } from "./providers/nagad";
import { sslcommerzInitiate } from "./providers/sslcommerz";
import type { VerifyResult } from "./providers/types";

export const PROVIDER_FOR: Record<Exclude<PaymentMethod, "COD">, PaymentProvider> = { BKASH: "BKASH", NAGAD: "NAGAD", CARD: "SSLCOMMERZ" };

const strip = (raw: unknown) => JSON.parse(JSON.stringify(raw ?? null)) as Prisma.InputJsonValue;

/**
 * Starts an online payment attempt for an order awaiting payment.
 * Creates a Payment row, asks the gateway for a checkout URL, and returns it.
 */
export async function startOnlinePayment(orderId: string, clientIp: string): Promise<string> {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) throw new LocalizedError("errors.orderNotFound");
  if (order.paymentMethod === "COD") throw new UserFacingError("This order is cash on delivery.");
  if (order.paymentStatus === "PAID") throw new LocalizedError("errors.alreadyPaid");
  if (order.status !== "PENDING" || (order.reservationExpiresAt && order.reservationExpiresAt < new Date())) {
    throw new LocalizedError("errors.paymentWindowClosed");
  }
  const provider = PROVIDER_FOR[order.paymentMethod];
  const payment = await db.payment.create({ data: { orderId: order.id, provider, amount: order.total, status: "PENDING" } });
  const input = {
    paymentId: payment.id,
    orderNumber: order.orderNumber,
    amount: order.total,
    customer: { name: order.customerName, phone: order.phone, email: order.email, address: order.addressLine, city: order.districtName },
    clientIp,
  };
  try {
    const r = provider === "BKASH" ? await bkashInitiate(input) : provider === "NAGAD" ? await nagadInitiate(input) : await sslcommerzInitiate(input);
    await db.payment.update({ where: { id: payment.id }, data: { providerPaymentId: r.providerPaymentId, rawResponse: strip(r.raw) } });
    await db.order.update({ where: { id: order.id }, data: { paymentStatus: "PENDING" } });
    return r.redirectUrl;
  } catch (e) {
    logger.error("payment.initiate_failed", { orderNumber: order.orderNumber, provider, error: e });
    await db.payment.update({ where: { id: payment.id }, data: { status: "FAILED", rawResponse: strip({ error: e instanceof Error ? e.message : String(e) }) } });
    throw new LocalizedError("errors.gateway");
  }
}

/**
 * Applies a gateway verification result. Idempotent: repeated callbacks/IPNs for an
 * already-paid payment do nothing. A payment is only marked PAID when the verified
 * amount equals the amount we requested.
 */
export async function applyVerification(provider: PaymentProvider, result: VerifyResult) {
  const payment = await db.payment.findUnique({ where: { provider_providerPaymentId: { provider, providerPaymentId: result.providerPaymentId } }, include: { order: true } });
  if (!payment) {
    logger.warn("payment.verify_unknown_payment", { provider, providerPaymentId: result.providerPaymentId });
    return null;
  }
  if (payment.status === "PAID") return payment.order;

  if (result.status === "PAID") {
    if (result.amount !== payment.amount) {
      logger.error("payment.amount_mismatch", { orderNumber: payment.order.orderNumber, expected: payment.amount, got: result.amount });
      await db.payment.update({ where: { id: payment.id }, data: { status: "FAILED", rawResponse: strip({ amountMismatch: true, result: result.raw }) } });
      await db.orderStatusHistory.create({
        data: { orderId: payment.orderId, fromStatus: payment.order.status, toStatus: payment.order.status, note: `⚠ ${provider} reported ৳${result.amount / 100} but ৳${payment.amount / 100} was due — payment NOT accepted. Review in the gateway dashboard.` },
      });
      return payment.order;
    }
    const order = await db.$transaction(async (tx) => {
      await tx.payment.update({ where: { id: payment.id }, data: { status: "PAID", providerTrxId: result.trxId, verifiedAt: new Date(), rawResponse: strip(result.raw) } });
      const o = await tx.order.update({ where: { id: payment.orderId }, data: { paymentStatus: "PAID", reservationExpiresAt: null } });
      await tx.orderStatusHistory.create({
        data: { orderId: o.id, fromStatus: o.status, toStatus: o.status, note: `Payment of ৳${payment.amount / 100} confirmed by ${provider}${result.trxId ? ` (trx ${result.trxId})` : ""}.` },
      });
      return o;
    });
    sendOrderConfirmation(order.id).catch((e) => logger.error("order.confirmation_email_failed", { error: e }));
    trackServerPurchase(order.id).catch((e) => logger.error("capi.purchase_failed", { error: e }));
    return order;
  }

  if (result.status === "PENDING") {
    await db.payment.update({ where: { id: payment.id }, data: { rawResponse: strip(result.raw) } });
    return payment.order;
  }

  await db.payment.update({ where: { id: payment.id }, data: { status: "FAILED", rawResponse: strip({ outcome: result.status, reason: result.reason, raw: result.raw }) } });
  if (payment.order.paymentStatus !== "PAID") await db.order.update({ where: { id: payment.orderId }, data: { paymentStatus: "FAILED" } });
  return payment.order;
}

/** Lets a customer whose online payment failed finish the order as cash on delivery instead. */
export async function switchToCashOnDelivery(orderId: string) {
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Order" WHERE "id" = ${orderId} FOR UPDATE`;
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order || order.status !== "PENDING" || order.paymentStatus === "PAID") throw new LocalizedError("errors.orderLocked");
    await tx.payment.updateMany({ where: { orderId, status: "PENDING" }, data: { status: "FAILED" } });
    await tx.payment.create({ data: { orderId, provider: "COD", amount: order.total, status: "PENDING" } });
    const o = await tx.order.update({ where: { id: orderId }, data: { paymentMethod: "COD", paymentStatus: "UNPAID", reservationExpiresAt: null } });
    await tx.orderStatusHistory.create({ data: { orderId, fromStatus: "PENDING", toStatus: "PENDING", note: "Customer switched to Cash on Delivery after an unsuccessful online payment." } });
    return o;
  });
}
