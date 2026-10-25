"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { ProductCardData } from "@/modules/catalog/queries";
import { discoverProductsAction } from "@/modules/catalog/actions";
import { ProductCard } from "@/components/product/product-card";
import { cn } from "@/lib/utils";

type Option = { slug: string; name: string; count: number };

export function FragranceFinder({
  families,
  occasions,
  initial,
}: {
  families: Option[];
  occasions: Option[];
  initial: { kind: "family" | "occasion"; slug: string; products: ProductCardData[] } | null;
}) {
  const [kind, setKind] = useState<"family" | "occasion">(initial?.kind ?? "family");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [products, setProducts] = useState<ProductCardData[]>(initial?.products ?? []);
  const [pending, start] = useTransition();
  const options = kind === "family" ? families : occasions;
  const current = options.find((o) => o.slug === slug);

  const choose = (k: "family" | "occasion", s: string) => {
    setKind(k);
    setSlug(s);
    start(async () => setProducts(await discoverProductsAction(k, s)));
  };

  return (
    <div>
      <div className="mb-6 inline-flex border border-burgundy p-1" role="tablist" aria-label="Discover by">
        {(["family", "occasion"] as const).map((k) => (
          <button
            key={k}
            role="tab"
            aria-selected={kind === k}
            onClick={() => {
              const first = (k === "family" ? families : occasions).find((o) => o.count > 0);
              if (first) choose(k, first.slug);
              else setKind(k);
            }}
            className={cn("px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors md:px-6", kind === k ? "bg-burgundy text-cream" : "text-burgundy")}
          >
            {k === "family" ? "By scent" : "By occasion"}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 md:gap-2.5">
        {options.map((o) => (
          <button
            key={o.slug}
            onClick={() => choose(kind, o.slug)}
            disabled={o.count === 0}
            aria-pressed={o.slug === slug}
            className={cn(
              "rounded-full border px-4 py-2 text-[13.5px] transition-colors md:px-5",
              o.slug === slug ? "border-burgundy bg-burgundy text-cream" : "border-beige bg-white text-charcoal hover:border-burgundy",
              o.count === 0 && "cursor-not-allowed opacity-40",
            )}
          >
            {o.name}
          </button>
        ))}
      </div>
      <div className={cn("mt-10 transition-opacity", pending && "opacity-50")} aria-live="polite">
        {products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            {current && (
              <div className="mt-10 text-center">
                <Link
                  href={kind === "family" ? `/discover/${current.slug}` : `/shop?occasion=${current.slug}`}
                  className="text-[12px] font-semibold uppercase tracking-[0.16em] text-burgundy underline decoration-rose underline-offset-[6px] hover:decoration-burgundy"
                >
                  See all {current.name} fragrances
                </Link>
              </div>
            )}
          </>
        ) : (
          <p className="py-10 text-center text-muted">{pending ? "Finding fragrances…" : "Choose a scent or an occasion to see our suggestions."}</p>
        )}
      </div>
    </div>
  );
}
