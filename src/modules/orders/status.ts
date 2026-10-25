import type { OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";

/** Allowed order status transitions. Anything not listed is rejected by the server. */
export const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "SHIPPED", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "RETURNED"],
  DELIVERED: ["RETURNED"],
  CANCELLED: [],
  RETURNED: [],
};

export const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  UNPAID: "Unpaid",
  PENDING: "Awaiting payment",
  PAID: "Paid",
  FAILED: "Failed",
  REFUNDED: "Refunded",
  PARTIALLY_REFUNDED: "Partially refunded",
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  COD: "Cash on Delivery",
  BKASH: "bKash",
  NAGAD: "Nagad",
  CARD: "Card",
};

export function canTransition(from: OrderStatus, to: OrderStatus) {
  return TRANSITIONS[from].includes(to);
}

/** Business rule checks beyond the graph. Returns an error message or null. */
export function transitionBlocker(
  order: { status: OrderStatus; paymentMethod: PaymentMethod; paymentStatus: PaymentStatus },
  to: OrderStatus,
): string | null {
  if (!canTransition(order.status, to)) return `An order can't move from ${STATUS_LABEL[order.status]} to ${STATUS_LABEL[to]}.`;
  if (order.paymentMethod !== "COD" && ["CONFIRMED", "PROCESSING", "SHIPPED"].includes(to) && order.paymentStatus !== "PAID") {
    return "This order hasn't been paid yet. Online-payment orders can only be confirmed after the gateway confirms payment.";
  }
  return null;
}

/** Customer-facing progress steps for the tracking timeline. */
export const PROGRESS: OrderStatus[] = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];
