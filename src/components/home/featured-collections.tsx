import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "@/components/ui/section-heading";
import { ButtonLink } from "@/components/ui/button";
import { getPublishedCollections } from "@/modules/catalog/queries";
import { cn } from "@/lib/utils";

const FALLBACKS = ["bg-burgundy", "bg-beige", "bg-burgundy-soft", "bg-cream-light", "bg-[#5a1a2c]", "bg-beige"];

export async function FeaturedCollections({ title, subtitle }: { title?: string | null; subtitle?: string | null }) {
  const collections = (await getPublishedCollections()).filter((c) => c._count.products > 0);
  const featured = (collections.some((c) => c.isFeatured) ? collections.filter((c) => c.isFeatured) : collections).slice(0, 4);
  if (featured.length === 0) return null;
  return (
    <section className="section-y bg-cream-light" aria-labelledby="col-title">
      <div className="container-x">
        <SectionHeading
          eyebrow="Collections"
          title={<span id="col-title">{title ?? "Curated for the moment"}</span>}
          description={subtitle ?? undefined}
          action={<ButtonLink href="/collections" variant="link">All collections</ButtonLink>}
        />
        <div className="grid grid-cols-2 gap-3 md:gap-6 lg:grid-cols-4">
          {featured.map((c, i) => {
            const dark = !c.imageUrl && (i % 2 === 0);
            return (
              <Link key={c.id} href={`/collections/${c.slug}`} className="group relative block aspect-[3/4] overflow-hidden">
                {c.imageUrl ? (
                  <>
                    <Image src={c.imageUrl} alt={c.imageAlt ?? c.name} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-burgundy/80 to-transparent" />
                  </>
                ) : (
                  <div className={cn("absolute inset-0", FALLBACKS[i % FALLBACKS.length])}>
                    <div className={cn("absolute inset-3 border md:inset-4", dark ? "border-gold/40" : "border-burgundy/20")} aria-hidden />
                  </div>
                )}
                <div className={cn("absolute inset-x-0 bottom-0 p-4 md:p-6", c.imageUrl || dark ? "text-cream" : "text-burgundy")}>
                  <p className={cn("eyebrow text-[10px]", c.imageUrl || dark ? "text-gold" : "text-burgundy/70")}>{c._count.products} fragrances</p>
                  <h3 className={cn("mt-1.5 font-serif text-[20px] leading-tight md:text-[26px]", c.imageUrl || dark ? "text-cream" : "text-burgundy")}>{c.name}</h3>
                  {c.description && <p className={cn("mt-1 hidden text-[13.5px] md:block", c.imageUrl || dark ? "text-cream/75" : "text-muted")}>{c.description}</p>}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
