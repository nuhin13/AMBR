import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { testDb, resetDb, makeVariant, makeOrder } from "../support/factory";
import { reserveStock } from "@/modules/inventory/service";
import { changeOrderStatus, releaseExpiredReservations } from "@/modules/orders/service";
import { applyVerification } from "@/modules/payments/service";
import { redeemCouponInTx } from "@/modules/promotions/coupons";
import { db } from "@/lib/db";

beforeEach(resetDb);
afterAll(async () => {
  await testDb.$disconnect();
  await db.$disconnect();
});

async function reservedOrder(qty = 2, extra: Parameters<typeof makeOrder>[3] = {}) {
  const { variant, product } = await makeVariant({ onHand: 10 });
  const order = await makeOrder(variant.id, product.id, qty, extra);
  await db.$transaction((tx) => reserveStock(tx, variant.id, qty, order.id, "P"));
  return { order, variant, product };
}

describe("order status changes", () => {
  it("cancelling releases reserved stock and records history", async () => {
    const { order, variant } = await reservedOrder(2);
    await changeOrderStatus(order.id, "CANCELLED", { actorId: null, note: "customer asked" });
    expect(await testDb.inventory.findUniqueOrThrow({ where: { variantId: variant.id } })).toMatchObject({ onHand: 10, reserved: 0 });
    const h = await testDb.orderStatusHistory.findMany({ where: { orderId: order.id } });
    expect(h.map((x) => x.toStatus)).toContain("CANCELLED");
  });

  it("shipping deducts on-hand stock; delivering a COD order marks it paid", async () => {
    const { order, variant, product } = await reservedOrder(2);
    await testDb.payment.create({ data: { orderId: order.id, provider: "COD", amount: order.total } });
    await changeOrderStatus(order.id, "CONFIRMED", { actorId: null });
    await changeOrderStatus(order.id, "SHIPPED", { actorId: null });
    expect(await testDb.inventory.findUniqueOrThrow({ where: { variantId: variant.id } })).toMatchObject({ onHand: 8, reserved: 0 });
    await changeOrderStatus(order.id, "DELIVERED", { actorId: null });
    const o = await testDb.order.findUniqueOrThrow({ where: { id: order.id }, include: { payments: true } });
    expect(o.paymentStatus).toBe("PAID");
    expect(o.payments[0].status).toBe("PAID");
    expect((await testDb.product.findUniqueOrThrow({ where: { id: product.id } })).salesCount).toBe(2);
  });

  it("rejects illegal transitions", async () => {
    const { order } = await reservedOrder(1);
    await expect(changeOrderStatus(order.id, "DELIVERED", { actorId: null })).rejects.toThrow(/can't move/);
  });

  it("returns can restock", async () => {
    const { order, variant } = await reservedOrder(1);
    await changeOrderStatus(order.id, "CONFIRMED", { actorId: null });
    await changeOrderStatus(order.id, "SHIPPED", { actorId: null });
    await changeOrderStatus(order.id, "RETURNED", { actorId: null, restock: true });
    expect(await testDb.inventory.findUniqueOrThrow({ where: { variantId: variant.id } })).toMatchObject({ onHand: 10, reserved: 0 });
  });

  it("expired unpaid online orders are cancelled and stock released", async () => {
    const { order, variant } = await reservedOrder(3, { paymentMethod: "BKASH", paymentStatus: "PENDING" });
    await testDb.order.update({ where: { id: order.id }, data: { reservationExpiresAt: new Date(Date.now() - 60_000) } });
    expect(await releaseExpiredReservations()).toBe(1);
    expect((await testDb.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("CANCELLED");
    expect(await testDb.inventory.findUniqueOrThrow({ where: { variantId: variant.id } })).toMatchObject({ reserved: 0 });
  });
});

describe("payment verification", () => {
  async function pendingPayment() {
    const { order } = await reservedOrder(1, { paymentMethod: "BKASH", paymentStatus: "PENDING" });
    await testDb.payment.create({ data: { orderId: order.id, provider: "BKASH", amount: order.total, providerPaymentId: "PAY-1" } });
    return order;
  }

  it("marks the order paid only when the verified amount matches — and is idempotent", async () => {
    const order = await pendingPayment();
    const ok = { status: "PAID" as const, providerPaymentId: "PAY-1", trxId: "TRX1", amount: order.total, raw: {} };
    await applyVerification("BKASH", ok);
    await applyVerification("BKASH", ok); // duplicate callback
    const o = await testDb.order.findUniqueOrThrow({ where: { id: order.id }, include: { history: true } });
    expect(o.paymentStatus).toBe("PAID");
    expect(o.history.filter((h) => h.note?.includes("confirmed by BKASH"))).toHaveLength(1);
  });

  it("refuses a payment whose amount doesn't match", async () => {
    const order = await pendingPayment();
    await applyVerification("BKASH", { status: "PAID", providerPaymentId: "PAY-1", trxId: "TRX1", amount: order.total - 100, raw: {} });
    expect((await testDb.order.findUniqueOrThrow({ where: { id: order.id } })).paymentStatus).not.toBe("PAID");
    expect((await testDb.payment.findFirstOrThrow({ where: { providerPaymentId: "PAY-1" } })).status).toBe("FAILED");
  });

  it("a failed gateway result never marks the order paid", async () => {
    const order = await pendingPayment();
    await applyVerification("BKASH", { status: "FAILED", providerPaymentId: "PAY-1", reason: "insufficient balance", raw: {} });
    expect((await testDb.order.findUniqueOrThrow({ where: { id: order.id } })).paymentStatus).toBe("FAILED");
  });
});

describe("coupons", () => {
  it("a single-use coupon can only be redeemed once under concurrency", async () => {
    await testDb.coupon.create({ data: { code: "ONCE", type: "FIXED", value: 5000, usageLimit: 1 } });
    const results = await Promise.allSettled(
      Array.from({ length: 5 }, (_, i) => db.$transaction((tx) => redeemCouponInTx(tx, "once", 100000, `+88017000000${i}0`, null))),
    );
    const ok = results.filter((r) => r.status === "fulfilled" && r.value.result.ok);
    expect(ok).toHaveLength(1);
    expect((await testDb.coupon.findUniqueOrThrow({ where: { code: "ONCE" } })).usedCount).toBe(1);
  });

  it("enforces the per-customer limit by phone", async () => {
    const c = await testDb.coupon.create({ data: { code: "PERPHONE", type: "PERCENT", value: 10, perCustomerLimit: 1 } });
    const { order } = await reservedOrder(1);
    await testDb.couponRedemption.create({ data: { couponId: c.id, orderId: order.id, phone: "+8801712345678", amount: 100 } });
    const r = await db.$transaction((tx) => redeemCouponInTx(tx, "PERPHONE", 100000, "+8801712345678", null));
    expect(r.result.ok).toBe(false);
  });
});
