import { getImageProps } from "next/image";
import { ButtonLink } from "@/components/ui/button";
import { getBanners } from "@/modules/content/queries";

export async function Hero() {
  const [b] = await getBanners("HOME_HERO");
  const eyebrow = b?.eyebrow ?? "More than a fragrance";
  const title = b?.title ?? "A Feeling.";
  const subtitle = b?.subtitle ?? "Discover fragrances that express your personality, elevate your everyday moments, and stay with you.";
  const desktop = b?.imageDesktop;
  const mobile = b?.imageMobile ?? desktop;
  return (
    <section className="relative overflow-hidden bg-burgundy text-cream" aria-labelledby="hero-title">
      <div className="grid lg:min-h-[620px] lg:grid-cols-[1fr_1.15fr]">
        <div className="relative order-2 flex items-center lg:order-1">
          <div className="container-x py-12 lg:max-w-none lg:py-20 lg:pl-[max(2rem,calc((100vw-1280px)/2+2rem))] lg:pr-14">
            <p className="eyebrow flex items-center gap-3 text-gold">
              <span className="h-px w-8 bg-gold" aria-hidden />
              {eyebrow}
            </p>
            <h1 id="hero-title" className="mt-5 text-[44px] leading-[1.02] text-cream sm:text-[56px] lg:text-[76px]">
              {title.split(" ").length > 1 ? (
                <>
                  {title.split(" ").slice(0, -1).join(" ")} <em className="font-serif italic text-rose">{title.split(" ").slice(-1)}</em>
                </>
              ) : (
                <em className="italic">{title}</em>
              )}
            </h1>
            <p className="mt-6 max-w-md text-[15.5px] leading-relaxed text-cream/80 md:text-[17px]">{subtitle}</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              {b?.ctaHref && <ButtonLink href={b.ctaHref} variant="light" size="lg">{b.ctaLabel ?? "Shop now"}</ButtonLink>}
              {b?.cta2Href && <ButtonLink href={b.cta2Href} variant="outline-light" size="lg">{b.cta2Label ?? "Discover"}</ButtonLink>}
              {!b && (
                <>
                  <ButtonLink href="/perfumes" variant="light" size="lg">Explore Perfumes</ButtonLink>
                  <ButtonLink href="/attar" variant="outline-light" size="lg">Discover Attars</ButtonLink>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="relative order-1 aspect-[4/5] sm:aspect-[16/10] lg:order-2 lg:aspect-auto">
          {desktop && <HeroPicture desktop={desktop} mobile={mobile!} alt={b?.imageAlt ?? ""} />}
          <div className="absolute inset-0 bg-gradient-to-t from-burgundy/70 via-transparent to-transparent lg:bg-gradient-to-r lg:from-burgundy lg:via-burgundy/10 lg:to-transparent" aria-hidden />
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
      <img {...rest} srcSet={mobileSet} className="absolute inset-0 h-full w-full object-cover" />
    </picture>
  );
}
