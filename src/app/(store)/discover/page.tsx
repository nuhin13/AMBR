import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { FragranceFinder } from "@/components/home/fragrance-finder";
import { getFamilies, getOccasions, getProductsByFamily } from "@/modules/catalog/queries";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Find Your Fragrance",
  description: "Discover AMBR fragrances by scent family — fresh, woody, floral, oriental and more — or by occasion, from office to evening.",
  alternates: { canonical: "/discover" },
};

export default async function DiscoverPage() {
  const [families, occasions] = await Promise.all([getFamilies(), getOccasions()]);
  const fam = families.map((f) => ({ slug: f.slug, name: f.name, count: f._count.products }));
  const occ = occasions.map((o) => ({ slug: o.slug, name: o.name, count: o._count.products }));
  const first = fam.find((f) => f.count > 0);
  const initial = first ? { kind: "family" as const, slug: first.slug, products: await getProductsByFamily(first.slug, 4) } : null;
  return (
    <>
      <PageHeader crumbs={[{ label: "Find your fragrance" }]} eyebrow="Discover" title="Find your fragrance" description="Not sure where to start? Choose the kind of scent you love, or the moment you're dressing for." />
      <div className="container-x py-12 md:py-16">
        <FragranceFinder families={fam} occasions={occ} initial={initial} />
        <section className="mt-20 border-t border-beige pt-14" aria-labelledby="families-title">
          <h2 id="families-title" className="text-[28px] md:text-[36px]">The fragrance families</h2>
          <div className="mt-8 grid gap-px border border-beige bg-beige sm:grid-cols-2 lg:grid-cols-5">
            {families.map((f) => (
              <Link key={f.id} href={`/discover/${f.slug}`} className="group bg-cream p-6 hover:bg-cream-light">
                <h3 className="text-[21px] group-hover:underline group-hover:decoration-rose group-hover:underline-offset-4">{f.name}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{f.description}</p>
                <p className="eyebrow mt-4 text-[10px] text-burgundy/70">{f._count.products} fragrance{f._count.products === 1 ? "" : "s"}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
