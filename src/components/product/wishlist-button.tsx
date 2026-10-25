"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/components/cart/store-provider";
import { useI18n } from "@/i18n/client";

export function WishlistButton({ productId, className, withLabel }: { productId: string; className?: string; withLabel?: boolean }) {
  const { wishlist, toggleWishlist } = useStore();
  const { t } = useI18n();
  const saved = wishlist.has(productId);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(productId);
      }}
      aria-pressed={saved}
      aria-label={saved ? t.product.removeFromWishlist : t.product.saveToWishlist}
      className={cn("inline-flex items-center gap-2 text-burgundy transition-transform active:scale-90", className)}
    >
      <Heart className={cn("size-[18px] transition-colors", saved && "fill-current")} strokeWidth={1.4} />
      {withLabel && <span className="btn-text text-[11px]">{saved ? t.common.saved : t.common.save}</span>}
    </button>
  );
}
