import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getBanners } from "@/modules/content/queries";
import { getT } from "@/i18n/server";
import { localePath, type Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { SectionIntro } from "@/components/editorial/kicker";
import { cn } from "@/lib/utils";

type Tile = Awaited<ReturnType<typeof getBanners>>[number];

/**
 * "Discover the collections": an asymmetric composition of mixed proportions
 * (tall feature, portrait, landscape, panorama). Tiles without photography become
 * typographic colour plates — never stand-in product photos.
 */
export async function Discovery({ title, subtitle }: { title?: string | null; subtitle?: string | null }) {
  const { t, locale } = await getT();
  const tiles = (await getBanners("DISCOVERY", locale)).slice(0, 4);
  if (tiles.length === 0) return null;
  const [a, b, c, d] = tiles;
  // Without photography the collections read better as a typographic index than as empty colour blocks.
  if (!tiles.some((x) => x.imageDesktop)) {
    return (
      <section className="section-y" aria-labelledby="disc-title">
        <div className="container-wide">
          <SectionIntro id="disc-title" kicker={t.home.discoverKicker} title={title ?? t.home.discoverTitle} text={subtitle ?? undefined} className="reveal" />
          <ol className="mt-12 border-t border-burgundy/15 md:mt-16">
            {tiles.map((tile, i) => (
              <li key={tile.id} className="reveal border-b border-burgundy/15" lang={tile.lang !== locale ? tile.lang : undefined}>
                <Link href={localePath(locale, tile.ctaHref ?? "/shop")} className="group grid items-baseline gap-x-8 gap-y-2 py-7 md:grid-cols-12 md:py-9">
                  <span className="font-serif text-[14px] italic text-rose md:col-span-1">{formatNumber(i + 1, locale).padStart(2, locale === "bn" ? "০" : "0")}</span>
                  <span className="font-serif text-[40px] italic leading-none text-burgundy transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:translate-x-3 md:col-span-6 md:text-[clamp(3rem,6vw,5.5rem)]">{tile.title}</span>
                  <span className="text-[14.5px] text-muted md:col-span-3">{tile.subtitle}</span>
                  <span className="btn-text inline-flex items-center gap-2 text-[10.5px] text-burgundy md:col-span-2 md:justify-end">
                    {tile.ctaLabel}
                    <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>
    );
  }
  return (
    <section className="section-y" aria-labelledby="disc-title">
      <div className="container-wide">
        <SectionIntro id="disc-title" kicker={t.home.discoverKicker} title={title ?? t.home.discoverTitle} text={subtitle ?? undefined} className="reveal" />
        <div className="mt-12 grid grid-cols-2 gap-3 md:mt-16 md:grid-cols-12 md:gap-6">
          {a && <DiscoveryTile tile={a} locale={locale} tone="burgundy" className="col-span-2 aspect-[4/5] md:col-span-7 md:row-span-2 md:aspect-auto md:min-h-[640px]" large />}
          {b && <DiscoveryTile tile={b} locale={locale} tone="beige" className="aspect-[3/4] md:col-span-5 md:aspect-[5/4]" />}
          {c && <DiscoveryTile tile={c} locale={locale} tone="rose" className="aspect-[3/4] md:col-span-5 md:aspect-[5/4]" />}
          {d && <DiscoveryTile tile={d} locale={locale} tone="deep" className="col-span-2 aspect-[16/9] md:col-span-12 md:aspect-[24/7]" wide />}
        </div>
      </div>
    </section>
  );
}

const TONES = {
  burgundy: "bg-burgundy text-cream",
  deep: "bg-[linear-gradient(120deg,#3a0c1a,#4a1022_55%,#5c1b2f)] text-cream",
  beige: "bg-beige text-burgundy",
  rose: "bg-[#ecc8c4] text-burgundy",
} as const;

function DiscoveryTile({ tile, locale, tone, className, large, wide }: { tile: Tile; locale: Locale; tone: keyof typeof TONES; className?: string; large?: boolean; wide?: boolean }) {
  const href = localePath(locale, tile.ctaHref ?? "/shop");
  const image = tile.imageDesktop;
  const light = Boolean(image) || tone === "burgundy" || tone === "deep";
  return (
    <Link href={href} className={cn("group reveal relative block overflow-hidden", image ? "bg-burgundy text-cream" : TONES[tone], className)} lang={tile.lang !== locale ? tile.lang : undefined}>
      {image && (
        <>
          <Image src={image} alt={tile.imageAlt ?? ""} fill sizes={large ? "(min-width: 768px) 58vw, 100vw" : wide ? "100vw" : "(min-width: 768px) 42vw, 50vw"} className="img-zoom object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-burgundy/85 via-burgundy/25 to-transparent" aria-hidden />
        </>
      )}
      <div className={cn("absolute inset-0 flex flex-col justify-end p-5 md:p-9", wide && "md:flex-row md:items-end md:justify-between md:gap-10")}>
        <div>
          <h3 className={cn("font-serif italic leading-[1.02]", large ? "text-[40px] md:text-[76px]" : wide ? "text-[32px] md:text-[60px]" : "text-[26px] md:text-[44px]", light ? "text-cream" : "text-burgundy")}>{tile.title}</h3>
          {tile.subtitle && <p className={cn("mt-2 max-w-sm text-[13.5px] md:mt-3 md:text-[15px]", light ? "text-cream/75" : "text-burgundy/75", !large && !wide && "hidden md:block")}>{tile.subtitle}</p>}
        </div>
        <span className={cn("btn-text mt-4 inline-flex shrink-0 items-center gap-2 text-[10.5px] md:mt-6 md:text-[11px]", light ? "text-gold" : "text-burgundy")}>
          {tile.ctaLabel ?? ""}
          <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
        </span>
      </div>
    </Link>
  );
}
