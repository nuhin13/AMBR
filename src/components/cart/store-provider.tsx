"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { CartView } from "@/modules/cart/service";
import type { ActionResult } from "@/lib/action-result";
import {
  addToCartAction,
  applyCouponAction,
  changeCartVariantAction,
  getCartAction,
  removeCartItemAction,
  removeCouponAction,
  updateCartItemAction,
} from "@/modules/cart/actions";
import { getWishlistIdsAction, toggleWishlistAction } from "@/modules/customers/actions";
import { useToast } from "@/components/ui/toast";
import { trackAddToCart } from "@/components/analytics/events";
import { useI18n } from "@/i18n/client";

type StoreCtx = {
  cart: CartView | null;
  cartOpen: boolean;
  setCartOpen: (o: boolean) => void;
  pending: boolean;
  add: (variantId: string, quantity: number, meta: { productId: string; name: string; label: string; price: number }) => Promise<boolean>;
  updateQty: (itemId: string, qty: number) => Promise<void>;
  remove: (itemId: string) => Promise<void>;
  changeVariant: (itemId: string, variantId: string) => Promise<void>;
  applyCoupon: (code: string) => Promise<string | null>;
  removeCoupon: () => Promise<void>;
  refresh: () => Promise<void>;
  wishlist: Set<string>;
  toggleWishlist: (productId: string) => Promise<void>;
};

const Ctx = createContext<StoreCtx | null>(null);

/**
 * Client-side cart & wishlist state. The header and product pages stay statically cached;
 * the cart is loaded after hydration and every mutation goes through a server action that
 * returns the authoritative cart.
 */
export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartView | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const { t, href } = useI18n();

  const apply = useCallback(
    (r: ActionResult<CartView>) => {
      if (r.ok && r.data) {
        setCart(r.data);
        return true;
      }
      if (!r.ok) toast(r.error, "error");
      return false;
    },
    [toast],
  );

  const refresh = useCallback(async () => {
    const r = await getCartAction();
    if (r.ok && r.data) setCart(r.data);
  }, []);

  useEffect(() => {
    let alive = true;
    getCartAction().then((r) => {
      if (alive && r.ok && r.data) setCart(r.data);
    });
    getWishlistIdsAction()
      .then((ids) => alive && setWishlist(new Set(ids)))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const run = useCallback(
    <T,>(fn: () => Promise<T>) =>
      new Promise<T>((resolve) => {
        startTransition(async () => resolve(await fn()));
      }),
    [],
  );

  const value = useMemo<StoreCtx>(
    () => ({
      cart,
      cartOpen,
      setCartOpen,
      pending,
      refresh,
      wishlist,
      add: (variantId, quantity, meta) =>
        run(async () => {
          const ok = apply(await addToCartAction(variantId, quantity));
          if (ok) {
            trackAddToCart({ id: meta.productId, name: meta.name, variant: meta.label, price: meta.price, quantity });
            setCartOpen(true);
          }
          return ok;
        }),
      updateQty: (itemId, qty) => run(async () => void apply(await updateCartItemAction(itemId, qty))),
      remove: (itemId) => run(async () => void apply(await removeCartItemAction(itemId))),
      changeVariant: (itemId, variantId) => run(async () => void apply(await changeCartVariantAction(itemId, variantId))),
      applyCoupon: (code) =>
        run(async () => {
          const r = await applyCouponAction(code);
          if (r.ok && r.data) {
            setCart(r.data);
            return null;
          }
          return r.ok ? null : r.error;
        }),
      removeCoupon: () => run(async () => void apply(await removeCouponAction())),
      toggleWishlist: async (productId) => {
        const r = await toggleWishlistAction(productId);
        if (!r.ok) {
          if (r.error === t.errors.signInRequired) {
            toast(t.product.wishlistSignIn, "info");
            router.push(`${href("/login")}?next=${encodeURIComponent(window.location.pathname)}`);
          } else toast(r.error, "error");
          return;
        }
        setWishlist((w) => {
          const n = new Set(w);
          if (r.data?.saved) n.add(productId);
          else n.delete(productId);
          return n;
        });
        toast(r.data?.saved ? t.product.wishlistSaved : t.product.wishlistRemoved);
      },
    }),
    [cart, cartOpen, pending, refresh, wishlist, run, apply, toast, router, t, href],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
