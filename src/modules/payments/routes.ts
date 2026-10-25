import "server-only";
import { NextResponse } from "next/server";
import { siteUrl } from "@/lib/env";
import type { Order } from "@prisma/client";

/** Where to send the customer's browser after a gateway callback. */
export function redirectForOrder(order: Pick<Order, "orderNumber" | "guestAccessToken" | "paymentStatus"> | null) {
  if (!order) return NextResponse.redirect(`${siteUrl}/`, 303);
  const t = order.guestAccessToken;
  return order.paymentStatus === "PAID"
    ? NextResponse.redirect(`${siteUrl}/order/${order.orderNumber}/confirmation?t=${t}`, 303)
    : NextResponse.redirect(`${siteUrl}/checkout/payment/${order.orderNumber}?t=${t}`, 303);
}
