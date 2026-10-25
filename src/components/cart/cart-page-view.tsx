"use client";

import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatBDT } from "@/lib/money";
import { useStore } from "./store-provider";
import { CartLine } from "./cart-line";
import { CouponField } from "./coupon-field";

export function CartPageView() {
  const { cart } = useStore();
  if (!cart) return <div className="h-64 animate-pulse bg-beige/40" aria-label="Loading your bag" />;
  if (cart.lines.length === 0)
    return <EmptyState title="Your bag is empty" description="Find a fragrance that feels like you." action={<ButtonLink href="/shop">Shop fragrances</ButtonLink>} />;
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_380px] lg:gap-16">
      <div className="divide-y divide-beige border-y border-beige">
        {cart.lines.map((l) => (
          <CartLine key={l.id} line={l} maxQty={cart.maxQtyPerItem} />
        ))}
      </div>
      <aside className="h-fit space-y-5 bg-cream-light p-6 lg:sticky lg:top-[120px]">
        <h2 className="text-[24px]">Summary</h2>
        <CouponField />
        <dl className="space-y-2 text-[14.5px]">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="tabular-nums">{formatBDT(cart.subtotal)}</dd></div>
          {cart.discount > 0 && <div className="flex justify-between text-success"><dt>Discount</dt><dd className="tabular-nums">−{formatBDT(cart.discount)}</dd></div>}
          <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd className="text-muted">At checkout</dd></div>
          <div className="flex justify-between border-t border-beige pt-3 text-[16px] font-medium"><dt>Total</dt><dd className="tabular-nums text-burgundy">{formatBDT(cart.total)}</dd></div>
        </dl>
        {cart.hasIssues && <p className="text-[13px] text-error">Please update the highlighted items before checkout.</p>}
        <ButtonLink href="/checkout" full size="lg" aria-disabled={cart.hasIssues} className={cart.hasIssues ? "pointer-events-none opacity-50" : undefined}>
          Proceed to checkout
        </ButtonLink>
        <p className="text-center text-[12.5px] text-muted">Cash on delivery available across Bangladesh</p>
      </aside>
    </div>
  );
}
