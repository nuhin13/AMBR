"use client";

import Link from "next/link";
import { formatBDT } from "@/lib/money";
import type { CartLine as Line } from "@/modules/cart/service";
import { ProductImage } from "@/components/product/product-image";
import { useStore } from "./store-provider";
import { QuantityStepper } from "./quantity-stepper";

export function CartLine({ line, maxQty, compact }: { line: Line; maxQty: number; compact?: boolean }) {
  const { updateQty, remove, changeVariant, pending } = useStore();
  return (
    <div className="flex gap-4 py-5">
      <Link href={`/product/${line.productSlug}`} className="w-20 shrink-0 sm:w-24">
        <ProductImage src={line.imageUrl} name={line.productName} sizes="96px" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/product/${line.productSlug}`} className="font-serif text-[17px] leading-tight text-burgundy hover:underline">
              {line.productName}
            </Link>
            {line.otherVariants.length > 1 ? (
              <label className="mt-1 flex items-center gap-2 text-[13px] text-muted">
                <span className="sr-only">Size</span>
                <select
                  value={line.variantId}
                  onChange={(e) => changeVariant(line.id, e.target.value)}
                  disabled={pending}
                  className="border-b border-beige bg-transparent py-0.5 pr-1 text-[13px] text-charcoal focus:border-burgundy focus:outline-none"
                >
                  {line.otherVariants.map((v) => (
                    <option key={v.id} value={v.id} disabled={v.available === 0 && v.id !== line.variantId}>
                      {v.label} — {formatBDT(v.price)}{v.available === 0 ? " (sold out)" : ""}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <p className="mt-1 text-[13px] text-muted">{line.variantLabel}</p>
            )}
          </div>
          <p className="shrink-0 text-[15px] font-medium tabular-nums text-burgundy">{formatBDT(line.unitPrice * line.quantity)}</p>
        </div>
        {line.issue && <p className="mt-1 text-[13px] font-medium text-error">{line.issue}</p>}
        <div className="mt-auto flex items-center justify-between pt-3">
          <QuantityStepper
            size="sm"
            value={line.quantity}
            max={Math.max(1, Math.min(maxQty, line.available))}
            disabled={pending || line.available === 0}
            onChange={(q) => updateQty(line.id, q)}
          />
          <button onClick={() => remove(line.id)} disabled={pending} className="text-[12px] uppercase tracking-[0.14em] text-muted underline-offset-4 hover:text-burgundy hover:underline">
            Remove
          </button>
        </div>
        {!compact && line.compareAtPrice && <p className="mt-1 text-[12px] text-muted">You save {formatBDT((line.compareAtPrice - line.unitPrice) * line.quantity)}</p>}
      </div>
    </div>
  );
}
