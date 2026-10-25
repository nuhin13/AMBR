"use client";

import Image from "next/image";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/utils";

/**
 * Product imagery at a fixed ratio (default 4:5) so grids never jump.
 * Without an uploaded photo an honest typographic placeholder is shown — never a stand-in
 * photo of a different product.
 */
export function ProductImage({
  src,
  alt,
  name,
  sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw",
  priority,
  className,
  hoverSrc,
  ratio = "aspect-[4/5]",
}: {
  src?: string | null;
  alt?: string;
  name: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  hoverSrc?: string | null;
  ratio?: string;
}) {
  const { t } = useI18n();
  return (
    <div className={cn("relative w-full overflow-hidden bg-[#efdcd2]", ratio, className)}>
      {src ? (
        <>
          <Image src={src} alt={alt || name} fill sizes={sizes} priority={priority} className="img-zoom object-cover" />
          {hoverSrc && (
            <Image src={hoverSrc} alt="" fill sizes={sizes} className="object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100" aria-hidden />
          )}
        </>
      ) : (
        <div className="@container absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_50%_38%,#f6e6de_0%,#ead6cb_55%,#e2cbbf_100%)] px-4 text-center">
          <span className="img-zoom block font-serif text-[clamp(1.05rem,9cqi,2.4rem)] italic leading-tight text-burgundy/85 @max-[110px]:hidden">{name}</span>
          <span className="mt-3 block h-px w-8 bg-gold" aria-hidden />
          <span className="eyebrow mt-3 text-[9.5px] text-burgundy/50 @max-[150px]:hidden">{t.common.photoSoon}</span>
          <span className="sr-only">{t.common.photoSoon}</span>
        </div>
      )}
    </div>
  );
}
