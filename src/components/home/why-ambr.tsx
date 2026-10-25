import { Feather, Gem, HeartHandshake, Package } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";

/** Wording deliberately avoids unverifiable performance or certification claims. */
const ITEMS = [
  { icon: Feather, title: "Carefully selected compositions", body: "Every fragrance is chosen for its character and balance before it joins our collection." },
  { icon: Gem, title: "Affordable premium", body: "A refined fragrance experience, priced for everyday wear rather than special occasions only." },
  { icon: HeartHandshake, title: "For every lifestyle", body: "From fresh office scents to rich evening attars — something for every day and every you." },
  { icon: Package, title: "Thoughtfully presented", body: "Honest descriptions, clear notes and careful packing, so what arrives is what you chose." },
];

export function WhyAmbr({ title, subtitle }: { title?: string | null; subtitle?: string | null }) {
  return (
    <section className="container-x section-y" aria-labelledby="why-title">
      <SectionHeading align="center" eyebrow="Why AMBR" title={<span id="why-title">{title ?? "Fragrance, made personal"}</span>} description={subtitle ?? undefined} />
      <div className="grid gap-px overflow-hidden border border-beige bg-beige sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map(({ icon: Icon, title: t, body }) => (
          <div key={t} className="bg-cream p-7 md:p-9">
            <Icon className="size-7 text-burgundy" strokeWidth={1.2} aria-hidden />
            <h3 className="mt-5 text-[21px]">{t}</h3>
            <p className="mt-2.5 text-[14.5px] leading-relaxed text-muted">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
