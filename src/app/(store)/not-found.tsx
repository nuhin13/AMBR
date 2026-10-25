import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-x flex flex-col items-center py-24 text-center md:py-32">
      <p className="eyebrow text-burgundy/80">404</p>
      <h1 className="mt-4 text-[40px] md:text-[56px]">This page has drifted away</h1>
      <p className="mt-4 max-w-md text-muted">Like the last note of a fragrance, it&apos;s no longer here. Let&apos;s find you something new.</p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/shop">Shop fragrances</ButtonLink>
        <ButtonLink href="/" variant="secondary">Back home</ButtonLink>
      </div>
    </div>
  );
}
