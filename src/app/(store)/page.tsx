import type { Metadata } from "next";
import { Hero } from "@/components/home/hero";
import { CategoryTiles } from "@/components/home/category-tiles";
import { BestSellers } from "@/components/home/best-sellers";
import { WhyAmbr } from "@/components/home/why-ambr";
import { FeaturedCollections } from "@/components/home/featured-collections";
import { BrandStory } from "@/components/home/brand-story";
import { ReviewsStrip } from "@/components/home/reviews-strip";
import { Newsletter } from "@/components/home/newsletter";
import { DiscoverSection } from "@/components/home/discover-section";
import { getHomepageSections } from "@/modules/content/queries";
import { getSettings } from "@/modules/content/settings";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await getSettings();
  return { title: { absolute: seo.defaultTitle }, description: seo.defaultDescription, alternates: { canonical: "/" } };
}

export default async function HomePage() {
  const sections = await getHomepageSections();
  return (
    <>
      <Hero />
      {sections
        .filter((s) => s.isEnabled)
        .map((s) => {
          const props = { title: s.title, subtitle: s.subtitle };
          switch (s.key) {
            case "categories":
              return <CategoryTiles key={s.key} {...props} />;
            case "bestSellers":
              return <BestSellers key={s.key} {...props} />;
            case "discover":
              return <DiscoverSection key={s.key} {...props} />;
            case "whyAmbr":
              return <WhyAmbr key={s.key} {...props} />;
            case "collections":
              return <FeaturedCollections key={s.key} {...props} />;
            case "story":
              return <BrandStory key={s.key} {...props} />;
            case "reviews":
              return <ReviewsStrip key={s.key} title={s.title} />;
            case "newsletter":
              return <Newsletter key={s.key} {...props} tone="beige" />;
          }
        })}
    </>
  );
}
