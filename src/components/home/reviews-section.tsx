import { getFeaturedReviews } from "@/modules/content/queries";
import { initialsName } from "@/modules/catalog/queries";
import { getT } from "@/i18n/server";
import { fmt } from "@/i18n/config";
import { formatDateL } from "@/i18n/format";
import { Stars } from "@/components/ui/stars";
import { Kicker } from "@/components/editorial/kicker";
import { LLink } from "@/components/i18n/llink";

/** Verified-purchase reviews only, shown in the language they were written in. Hidden until 3 exist. */
export async function ReviewsSection({ title }: { title?: string | null }) {
  const { t, locale } = await getT();
  const reviews = await getFeaturedReviews(locale);
  if (reviews.length < 3) return null;
  const [lead, ...rest] = reviews.slice(0, 3);
  return (
    <section className="section-y" aria-labelledby="rev-title">
      <div className="container-wide grid gap-14 md:grid-cols-12">
        <div className="md:col-span-7">
          <Kicker>{t.home.reviewsKicker}</Kicker>
          <h2 id="rev-title" className="sr-only">{title ?? t.home.reviewsTitle}</h2>
          <figure className="reveal mt-8">
            <Stars value={lead.rating} label={fmt(t.review.outOf, { value: lead.rating })} />
            <blockquote className="t-h2 mt-6 italic" lang={lead.locale ?? undefined}>“{lead.body}”</blockquote>
            <figcaption className="mt-6 text-[13.5px] text-muted">
              {initialsName(lead.user.name)} · {t.home.verifiedBuyer} · <LLink href={`/product/${lead.product.slug}`} className="text-burgundy hover:underline">{lead.productName}</LLink> · {formatDateL(lead.createdAt, locale)}
            </figcaption>
          </figure>
        </div>
        <div className="space-y-10 md:col-span-4 md:col-start-9 md:pt-16">
          {rest.map((r) => (
            <figure key={r.id} className="reveal border-t border-burgundy/15 pt-6">
              <Stars value={r.rating} size={12} label={fmt(t.review.outOf, { value: r.rating })} />
              <blockquote className="mt-3 text-[15.5px] leading-relaxed" lang={r.locale ?? undefined}>“{r.body}”</blockquote>
              <figcaption className="mt-3 text-[12.5px] text-muted">{initialsName(r.user.name)} · {r.productName} · {r.orderItem.variantLabel}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
