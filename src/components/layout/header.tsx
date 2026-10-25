import { Logo } from "@/components/brand/logo";
import { LLink } from "@/components/i18n/llink";
import { LanguageSwitch } from "@/components/i18n/language-switch";
import { getSettings, whatsappLink } from "@/modules/content/settings";
import { getT } from "@/i18n/server";
import { localePath } from "@/i18n/config";
import { AccountLink, CartButton, SearchButton } from "./header-actions";
import { HeaderShell } from "./header-shell";
import { MobileNav } from "./mobile-nav";
import { NAV_PRIMARY } from "./nav";

const linkCls = "eyebrow link-underline py-1 text-cream/85 transition-colors hover:text-cream";

export async function Header() {
  const [{ store }, { t, locale }] = await Promise.all([getSettings(), getT()]);
  const left = NAV_PRIMARY.slice(0, 4);
  const right = NAV_PRIMARY.slice(4);
  return (
    <HeaderShell>
      <div className="container-wide grid h-[60px] grid-cols-[1fr_auto_1fr] items-center transition-[height] duration-300 lg:h-[84px] lg:group-data-[scrolled]/header:h-[68px]">
        <div className="flex items-center">
          <MobileNav whatsappHref={whatsappLink(store.whatsapp)} />
          <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex xl:gap-10">
            {left.map((l) => (
              <LLink key={l.href} href={l.href} className={linkCls}>{t.nav[l.key]}</LLink>
            ))}
          </nav>
        </div>
        <div className="w-[46px] transition-[width] duration-300 lg:w-[74px] lg:group-data-[scrolled]/header:w-[58px]">
          <Logo priority href={localePath(locale, "/")} />
        </div>
        <div className="flex items-center justify-end gap-1 lg:gap-8">
          <nav aria-label="Secondary" className="hidden items-center gap-7 lg:flex xl:gap-10">
            {right.map((l) => (
              <LLink key={l.href} href={l.href} className={linkCls}>{t.nav[l.key]}</LLink>
            ))}
          </nav>
          <div className="flex items-center lg:-mr-2">
            <LanguageSwitch className="mr-2 hidden md:flex" />
            <SearchButton />
            <span className="hidden sm:block"><AccountLink /></span>
            <CartButton />
          </div>
        </div>
      </div>
    </HeaderShell>
  );
}
