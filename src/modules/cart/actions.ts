"use server";

import { z } from "zod";
import { toActionError, type ActionResult } from "@/lib/action-result";
import { enforceRateLimit } from "@/lib/rate-limit";
import { requestMeta } from "@/lib/request";
import * as cart from "./service";
import type { CartView } from "./service";

const id = z.string().min(1).max(40);
const qty = z.number().int().min(0).max(20);

async function run(fn: () => Promise<CartView>): Promise<ActionResult<CartView>> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    return toActionError(e);
  }
}

export async function getCartAction() {
  return run(() => cart.getCartView());
}

export async function addToCartAction(variantId: string, quantity = 1) {
  return run(async () => {
    const { ip } = await requestMeta();
    await enforceRateLimit(`cart:${ip}`, 120, 60);
    return cart.addItem(id.parse(variantId), qty.min(1).parse(quantity));
  });
}

export async function updateCartItemAction(itemId: string, quantity: number) {
  return run(() => cart.updateQuantity(id.parse(itemId), qty.parse(quantity)));
}

export async function removeCartItemAction(itemId: string) {
  return run(() => cart.removeItem(id.parse(itemId)));
}

export async function changeCartVariantAction(itemId: string, variantId: string) {
  return run(() => cart.changeVariant(id.parse(itemId), id.parse(variantId)));
}

export async function applyCouponAction(code: string) {
  return run(async () => {
    const { ip } = await requestMeta();
    await enforceRateLimit(`coupon:${ip}`, 15, 600);
    return cart.applyCoupon(z.string().max(40).parse(code));
  });
}

export async function removeCouponAction() {
  return run(() => cart.removeCoupon());
}
