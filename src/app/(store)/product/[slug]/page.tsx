import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/page-header";
import { ProductGallery } from "@/components/product/product-gallery";
import { PurchasePanel } from "@/components/product/purchase-panel";
import { NotesPyramid } from "@/components/product/notes-pyramid";
import { WishlistButton } from "@/components/product/wishlist-button";
import { ViewTracker } from "@/components/product/view-tracker";
import { ProductGrid } from "@/components/product/product-card";
import { Accordion } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Stars } from "@/components/ui/stars";
import { SectionHeading } from "@/components/ui/section-heading";
import { JsonLd } from "@/components/seo/json-ld";
import { db } from "@/lib/db";
import { siteUrl } from "@/lib/env";
import { formatBDT } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { getProductBySlug, getRelatedProducts, SEASON_LABELS, visibleProduct } from "@/modules/catalog/queries";
import { getActiveZones } from "@/modules/shipping/service";
import { getSettings, whatsappLink } from "@/modules/content/settings";

export const revalidate = 300;

export async function generateStaticParams() {
  if (process.env.SKIP_BUILD_PRERENDER === "1") return []; // no database during Docker builds; pages render on first request
  const rows = await db.product.findMany({ where: visibleProduct, select: { slug: true } });
  return rows.map((r) => ({ slug: r.slug }));
}

const INTENSITY: Record<string, string> = { LIGHT: "Light", MODERATE: "Moderate", STRONG: "Strong" };

export async function generateMetadata(props: PageProps<"/product/[slug]">) {
  const p = await getProductBySlug((await props.params).slug);
  if (!p) return { title: "Not found" };
  const from = Math.min(...p.variants.map((v) => v.price));
  const description = p.seoDescription ?? `${p.shortDescription} ${p.productType} from ${formatBDT(from)}. Cash on delivery across Bangladesh.`;
  return {
    title: p.seoTitle ?? `${p.name} — ${p.families[0]?.family.name ?? ""} ${p.category.type === "ATTAR" ? "Attar" : "Perfume"}`.trim(),
    description,
    alternates: { canonical: `/product/${p.slug}` },
    openGraph: { title: p.name, description, images: p.images[0] ? [{ url: p.images[0].url, alt: p.images[0].alt }] : undefined },
  };
}

export default async function ProductPage(props: PageProps<"/product/[slug]">) {
  const p = await getProductBySlug((await props.params).slug);
  if (!p) notFound();
  const [related, zones, settings] = await Promise.all([
    getRelatedProducts(p.id, p.categoryId, p.families.map((f) => f.family.slug)),
    getActiveZones(),
    getSettings(),
  ]);
  const primaryFamily = p.families[0]?.family;
  const from = Math.min(...p.variants.map((v) => v.price));
  const isAttar = p.category.type === "ATTAR";
  const wa = whatsappLink(settings.store.whatsapp, `Hi AMBR, I have a question about ${p.name}.`);
  const categoryHref = p.category.slug === "perfumes" || p.category.slug === "attar" ? `/${p.category.slug}` : `/category/${p.category.slug}`;

  const details = [
    {
      id: "details",
      title: "Product details",
      content: (
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
          <dt className="text-muted">Type</dt><dd>{p.productType}</dd>
          <dt className="text-muted">Family</dt><dd>{p.families.map((f) => f.family.name).join(", ") || "—"}</dd>
          <dt className="text-muted">Intensity</dt><dd>{INTENSITY[p.intensity]}</dd>
          {p.seasons.length > 0 && (<><dt className="text-muted">Seasons</dt><dd>{p.seasons.map((s) => SEASON_LABELS[s]).join(", ")}</dd></>)}
          {p.occasions.length > 0 && (<><dt className="text-muted">Best for</dt><dd>{p.occasions.map((o) => o.occasion.name).join(", ")}</dd></>)}
          <dt className="text-muted">Sizes</dt><dd>{p.variants.map((v) => v.label).join(", ")}</dd>
          {p.applicationMethod && (<><dt className="text-muted">Application</dt><dd>{p.applicationMethod}</dd></>)}
          {/* Performance is shown ONLY when tested data with a method note exists — never invented. */}
          {p.performance?.longevity && (<><dt className="text-muted">Longevity</dt><dd>{p.performance.longevity}</dd></>)}
          {p.performance?.projection && (<><dt className="text-muted">Projection</dt><dd>{p.performance.projection}</dd></>)}
          {p.performance && (<><dt className="text-muted">How tested</dt><dd className="text-[13px] text-muted">{p.performance.testMethodNote} ({formatDate(p.performance.testedAt)}). Results vary with skin, weather and fabric.</dd></>)}
        </dl>
      ),
    },
    ...(p.usageInstructions ? [{ id: "usage", title: isAttar ? "How to apply your attar" : "How to wear it", content: <p>{p.usageInstructions}</p> }] : []),
    {
      id: "delivery",
      title: "Delivery & payment",
      content: (
        <div className="space-y-3">
          <ul className="space-y-1.5">
            {zones.map((z) => (
              <li key={z.id} className="flex justify-between gap-4">
                <span>{z.name} <span className="text-muted">· {z.estimatedDays}</span></span>
                <span className="tabular-nums">{formatBDT(z.fee)}{z.freeShippingThreshold ? <span className="text-muted"> · free over {formatBDT(z.freeShippingThreshold)}</span> : null}</span>
              </li>
            ))}
          </ul>
          <p className="text-muted">Cash on delivery available. <Link href="/policies/shipping" className="text-burgundy underline underline-offset-4">Shipping policy</Link> · <Link href="/policies/returns" className="text-burgundy underline underline-offset-4">Returns</Link></p>
        </div>
      ),
    },
    {
      id: "safety",
      title: "Safety & care",
      content: (
        <div className="space-y-2">
          {p.safetyNote && <p>{p.safetyNote}</p>}
          <p className="text-muted">Store upright in a cool, dark place. <Link href="/fragrance-guide" className="text-burgundy underline underline-offset-4">Read our fragrance guide</Link>.</p>
        </div>
      ),
    },
  ];

  return (
    <>
      <ViewTracker id={p.id} name={p.name} price={from} />
      <div className="container-x pb-16 pt-6 md:pt-8">
        <Breadcrumbs items={[{ href: categoryHref, label: p.category.name }, { label: p.name }]} />
        <div className="mt-6 grid gap-8 md:mt-8 lg:grid-cols-2 lg:gap-16">
          <div className="lg:sticky lg:top-[120px] lg:self-start">
            <ProductGallery images={p.images.map((i) => ({ url: i.url, alt: i.alt }))} name={p.name} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {primaryFamily && <Link href={`/discover/${primaryFamily.slug}`} className="eyebrow text-burgundy/80 hover:underline">{primaryFamily.name}</Link>}
              <span className="eyebrow text-burgundy/50">·</span>
              <span className="eyebrow text-burgundy/80">{p.productType}</span>
              {p.isBestSeller && <Badge tone="burgundy">Best seller</Badge>}
              {p.isNewArrival && <Badge tone="rose">New</Badge>}
              {p.isDemo && <Badge tone="gold">Demo product</Badge>}
            </div>
            <div className="mt-3 flex items-start justify-between gap-4">
              <h1 className="text-[38px] leading-[1.05] md:text-[54px]">{p.name}</h1>
              <WishlistButton productId={p.id} className="mt-3" withLabel />
            </div>
            {p.rating && (
              <a href="#reviews" className="mt-3 inline-flex items-center gap-2 text-[13px] text-muted hover:text-burgundy">
                <Stars value={p.rating.average} /> {p.rating.average} · {p.rating.count} verified review{p.rating.count === 1 ? "" : "s"}
              </a>
            )}
            <p className="mt-5 text-[16px] leading-relaxed text-charcoal md:text-[17px]">{p.shortDescription}</p>
            {p.isDemo && <p className="mt-3 border-l-2 border-gold pl-3 text-[13px] text-muted">This is a demo product used to preview the store. It will be replaced by the real AMBR catalogue.</p>}

            <div className="mt-8">
              <PurchasePanel productId={p.id} productName={p.name} variants={p.variants} maxQty={settings.checkout.maxQtyPerItem} />
            </div>
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-[13px] text-burgundy underline decoration-rose underline-offset-4">
                Questions about this scent? Ask us on WhatsApp
              </a>
            )}

            <section className="mt-12" aria-labelledby="notes-title">
              <h2 id="notes-title" className="mb-5 text-[24px] md:text-[28px]">The notes</h2>
              <NotesPyramid notes={p.notesByTier} />
            </section>

            {p.description && (
              <section className="mt-12" aria-labelledby="story-title">
                <h2 id="story-title" className="mb-4 text-[24px] md:text-[28px]">The story</h2>
                <div className="prose-ambr" dangerouslySetInnerHTML={{ __html: p.description }} />
                {p.inspirationNote && <p className="mt-4 text-[13.5px] italic text-muted">{p.inspirationNote}</p>}
              </section>
            )}

            <div className="mt-12">
              <Accordion items={details} defaultOpen={["details"]} />
            </div>
            <p className="mt-6 text-[12px] leading-relaxed text-muted">
              AMBR fragrances are independent compositions. AMBR is not affiliated with or endorsed by any designer fragrance house.
            </p>
          </div>
        </div>
      </div>

      <section id="reviews" className="border-t border-beige bg-cream-light" aria-labelledby="reviews-title">
        <div className="container-x section-y">
          <SectionHeading eyebrow="Verified reviews" title={<span id="reviews-title">What customers say</span>} />
          {p.reviews.length === 0 ? (
            <p className="max-w-xl text-muted">
              No reviews yet. Reviews on AMBR come only from customers who bought and received this fragrance — if that&apos;s you,{" "}
              <Link href="/account/orders" className="text-burgundy underline underline-offset-4">review it from your orders</Link>.
            </p>
          ) : (
            <div className="grid gap-8 md:grid-cols-[240px_1fr]">
              <div>
                <p className="font-serif text-[56px] leading-none text-burgundy">{p.rating!.average}</p>
                <Stars value={p.rating!.average} size={16} className="mt-2" />
                <p className="mt-2 text-[13px] text-muted">{p.rating!.count} verified review{p.rating!.count === 1 ? "" : "s"}</p>
              </div>
              <ul className="divide-y divide-beige">
                {p.reviews.map((r) => (
                  <li key={r.id} className="py-6 first:pt-0">
                    <div className="flex items-center justify-between gap-4">
                      <Stars value={r.rating} />
                      <span className="text-[12px] text-muted">{formatDate(r.createdAt)}</span>
                    </div>
                    {r.title && <p className="mt-3 font-serif text-[18px] text-burgundy">{r.title}</p>}
                    <p className="mt-2 leading-relaxed">{r.body}</p>
                    <p className="mt-3 text-[12.5px] text-muted">{r.author} · Verified buyer · {r.variantLabel}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {related.length > 0 && (
        <section className="container-x section-y" aria-labelledby="related-title">
          <SectionHeading eyebrow="You may also like" title={<span id="related-title">Similar fragrances</span>} />
          <ProductGrid products={related} />
        </section>
      )}

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: p.name,
          description: p.shortDescription,
          sku: p.variants[0]?.sku,
          brand: { "@type": "Brand", name: "AMBR" },
          category: p.category.name,
          url: `${siteUrl}/product/${p.slug}`,
          ...(p.images.length ? { image: p.images.map((i) => (i.url.startsWith("http") ? i.url : `${siteUrl}${i.url}`)) } : {}),
          offers: p.variants.map((v) => ({
            "@type": "Offer",
            sku: v.sku,
            name: `${p.name} ${v.label}`,
            price: (v.price / 100).toFixed(2),
            priceCurrency: "BDT",
            availability: v.available > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            url: `${siteUrl}/product/${p.slug}`,
            itemCondition: "https://schema.org/NewCondition",
          })),
          ...(p.rating ? { aggregateRating: { "@type": "AggregateRating", ratingValue: p.rating.average, reviewCount: p.rating.count } } : {}),
        }}
      />
    </>
  );
}
