"use client";

import { Sheet } from "@/components/ui/sheet";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatBDT } from "@/lib/money";
import { useStore } from "./store-provider";
import { CartLine } from "./cart-line";
import { CouponField } from "./coupon-field";

export function CartDrawer() {
  const { cart, cartOpen, setCartOpen } = useStore();
  const count = cart?.count ?? 0;
  return (
    <Sheet
      open={cartOpen}
      onOpenChange={setCartOpen}
      title="Your bag"
      description={count ? `${count} item${count === 1 ? "" : "s"}` : undefined}
      footer={
        cart && cart.lines.length > 0 ? (
          <div className="space-y-4">
            <CouponField />
            <dl className="space-y-1.5 text-[14px]">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="tabular-nums">{formatBDT(cart.subtotal)}</dd></div>
              {cart.discount > 0 && <div className="flex justify-between text-success"><dt>Discount</dt><dd className="tabular-nums">−{formatBDT(cart.discount)}</dd></div>}
              <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd className="text-muted">{cart.coupon?.ok && cart.coupon.freeShipping ? "Free" : "Calculated at checkout"}</dd></div>
            </dl>
            {cart.hasIssues && <p className="text-[13px] text-error">Some items need your attention before checkout.</p>}
            <ButtonLink href="/checkout" full size="lg" onClick={() => setCartOpen(false)} aria-disabled={cart.hasIssues} className={cart.hasIssues ? "pointer-events-none opacity-50" : undefined}>
              Checkout · {formatBDT(cart.total)}
            </ButtonLink>
            <ButtonLink href="/cart" variant="link" full onClick={() => setCartOpen(false)} className="text-[13px]">
              View bag
            </ButtonLink>
          </div>
        ) : undefined
      }
    >
      {!cart || cart.lines.length === 0 ? (
        <EmptyState
          title="Your bag is empty"
          description="Find a fragrance that feels like you."
          action={<Button onClick={() => setCartOpen(false)} variant="secondary">Continue shopping</Button>}
        />
      ) : (
        <div className="divide-y divide-beige px-5">
          {cart.lines.map((l) => (
            <CartLine key={l.id} line={l} maxQty={cart.maxQtyPerItem} compact />
          ))}
        </div>
      )}
    </Sheet>
  );
}
