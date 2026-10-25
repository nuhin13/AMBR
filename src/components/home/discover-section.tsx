import { SectionHeading } from "@/components/ui/section-heading";
import { getFamilies, getOccasions, getProductsByFamily } from "@/modules/catalog/queries";
import { FragranceFinder } from "./fragrance-finder";

export async function DiscoverSection({ title, subtitle }: { title?: string | null; subtitle?: string | null }) {
  const [families, occasions] = await Promise.all([getFamilies(), getOccasions()]);
  const fam = families.map((f) => ({ slug: f.slug, name: f.name, count: f._count.products }));
  const occ = occasions.map((o) => ({ slug: o.slug, name: o.name, count: o._count.products }));
  const first = fam.find((f) => f.count > 0);
  if (!first) return null;
  const products = await getProductsByFamily(first.slug, 4);
  return (
    <section id="discover" className="container-x section-y" aria-labelledby="disc-title">
      <SectionHeading
        eyebrow="Find your fragrance"
        title={<span id="disc-title">{title ?? "What do you love to smell like?"}</span>}
        description={subtitle ?? "Explore by scent family or by the moment you're dressing for."}
      />
      <FragranceFinder families={fam} occasions={occ} initial={{ kind: "family", slug: first.slug, products }} />
    </section>
  );
}
