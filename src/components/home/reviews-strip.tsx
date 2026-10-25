import Link from "next/link";
import { SectionHeading } from "@/components/ui/section-heading";
import { Stars } from "@/components/ui/stars";
import { getFeaturedReviews } from "@/modules/content/queries";
import { initialsName } from "@/modules/catalog/queries";
import { formatDate } from "@/lib/utils";

/** Only approved, verified-purchase reviews. Hidden entirely until at least 3 exist. */
export async function ReviewsStrip({ title }: { title?: string | null }) {
  const reviews = await getFeaturedReviews();
  if (reviews.length < 3) return null;
  return (
    <section className="container-x section-y" aria-labelledby="rev-title">
      <SectionHeading align="center" eyebrow="From our customers" title={<span id="rev-title">{title ?? "In their words"}</span>} />
      <div className="grid gap-6 md:grid-cols-3">
        {reviews.slice(0, 3).map((r) => (
          <figure key={r.id} className="flex flex-col border border-beige bg-cream-light p-7">
            <Stars value={r.rating} />
            {r.title && <p className="mt-4 font-serif text-[19px] text-burgundy">{r.title}</p>}
            <blockquote className="mt-3 flex-1 text-[15px] leading-relaxed">“{r.body}”</blockquote>
            <figcaption className="mt-6 border-t border-beige pt-4 text-[13px] text-muted">
              <span className="font-medium text-charcoal">{initialsName(r.user.name)}</span> · Verified buyer
              <br />
              <Link href={`/product/${r.product.slug}`} className="text-burgundy hover:underline">{r.product.name}</Link> · {r.orderItem.variantLabel} · {formatDate(r.createdAt)}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
