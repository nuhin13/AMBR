import Image from "next/image";
import Link from "next/link";

export function BrandStory({ title, subtitle }: { title?: string | null; subtitle?: string | null }) {
  return (
    <section className="bg-burgundy text-cream" aria-labelledby="story-title">
      <div className="grid lg:grid-cols-2">
        <div className="relative aspect-[4/3] lg:aspect-auto lg:min-h-[560px]">
          <Image src="/images/temporary/brand-story.jpg" alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
        </div>
        <div className="flex items-center">
          <div className="px-6 py-16 md:px-14 lg:max-w-xl lg:py-24">
            <p className="eyebrow flex items-center gap-3 text-gold"><span className="h-px w-8 bg-gold" aria-hidden />Our philosophy</p>
            <h2 id="story-title" className="mt-5 text-[36px] leading-[1.08] text-cream md:text-[52px]">
              {title ?? (<>Every Scent Tells <em className="italic text-rose">Your Story.</em></>)}
            </h2>
            <p className="mt-6 text-[15.5px] leading-relaxed text-cream/80 md:text-[17px]">
              {subtitle ??
                "At AMBR, we believe fragrance is more than a smell — it's part of who you are. From everyday confidence to special moments, from timeless attars to modern perfumes, we create fragrances that stay with you, so you can feel above ordinary, every day."}
            </p>
            <Link href="/about" className="mt-9 inline-block text-[12px] font-semibold uppercase tracking-[0.16em] text-gold underline decoration-gold/40 underline-offset-[6px] hover:decoration-gold">
              Read our story
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
