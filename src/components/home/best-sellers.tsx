import { ButtonLink } from "@/components/ui/button";
import { ProductCard } from "@/components/product/product-card";
import { SectionIntro } from "@/components/editorial/kicker";
import { getBestSellers } from "@/modules/catalog/queries";
import { getT } from "@/i18n/server";
import { localePath } from "@/i18n/config";

/** Image-first best sellers: staggered grid on desktop, swipeable row on mobile. */
export async function BestSellers({ title, subtitle }: { title?: string | null; subtitle?: string | null }) {
  const { t, locale } = await getT();
  const products = await getBestSellers(locale, 8);
  if (products.length === 0) return null;
  return (
    <section className="section-y bg-cream-light" aria-labelledby="bs-title">
      <div className="container-wide">
        <SectionIntro
          id="bs-title"
          kicker={t.home.bestKicker}
          title={title ?? t.home.bestTitle}
          text={subtitle ?? undefined}
          action={<ButtonLink href={localePath(locale, "/shop?sort=best-sellers")} variant="quiet">{t.common.viewAll}</ButtonLink>}
          className="reveal"
        />
      </div>
      <div className="no-scrollbar mt-12 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 md:hidden">
        {products.map((p) => (
          <div key={p.id} className="w-[72%] shrink-0 snap-start">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
      <div className="container-wide mt-16 hidden md:block">
        <div className="grid grid-cols-3 gap-x-7 gap-y-20 xl:grid-cols-4">
          {products.slice(0, 8).map((p, i) => (
            <div key={p.id} className={i % 2 === 1 ? "md:translate-y-12" : undefined}>
              <ProductCard product={p} sizes="(min-width: 1280px) 22vw, 30vw" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
