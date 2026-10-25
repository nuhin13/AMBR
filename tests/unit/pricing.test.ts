import { describe, expect, it } from "vitest";
import { computeTotals, evaluateCoupon, shippingFee, type CouponRule } from "@/modules/pricing";

const base: CouponRule = { code: "X", type: "PERCENT", value: 10, maxDiscount: null, minSubtotal: null, startsAt: null, endsAt: null, usageLimit: null, usedCount: 0, isActive: true };
const tk = (n: number) => n * 100;

describe("evaluateCoupon", () => {
  it("applies a percentage discount rounded down to whole taka", () => {
    const r = evaluateCoupon({ ...base, value: 10 }, tk(855));
    expect(r).toMatchObject({ ok: true, discount: tk(85) });
  });
  it("caps percentage discounts at maxDiscount", () => {
    expect(evaluateCoupon({ ...base, value: 50, maxDiscount: tk(100) }, tk(1000))).toMatchObject({ ok: true, discount: tk(100) });
  });
  it("never discounts more than the subtotal", () => {
    expect(evaluateCoupon({ ...base, type: "FIXED", value: tk(500) }, tk(300))).toMatchObject({ ok: true, discount: tk(300) });
  });
  it("enforces minimum subtotal with a helpful message", () => {
    const r = evaluateCoupon({ ...base, minSubtotal: tk(800) }, tk(650));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain("৳150");
  });
  it("rejects expired, not-yet-active, inactive and exhausted codes", () => {
    const now = new Date("2026-10-25T00:00:00Z");
    expect(evaluateCoupon({ ...base, endsAt: new Date("2026-10-01") }, tk(1000), now).ok).toBe(false);
    expect(evaluateCoupon({ ...base, startsAt: new Date("2026-11-01") }, tk(1000), now).ok).toBe(false);
    expect(evaluateCoupon({ ...base, isActive: false }, tk(1000), now).ok).toBe(false);
    expect(evaluateCoupon({ ...base, usageLimit: 5, usedCount: 5 }, tk(1000), now).ok).toBe(false);
  });
  it("free-shipping coupons give no item discount", () => {
    expect(evaluateCoupon({ ...base, type: "FREE_SHIPPING", value: 0 }, tk(500))).toMatchObject({ ok: true, discount: 0, freeShipping: true });
  });
});

describe("shippingFee", () => {
  const zone = { fee: tk(70), freeShippingThreshold: tk(1500) };
  it("charges the zone fee below the threshold", () => expect(shippingFee(zone, tk(1499), false)).toBe(tk(70)));
  it("is free at or above the threshold", () => expect(shippingFee(zone, tk(1500), false)).toBe(0));
  it("is free with a free-shipping coupon", () => expect(shippingFee(zone, tk(100), true)).toBe(0));
  it("never free by threshold when none is set", () => expect(shippingFee({ fee: tk(130), freeShippingThreshold: null }, tk(99999), false)).toBe(tk(130)));
});

describe("computeTotals", () => {
  it("adds lines, subtracts discount and adds delivery", () => {
    const lines = [{ unitPrice: tk(350), quantity: 2 }, { unitPrice: tk(850), quantity: 1 }];
    const coupon = evaluateCoupon({ ...base, value: 10 }, tk(1550));
    expect(computeTotals(lines, { coupon, zone: { fee: tk(70), freeShippingThreshold: null } })).toEqual({ subtotal: tk(1550), discount: tk(155), shippingFee: tk(70), total: tk(1465) });
  });
  it("checks the free threshold against the discounted subtotal", () => {
    const coupon = evaluateCoupon({ ...base, type: "FIXED", value: tk(100) }, tk(1500));
    const t = computeTotals([{ unitPrice: tk(1500), quantity: 1 }], { coupon, zone: { fee: tk(70), freeShippingThreshold: tk(1500) } });
    expect(t.shippingFee).toBe(tk(70));
    expect(t.total).toBe(tk(1470));
  });
  it("ignores invalid coupons", () => {
    const coupon = evaluateCoupon({ ...base, isActive: false }, tk(500));
    expect(computeTotals([{ unitPrice: tk(500), quantity: 1 }], { coupon }).discount).toBe(0);
  });
});
