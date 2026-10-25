"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useStore } from "./store-provider";

export function CouponField() {
  const { cart, applyCoupon, removeCoupon, pending } = useStore();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  if (!cart) return null;

  if (cart.couponCode) {
    return (
      <div className="flex items-center justify-between gap-3 border border-dashed border-burgundy/40 bg-white px-3 py-2 text-[13px]">
        <div>
          <span className="font-semibold tracking-wider text-burgundy">{cart.couponCode}</span>
          <span className="ml-2 text-muted">{cart.coupon?.ok ? cart.coupon.label : cart.coupon?.reason}</span>
        </div>
        <button onClick={() => removeCoupon()} className="p-1 text-muted hover:text-burgundy" aria-label="Remove code" disabled={pending}>
          <X className="size-4" />
        </button>
      </div>
    );
  }

  // Not a <form>: this field also renders inside the checkout form, and forms can't nest.
  const submit = async () => {
    if (!code.trim()) return;
    setError(null);
    const err = await applyCoupon(code);
    if (err) setError(err);
    else setCode("");
  };
  return (
    <div>
      <label htmlFor="coupon" className="sr-only">Discount code</label>
      <div className="flex">
        <input
          id="coupon"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Discount code"
          autoComplete="off"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          className="h-11 min-w-0 flex-1 border border-r-0 border-beige bg-white px-3 text-[14px] uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal focus:border-burgundy focus:outline-none"
        />
        <button type="button" onClick={submit} disabled={pending || !code.trim()} className="h-11 shrink-0 border border-burgundy px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-burgundy hover:bg-burgundy hover:text-cream disabled:opacity-40">
          Apply
        </button>
      </div>
      {error && <p className="mt-1.5 text-[13px] text-error" role="alert">{error}</p>}
    </div>
  );
}
