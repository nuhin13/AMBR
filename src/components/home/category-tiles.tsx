import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { getActiveCategories } from "@/modules/catalog/queries";

export const categoryHref = (slug: string) => (slug === "perfumes" || slug === "attar" ? `/${slug}` : `/category/${slug}`);

export async function CategoryTiles({ title, subtitle }: { title?: string | null; subtitle?: string | null }) {
  const categories = (await getActiveCategories()).slice(0, 4);
  if (categories.length === 0) return null;
  return (
    <section className="container-x section-y" aria-labelledby="cat-title">
      <SectionHeading eyebrow="Shop by category" title={<span id="cat-title">{title ?? "Choose your ritual"}</span>} description={subtitle ?? undefined} />
      <div className="grid grid-cols-2 gap-3 md:gap-6">
        {categories.map((c, i) => (
          <Link key={c.id} href={categoryHref(c.slug)} className="group relative block aspect-[4/5] overflow-hidden md:aspect-[4/3] lg:aspect-[3/2]">
            {c.imageUrl ? (
              <>
                <Image src={c.imageUrl} alt={c.imageAlt ?? c.name} fill sizes="(min-width: 768px) 50vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                <div className="absolute inset-0 bg-gradient-to-t from-burgundy via-burgundy/55 to-burgundy/5" />
              </>
            ) : (
              <div className={i % 2 === 0 ? "absolute inset-0 bg-burgundy-soft" : "absolute inset-0 bg-[linear-gradient(160deg,#5a1a2c_0%,#4a1022_60%,#3a0c1a_100%)]"}>
                <div className="absolute inset-4 border border-gold/40 md:inset-6" aria-hidden />
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 p-4 text-cream md:p-8">
              <p className="eyebrow hidden text-gold md:block">{c._count.products} fragrance{c._count.products === 1 ? "" : "s"}</p>
              <h3 className="mt-1 font-serif text-[22px] leading-tight text-cream md:mt-2 md:text-[36px]">{c.name}</h3>
              {c.tagline && <p className="mt-1 hidden text-[14px] text-cream/80 md:block">{c.tagline}</p>}
              <span className="mt-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] md:mt-5">
                Shop now <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
