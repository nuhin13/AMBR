import "server-only";
import type { Coupon } from "@prisma/client";
import { db, type Tx } from "@/lib/db";
import { evaluateCoupon, type CouponEvaluation } from "@/modules/pricing";

export const normaliseCode = (code: string) => code.trim().toUpperCase().replace(/\s+/g, "");

/** Preview evaluation for the cart (no locking). */
export async function previewCoupon(code: string, subtotal: number): Promise<{ coupon: Coupon | null; result: CouponEvaluation }> {
  const coupon = await db.coupon.findUnique({ where: { code: normaliseCode(code) } });
  if (!coupon) return { coupon: null, result: { ok: false, reason: "We couldn't find that code." } };
  return { coupon, result: evaluateCoupon(coupon, subtotal) };
}

/**
 * Locks the coupon row, enforces global and per-customer limits and increments usage.
 * Called inside the order transaction so two customers can't both take the last use.
 */
export async function redeemCouponInTx(tx: Tx, code: string, subtotal: number, phone: string, userId: string | null) {
  const locked = await tx.$queryRaw<{ id: string }[]>`SELECT "id" FROM "Coupon" WHERE "code" = ${normaliseCode(code)} FOR UPDATE`;
  if (!locked[0]) return { coupon: null, result: { ok: false, reason: "We couldn't find that code." } as CouponEvaluation };
  const coupon = await tx.coupon.findUniqueOrThrow({ where: { id: locked[0].id } });
  let result = evaluateCoupon(coupon, subtotal);
  if (result.ok && coupon.perCustomerLimit !== null) {
    const used = await tx.couponRedemption.count({
      where: { couponId: coupon.id, OR: [{ phone }, ...(userId ? [{ userId }] : [])] },
    });
    if (used >= coupon.perCustomerLimit) result = { ok: false, reason: "You've already used this code." };
  }
  if (result.ok) await tx.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
  return { coupon, result };
}

/** Gives a coupon use back when an order is cancelled. */
export async function releaseCouponInTx(tx: Tx, orderId: string) {
  const r = await tx.couponRedemption.findUnique({ where: { orderId } });
  if (!r) return;
  await tx.couponRedemption.delete({ where: { id: r.id } });
  await tx.coupon.update({ where: { id: r.couponId }, data: { usedCount: { decrement: 1 } } });
}
