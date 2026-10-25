"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";
import type { ActionResult } from "@/lib/action-result";
import { LocalizedError } from "@/lib/i18n-errors";
import { getDictionary, getRequestLocale } from "@/i18n/server";
import { localizedAction } from "@/i18n/actions";
import { getCurrentUser } from "@/modules/auth/session";

const schema = z.object({
  orderItemId: z.string().min(1),
  rating: z.coerce.number().int().min(1, "validation.rating").max(5),
  title: z.string().trim().max(80).optional(),
  body: z.string().trim().min(10, "validation.reviewBody").max(1500),
});

/**
 * Reviews can only be written for an order item that was DELIVERED to the signed-in customer.
 * They are held for moderation (PENDING) and only appear once approved by staff.
 */
export async function submitReviewAction(raw: unknown): Promise<ActionResult> {
  return localizedAction(async () => {
    const user = await getCurrentUser();
    if (!user) throw new LocalizedError("errors.reviewSignIn");
    await enforceRateLimit(`review:${user.id}`, 10, 3600);
    const input = schema.parse(raw);
    const item = await db.orderItem.findFirst({
      where: { id: input.orderItemId, order: { userId: user.id, status: "DELIVERED" } },
      include: { review: true },
    });
    if (!item) throw new LocalizedError("errors.reviewDeliveredOnly");
    if (item.review) throw new LocalizedError("errors.reviewDuplicate");
    await db.review.create({
      data: { productId: item.productId, userId: user.id, orderItemId: item.id, rating: input.rating, title: input.title || null, body: input.body, locale: await getRequestLocale() },
    });
    revalidatePath("/account/orders");
    return { ok: true as const, message: getDictionary(await getRequestLocale()).errors.reviewThanks };
  });
}
