"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { VariantFormat } from "@prisma/client";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { QuantityStepper } from "@/components/cart/quantity-stepper";
import { useStore } from "@/components/cart/store-provider";
import { useI18n } from "@/i18n/client";

export type PanelVariant = { id: string; label: string; format: VariantFormat; price: number; compareAtPrice: number | null; available: number };

/**
 * Format (spray / roll-on) + size selection, quantity, Add to bag and Buy now.
 * Price updates with the selected size. On product pages a slim sticky bar keeps
 * "Add to bag" reachable on mobile once the main button scrolls away.
 */
export function PurchasePanel({
  productId,
  productName,
  variants,
  maxQty = 10,
  compact,
  stickyBar,
  onAdded,
}: {
  productId: string;
  productName: string;
  variants: PanelVariant[];
  maxQty?: number;
  compact?: boolean;
  stickyBar?: boolean;
  onAdded?: () => void;
}) {
  const { t, fmt, price, href, size } = useI18n();
  const formats = useMemo(() => [...new Set(variants.map((v) => v.format))], [variants]);
  const firstAvailable = variants.find((v) => v.available > 0) ?? variants[0];
  const [format, setFormat] = useState<VariantFormat>(firstAvailable?.format ?? "SPRAY");
  const inFormat = variants.filter((v) => v.format === format);
  const [selectedId, setSelectedId] = useState<string | undefined>(firstAvailable?.id);
  const [qty, setQty] = useState(1);
  const { add, pending, setCartOpen } = useStore();
  const router = useRouter();
  const mainButton = useRef<HTMLDivElement>(null);
  const [showBar, setShowBar] = useState(false);

  useEffect(() => {
    if (!stickyBar || !mainButton.current) return;
    const io = new IntersectionObserver(([e]) => setShowBar(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(mainButton.current);
    return () => io.disconnect();
  }, [stickyBar]);

  const v = inFormat.find((x) => x.id === selectedId) ?? inFormat.find((x) => x.available > 0) ?? inFormat[0];
  if (!v) return null;
  const soldOut = v.available <= 0;
  const max = Math.max(1, Math.min(maxQty, v.available));
  const meta = { productId, name: productName, label: v.label, price: v.price };
  const addToBag = async () => {
    const ok = await add(v.id, qty, meta);
    if (ok) onAdded?.();
  };

  return (
    <div className="space-y-7">
      <div className="flex items-baseline gap-3">
        <span className={cn("font-sans tabular-nums text-burgundy", compact ? "text-[22px]" : "text-[26px] md:text-[30px]", v.compareAtPrice && v.compareAtPrice > v.price && "text-error")}>{price(v.price)}</span>
        {v.compareAtPrice && v.compareAtPrice > v.price && (
          <>
            <span className="text-[15px] tabular-nums text-muted line-through"><span className="sr-only">{t.product.was} </span>{price(v.compareAtPrice)}</span>
            <span className="text-[13px] text-error">{fmt(t.product.youSave, { amount: price(v.compareAtPrice - v.price) })}</span>
          </>
        )}
      </div>

      {formats.length > 1 && (
        <fieldset>
          <legend className="eyebrow mb-3 text-burgundy/80">{t.product.format}</legend>
          <div className="inline-flex border border-burgundy/25 p-1" role="radiogroup">
            {formats.map((f) => (
              <button
                key={f}
                type="button"
                role="radio"
                aria-checked={f === format}
                onClick={() => {
                  setFormat(f);
                  const next = variants.find((x) => x.format === f && x.available > 0) ?? variants.find((x) => x.format === f);
                  setSelectedId(next?.id);
                  setQty(1);
                }}
                className={cn("btn-text px-5 py-2 text-[11px] transition-colors", f === format ? "bg-burgundy text-cream" : "text-burgundy hover:bg-beige/60")}
              >
                {t.labels.format[f]}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend className="eyebrow mb-3 text-burgundy/80">{t.product.size}</legend>
        <div className="flex flex-wrap gap-x-7 gap-y-3" role="radiogroup">
          {inFormat.map((x) => {
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
                className={cn("group relative pb-2 text-left transition-colors", out && "opacity-45")}
              >
                <span className={cn("block font-serif text-[20px] leading-none", active ? "text-burgundy" : "text-charcoal/70 group-hover:text-burgundy")}>{size(x.label)}</span>
                <span className="mt-1.5 block text-[12.5px] tabular-nums text-muted">{out ? t.product.soldOut : price(x.price)}</span>
                <span className={cn("absolute inset-x-0 bottom-0 h-px origin-left bg-burgundy transition-transform duration-300", active ? "scale-x-100" : "scale-x-0")} aria-hidden />
              </button>
            );
          })}
        </div>
      </fieldset>

      <StockLine available={v.available} />

      <div ref={mainButton} className="flex gap-3">
        <QuantityStepper value={qty} max={max} onChange={setQty} disabled={soldOut} />
        <Button size="lg" className="flex-1" disabled={soldOut} loading={pending} onClick={addToBag}>
          {soldOut ? t.product.soldOut : t.product.addToBag}
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
              router.push(href("/checkout"));
            }
          }}
        >
          {t.product.buyNow}
        </Button>
      )}

      {stickyBar && (
        <div
          className={cn(
            "fixed inset-x-0 bottom-0 z-30 border-t border-burgundy/10 bg-cream/95 px-4 py-3 backdrop-blur transition-transform duration-300 lg:hidden",
            showBar ? "translate-y-0" : "translate-y-full",
          )}
          aria-hidden={!showBar}
        >
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-serif text-[16px] text-burgundy">{productName}</p>
              <p className="text-[12.5px] text-muted">{size(v.label)} · {price(v.price)}</p>
            </div>
            <Button size="md" disabled={soldOut || pending} onClick={addToBag} tabIndex={showBar ? 0 : -1}>
              {soldOut ? t.product.soldOut : t.product.add}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function StockLine({ available }: { available: number }) {
  const { t, fmt } = useI18n();
  if (available <= 0) return <p className="text-[13.5px] text-error">{t.product.sizeSoldOut}</p>;
  if (available <= 5) return <p className="text-[13.5px] font-medium text-burgundy">{fmt(t.product.onlyLeft, { count: available })}</p>;
  return (
    <p className="flex items-center gap-2 text-[13.5px] text-success">
      <Check className="size-4" aria-hidden /> {t.product.inStock}
    </p>
  );
}
