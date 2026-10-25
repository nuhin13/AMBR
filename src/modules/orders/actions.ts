"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { normalizeBDPhone } from "@/lib/phone";
import { enforceRateLimit } from "@/lib/rate-limit";
import { requestMeta } from "@/lib/request";
import type { ActionResult } from "@/lib/action-result";
import { LocalizedError } from "@/lib/i18n-errors";
import { localePath } from "@/i18n/config";
import { getRequestLocale } from "@/i18n/server";
import { localizedAction } from "@/i18n/actions";

/** Track-order lookup: order number + the phone used at checkout. Returns a link with the access token. */
export async function trackOrderAction(raw: unknown): Promise<ActionResult<{ redirectTo: string }>> {
  return localizedAction(async () => {
    const { ip } = await requestMeta();
    await enforceRateLimit(`track:${ip}`, 10, 600);
    const input = z.object({ orderNumber: z.string().trim().min(5).max(30), phone: z.string().trim().min(6, "validation.phone") }).parse(raw);
    const phone = normalizeBDPhone(input.phone);
    const order = await db.order.findUnique({ where: { orderNumber: input.orderNumber.toUpperCase() } });
    if (!order || !phone || order.phone !== phone) throw new LocalizedError("errors.orderNotFoundPhone");
    const locale = await getRequestLocale();
    return { ok: true as const, data: { redirectTo: localePath(locale, `/order/${order.orderNumber}?t=${order.guestAccessToken}`) } };
  });
}
