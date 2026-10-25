"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/client";
import { ProductImage } from "./product-image";

/** Swipeable on mobile, thumbnails + large image on desktop. Smooth cross-fade between images. */
export function ProductGallery({ images, name }: { images: { url: string; alt: string }[]; name: string }) {
  const [active, setActive] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);
  const { fmt } = useI18n();
  if (images.length === 0) return <ProductImage name={name} priority sizes="(min-width: 1024px) 50vw, 100vw" />;

  const go = (i: number) => {
    setActive(i);
    const el = scroller.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="lg:grid lg:grid-cols-[76px_1fr] lg:gap-5">
      <div className="order-2 hidden flex-col gap-3 lg:flex">
        {images.map((img, i) => (
          <button key={img.url} onClick={() => go(i)} aria-label={fmt("{n}", { n: i + 1 })} aria-current={i === active} className={cn("relative aspect-[4/5] overflow-hidden transition-opacity", i === active ? "opacity-100 ring-1 ring-burgundy ring-offset-2 ring-offset-cream" : "opacity-55 hover:opacity-100")}>
            <Image src={img.url} alt="" fill sizes="76px" className="object-cover" />
          </button>
        ))}
      </div>
      <div className="order-1 lg:order-2">
        <div
          ref={scroller}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
          onScroll={(e) => {
            const el = e.currentTarget;
            setActive(Math.round(el.scrollLeft / el.clientWidth));
          }}
        >
          {images.map((img, i) => (
            <div key={img.url} className="w-full shrink-0 snap-start">
              <ProductImage src={img.url} alt={img.alt} name={name} priority={i === 0} sizes="(min-width: 1024px) 50vw, 100vw" />
            </div>
          ))}
        </div>
        {images.length > 1 && (
          <div className="mt-4 flex justify-center gap-2 lg:hidden">
            {images.map((_, i) => (
              <button key={i} onClick={() => go(i)} aria-label={fmt("{n}", { n: i + 1 })} className={cn("h-[2px] transition-all duration-300", i === active ? "w-8 bg-burgundy" : "w-4 bg-burgundy/25")} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
