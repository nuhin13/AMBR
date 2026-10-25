import { SectionIntro } from "@/components/editorial/kicker";
import { getFamilies, getOccasions } from "@/modules/catalog/queries";
import { getT } from "@/i18n/server";
import { SignatureFinder } from "./signature-finder";

export async function FinderSection({ title, subtitle }: { title?: string | null; subtitle?: string | null }) {
  const { t, locale } = await getT();
  const [families, occasions] = await Promise.all([getFamilies(locale), getOccasions(locale)]);
  const fam = families.filter((f) => f._count.products > 0).map((f) => ({ value: f.slug, label: f.name }));
  const occ = occasions.filter((o) => o._count.products > 0).map((o) => ({ value: o.slug, label: o.name }));
  if (fam.length === 0) return null;
  return (
    <section id="finder" className="section-y" aria-labelledby="finder-title">
      <div className="container-wide">
        <SectionIntro id="finder-title" kicker={t.home.finderKicker} title={title ?? t.home.finderTitle} text={subtitle ?? t.home.finderText} className="reveal" />
        <div className="mt-14 md:mt-20">
          <SignatureFinder families={fam} occasions={occ} />
        </div>
      </div>
    </section>
  );
}
