import "server-only";
import { randomInt } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { randomToken } from "@/lib/crypto";
import { logger } from "@/lib/logger";
import { normalizeBDPhone } from "@/lib/phone";
import { UserFacingError } from "@/lib/action-result";
import { reserveStock } from "@/modules/inventory/service";
import { computeTotals, type CouponEvaluation } from "@/modules/pricing";
import { redeemCouponInTx } from "@/modules/promotions/coupons";
import { resolveZone } from "@/modules/shipping/service";
import { availableMethods } from "@/modules/payments/availability";
import { getCheckoutCart } from "@/modules/cart/service";
import { releaseExpiredReservations } from "@/modules/orders/service";
import { sendOrderConfirmation } from "./notify";
import { trackServerPurchase } from "@/modules/analytics/capi";
import type { CheckoutInput } from "./schema";

const RESERVATION_MINUTES = 30;

function orderNumber() {
  const d = new Date(Date.now() + 6 * 3600_000); // Dhaka date
  const ymd = `${String(d.getUTCFullYear()).slice(2)}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  return `AMB-${ymd}-${randomInt(1000, 9999)}`;
}

export type PlacedOrder = { orderId: string; orderNumber: string; token: string; paymentMethod: CheckoutInput["paymentMethod"]; total: number };

/**
 * Places an order in ONE transaction: re-prices the cart from the database, reserves stock
 * with guarded updates, redeems the coupon, snapshots items and the address, and clears the cart.
 * Any failure rolls everything back.
 */
export async function placeOrder(input: CheckoutInput, userId: string | null): Promise<PlacedOrder> {
  const phone = normalizeBDPhone(input.phone)!;

  // Idempotency: a double-submitted form returns the original order.
  const existing = await db.order.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
  if (existing) return { orderId: existing.id, orderNumber: existing.orderNumber, token: existing.guestAccessToken, paymentMethod: existing.paymentMethod, total: existing.total };

  if (!(await availableMethods()).includes(input.paymentMethod)) throw new UserFacingError("That payment method isn't available right now. Please choose another.");

  // Free stock held by abandoned online-payment orders before we check availability.
  await releaseExpiredReservations(20).catch((e) => logger.warn("checkout.release_expired_failed", { error: e }));

  const cart = await getCheckoutCart();
  if (!cart || cart.items.length === 0) throw new UserFacingError("Your bag is empty.");

  const district = await db.district.findUnique({ where: { id: input.districtId } });
  const upazila = await db.upazila.findFirst({ where: { id: input.upazilaId, districtId: input.districtId } });
  if (!district || !upazila) throw new UserFacingError("Please choose a valid district and area.");
  const zone = await resolveZone(district.id, upazila.id);
  if (!zone) throw new UserFacingError("Sorry, we don't deliver to this area yet. Please contact us on WhatsApp.");

  for (const it of cart.items) {
    const p = it.variant.product;
    if (p.status !== "PUBLISHED" || p.category.status !== "ACTIVE" || it.variant.status !== "ACTIVE") {
      throw new UserFacingError(`${p.name} (${it.variant.label}) is no longer available. Please remove it from your bag.`);
    }
  }

  const lines = cart.items.map((it) => ({
    variantId: it.variantId,
    productId: it.variant.productId,
    productName: it.variant.product.name,
    productSlug: it.variant.product.slug,
    variantLabel: it.variant.label,
    sku: it.variant.sku,
    unitPrice: it.variant.price,
    quantity: it.quantity,
    imageUrl: it.variant.product.images[0]?.url ?? null,
    isDemo: it.variant.product.isDemo,
  }));
  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const online = input.paymentMethod !== "COD";

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const placed = await db.$transaction(
        async (tx) => {
          let coupon: CouponEvaluation | null = null;
          let couponId: string | null = null;
          if (cart.couponCode) {
            const r = await redeemCouponInTx(tx, cart.couponCode, subtotal, phone, userId);
            if (!r.result.ok) throw new UserFacingError(`Coupon ${cart.couponCode}: ${r.result.reason} Remove it from your bag to continue.`);
            coupon = r.result;
            couponId = r.coupon!.id;
          }
          const totals = computeTotals(lines, { coupon, zone });
          const token = randomToken(18);
          const order = await tx.order.create({
            data: {
              orderNumber: orderNumber(),
              userId,
              guestAccessToken: token,
              idempotencyKey: input.idempotencyKey,
              status: "PENDING",
              paymentStatus: online ? "PENDING" : "UNPAID",
              paymentMethod: input.paymentMethod,
              customerName: input.customerName,
              phone,
              email: input.email || null,
              districtName: district.name,
              upazilaName: upazila.name,
              addressLine: input.addressLine,
              deliveryInstructions: input.deliveryInstructions || null,
              shippingZoneName: zone.name,
              subtotal: totals.subtotal,
              discountTotal: totals.discount,
              shippingFee: totals.shippingFee,
              total: totals.total,
              couponCode: coupon ? cart.couponCode : null,
              reservationExpiresAt: online ? new Date(Date.now() + RESERVATION_MINUTES * 60_000) : null,
              isDemo: lines.some((l) => l.isDemo),
              items: {
                create: lines.map((l) => ({
                  variantId: l.variantId,
                  productId: l.productId,
                  productName: l.productName,
                  productSlug: l.productSlug,
                  variantLabel: l.variantLabel,
                  sku: l.sku,
                  unitPrice: l.unitPrice,
                  quantity: l.quantity,
                  imageUrl: l.imageUrl,
                  lineTotal: l.unitPrice * l.quantity,
                })),
              },
              history: { create: { toStatus: "PENDING", note: online ? "Order placed — awaiting online payment." : "Order placed — cash on delivery." } },
              ...(online ? {} : { payments: { create: { provider: "COD", amount: totals.total, status: "PENDING" } } }),
            },
          });
          for (const l of lines) await reserveStock(tx, l.variantId, l.quantity, order.id, `${l.productName} (${l.variantLabel})`);
          if (couponId) await tx.couponRedemption.create({ data: { couponId, orderId: order.id, userId, phone, amount: totals.discount } });
          await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
          await tx.cart.update({ where: { id: cart.id }, data: { couponCode: null, contactPhone: phone, contactEmail: input.email || null } });

          if (userId && input.saveAddress) {
            const count = await tx.address.count({ where: { userId } });
            await tx.address.create({
              data: { userId, recipientName: input.customerName, phone, districtId: district.id, upazilaId: upazila.id, line: input.addressLine, isDefault: count === 0 },
            });
          }
          return { orderId: order.id, orderNumber: order.orderNumber, token, paymentMethod: input.paymentMethod, total: order.total };
        },
        { timeout: 15_000 },
      );

      logger.info("order.placed", { orderNumber: placed.orderNumber, method: placed.paymentMethod, total: placed.total });
      if (!online) {
        sendOrderConfirmation(placed.orderId).catch((e) => logger.error("order.confirmation_email_failed", { error: e }));
        trackServerPurchase(placed.orderId).catch((e) => logger.error("capi.purchase_failed", { error: e }));
      }
      return placed;
    } catch (e) {
      // Retry only on an order-number collision; everything else bubbles up.
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002" && String(e.meta?.target).includes("orderNumber")) continue;
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002" && String(e.meta?.target).includes("idempotencyKey")) {
        const o = await db.order.findUniqueOrThrow({ where: { idempotencyKey: input.idempotencyKey } });
        return { orderId: o.id, orderNumber: o.orderNumber, token: o.guestAccessToken, paymentMethod: o.paymentMethod, total: o.total };
      }
      throw e;
    }
  }
  throw new UserFacingError("We couldn't create your order. Please try again.");
}
