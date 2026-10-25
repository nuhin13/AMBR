import { getImageProps } from "next/image";
import { ButtonLink } from "@/components/ui/button";
import { getBanners } from "@/modules/content/queries";
import { getT } from "@/i18n/server";
import { localePath } from "@/i18n/config";

/** Splits "More Than a Fragrance. A Feeling." → ["More Than a Fragrance.", "A Feeling."] (also "।"). */
function splitHeadline(title: string): [string, string | null] {
  const m = title.match(/^(.+?[.।])\s+(.+)$/);
  return m ? [m[1], m[2]] : [title, null];
}

/** Full-bleed editorial campaign: one image, minimal copy, one call to action. */
export async function Hero() {
  const { t, locale } = await getT();
  const [b] = await getBanners("HOME_HERO", locale);
  const title = b?.title ?? "More Than a Fragrance. A Feeling.";
  const [first, second] = splitHeadline(title);
  const desktop = b?.imageDesktop;
  const mobile = b?.imageMobile ?? desktop;
  const lang = b && b.lang !== locale ? b.lang : undefined;
  return (
    <section className="relative isolate overflow-hidden bg-burgundy text-cream" aria-labelledby="hero-title">
      <div className="lg:grid lg:min-h-[min(84svh,820px)] lg:grid-cols-12">
        {/* Image: full-bleed portrait on phones; right-hand panel on desktop so the photograph is never upscaled */}
        <div className="relative aspect-[4/5] max-h-[74svh] w-full sm:aspect-[16/10] lg:order-2 lg:col-span-6 lg:aspect-auto lg:max-h-none xl:col-span-7">
          {desktop && <HeroPicture desktop={desktop} mobile={mobile!} alt={b?.imageAlt ?? ""} />}
          <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(74,16,34,1)_0%,rgba(74,16,34,0.55)_30%,rgba(74,16,34,0)_60%)] lg:bg-[linear-gradient(to_right,rgba(74,16,34,1)_0%,rgba(74,16,34,0)_35%)]" aria-hidden />
        </div>
        <div className="relative z-10 -mt-40 flex items-end sm:-mt-28 lg:order-1 lg:col-span-6 lg:mt-0 lg:items-center xl:col-span-5">
          <div className="w-full px-[var(--gutter)] pb-12 md:pb-16 lg:py-20 lg:pr-0" lang={lang}>
            {b?.eyebrow && <p className="eyebrow text-gold">{b.eyebrow}</p>}
            <h1 id="hero-title" className="t-display mt-4 text-cream md:mt-6 lg:-mr-24">
              <span className="block">{first}</span>
              {second && <em className="block font-serif italic text-rose">{second}</em>}
            </h1>
            {b?.subtitle && <p className="t-lead mt-5 max-w-md text-cream/80 md:mt-7">{b.subtitle}</p>}
            <div className="mt-8 md:mt-10">
              <ButtonLink href={localePath(locale, b?.ctaHref ?? "/shop")} variant="light" size="lg">
                {b?.ctaLabel ?? t.home.heroCta}
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Art-directed hero: portrait crop on phones, landscape on larger screens (both optimised by next/image). */
function HeroPicture({ desktop, mobile, alt }: { desktop: string; mobile: string; alt: string }) {
  const common = { alt, fill: true, priority: true } as const;
  const { props: { srcSet: desktopSet } } = getImageProps({ ...common, src: desktop, sizes: "(min-width: 1024px) 55vw, 100vw" });
  const { props: { srcSet: mobileSet, ...rest } } = getImageProps({ ...common, src: mobile, sizes: "100vw" });
  return (
    <picture>
      <source media="(min-width: 640px)" srcSet={desktopSet} sizes="(min-width: 1024px) 55vw, 100vw" />
      {/* eslint-disable-next-line jsx-a11y/alt-text -- alt is in rest */}
      <img {...rest} srcSet={mobileSet} className="absolute inset-0 h-full w-full object-cover object-[62%_center]" />
    </picture>
  );
}
