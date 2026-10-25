"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ProductImage } from "./product-image";

export function ProductGallery({ images, name }: { images: { url: string; alt: string }[]; name: string }) {
  const [active, setActive] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);
  if (images.length === 0) return <ProductImage name={name} priority sizes="(min-width: 1024px) 50vw, 100vw" />;

  const go = (i: number) => {
    setActive(i);
    scroller.current?.children[i]?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  };

  return (
    <div className="lg:grid lg:grid-cols-[72px_1fr] lg:gap-4">
      <div className="order-2 hidden flex-col gap-3 lg:flex">
        {images.map((img, i) => (
          <button key={img.url} onClick={() => go(i)} aria-label={`Show image ${i + 1}`} aria-current={i === active} className={cn("relative aspect-[4/5] overflow-hidden border", i === active ? "border-burgundy" : "border-transparent opacity-70 hover:opacity-100")}>
            <Image src={img.url} alt="" fill sizes="72px" className="object-cover" />
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
          <div className="mt-3 flex justify-center gap-2 lg:hidden">
            {images.map((_, i) => (
              <button key={i} onClick={() => go(i)} aria-label={`Image ${i + 1}`} className={cn("h-1 rounded-full transition-all", i === active ? "w-6 bg-burgundy" : "w-2 bg-rose/60")} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
