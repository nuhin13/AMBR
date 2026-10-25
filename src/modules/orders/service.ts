import "server-only";
import type { OrderStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { siteUrl } from "@/lib/env";
import { logger } from "@/lib/logger";
import { UserFacingError } from "@/lib/action-result";
import { fulfilStock, releaseStock, returnStock } from "@/modules/inventory/service";
import { releaseCouponInTx } from "@/modules/promotions/coupons";
import { sendEmail } from "@/modules/notifications/email";
import { orderStatusEmail } from "@/modules/notifications/templates";
import { STATUS_LABEL, transitionBlocker } from "./status";

export type StatusChangeOptions = {
  note?: string;
  actorId: string | null;
  restock?: boolean; // for RETURNED
  notifyCustomer?: boolean;
};

/**
 * Applies an order status change and all of its side effects in one transaction:
 * stock release/fulfil/return, coupon release, COD payment capture, history row.
 */
export async function changeOrderStatus(orderId: string, to: OrderStatus, opts: StatusChangeOptions) {
  const updated = await db.$transaction(async (tx) => {
    // Lock the order row so two staff members can't apply conflicting changes.
    await tx.$queryRaw`SELECT "id" FROM "Order" WHERE "id" = ${orderId} FOR UPDATE`;
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) throw new UserFacingError("Order not found.");
    const blocker = transitionBlocker(order, to);
    if (blocker) throw new UserFacingError(blocker);

    const from = order.status;
    const wasShipped = from === "SHIPPED" || from === "DELIVERED";

    if (to === "CANCELLED") {
      for (const it of order.items) await releaseStock(tx, it.variantId, it.quantity, order.id, "Order cancelled", opts.actorId ?? undefined);
      await releaseCouponInTx(tx, order.id);
      // No money will be collected for a cancelled order: close any open payment attempt (incl. COD).
      await tx.payment.updateMany({ where: { orderId: order.id, status: "PENDING" }, data: { status: "FAILED" } });
    }
    if (to === "SHIPPED") {
      for (const it of order.items) await fulfilStock(tx, it.variantId, it.quantity, order.id, opts.actorId ?? undefined);
    }
    if (to === "DELIVERED") {
      if (order.paymentMethod === "COD") {
        await tx.payment.updateMany({ where: { orderId: order.id, provider: "COD" }, data: { status: "PAID", verifiedAt: new Date() } });
      }
      for (const it of order.items) await tx.product.update({ where: { id: it.productId }, data: { salesCount: { increment: it.quantity } } });
    }
    if (to === "RETURNED" && wasShipped && opts.restock) {
      for (const it of order.items) await returnStock(tx, it.variantId, it.quantity, order.id, opts.actorId ?? undefined);
    }

    const paymentStatus =
      to === "DELIVERED" && order.paymentMethod === "COD" ? "PAID" : order.paymentStatus;

    const result = await tx.order.update({
      where: { id: order.id },
      data: { status: to, paymentStatus, reservationExpiresAt: to === "CANCELLED" ? null : order.reservationExpiresAt },
    });
    await tx.orderStatusHistory.create({ data: { orderId: order.id, fromStatus: from, toStatus: to, note: opts.note, changedById: opts.actorId } });
    return result;
  });

  if (opts.notifyCustomer !== false && updated.email && ["CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"].includes(to)) {
    const mail = orderStatusEmail(updated.orderNumber, STATUS_LABEL[to], trackingUrl(updated.orderNumber, updated.guestAccessToken), opts.note);
    sendEmail({ to: updated.email, ...mail }).catch((e) => logger.error("order.status_email_failed", { error: e }));
  }
  return updated;
}

export const trackingUrl = (orderNumber: string, token: string) => `${siteUrl}/order/${orderNumber}?t=${token}`;

/**
 * Cancels online-payment orders whose reservation window passed without payment,
 * releasing their stock. Safe to call often (cron, checkout, admin dashboard).
 */
export async function releaseExpiredReservations(limit = 50) {
  const expired = await db.order.findMany({
    where: { status: "PENDING", paymentStatus: { in: ["PENDING", "FAILED"] }, reservationExpiresAt: { lt: new Date() } },
    select: { id: true, orderNumber: true },
    take: limit,
  });
  for (const o of expired) {
    try {
      await changeOrderStatus(o.id, "CANCELLED", { actorId: null, note: "Payment not completed within 30 minutes — stock released automatically.", notifyCustomer: false });
      await db.payment.updateMany({ where: { orderId: o.id, status: "PENDING" }, data: { status: "FAILED" } });
      await db.order.update({ where: { id: o.id }, data: { paymentStatus: "FAILED" } });
    } catch (e) {
      logger.error("reservation.release_failed", { orderNumber: o.orderNumber, error: e });
    }
  }
  return expired.length;
}

/** Order lookup for the public tracking page: needs order number + matching phone or access token. */
export async function findOrderForCustomer(orderNumber: string, auth: { token?: string; phone?: string; userId?: string }) {
  const order = await db.order.findUnique({
    where: { orderNumber: orderNumber.trim().toUpperCase() },
    include: { items: true, history: { orderBy: { createdAt: "asc" } }, shipment: true, payments: { orderBy: { createdAt: "desc" } } },
  });
  if (!order) return null;
  const allowed =
    (auth.token && auth.token === order.guestAccessToken) ||
    (auth.phone && auth.phone === order.phone) ||
    (auth.userId && auth.userId === order.userId);
  return allowed ? order : null;
}
