"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max,
  disabled,
  size = "md",
  label = "Quantity",
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max: number;
  disabled?: boolean;
  size?: "sm" | "md";
  label?: string;
}) {
  const h = size === "sm" ? "h-9" : "h-12";
  return (
    <div className={cn("inline-flex items-center border border-beige bg-white", h)} role="group" aria-label={label}>
      <button
        type="button"
        className={cn("flex items-center justify-center text-burgundy disabled:opacity-30", size === "sm" ? "w-8" : "w-11")}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
      >
        <Minus className="size-3.5" />
      </button>
      <span className={cn("min-w-8 text-center tabular-nums", size === "sm" ? "text-[14px]" : "text-[15px]")} aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className={cn("flex items-center justify-center text-burgundy disabled:opacity-30", size === "sm" ? "w-8" : "w-11")}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}
