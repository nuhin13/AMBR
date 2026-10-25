import { ButtonLink } from "@/components/ui/button";
import { getT } from "@/i18n/server";
import { localePath } from "@/i18n/config";

export default async function NotFound() {
  const { t, locale } = await getT();
  return (
    <div className="container-wide py-24 md:py-36">
      <p className="eyebrow text-burgundy/70">404</p>
      <h1 className="t-display mt-6 max-w-[14ch]">{t.pages.notFoundTitle}</h1>
      <p className="t-lead mt-6 max-w-md text-muted">{t.pages.notFoundText}</p>
      <div className="mt-10 flex flex-wrap items-center gap-8">
        <ButtonLink href={localePath(locale, "/shop")}>{t.pages.shopFragrances}</ButtonLink>
        <ButtonLink href={localePath(locale, "/")} variant="quiet">{t.pages.backHome}</ButtonLink>
      </div>
    </div>
  );
}
