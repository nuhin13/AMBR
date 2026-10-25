"use client";

import { Button } from "@/components/ui/button";
import { useStore } from "@/components/cart/store-provider";
import { useI18n } from "@/i18n/client";

/** One-tap add for single-variant products (e.g. discovery sets). */
export function AddToBagButton({ variantId, productId, name, label, price, disabled, variant = "primary" }: { variantId: string; productId: string; name: string; label: string; price: number; disabled?: boolean; variant?: "primary" | "secondary" | "light" }) {
  const { add, pending } = useStore();
  const { t } = useI18n();
  return (
    <Button variant={variant} disabled={disabled} loading={pending} onClick={() => add(variantId, 1, { productId, name, label, price })}>
      {disabled ? t.product.soldOut : t.product.addToBag}
    </Button>
  );
}
