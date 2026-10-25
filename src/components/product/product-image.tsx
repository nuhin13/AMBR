import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Product imagery always renders at a fixed 4:5 ratio so grids never jump.
 * When no photo has been uploaded yet, an honest typographic placeholder is shown —
 * never a stand-in photo of a different product.
 */
export function ProductImage({
  src,
  alt,
  name,
  sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw",
  priority,
  className,
  hoverSrc,
}: {
  src?: string | null;
  alt?: string;
  name: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  hoverSrc?: string | null;
}) {
  return (
    <div className={cn("relative aspect-[4/5] w-full overflow-hidden bg-beige/70", className)}>
      {src ? (
        <>
          <Image src={src} alt={alt || name} fill sizes={sizes} priority={priority} className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]" />
          {hoverSrc && (
            <Image src={hoverSrc} alt="" fill sizes={sizes} className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100" aria-hidden />
          )}
        </>
      ) : (
        <div className="@container absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_50%_35%,#f1ddd3_0%,#e6d3c7_70%)] px-4 text-center">
          <span className="block h-px w-6 bg-gold @min-[120px]:mb-4 @min-[120px]:w-10" aria-hidden />
          <span className="hidden font-serif text-[clamp(1.1rem,3.4vw,1.6rem)] leading-tight text-burgundy @min-[120px]:block">{name}</span>
          <span className="eyebrow mt-3 hidden text-[9.5px] text-burgundy/60 @min-[120px]:block">Photo coming soon</span>
          <span className="sr-only">No product photo yet</span>
        </div>
      )}
    </div>
  );
}
