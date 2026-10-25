"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { normalizeBDPhone } from "@/lib/phone";
import { enforceRateLimit } from "@/lib/rate-limit";
import { requestMeta } from "@/lib/request";
import { toActionError, UserFacingError, type ActionResult } from "@/lib/action-result";

/** Track-order lookup: order number + the phone used at checkout. Returns a link with the access token. */
export async function trackOrderAction(raw: unknown): Promise<ActionResult<{ redirectTo: string }>> {
  try {
    const { ip } = await requestMeta();
    await enforceRateLimit(`track:${ip}`, 10, 600);
    const input = z.object({ orderNumber: z.string().trim().min(5, "Enter your order number").max(30), phone: z.string().trim().min(6, "Enter your phone number") }).parse(raw);
    const phone = normalizeBDPhone(input.phone);
    const order = await db.order.findUnique({ where: { orderNumber: input.orderNumber.toUpperCase() } });
    if (!order || !phone || order.phone !== phone) throw new UserFacingError("We couldn't find an order with that number and phone. Please check and try again.");
    return { ok: true, data: { redirectTo: `/order/${order.orderNumber}?t=${order.guestAccessToken}` } };
  } catch (e) {
    return toActionError(e);
  }
}
