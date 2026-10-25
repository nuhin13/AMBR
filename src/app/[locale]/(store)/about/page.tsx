import { ContentPageView, contentMetadata } from "@/components/layout/content-page";
import { ButtonLink } from "@/components/ui/button";
import { getT } from "@/i18n/server";
import { localePath } from "@/i18n/config";

export const revalidate = 300;
export const generateMetadata = () => contentMetadata("about", "/about");

export default async function AboutPage() {
  const { t, locale } = await getT();
  return (
    <>
      <ContentPageView slug="about" crumbs={[{ label: t.nav.story }]} kicker={t.pages.aboutKicker} />
      <section className="bg-burgundy text-cream">
        <div className="container-wide section-y grid gap-10 md:grid-cols-12 md:items-end">
          <p className="t-display text-cream md:col-span-8">{t.pages.aboutCtaTitle}</p>
          <div className="flex flex-wrap gap-6 md:col-span-4 md:justify-end">
            <ButtonLink href={localePath(locale, "/shop")} variant="light">{t.nav.shop}</ButtonLink>
            <ButtonLink href={localePath(locale, "/attar")} variant="quiet-light">{t.nav.attar}</ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
