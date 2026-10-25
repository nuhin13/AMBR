"use client";

import { Sheet } from "@/components/ui/sheet";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useI18n } from "@/i18n/client";
import { useStore } from "./store-provider";
import { CartLine } from "./cart-line";
import { CouponField } from "./coupon-field";

export function CartDrawer() {
  const { cart, cartOpen, setCartOpen } = useStore();
  const { t, fmt, price, href } = useI18n();
  const count = cart?.count ?? 0;
  return (
    <Sheet
      open={cartOpen}
      onOpenChange={setCartOpen}
      title={t.cart.title}
      description={count ? fmt(count === 1 ? t.common.items_one : t.common.items_other, { count }) : undefined}
      footer={
        cart && cart.lines.length > 0 ? (
          <div className="space-y-5">
            <CouponField />
            <dl className="space-y-1.5 text-[14px]">
              <div className="flex justify-between"><dt className="text-muted">{t.cart.subtotal}</dt><dd className="tabular-nums">{price(cart.subtotal)}</dd></div>
              {cart.discount > 0 && <div className="flex justify-between text-success"><dt>{t.cart.discount}</dt><dd className="tabular-nums">−{price(cart.discount)}</dd></div>}
              <div className="flex justify-between"><dt className="text-muted">{t.cart.delivery}</dt><dd className="text-muted">{cart.coupon?.ok && cart.coupon.freeShipping ? t.cart.free : t.cart.deliveryAtCheckout}</dd></div>
            </dl>
            {cart.hasIssues && <p className="text-[13px] text-error">{t.cart.issues}</p>}
            <ButtonLink href={href("/checkout")} full size="lg" onClick={() => setCartOpen(false)} aria-disabled={cart.hasIssues} className={cart.hasIssues ? "pointer-events-none opacity-50" : undefined}>
              {t.cart.checkout} · {price(cart.total)}
            </ButtonLink>
            <ButtonLink href={href("/cart")} variant="link" full onClick={() => setCartOpen(false)} className="text-[13px]">
              {t.cart.viewBag}
            </ButtonLink>
          </div>
        ) : undefined
      }
    >
      {!cart || cart.lines.length === 0 ? (
        <EmptyState title={t.cart.empty} description={t.cart.emptyText} action={<Button onClick={() => setCartOpen(false)} variant="secondary">{t.common.continueShopping}</Button>} />
      ) : (
        <div className="divide-y divide-burgundy/10 px-5 md:px-6">
          {cart.lines.map((l) => (
            <CartLine key={l.id} line={l} maxQty={cart.maxQtyPerItem} compact />
          ))}
        </div>
      )}
    </Sheet>
  );
}
