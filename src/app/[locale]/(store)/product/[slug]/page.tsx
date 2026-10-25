import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/page-intro";
import { ProductGallery } from "@/components/product/product-gallery";
import { PurchasePanel } from "@/components/product/purchase-panel";
import { NotesLadder } from "@/components/product/notes-ladder";
import { WishlistButton } from "@/components/product/wishlist-button";
import { ViewTracker } from "@/components/product/view-tracker";
import { ProductGrid } from "@/components/product/product-card";
import { Kicker, SectionIntro } from "@/components/editorial/kicker";
import { LLink } from "@/components/i18n/llink";
import { Stars } from "@/components/ui/stars";
import { JsonLd } from "@/components/seo/json-ld";
import { db } from "@/lib/db";
import { siteUrl } from "@/lib/env";
import { getProductBySlug, getRelatedProducts, visibleProduct } from "@/modules/catalog/queries";
import { getActiveZones } from "@/modules/shipping/service";
import { getSettings, whatsappLink } from "@/modules/content/settings";
import { getT } from "@/i18n/server";
import { fmt, localePath } from "@/i18n/config";
import { formatDateL, formatNumber, formatPrice } from "@/i18n/format";
import { localeAlternates, ogLocale } from "@/i18n/meta";

export const revalidate = 300;

export async function generateStaticParams() {
  if (process.env.SKIP_BUILD_PRERENDER === "1") return []; // no database during Docker builds; pages render on first request
  const rows = await db.product.findMany({ where: visibleProduct, select: { slug: true } });
  return rows.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata(props: PageProps<"/[locale]/product/[slug]">) {
  const { t, locale } = await getT();
  const p = await getProductBySlug((await props.params).slug, locale);
  if (!p) return { title: "Not found" };
  const from = Math.min(...p.variants.map((v) => v.price));
  const description = p.seoDescription ?? `${p.shortDescription} ${p.productType} — ${t.common.from} ${formatPrice(from, locale)}.`;
  return {
    title: p.seoTitle ?? `${p.name} — ${p.familyNames[0]?.name ?? ""} ${p.categoryName}`.trim(),
    description,
    alternates: localeAlternates(locale, `/product/${p.slug}`),
    openGraph: { title: p.name, description, ...ogLocale(locale), images: p.images[0] ? [{ url: p.images[0].url, alt: p.images[0].alt }] : undefined },
  };
}

export default async function ProductPage(props: PageProps<"/[locale]/product/[slug]">) {
  const { t, locale } = await getT();
  const p = await getProductBySlug((await props.params).slug, locale);
  if (!p) notFound();
  const [related, zones, settings] = await Promise.all([
    getRelatedProducts(locale, p.id, p.categoryId, p.familyNames.map((f) => f.slug)),
    getActiveZones(locale),
    getSettings(),
  ]);
  const from = Math.min(...p.variants.map((v) => v.price));
  const isAttar = p.category.type === "ATTAR";
  const wa = whatsappLink(settings.store.whatsapp, fmt(t.product.whatsappMessage, { name: p.name }));
  const categoryHref = p.category.slug === "perfumes" || p.category.slug === "attar" ? `/${p.category.slug}` : `/category/${p.category.slug}`;
  const formats = [...new Set(p.variants.map((v) => v.format))];
  const contentLang = p.lang !== locale ? p.lang : undefined;
  const price = (n: number) => formatPrice(n, locale);

  const profile: [string, React.ReactNode][] = [
    [t.product.family, p.familyNames.map((f) => f.name).join(", ") || "—"],
    [t.product.presence, `${t.labels.intensity[p.intensity]} — ${t.labels.intensityHint[p.intensity]}`],
    [t.catalog.forWhom, t.labels.gender[p.gender]],
    [t.product.format, formats.map((f) => t.labels.format[f]).join(" / ")],
    [t.product.sizes, p.variants.map((v) => v.label).join(", ")],
    ...(p.seasons.length ? ([[t.product.seasons, p.seasons.map((s) => t.labels.season[s]).join(", ")]] as [string, string][]) : []),
  ];

  return (
    <>
      <ViewTracker id={p.id} name={p.name} price={from} />
      <div className="container-wide pb-20 pt-6 md:pt-8">
        <Breadcrumbs items={[{ href: categoryHref, label: p.categoryName }, { label: p.name }]} />
        <div className="mt-6 grid gap-10 md:mt-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:sticky lg:top-[100px] lg:col-span-7 lg:self-start">
            <ProductGallery images={p.images.map((i) => ({ url: i.url, alt: i.alt }))} name={p.name} />
          </div>

          <div className="lg:col-span-5">
            <div className="flex items-start justify-between gap-6">
              <p className="eyebrow text-burgundy/70">
                {p.familyNames[0] && (
                  <LLink href={`/discover/${p.familyNames[0].slug}`} className="link-underline">{p.familyNames[0].name}</LLink>
                )}
                {p.familyNames[0] && " · "}
                <span lang={contentLang}>{p.productType}</span>
              </p>
              <WishlistButton productId={p.id} withLabel className="-mt-1 shrink-0" />
            </div>
            <h1 className="t-h1 mt-4" lang={contentLang}>{p.name}</h1>
            {(p.isBestSeller || p.isNewArrival || p.isDemo) && (
              <p className="eyebrow mt-4 flex flex-wrap gap-x-4 text-[10.5px] text-burgundy/65">
                {p.isBestSeller && <span>{t.product.badgeBestSeller}</span>}
                {p.isNewArrival && <span>{t.product.badgeNew}</span>}
                {p.isDemo && <span className="text-gold">{t.common.demoProduct}</span>}
              </p>
            )}
            {p.inspirationNote && (
              <p className="mt-4 text-[14.5px] italic text-muted" lang={contentLang}>
                <span className="not-italic text-burgundy/70">{t.product.inspiredBy} — </span>
                {p.inspirationNote}
              </p>
            )}
            {p.rating && (
              <a href="#reviews" className="mt-4 inline-flex items-center gap-2 text-[13px] text-muted hover:text-burgundy">
                <Stars value={p.rating.average} label={fmt(t.review.outOf, { value: p.rating.average })} />
                {formatNumber(p.rating.average, locale)} · {fmt(p.rating.count === 1 ? t.product.reviewCount_one : t.product.reviewCount_other, { count: formatNumber(p.rating.count, locale) })}
              </a>
            )}
            <p className="t-lead mt-6 text-charcoal" lang={contentLang}>{p.shortDescription}</p>
            {p.isDemo && <p className="mt-4 border-l border-gold pl-4 text-[13px] text-muted">{t.common.demoNote}</p>}

            <div className="mt-10">
              <PurchasePanel productId={p.id} productName={p.name} variants={p.variants} maxQty={settings.checkout.maxQtyPerItem} stickyBar />
            </div>

            <div className="mt-10 space-y-2 border-t border-burgundy/12 pt-6 text-[13.5px]">
              {zones.slice(0, 3).map((z) => (
                <p key={z.id} className="flex justify-between gap-4">
                  <span>{z.name} <span className="text-muted">· {z.estimatedDays}</span></span>
                  <span className="tabular-nums text-burgundy">{price(z.fee)}</span>
                </p>
              ))}
              <p className="pt-2 text-muted">
                {t.product.codAvailable}{" "}
                <LLink href="/policies/shipping" className="link-underline text-burgundy">{t.product.shippingPolicy}</LLink>
                {" · "}
                <LLink href="/policies/returns" className="link-underline text-burgundy">{t.product.returnsPolicy}</LLink>
              </p>
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="link-quiet mt-3 inline-block text-burgundy">{t.product.askWhatsapp}</a>
              )}
            </div>
          </div>
        </div>
      </div>

      {(p.notesByTier.top.length + p.notesByTier.heart.length + p.notesByTier.base.length > 0) && (
        <section className="section-y border-t border-burgundy/10" aria-labelledby="notes-title">
          <div className="container-wide grid gap-10 md:grid-cols-12">
            <div className="md:col-span-4">
              <Kicker>{t.product.profile}</Kicker>
              <h2 id="notes-title" className="t-h2 mt-5">{t.product.notes}</h2>
            </div>
            <div className="md:col-span-7 md:col-start-6">
              <NotesLadder notes={p.notesByTier} />
            </div>
          </div>
        </section>
      )}

      <section className="section-y bg-cream-light" aria-labelledby="story-title">
        <div className="container-wide grid gap-14 md:grid-cols-12">
          <div className="md:col-span-7" lang={contentLang}>
            <h2 id="story-title" className="t-h2">{t.product.story}</h2>
            <div className="prose-ambr prose-lg mt-8" dangerouslySetInnerHTML={{ __html: p.description }} />
          </div>
          <div className="md:col-span-4 md:col-start-9">
            <dl className="divide-y divide-burgundy/12 border-y border-burgundy/12 text-[14.5px]">
              {profile.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[7.5rem_1fr] gap-4 py-4">
                  <dt className="eyebrow pt-0.5 text-burgundy/70">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
              {p.occasionNames.length > 0 && (
                <div className="grid grid-cols-[7.5rem_1fr] gap-4 py-4">
                  <dt className="eyebrow pt-0.5 text-burgundy/70">{t.product.bestFor}</dt>
                  <dd className="flex flex-wrap gap-x-3 gap-y-1">
                    {p.occasionNames.map((o) => (
                      <LLink key={o.slug} href={`/shop?occasion=${o.slug}`} className="link-underline text-burgundy">{o.name}</LLink>
                    ))}
                  </dd>
                </div>
              )}
              {/* Performance appears ONLY when tested data with a method note exists — never invented. */}
              {p.performance && (
                <div className="py-4">
                  <dt className="eyebrow text-burgundy/70">{t.product.performance}</dt>
                  <dd className="mt-2 space-y-1">
                    {p.performance.longevity && <p>{t.product.longevity}: {p.performance.longevity}</p>}
                    {p.performance.projection && <p>{t.product.projection}: {p.performance.projection}</p>}
                    <p className="text-[12.5px] text-muted">{t.product.howTested}: {p.performance.testMethodNote} ({formatDateL(p.performance.testedAt, locale)}). {t.product.performanceNote}</p>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </section>

      <section className="section-y" aria-label={t.product.howToWear}>
        <div className="container-wide grid gap-12 md:grid-cols-3 md:gap-16">
          {p.usageInstructions && (
            <div lang={contentLang}>
              <h3 className="t-h3">{isAttar ? t.product.howToApplyAttar : t.product.howToWear}</h3>
              <p className="mt-4 text-[15px] leading-relaxed text-muted">{p.usageInstructions}</p>
            </div>
          )}
          <div>
            <h3 className="t-h3">{t.product.deliveryPayment}</h3>
            <ul className="mt-4 space-y-1.5 text-[14.5px] text-muted">
              {zones.map((z) => (
                <li key={z.id}>
                  {z.name}: <span className="text-charcoal">{price(z.fee)}</span>
                  {z.freeShippingThreshold ? ` · ${fmt(t.product.freeOver, { amount: price(z.freeShippingThreshold) })}` : ""} · {z.estimatedDays}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="t-h3">{t.product.safety}</h3>
            {p.safetyNote && <p className="mt-4 text-[15px] leading-relaxed text-muted" lang={contentLang}>{p.safetyNote}</p>}
            <p className="mt-3 text-[14.5px] text-muted">
              {t.product.storage} <LLink href="/fragrance-guide" className="link-underline text-burgundy">{t.product.guideLink}</LLink>
            </p>
          </div>
        </div>
        <p className="container-wide mt-14 text-[12px] leading-relaxed text-muted">{t.common.independentNote}</p>
      </section>

      <section id="reviews" className="section-y border-t border-burgundy/10" aria-labelledby="reviews-title">
        <div className="container-wide">
          <SectionIntro id="reviews-title" kicker={t.product.reviewsKicker} title={t.product.reviewsTitle} />
          <div className="mt-12 md:grid md:grid-cols-12">
            {p.reviews.length === 0 ? (
              <p className="max-w-xl text-muted md:col-span-9 md:col-start-4">
                {t.product.noReviews} <LLink href="/account/orders" className="link-underline text-burgundy">{t.product.reviewFromOrders}</LLink>.
              </p>
            ) : (
              <>
                <div className="md:col-span-3">
                  <p className="font-serif text-[64px] leading-none text-burgundy">{formatNumber(p.rating!.average, locale)}</p>
                  <Stars value={p.rating!.average} size={16} className="mt-3" label={fmt(t.review.outOf, { value: p.rating!.average })} />
                  <p className="mt-2 text-[13px] text-muted">{fmt(p.rating!.count === 1 ? t.product.reviewCount_one : t.product.reviewCount_other, { count: formatNumber(p.rating!.count, locale) })}</p>
                </div>
                <ul className="mt-10 divide-y divide-burgundy/12 md:col-span-8 md:col-start-5 md:mt-0">
                  {p.reviews.map((r) => (
                    <li key={r.id} className="py-7 first:pt-0">
                      <div className="flex items-center justify-between gap-4">
                        <Stars value={r.rating} label={fmt(t.review.outOf, { value: r.rating })} />
                        <span className="text-[12px] text-muted">{formatDateL(r.createdAt, locale)}</span>
                      </div>
                      {r.title && <p className="mt-4 font-serif text-[19px] text-burgundy" lang={r.locale ?? undefined}>{r.title}</p>}
                      <p className="mt-2 leading-relaxed" lang={r.locale ?? undefined}>{r.body}</p>
                      <p className="mt-3 text-[12.5px] text-muted">{r.author} · {t.home.verifiedBuyer} · {r.variantLabel}</p>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="section-y bg-cream-light" aria-labelledby="related-title">
          <div className="container-wide">
            <SectionIntro id="related-title" kicker={t.product.relatedKicker} title={t.product.relatedTitle} />
            <div className="mt-12">
              <ProductGrid products={related} />
            </div>
          </div>
        </section>
      )}

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: p.name,
          description: p.shortDescription,
          inLanguage: p.lang === "bn" ? "bn-BD" : "en",
          sku: p.variants[0]?.sku,
          brand: { "@type": "Brand", name: "AMBR" },
          category: p.categoryName,
          url: `${siteUrl}${localePath(locale, `/product/${p.slug}`)}`,
          ...(p.images.length ? { image: p.images.map((i) => (i.url.startsWith("http") ? i.url : `${siteUrl}${i.url}`)) } : {}),
          offers: p.variants.map((v) => ({
            "@type": "Offer",
            sku: v.sku,
            name: `${p.name} ${v.label}`,
            price: (v.price / 100).toFixed(2),
            priceCurrency: "BDT",
            availability: v.available > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            url: `${siteUrl}${localePath(locale, `/product/${p.slug}`)}`,
            itemCondition: "https://schema.org/NewCondition",
          })),
          ...(p.rating ? { aggregateRating: { "@type": "AggregateRating", ratingValue: p.rating.average, reviewCount: p.rating.count } } : {}),
        }}
      />
    </>
  );
}
