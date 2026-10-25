"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { translateMessage } from "@/i18n/translate";
import { useStore } from "./store-provider";

/** Not a <form>: this field also renders inside the checkout form, and forms can't nest. */
export function CouponField() {
  const { cart, applyCoupon, removeCoupon, pending } = useStore();
  const { t } = useI18n();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  if (!cart) return null;

  if (cart.couponCode) {
    const c = cart.coupon;
    const label = c?.ok ? c.label : c ? translateMessage(t, c.reasonKey, c.vars) : "";
    return (
      <div className="flex items-center justify-between gap-3 border-b border-dashed border-burgundy/30 pb-2 text-[13px]">
        <div>
          <span className="font-semibold tracking-wider text-burgundy">{cart.couponCode}</span>
          <span className="ml-2 text-muted">{label}</span>
        </div>
        <button onClick={() => removeCoupon()} className="p-1 text-muted hover:text-burgundy" aria-label={t.cart.couponRemove} disabled={pending}>
          <X className="size-4" />
        </button>
      </div>
    );
  }

  const submit = async () => {
    if (!code.trim()) return;
    setError(null);
    const err = await applyCoupon(code);
    if (err) setError(err);
    else setCode("");
  };
  return (
    <div>
      <label htmlFor="coupon" className="sr-only">{t.cart.couponPlaceholder}</label>
      <div className="flex items-end gap-3 border-b border-burgundy/25 focus-within:border-burgundy">
        <input
          id="coupon"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={t.cart.couponPlaceholder}
          autoComplete="off"
          className="h-10 min-w-0 flex-1 bg-transparent text-[14px] uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal focus:outline-none"
        />
        <button type="button" onClick={submit} disabled={pending || !code.trim()} className="btn-text h-10 shrink-0 text-[11px] text-burgundy disabled:opacity-35">
          {t.cart.couponApply}
        </button>
      </div>
      {error && <p className="mt-1.5 text-[13px] text-error" role="alert">{error}</p>}
    </div>
  );
}
