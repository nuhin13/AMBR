"use client";

import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useI18n } from "@/i18n/client";
import { useStore } from "./store-provider";
import { CartLine } from "./cart-line";
import { CouponField } from "./coupon-field";

export function CartPageView() {
  const { cart } = useStore();
  const { t, price, href } = useI18n();
  if (!cart) return <div className="h-64 animate-pulse bg-beige/40" aria-label={t.common.loading} />;
  if (cart.lines.length === 0) return <EmptyState title={t.cart.empty} description={t.cart.emptyText} action={<ButtonLink href={href("/shop")}>{t.catalog.shopTitle}</ButtonLink>} />;
  return (
    <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
      <div className="divide-y divide-burgundy/10 border-y border-burgundy/10 lg:col-span-7">
        {cart.lines.map((l) => (
          <CartLine key={l.id} line={l} maxQty={cart.maxQtyPerItem} />
        ))}
      </div>
      <aside className="h-fit space-y-6 lg:sticky lg:top-[110px] lg:col-span-4 lg:col-start-9">
        <h2 className="t-h3">{t.cart.summary}</h2>
        <CouponField />
        <dl className="space-y-2.5 text-[14.5px]">
          <div className="flex justify-between"><dt className="text-muted">{t.cart.subtotal}</dt><dd className="tabular-nums">{price(cart.subtotal)}</dd></div>
          {cart.discount > 0 && <div className="flex justify-between text-success"><dt>{t.cart.discount}</dt><dd className="tabular-nums">−{price(cart.discount)}</dd></div>}
          <div className="flex justify-between"><dt className="text-muted">{t.cart.delivery}</dt><dd className="text-muted">{t.cart.deliveryAtCheckout}</dd></div>
          <div className="flex justify-between border-t border-burgundy/15 pt-4 text-[17px]"><dt>{t.cart.total}</dt><dd className="tabular-nums text-burgundy">{price(cart.total)}</dd></div>
        </dl>
        {cart.hasIssues && <p className="text-[13px] text-error">{t.cart.issues}</p>}
        <ButtonLink href={href("/checkout")} full size="lg" aria-disabled={cart.hasIssues} className={cart.hasIssues ? "pointer-events-none opacity-50" : undefined}>
          {t.cart.proceed}
        </ButtonLink>
        <p className="text-center text-[12.5px] text-muted">{t.cart.codNote}</p>
      </aside>
    </div>
  );
}
