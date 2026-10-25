"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { ProductCardData } from "@/modules/catalog/queries";
import { Stars } from "@/components/ui/stars";
import { Sheet } from "@/components/ui/sheet";
import { useStore } from "@/components/cart/store-provider";
import { LLink } from "@/components/i18n/llink";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { ProductImage } from "./product-image";
import { PurchasePanel } from "./purchase-panel";
import { WishlistButton } from "./wishlist-button";

const BADGE_KEY = { bestSeller: "badgeBestSeller", new: "badgeNew", sale: "badgeSale" } as const;

/**
 * Image-first product presentation: no border, no card background. The photograph (or honest
 * placeholder) dominates; text sits quietly beneath. Desktop gets a hover "quick add" strip;
 * touch devices get an always-visible add button.
 */
export function ProductCard({
  product,
  layout = "grid",
  priority,
  imageRatio,
  sizes,
}: {
  product: ProductCardData;
  layout?: "grid" | "list";
  priority?: boolean;
  imageRatio?: string;
  sizes?: string;
}) {
  const [quickView, setQuickView] = useState(false);
  const { add, pending } = useStore();
  const { t, price, locale, size } = useI18n();
  const p = product;
  const href = `/product/${p.slug}`;
  const sizesText = p.variants.map((v) => size(v.label)).join(" · ");
  const formatText = p.formats.map((f) => t.labels.format[f]).join(" / ");
  const lang = p.lang !== locale ? p.lang : undefined;

  const quickAdd = async () => {
    const inStock = p.variants.filter((v) => v.available > 0);
    if (p.variants.length === 1 && inStock.length === 1) {
      await add(inStock[0].id, 1, { productId: p.id, name: p.name, label: inStock[0].label, price: inStock[0].price });
    } else {
      setQuickView(true); // more than one size: ask, never guess
    }
  };

  return (
    <article className={cn("group relative", layout === "list" ? "grid grid-cols-[8rem_1fr] gap-5 sm:grid-cols-[11rem_1fr] sm:gap-8" : "flex flex-col")}>
      <div className="relative overflow-hidden">
        <LLink href={href} aria-label={p.name} tabIndex={-1} className="block">
          <ProductImage src={p.images[0]?.url} alt={p.images[0]?.alt} hoverSrc={p.images[1]?.url} name={p.name} priority={priority} ratio={imageRatio} sizes={sizes} />
        </LLink>
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {!p.inStock ? (
            <span className="eyebrow bg-cream/90 px-2 py-1 text-[9.5px] text-burgundy">{t.product.soldOut}</span>
          ) : (
            p.badge && <span className="eyebrow bg-cream/90 px-2 py-1 text-[9.5px] text-burgundy">{t.product[BADGE_KEY[p.badge]]}</span>
          )}
          {p.isDemo && <span className="eyebrow bg-gold/80 px-2 py-1 text-[9px] text-burgundy">{t.common.demo}</span>}
        </div>
        <WishlistButton productId={p.id} className="absolute right-2.5 top-2.5 p-1.5 opacity-80 hover:opacity-100" />
        {layout === "grid" && p.inStock && (
          <button
            type="button"
            onClick={quickAdd}
            disabled={pending}
            className="btn-text absolute inset-x-0 bottom-0 hidden translate-y-full bg-burgundy/95 py-3 text-[11px] text-cream transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:translate-y-0 focus-visible:translate-y-0 lg:block"
          >
            {p.variants.length > 1 ? t.product.quickView : t.product.addToBag}
          </button>
        )}
      </div>

      <div className={cn("flex flex-1 flex-col", layout === "grid" ? "pt-4" : "py-1")} lang={lang}>
        <p className="eyebrow text-[10px] text-burgundy/60" lang={locale}>
          {[p.family, formatText].filter(Boolean).join(" · ")}
        </p>
        <div className="mt-1.5 flex items-start justify-between gap-3">
          <h3 className="font-serif text-[19px] leading-tight md:text-[22px]">
            <LLink href={href} className="link-underline">{p.name}</LLink>
          </h3>
          {layout === "grid" && p.inStock && (
            <button
              type="button"
              onClick={quickAdd}
              disabled={pending}
              aria-label={t.product.addToBag}
              className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-burgundy/25 text-burgundy transition-colors hover:bg-burgundy hover:text-cream lg:hidden"
            >
              <Plus className="size-4" strokeWidth={1.5} />
            </button>
          )}
        </div>
        {p.inspirationNote && <p className="mt-1 text-[12.5px] italic leading-snug text-muted">{p.inspirationNote}</p>}
        {layout === "list" && <p className="mt-2 text-[14px] leading-relaxed text-muted">{p.shortDescription}</p>}
        {p.rating && (
          <p className="mt-2 flex items-center gap-1.5 text-[12px] text-muted" lang={locale}>
            <Stars value={p.rating.average} size={11} /> {p.rating.average} ({p.rating.count})
          </p>
        )}
        <div className="mt-2.5 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[14px]" lang={locale}>
          <span className="tabular-nums text-burgundy">
            {p.variants.length > 1 && <span className="mr-1 text-[12px] text-muted">{t.common.from}</span>}
            {price(p.fromPrice)}
            {p.fromCompareAt && <span className="ml-2 text-[12.5px] text-muted line-through">{price(p.fromCompareAt)}</span>}
          </span>
          <span className="text-[12px] text-muted">{sizesText}</span>
        </div>
        {layout === "list" && p.inStock && (
          <button type="button" onClick={quickAdd} disabled={pending} className="btn-text link-quiet mt-4 self-start text-[11px] text-burgundy">
            {t.product.addToBag}
          </button>
        )}
      </div>

      <Sheet open={quickView} onOpenChange={setQuickView} side="center" title={p.name} description={p.family ? `${p.family} · ${p.categoryName}` : p.categoryName}>
        <div className="grid gap-6 p-5 sm:grid-cols-[minmax(0,240px)_1fr] sm:gap-10 sm:p-8" lang={lang}>
          <div className="mx-auto w-full max-w-[240px]">
            <ProductImage src={p.images[0]?.url} alt={p.images[0]?.alt} name={p.name} sizes="240px" />
          </div>
          <div lang={locale}>
            <p className="text-[15px] leading-relaxed text-charcoal" lang={lang}>{p.shortDescription}</p>
            <div className="mt-7">
              <PurchasePanel productId={p.id} productName={p.name} variants={p.variants} compact onAdded={() => setQuickView(false)} />
            </div>
            <LLink href={href} className="link-quiet mt-7 inline-block text-[13px] text-burgundy" onClick={() => setQuickView(false)}>
              {t.product.seeDetails}
            </LLink>
          </div>
        </div>
      </Sheet>
    </article>
  );
}

export function ProductGrid({ products, layout = "grid", priorityCount = 0, columns = "default" }: { products: ProductCardData[]; layout?: "grid" | "list"; priorityCount?: number; columns?: "default" | "three" }) {
  return (
    <div
      className={
        layout === "grid"
          ? cn("grid grid-cols-2 gap-x-4 gap-y-12 md:gap-x-7 md:gap-y-16", columns === "three" ? "md:grid-cols-3" : "md:grid-cols-3 xl:grid-cols-4")
          : "flex flex-col gap-10"
      }
    >
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} layout={layout} priority={i < priorityCount} />
      ))}
    </div>
  );
}
