import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { getSettings, whatsappLink } from "@/modules/content/settings";
import { AccountLink, CartButton, SearchButton } from "./header-actions";
import { MobileNav } from "./mobile-nav";
import { NAV_LEFT, NAV_RIGHT } from "./nav-links";

const linkCls = "eyebrow link-underline py-1 text-cream/90 transition-colors hover:text-cream";

export async function Header() {
  const { store } = await getSettings();
  return (
    <header className="sticky top-0 z-40 bg-burgundy text-cream shadow-[0_1px_0_rgba(212,176,138,0.25)]">
      <div className="container-x grid h-16 grid-cols-[1fr_auto_1fr] items-center lg:h-[92px]">
        <div className="flex items-center gap-1">
          <MobileNav whatsappHref={whatsappLink(store.whatsapp)} />
          <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex xl:gap-9">
            {NAV_LEFT.map((l) => (
              <Link key={l.href} href={l.href} className={linkCls}>{l.label}</Link>
            ))}
          </nav>
        </div>
        <div className="w-[52px] lg:w-[84px]">
          <Logo priority />
        </div>
        <div className="flex items-center justify-end gap-1 lg:gap-7">
          <nav aria-label="Secondary" className="hidden items-center gap-7 lg:flex xl:gap-9">
            {NAV_RIGHT.map((l) => (
              <Link key={l.href} href={l.href} className={linkCls}>{l.label}</Link>
            ))}
          </nav>
          <div className="flex items-center lg:-mr-2">
            <SearchButton />
            <span className="hidden sm:block"><AccountLink /></span>
            <CartButton />
          </div>
        </div>
      </div>
    </header>
  );
}
