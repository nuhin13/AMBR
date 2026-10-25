import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";
import { Kicker } from "@/components/editorial/kicker";
import { getBanners } from "@/modules/content/queries";
import { getT } from "@/i18n/server";
import { localePath } from "@/i18n/config";

/** Brand philosophy: atmospheric image bleeding off the left edge, oversized type overlapping it. */
export async function Story({ title }: { title?: string | null }) {
  const { t, locale } = await getT();
  const [b] = await getBanners("STORY", locale);
  const heading = title ?? b?.title ?? t.home.storyTitle;
  const lang = b && b.lang !== locale ? b.lang : undefined;
  return (
    <section className="overflow-hidden bg-burgundy text-cream" aria-labelledby="story-title">
      <div className="grid md:grid-cols-12 md:items-center">
        <div className="relative aspect-[4/5] md:col-span-6 md:aspect-auto md:h-[min(92svh,820px)] lg:col-span-7">
          {b?.imageDesktop ? (
            <Image src={b.imageDesktop} alt={b.imageAlt ?? ""} fill sizes="(min-width: 768px) 58vw, 100vw" className="object-cover" />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,#6b2a3c,#3a0c1a)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-burgundy/70 to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-burgundy" aria-hidden />
        </div>
        <div className="relative z-10 -mt-24 px-5 pb-20 md:col-span-6 md:mt-0 md:-ml-24 md:px-0 md:pb-0 md:pr-[var(--gutter)] lg:col-span-5 lg:-ml-32" lang={lang}>
          <Kicker tone="light">{b?.eyebrow ?? t.home.storyKicker}</Kicker>
          <h2 id="story-title" className="t-h1 mt-6 text-cream">{heading}</h2>
          <p className="t-lead mt-7 max-w-md text-cream/75">{b?.subtitle ?? t.home.storyBody}</p>
          <div className="mt-9">
            <ButtonLink href={localePath(locale, b?.ctaHref ?? "/about")} variant="quiet-light">{b?.ctaLabel ?? t.home.storyCta}</ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
