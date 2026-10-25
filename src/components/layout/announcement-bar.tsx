import { getBanners } from "@/modules/content/queries";
import { getT } from "@/i18n/server";
import { LLink } from "@/components/i18n/llink";

export async function AnnouncementBar() {
  const { locale } = await getT();
  const [banner] = await getBanners("ANNOUNCEMENT", locale);
  if (!banner) return null;
  return (
    <div className="bg-burgundy-deep text-cream/85" lang={banner.lang === locale ? undefined : banner.lang}>
      <p className="container-wide flex min-h-8 items-center justify-center gap-3 py-1.5 text-center text-[11px] tracking-[0.14em] uppercase [&:lang(bn)]:normal-case [&:lang(bn)]:tracking-normal [&:lang(bn)]:text-[12.5px]">
        <span>{banner.title}</span>
        {banner.ctaHref && banner.ctaLabel && (
          <LLink href={banner.ctaHref} className="link-quiet text-cream">
            {banner.ctaLabel}
          </LLink>
        )}
      </p>
    </div>
  );
}
