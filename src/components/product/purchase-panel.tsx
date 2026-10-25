"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { formatBDT } from "@/lib/money";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { QuantityStepper } from "@/components/cart/quantity-stepper";
import { useStore } from "@/components/cart/store-provider";

export type PanelVariant = { id: string; label: string; price: number; compareAtPrice: number | null; available: number };

/** Size selector + quantity + Add to Bag / Buy Now. Price updates with the selected size. */
export function PurchasePanel({
  productId,
  productName,
  variants,
  maxQty = 10,
  compact,
  onAdded,
}: {
  productId: string;
  productName: string;
  variants: PanelVariant[];
  maxQty?: number;
  compact?: boolean;
  onAdded?: () => void;
}) {
  const firstAvailable = variants.find((v) => v.available > 0) ?? variants[0];
  const [selectedId, setSelectedId] = useState(firstAvailable?.id);
  const [qty, setQty] = useState(1);
  const { add, pending, setCartOpen } = useStore();
  const router = useRouter();
  const v = variants.find((x) => x.id === selectedId) ?? firstAvailable;
  if (!v) return null;
  const soldOut = v.available <= 0;
  const max = Math.max(1, Math.min(maxQty, v.available));
  const meta = { productId, name: productName, label: v.label, price: v.price };

  return (
    <div className="space-y-6">
      <div>
        <Price amount={v.price} compareAt={v.compareAtPrice} className={compact ? "text-xl" : "text-2xl md:text-[28px]"} />
        {v.compareAtPrice && v.compareAtPrice > v.price && (
          <p className="mt-1 text-[13px] text-error">You save {formatBDT(v.compareAtPrice - v.price)}</p>
        )}
      </div>

      <fieldset>
        <legend className="eyebrow mb-3 text-burgundy/80">Size</legend>
        <div className="flex flex-wrap gap-2.5" role="radiogroup">
          {variants.map((x) => {
            const active = x.id === v.id;
            const out = x.available <= 0;
            return (
              <button
                type="button"
                key={x.id}
                role="radio"
                aria-checked={active}
                onClick={() => {
                  setSelectedId(x.id);
                  setQty(1);
                }}
                className={cn(
                  "relative min-w-[96px] border px-4 py-2.5 text-left transition-colors",
                  active ? "border-burgundy bg-burgundy text-cream" : "border-beige bg-white text-charcoal hover:border-burgundy",
                  out && !active && "opacity-55",
                )}
              >
                <span className="block text-[14px] font-medium">{x.label}</span>
                <span className={cn("block text-[12.5px] tabular-nums", active ? "text-cream/80" : "text-muted")}>
                  {out ? "Sold out" : formatBDT(x.price)}
                </span>
                {out && <span className="absolute inset-x-2 top-1/2 h-px -rotate-12 bg-current opacity-30" aria-hidden />}
              </button>
            );
          })}
        </div>
      </fieldset>

      <StockLine available={v.available} />

      <div className="flex flex-col gap-3 sm:flex-row">
        <QuantityStepper value={qty} max={max} onChange={setQty} disabled={soldOut} />
        <Button
          size="lg"
          className="flex-1"
          disabled={soldOut}
          loading={pending}
          onClick={async () => {
            const ok = await add(v.id, qty, meta);
            if (ok) onAdded?.();
          }}
        >
          {soldOut ? "Sold out" : "Add to bag"}
        </Button>
      </div>
      {!soldOut && !compact && (
        <Button
          variant="secondary"
          size="lg"
          full
          disabled={pending}
          onClick={async () => {
            const ok = await add(v.id, qty, meta);
            if (ok) {
              setCartOpen(false);
              router.push("/checkout");
            }
          }}
        >
          Buy now
        </Button>
      )}
    </div>
  );
}

function StockLine({ available }: { available: number }) {
  if (available <= 0) return <p className="text-[13.5px] text-error">This size is currently sold out.</p>;
  if (available <= 5)
    return <p className="text-[13.5px] font-medium text-burgundy">Only {available} left in stock</p>;
  return (
    <p className="flex items-center gap-2 text-[13.5px] text-success">
      <Check className="size-4" aria-hidden /> In stock — ready to ship
    </p>
  );
}
