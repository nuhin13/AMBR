import { getDiscoverySets } from "@/modules/catalog/queries";
import { getT } from "@/i18n/server";
import { localePath } from "@/i18n/config";
import { formatPrice } from "@/i18n/format";
import { SectionIntro } from "@/components/editorial/kicker";
import { ProductImage } from "@/components/product/product-image";
import { AddToBagButton } from "@/components/product/add-to-bag-button";
import { ButtonLink } from "@/components/ui/button";
import { LLink } from "@/components/i18n/llink";
import { cn } from "@/lib/utils";

/** Discovery sets & bundles — given a prominent, horizontal editorial presentation. Hidden when none exist. */
export async function DiscoverySets({ title, subtitle }: { title?: string | null; subtitle?: string | null }) {
  const { t, locale } = await getT();
  const sets = await getDiscoverySets(locale, 3);
  if (sets.length === 0) return null;
  return (
    <section className="section-y bg-beige/45" aria-labelledby="sets-title">
      <div className="container-wide">
        <SectionIntro id="sets-title" kicker={t.home.setsKicker} title={title ?? t.home.setsTitle} text={subtitle ?? t.home.setsText} className="reveal" />
        <div className="mt-14 space-y-16 md:mt-20 md:space-y-24">
          {sets.map((s, i) => {
            const v = s.variants[0];
            return (
              <article key={s.id} className="reveal grid items-center gap-8 md:grid-cols-12 md:gap-12" lang={s.lang !== locale ? s.lang : undefined}>
                <LLink href={`/product/${s.slug}`} className={cn("group block md:col-span-7", i % 2 === 1 && "md:order-2 md:col-start-6")}>
                  <ProductImage src={s.images[0]?.url} alt={s.images[0]?.alt} name={s.name} ratio="aspect-[3/2]" sizes="(min-width: 768px) 58vw, 100vw" />
                </LLink>
                <div className={cn("md:col-span-4", i % 2 === 1 ? "md:order-1 md:col-start-1" : "md:col-start-9")}>
                  <p className="eyebrow text-burgundy/70" lang={locale}>{t.product.discoverySet}{v ? ` · ${v.label}` : ""}</p>
                  <h3 className="t-h2 mt-4"><LLink href={`/product/${s.slug}`} className="link-underline">{s.name}</LLink></h3>
                  <p className="mt-4 text-[15px] leading-relaxed text-muted">{s.shortDescription}</p>
                  {v && (
                    <div className="mt-7 flex flex-wrap items-center gap-6" lang={locale}>
                      <span className="text-[22px] tabular-nums text-burgundy">{formatPrice(v.price, locale)}</span>
                      <AddToBagButton variantId={v.id} productId={s.id} name={s.name} label={v.label} price={v.price} disabled={v.available <= 0} />
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
        <div className="mt-16 md:text-right">
          <ButtonLink href={localePath(locale, "/category/discovery-sets")} variant="quiet">{t.common.viewAll}</ButtonLink>
        </div>
      </div>
    </section>
  );
}
