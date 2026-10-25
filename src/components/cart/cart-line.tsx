"use client";

import type { CartLine as Line } from "@/modules/cart/service";
import { ProductImage } from "@/components/product/product-image";
import { LLink } from "@/components/i18n/llink";
import { useI18n } from "@/i18n/client";
import { useStore } from "./store-provider";
import { QuantityStepper } from "./quantity-stepper";

export function CartLine({ line, maxQty, compact }: { line: Line; maxQty: number; compact?: boolean }) {
  const { updateQty, remove, changeVariant, pending } = useStore();
  const { t, fmt, price } = useI18n();
  const issue = line.issue
    ? line.issue.code === "onlyLeft"
      ? fmt(t.cart.issueOnlyLeft, { count: line.issue.count ?? 0 })
      : line.issue.code === "soldOut"
        ? t.cart.issueSoldOut
        : t.cart.issueUnavailable
    : null;
  return (
    <div className="flex gap-4 py-5">
      <LLink href={`/product/${line.productSlug}`} className="w-20 shrink-0 sm:w-24">
        <ProductImage src={line.imageUrl} name={line.productName} sizes="96px" />
      </LLink>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <LLink href={`/product/${line.productSlug}`} className="font-serif text-[18px] leading-tight text-burgundy hover:underline">
              {line.productName}
            </LLink>
            {line.otherVariants.length > 1 ? (
              <label className="mt-1 flex items-center gap-2 text-[13px] text-muted">
                <span className="sr-only">{t.cart.sizeLabel}</span>
                <select
                  value={line.variantId}
                  onChange={(e) => changeVariant(line.id, e.target.value)}
                  disabled={pending}
                  className="border-b border-burgundy/20 bg-transparent py-0.5 pr-1 text-[13px] text-charcoal focus:border-burgundy focus:outline-none"
                >
                  {line.otherVariants.map((v) => (
                    <option key={v.id} value={v.id} disabled={v.available === 0 && v.id !== line.variantId}>
                      {v.label} — {price(v.price)}{v.available === 0 ? ` (${t.cart.soldOutOption})` : ""}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <p className="mt-1 text-[13px] text-muted">{line.variantLabel}</p>
            )}
          </div>
          <p className="shrink-0 text-[15px] tabular-nums text-burgundy">{price(line.unitPrice * line.quantity)}</p>
        </div>
        {issue && <p className="mt-1 text-[13px] font-medium text-error">{issue}</p>}
        <div className="mt-auto flex items-center justify-between pt-3">
          <QuantityStepper size="sm" value={line.quantity} max={Math.max(1, Math.min(maxQty, line.available))} disabled={pending || line.available === 0} onChange={(q) => updateQty(line.id, q)} />
          <button onClick={() => remove(line.id)} disabled={pending} className="btn-text link-underline text-[10.5px] text-muted hover:text-burgundy">
            {t.common.remove}
          </button>
        </div>
        {!compact && line.compareAtPrice && <p className="mt-1 text-[12px] text-muted">{fmt(t.product.youSave, { amount: price((line.compareAtPrice - line.unitPrice) * line.quantity) })}</p>}
      </div>
    </div>
  );
}
