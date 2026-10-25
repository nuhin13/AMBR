"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/components/cart/store-provider";

export function WishlistButton({ productId, className, withLabel }: { productId: string; className?: string; withLabel?: boolean }) {
  const { wishlist, toggleWishlist } = useStore();
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
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      className={cn("inline-flex items-center gap-2 text-burgundy transition-colors hover:text-burgundy-soft", className)}
    >
      <Heart className={cn("size-[18px]", saved && "fill-current")} strokeWidth={1.5} />
      {withLabel && <span className="text-[12px] uppercase tracking-[0.14em]">{saved ? "Saved" : "Save"}</span>}
    </button>
  );
}
