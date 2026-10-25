import type { Metadata } from "next";
import { Hero } from "@/components/home/hero";
import { Discovery } from "@/components/home/discovery";
import { BestSellers } from "@/components/home/best-sellers";
import { Story } from "@/components/home/story";
import { FinderSection } from "@/components/home/finder-section";
import { DiscoverySets } from "@/components/home/discovery-sets";
import { ReviewsSection } from "@/components/home/reviews-section";
import { JournalTeaser } from "@/components/home/journal-teaser";
import { getHomepageSections } from "@/modules/content/queries";
import { getSettings } from "@/modules/content/settings";
import { getT } from "@/i18n/server";
import { localeAlternates } from "@/i18n/meta";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const [{ seo }, { locale }] = await Promise.all([getSettings(), getT()]);
  const bn = locale === "bn";
  return {
    title: { absolute: bn ? seo.defaultTitleBn : seo.defaultTitle },
    description: bn ? seo.defaultDescriptionBn : seo.defaultDescription,
    alternates: localeAlternates(locale, "/"),
  };
}

export default async function HomePage() {
  const { locale } = await getT();
  const sections = await getHomepageSections(locale);
  return (
    <>
      <Hero />
      {sections
        .filter((s) => s.isEnabled)
        .map((s) => {
          const props = { title: s.title, subtitle: s.subtitle };
          switch (s.key) {
            case "discovery":
              return <Discovery key={s.key} {...props} />;
            case "bestSellers":
              return <BestSellers key={s.key} {...props} />;
            case "story":
              return <Story key={s.key} title={s.title} />;
            case "finder":
              return <FinderSection key={s.key} {...props} />;
            case "sets":
              return <DiscoverySets key={s.key} {...props} />;
            case "reviews":
              return <ReviewsSection key={s.key} title={s.title} />;
            case "journal":
              return <JournalTeaser key={s.key} title={s.title} />;
            default:
              return null; // "newsletter" lives in the footer
          }
        })}
    </>
  );
}
