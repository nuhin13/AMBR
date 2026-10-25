import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { ProductCard } from "@/components/product/product-card";
import { getBestSellers } from "@/modules/catalog/queries";

export async function BestSellers({ title, subtitle }: { title?: string | null; subtitle?: string | null }) {
  const products = await getBestSellers(8);
  if (products.length === 0) return null;
  return (
    <section className="section-y bg-cream-light" aria-labelledby="bs-title">
      <div className="container-x">
        <SectionHeading
          eyebrow="Best sellers"
          title={<span id="bs-title">{title ?? "Loved by our customers"}</span>}
          description={subtitle ?? "The fragrances people come back for."}
          action={<ButtonLink href="/shop?sort=best-sellers" variant="link">View all best sellers</ButtonLink>}
        />
      </div>
      {/* Mobile: swipeable row. Desktop: 4-column grid. */}
      <div className="no-scrollbar flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 md:hidden">
        {products.map((p) => (
          <div key={p.id} className="w-[68%] shrink-0 snap-start">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
      <div className="container-x hidden md:block">
        <div className="grid grid-cols-3 gap-x-6 gap-y-14 lg:grid-cols-4">
          {products.slice(0, 8).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
