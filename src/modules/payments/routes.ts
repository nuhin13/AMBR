import "server-only";
import { NextResponse } from "next/server";
import { siteUrl } from "@/lib/env";
import type { Order } from "@prisma/client";
import { localePath } from "@/i18n/config";

/** Where to send the customer's browser after a gateway callback. */
export function redirectForOrder(order: Pick<Order, "orderNumber" | "guestAccessToken" | "paymentStatus" | "locale"> | null) {
  if (!order) return NextResponse.redirect(`${siteUrl}/`, 303);
  const t = order.guestAccessToken;
  const locale = order.locale === "bn" ? "bn" : "en";
  return order.paymentStatus === "PAID"
    ? NextResponse.redirect(`${siteUrl}${localePath(locale, `/order/${order.orderNumber}/confirmation?t=${t}`)}`, 303)
    : NextResponse.redirect(`${siteUrl}${localePath(locale, `/checkout/payment/${order.orderNumber}?t=${t}`)}`, 303);
}
