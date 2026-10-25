import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { getPublishedCollections } from "@/modules/catalog/queries";
import { cn } from "@/lib/utils";

export const revalidate = 300;
export const metadata: Metadata = { title: "Collections", description: "Curated AMBR fragrance collections — for the office, evenings, everyday wear and gifting.", alternates: { canonical: "/collections" } };

export default async function CollectionsPage() {
  const collections = (await getPublishedCollections()).filter((c) => c._count.products > 0);
  return (
    <>
      <PageHeader crumbs={[{ label: "Collections" }]} eyebrow="Curated" title="Collections" description="Fragrances gathered around a mood, a moment or a budget." />
      <div className="container-x py-12 md:py-16">
        {collections.length === 0 ? (
          <EmptyState title="Collections coming soon" description="We're curating our first collections." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
            {collections.map((c, i) => (
              <Link key={c.id} href={`/collections/${c.slug}`} className="group relative block aspect-[4/3] overflow-hidden">
                {c.imageUrl ? (
                  <>
                    <Image src={c.imageUrl} alt={c.imageAlt ?? c.name} fill sizes="(min-width: 1024px) 33vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-burgundy/85 to-transparent" />
                  </>
                ) : (
                  <div className={cn("absolute inset-0", i % 3 === 1 ? "bg-beige" : i % 3 === 2 ? "bg-burgundy-soft" : "bg-burgundy")}>
                    <div className={cn("absolute inset-4 border", i % 3 === 1 ? "border-burgundy/20" : "border-gold/40")} />
                  </div>
                )}
                <div className={cn("absolute inset-x-0 bottom-0 p-6 md:p-8", !c.imageUrl && i % 3 === 1 ? "text-burgundy" : "text-cream")}>
                  <p className={cn("eyebrow text-[10px]", !c.imageUrl && i % 3 === 1 ? "text-burgundy/70" : "text-gold")}>{c._count.products} fragrances</p>
                  <h2 className={cn("mt-2 text-[26px] md:text-[30px]", !c.imageUrl && i % 3 === 1 ? "text-burgundy" : "text-cream")}>{c.name}</h2>
                  {c.description && <p className={cn("mt-1 text-[14px]", !c.imageUrl && i % 3 === 1 ? "text-muted" : "text-cream/80")}>{c.description}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
