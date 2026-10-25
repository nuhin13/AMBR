import { ContentPageView, contentMetadata } from "@/components/layout/content-page";
import { ButtonLink } from "@/components/ui/button";

export const revalidate = 300;
export const generateMetadata = () => contentMetadata("about", "/about");

export default async function AboutPage() {
  return (
    <>
      <ContentPageView slug="about" crumbs={[{ label: "About AMBR" }]} eyebrow="Our story" />
      <section className="bg-burgundy py-16 text-center text-cream md:py-20">
        <p className="eyebrow text-gold">AMBR — Above Ordinary</p>
        <h2 className="mx-auto mt-4 max-w-xl text-[30px] text-cream md:text-[40px]">More than a fragrance. <em className="italic text-rose">A feeling.</em></h2>
        <div className="mt-8 flex justify-center gap-3">
          <ButtonLink href="/perfumes" variant="light">Explore perfumes</ButtonLink>
          <ButtonLink href="/attar" variant="outline-light">Discover attars</ButtonLink>
        </div>
      </section>
    </>
  );
}
