"use client";

import Link from "next/link";
import { useState } from "react";
import type { ProductCardData } from "@/modules/catalog/queries";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import { Stars } from "@/components/ui/stars";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { useStore } from "@/components/cart/store-provider";
import { cn } from "@/lib/utils";
import { ProductImage } from "./product-image";
import { PurchasePanel } from "./purchase-panel";
import { WishlistButton } from "./wishlist-button";

export function ProductCard({ product, layout = "grid", priority }: { product: ProductCardData; layout?: "grid" | "list"; priority?: boolean }) {
  const [quickView, setQuickView] = useState(false);
  const { add, pending } = useStore();
  const p = product;
  const href = `/product/${p.slug}`;
  const sizes = p.variants.map((v) => v.label.replace(" ml", "")).join(" · ") + " ml";

  const quickAdd = async () => {
    const inStock = p.variants.filter((v) => v.available > 0);
    if (p.variants.length === 1 && inStock.length === 1) {
      await add(inStock[0].id, 1, { productId: p.id, name: p.name, label: inStock[0].label, price: inStock[0].price });
    } else {
      setQuickView(true); // more than one size: ask, never guess
    }
  };

  return (
    <article className={cn("group relative flex", layout === "list" ? "flex-row gap-5 border-b border-beige pb-6" : "flex-col")}>
      <div className={cn("relative", layout === "list" ? "w-32 shrink-0 sm:w-44" : "w-full")}>
        <Link href={href} aria-label={p.name} tabIndex={-1}>
          <ProductImage src={p.images[0]?.url} alt={p.images[0]?.alt} hoverSrc={p.images[1]?.url} name={p.name} priority={priority} />
        </Link>
        <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
          {!p.inStock ? <Badge tone="outline" className="bg-cream/90">Sold out</Badge> : p.badge && <Badge tone={p.badge === "Sale" ? "rose" : "burgundy"}>{p.badge}</Badge>}
          {p.isDemo && <Badge tone="gold">Demo</Badge>}
        </div>
        <WishlistButton productId={p.id} className="absolute right-2 top-2 rounded-full bg-cream/85 p-2 backdrop-blur-sm" />
        {layout === "grid" && (
          <button
            type="button"
            onClick={() => setQuickView(true)}
            className="absolute inset-x-3 bottom-3 hidden translate-y-2 bg-cream/95 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-burgundy opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 focus:translate-y-0 focus:opacity-100 lg:block"
          >
            Quick view
          </button>
        )}
      </div>

      <div className={cn("flex flex-1 flex-col", layout === "grid" ? "pt-4" : "py-1")}>
        {p.family && <p className="eyebrow text-[10px] text-burgundy/70">{p.family} · {p.categoryType === "ATTAR" ? "Attar" : "Perfume"}</p>}
        <h3 className="mt-1.5 font-serif text-[19px] leading-tight md:text-[21px]">
          <Link href={href} className="hover:underline hover:decoration-rose hover:underline-offset-4">{p.name}</Link>
        </h3>
        <p className={cn("mt-1.5 text-[13.5px] leading-snug text-muted", layout === "grid" && "line-clamp-2")}>{p.shortDescription}</p>
        {p.rating && (
          <p className="mt-2 flex items-center gap-1.5 text-[12px] text-muted">
            <Stars value={p.rating.average} size={12} /> {p.rating.average} ({p.rating.count})
          </p>
        )}
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <Price amount={p.fromPrice} compareAt={p.fromCompareAt} from={p.variants.length > 1} className="text-[15px]" />
          <span className="text-[12px] text-muted">{sizes}</span>
        </div>
        <Button variant="secondary" size="sm" full className="mt-3" onClick={quickAdd} disabled={!p.inStock || pending}>
          {p.inStock ? "Add to bag" : "Sold out"}
        </Button>
      </div>

      <Sheet open={quickView} onOpenChange={setQuickView} side="center" title={p.name} description={p.family ? `${p.family} · ${p.categoryName}` : p.categoryName}>
        <div className="grid gap-6 p-5 sm:grid-cols-[minmax(0,240px)_1fr] sm:gap-8 sm:p-7">
          <div className="mx-auto w-full max-w-[240px]">
            <ProductImage src={p.images[0]?.url} alt={p.images[0]?.alt} name={p.name} sizes="240px" />
          </div>
          <div>
            <p className="text-[15px] leading-relaxed text-charcoal">{p.shortDescription}</p>
            <div className="mt-6">
              <PurchasePanel productId={p.id} productName={p.name} variants={p.variants.map((v) => ({ ...v }))} compact onAdded={() => setQuickView(false)} />
            </div>
            <Link href={href} className="mt-6 inline-block text-[13px] text-burgundy underline underline-offset-4" onClick={() => setQuickView(false)}>
              See full details & notes →
            </Link>
          </div>
        </div>
      </Sheet>
    </article>
  );
}

export function ProductGrid({ products, layout = "grid", priorityCount = 0 }: { products: ProductCardData[]; layout?: "grid" | "list"; priorityCount?: number }) {
  return (
    <div className={layout === "grid" ? "grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4 lg:gap-y-14" : "flex flex-col gap-6"}>
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} layout={layout} priority={i < priorityCount} />
      ))}
    </div>
  );
}
