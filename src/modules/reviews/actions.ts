"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";
import { toActionError, UserFacingError, type ActionResult } from "@/lib/action-result";
import { getCurrentUser } from "@/modules/auth/session";

const schema = z.object({
  orderItemId: z.string().min(1),
  rating: z.coerce.number().int().min(1, "Choose a rating").max(5),
  title: z.string().trim().max(80).optional(),
  body: z.string().trim().min(10, "Please write at least a sentence").max(1500),
});

/**
 * Reviews can only be written for an order item that was DELIVERED to the signed-in customer.
 * They are held for moderation (PENDING) and only appear once approved by staff.
 */
export async function submitReviewAction(raw: unknown): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) throw new UserFacingError("Please sign in to write a review.");
    await enforceRateLimit(`review:${user.id}`, 10, 3600);
    const input = schema.parse(raw);
    const item = await db.orderItem.findFirst({
      where: { id: input.orderItemId, order: { userId: user.id, status: "DELIVERED" } },
      include: { review: true },
    });
    if (!item) throw new UserFacingError("You can review products from delivered orders only.");
    if (item.review) throw new UserFacingError("You've already reviewed this item.");
    await db.review.create({
      data: { productId: item.productId, userId: user.id, orderItemId: item.id, rating: input.rating, title: input.title || null, body: input.body },
    });
    revalidatePath("/account/orders");
    return { ok: true, message: "Thank you! Your review will appear once it's been checked." };
  } catch (e) {
    return toActionError(e);
  }
}
