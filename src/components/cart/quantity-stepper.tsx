"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/client";

export function QuantityStepper({ value, onChange, min = 1, max, disabled, size = "md" }: { value: number; onChange: (v: number) => void; min?: number; max: number; disabled?: boolean; size?: "sm" | "md" }) {
  const { t, locale } = useI18n();
  const h = size === "sm" ? "h-9" : "h-13";
  const shown = locale === "bn" ? String(value).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]) : value;
  return (
    <div className={cn("inline-flex items-center border border-burgundy/25", h)} role="group" aria-label={t.product.quantity}>
      <button type="button" className={cn("flex h-full items-center justify-center text-burgundy disabled:opacity-25", size === "sm" ? "w-8" : "w-11")} onClick={() => onChange(Math.max(min, value - 1))} disabled={disabled || value <= min} aria-label={t.product.decrease}>
        <Minus className="size-3.5" />
      </button>
      <span className={cn("min-w-7 text-center tabular-nums", size === "sm" ? "text-[14px]" : "text-[15px]")} aria-live="polite">{shown}</span>
      <button type="button" className={cn("flex h-full items-center justify-center text-burgundy disabled:opacity-25", size === "sm" ? "w-8" : "w-11")} onClick={() => onChange(Math.min(max, value + 1))} disabled={disabled || value >= max} aria-label={t.product.increase}>
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}
