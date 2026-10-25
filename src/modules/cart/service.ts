import "server-only";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { randomToken } from "@/lib/crypto";
import { LocalizedError } from "@/lib/i18n-errors";
import { getCurrentUser } from "@/modules/auth/session";
import { sellable } from "@/modules/inventory/service";
import { computeTotals, evaluateCoupon, type CouponEvaluation } from "@/modules/pricing";
import { getSettings } from "@/modules/content/settings";
import { normaliseCode } from "@/modules/promotions/coupons";

export const CART_COOKIE = "ambr_cart";

export type CartLine = {
  id: string;
  variantId: string;
  productId: string;
  productSlug: string;
  productName: string;
  variantLabel: string;
  imageUrl: string | null;
  unitPrice: number;
  compareAtPrice: number | null;
  quantity: number;
  available: number;
  /** Purchasable right now (product published, variant active, enough stock). */
  ok: boolean;
  /** Why the line can't be bought right now (translated on the client). */
  issue: { code: "unavailable" | "soldOut" | "onlyLeft"; count?: number } | null;
  otherVariants: { id: string; label: string; price: number; available: number }[];
};

export type CartView = {
  id: string | null;
  lines: CartLine[];
  count: number;
  subtotal: number;
  discount: number;
  couponCode: string | null;
  coupon: CouponEvaluation | null;
  total: number; // before delivery
  maxQtyPerItem: number;
  hasIssues: boolean;
};

const EMPTY: Omit<CartView, "maxQtyPerItem"> = { id: null, lines: [], count: 0, subtotal: 0, discount: 0, couponCode: null, coupon: null, total: 0, hasIssues: false };

/** Finds the current cart (user cart when logged in, otherwise the guest-cookie cart). */
async function findCartId(): Promise<string | null> {
  const user = await getCurrentUser();
  if (user) {
    const c = await db.cart.findUnique({ where: { userId: user.id }, select: { id: true } });
    return c?.id ?? null;
  }
  const token = (await cookies()).get(CART_COOKIE)?.value;
  if (!token) return null;
  const c = await db.cart.findUnique({ where: { guestToken: token }, select: { id: true } });
  return c?.id ?? null;
}

/** Finds or creates the cart. Only callable from server actions/route handlers (may set a cookie). */
async function ensureCart(): Promise<string> {
  const existing = await findCartId();
  if (existing) return existing;
  const user = await getCurrentUser();
  if (user) return (await db.cart.create({ data: { userId: user.id } })).id;
  const token = randomToken(24);
  (await cookies()).set(CART_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 60 });
  return (await db.cart.create({ data: { guestToken: token } })).id;
}

export async function getCartView(): Promise<CartView> {
  const { checkout } = await getSettings();
  const cartId = await findCartId();
  if (!cartId) return { ...EMPTY, maxQtyPerItem: checkout.maxQtyPerItem };
  return buildCartView(cartId, checkout.maxQtyPerItem);
}

export async function buildCartView(cartId: string, maxQtyPerItem: number): Promise<CartView> {
  const cart = await db.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
        include: {
          variant: {
            include: {
              inventory: true,
              product: {
                include: {
                  category: { select: { status: true } },
                  images: { orderBy: { sortOrder: "asc" }, take: 1 },
                  variants: { where: { status: "ACTIVE" }, orderBy: { sizeMl: "asc" }, include: { inventory: true } },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!cart) return { ...EMPTY, maxQtyPerItem };

  const lines: CartLine[] = cart.items.map((item) => {
    const v = item.variant;
    const p = v.product;
    const available = sellable(v.inventory);
    let issue: CartLine["issue"] = null;
    if (p.status !== "PUBLISHED" || p.category.status !== "ACTIVE" || v.status !== "ACTIVE") issue = { code: "unavailable" };
    else if (available === 0) issue = { code: "soldOut" };
    else if (item.quantity > available) issue = { code: "onlyLeft", count: available };
    return {
      id: item.id,
      variantId: v.id,
      productId: p.id,
      productSlug: p.slug,
      productName: p.name,
      variantLabel: v.label,
      imageUrl: p.images[0]?.url ?? null,
      unitPrice: v.price,
      compareAtPrice: v.compareAtPrice && v.compareAtPrice > v.price ? v.compareAtPrice : null,
      quantity: item.quantity,
      available,
      ok: issue === null,
      issue,
      otherVariants: p.variants.map((o) => ({ id: o.id, label: o.label, price: o.price, available: sellable(o.inventory) })),
    };
  });

  const purchasable = lines.filter((l) => l.ok);
  let coupon: CouponEvaluation | null = null;
  if (cart.couponCode) {
    const c = await db.coupon.findUnique({ where: { code: cart.couponCode } });
    const sub = purchasable.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
    coupon = c ? evaluateCoupon(c, sub) : { ok: false, reason: "This code is no longer available.", reasonKey: "errors.codeInactive" };
  }
  const totals = computeTotals(purchasable, { coupon });
  return {
    id: cart.id,
    lines,
    count: lines.reduce((s, l) => s + l.quantity, 0),
    subtotal: totals.subtotal,
    discount: totals.discount,
    couponCode: cart.couponCode,
    coupon,
    total: totals.total,
    maxQtyPerItem,
    hasIssues: lines.some((l) => !l.ok),
  };
}

async function touch(cartId: string) {
  await db.cart.update({ where: { id: cartId }, data: { lastActivityAt: new Date() } });
}

async function assertPurchasable(variantId: string) {
  const v = await db.productVariant.findUnique({
    where: { id: variantId },
    include: { inventory: true, product: { include: { category: { select: { status: true } } } } },
  });
  if (!v || v.status !== "ACTIVE" || v.product.status !== "PUBLISHED" || v.product.category.status !== "ACTIVE") {
    throw new LocalizedError("errors.itemUnavailable");
  }
  return { available: sellable(v.inventory), name: `${v.product.name} (${v.label})` };
}

export async function addItem(variantId: string, quantity: number) {
  const { checkout } = await getSettings();
  const { available, name } = await assertPurchasable(variantId);
  if (available <= 0) throw new LocalizedError("errors.soldOutName", { name });
  const cartId = await ensureCart();
  const existing = await db.cartItem.findUnique({ where: { cartId_variantId: { cartId, variantId } } });
  const next = Math.min((existing?.quantity ?? 0) + quantity, available, checkout.maxQtyPerItem);
  if (existing && next === existing.quantity) {
    throw existing.quantity >= available ? new LocalizedError("errors.haveAllStock", { name }) : new LocalizedError("errors.maxPerItem", { max: checkout.maxQtyPerItem });
  }
  await db.cartItem.upsert({
    where: { cartId_variantId: { cartId, variantId } },
    create: { cartId, variantId, quantity: next },
    update: { quantity: next },
  });
  await touch(cartId);
  return buildCartView(cartId, checkout.maxQtyPerItem);
}

async function ownedItem(itemId: string) {
  const cartId = await findCartId();
  const item = cartId ? await db.cartItem.findFirst({ where: { id: itemId, cartId } }) : null;
  if (!item || !cartId) throw new LocalizedError("errors.itemGone");
  return { item, cartId };
}

export async function updateQuantity(itemId: string, quantity: number) {
  const { checkout } = await getSettings();
  const { item, cartId } = await ownedItem(itemId);
  if (quantity <= 0) {
    await db.cartItem.delete({ where: { id: item.id } });
  } else {
    const { available } = await assertPurchasable(item.variantId);
    const q = Math.min(quantity, Math.max(available, 1), checkout.maxQtyPerItem);
    await db.cartItem.update({ where: { id: item.id }, data: { quantity: q } });
  }
  await touch(cartId);
  return buildCartView(cartId, checkout.maxQtyPerItem);
}

export async function removeItem(itemId: string) {
  return updateQuantity(itemId, 0);
}

export async function changeVariant(itemId: string, newVariantId: string) {
  const { checkout } = await getSettings();
  const { item, cartId } = await ownedItem(itemId);
  if (item.variantId === newVariantId) return buildCartView(cartId, checkout.maxQtyPerItem);
  const [current, next] = await Promise.all([
    db.productVariant.findUnique({ where: { id: item.variantId }, select: { productId: true } }),
    db.productVariant.findUnique({ where: { id: newVariantId }, select: { productId: true } }),
  ]);
  if (!current || !next || current.productId !== next.productId) throw new LocalizedError("errors.sameFragranceSize");
  const { available, name } = await assertPurchasable(newVariantId);
  if (available <= 0) throw new LocalizedError("errors.soldOutName", { name });
  await db.$transaction(async (tx) => {
    const dup = await tx.cartItem.findUnique({ where: { cartId_variantId: { cartId, variantId: newVariantId } } });
    if (dup) {
      await tx.cartItem.update({ where: { id: dup.id }, data: { quantity: Math.min(dup.quantity + item.quantity, available, checkout.maxQtyPerItem) } });
      await tx.cartItem.delete({ where: { id: item.id } });
    } else {
      await tx.cartItem.update({ where: { id: item.id }, data: { variantId: newVariantId, quantity: Math.min(item.quantity, available) } });
    }
  });
  await touch(cartId);
  return buildCartView(cartId, checkout.maxQtyPerItem);
}

export async function applyCoupon(code: string) {
  const { checkout } = await getSettings();
  const cartId = await findCartId();
  if (!cartId) throw new LocalizedError("errors.bagEmpty");
  const normalised = normaliseCode(code);
  if (!normalised) throw new LocalizedError("errors.enterCode");
  const coupon = await db.coupon.findUnique({ where: { code: normalised } });
  if (!coupon) throw new LocalizedError("errors.codeNotFound");
  const view = await buildCartView(cartId, checkout.maxQtyPerItem);
  const result = evaluateCoupon(coupon, view.subtotal);
  if (!result.ok) throw new LocalizedError(result.reasonKey, result.vars);
  await db.cart.update({ where: { id: cartId }, data: { couponCode: normalised } });
  return buildCartView(cartId, checkout.maxQtyPerItem);
}

export async function removeCoupon() {
  const { checkout } = await getSettings();
  const cartId = await findCartId();
  if (!cartId) return { ...EMPTY, maxQtyPerItem: checkout.maxQtyPerItem };
  await db.cart.update({ where: { id: cartId }, data: { couponCode: null } });
  return buildCartView(cartId, checkout.maxQtyPerItem);
}

/** Moves guest-cart items into the user's cart after login/registration. */
export async function mergeGuestCart(userId: string) {
  const jar = await cookies();
  const token = jar.get(CART_COOKIE)?.value;
  if (!token) return;
  const guest = await db.cart.findUnique({ where: { guestToken: token }, include: { items: true } });
  if (guest) {
    await db.$transaction(async (tx) => {
      const userCart = (await tx.cart.findUnique({ where: { userId } })) ?? (await tx.cart.create({ data: { userId } }));
      for (const it of guest.items) {
        const existing = await tx.cartItem.findUnique({ where: { cartId_variantId: { cartId: userCart.id, variantId: it.variantId } } });
        if (existing) await tx.cartItem.update({ where: { id: existing.id }, data: { quantity: Math.min(existing.quantity + it.quantity, 20) } });
        else await tx.cartItem.create({ data: { cartId: userCart.id, variantId: it.variantId, quantity: it.quantity } });
      }
      if (guest.couponCode && !userCart.couponCode) await tx.cart.update({ where: { id: userCart.id }, data: { couponCode: guest.couponCode } });
      await tx.cart.delete({ where: { id: guest.id } });
    });
  }
  jar.delete(CART_COOKIE);
}

/** Server-side lookup used by checkout (never trusts client cart state). */
export async function getCheckoutCart() {
  const cartId = await findCartId();
  if (!cartId) return null;
  return db.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        include: {
          variant: { include: { product: { include: { images: { orderBy: { sortOrder: "asc" }, take: 1 }, category: { select: { status: true } } } } } },
        },
      },
    },
  });
}
