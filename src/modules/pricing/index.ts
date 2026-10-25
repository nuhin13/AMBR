import { percentOf } from "@/lib/money";
import type { MessageKey } from "@/i18n/translate";

/**
 * Pure pricing rules — no database access, fully unit-tested.
 * The server always recomputes totals with these functions; client totals are display-only.
 */

export type CouponRule = {
  code: string;
  type: "PERCENT" | "FIXED" | "FREE_SHIPPING";
  value: number;
  maxDiscount: number | null;
  minSubtotal: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
};

export type CouponEvaluation =
  | { ok: true; discount: number; freeShipping: boolean; label: string }
  | { ok: false; reason: string; reasonKey: MessageKey; vars?: Record<string, string | number> };

const fail = (reasonKey: MessageKey, reason: string, vars?: Record<string, string | number>): CouponEvaluation => ({ ok: false, reason, reasonKey, vars });

export function evaluateCoupon(coupon: CouponRule, subtotal: number, now = new Date()): CouponEvaluation {
  if (!coupon.isActive) return fail("errors.codeInactive", "This code is no longer active.");
  if (coupon.startsAt && coupon.startsAt > now) return fail("errors.codeNotYet", "This code isn't active yet.");
  if (coupon.endsAt && coupon.endsAt < now) return fail("errors.codeExpired", "This code has expired.");
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) return fail("errors.codeLimit", "This code has reached its usage limit.");
  if (coupon.minSubtotal !== null && subtotal < coupon.minSubtotal) {
    const amount = Math.ceil((coupon.minSubtotal - subtotal) / 100);
    return fail("errors.codeMin", `Add ৳${amount} more to use this code.`, { amount });
  }
  switch (coupon.type) {
    case "PERCENT": {
      let d = percentOf(subtotal, Math.min(100, Math.max(0, coupon.value)));
      if (coupon.maxDiscount !== null) d = Math.min(d, coupon.maxDiscount);
      return { ok: true, discount: Math.min(d, subtotal), freeShipping: false, label: `${coupon.value}% off` };
    }
    case "FIXED":
      return { ok: true, discount: Math.min(coupon.value, subtotal), freeShipping: false, label: `৳${coupon.value / 100} off` };
    case "FREE_SHIPPING":
      return { ok: true, discount: 0, freeShipping: true, label: "Free delivery" };
  }
}

export type ZoneRate = { fee: number; freeShippingThreshold: number | null };

export function shippingFee(zone: ZoneRate, subtotalAfterDiscount: number, freeShippingCoupon: boolean): number {
  if (freeShippingCoupon) return 0;
  if (zone.freeShippingThreshold !== null && subtotalAfterDiscount >= zone.freeShippingThreshold) return 0;
  return zone.fee;
}

export type Totals = { subtotal: number; discount: number; shippingFee: number; total: number };

export function computeTotals(
  lines: { unitPrice: number; quantity: number }[],
  opts: { coupon?: CouponEvaluation | null; zone?: ZoneRate | null },
): Totals {
  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const c = opts.coupon && opts.coupon.ok ? opts.coupon : null;
  const discount = c ? Math.min(c.discount, subtotal) : 0;
  const fee = opts.zone ? shippingFee(opts.zone, subtotal - discount, c?.freeShipping ?? false) : 0;
  return { subtotal, discount, shippingFee: fee, total: subtotal - discount + fee };
}
