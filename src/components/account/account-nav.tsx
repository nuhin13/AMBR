"use client";

import { usePathname } from "next/navigation";
import { LLink } from "@/components/i18n/llink";
import { useI18n } from "@/i18n/client";
import { stripLocale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export function AccountNav() {
  const path = stripLocale(usePathname() ?? "/");
  const { t } = useI18n();
  const links = [
    { href: "/account", label: t.account.overview },
    { href: "/account/orders", label: t.account.orders },
    { href: "/account/addresses", label: t.account.addresses },
    { href: "/account/wishlist", label: t.account.wishlist },
    { href: "/account/profile", label: t.account.profile },
  ];
  return (
    <nav aria-label={t.account.kicker} className="no-scrollbar -mx-4 flex gap-6 overflow-x-auto border-b border-burgundy/10 px-4 lg:mx-0 lg:flex-col lg:gap-1 lg:border-b-0 lg:px-0">
      {links.map((l) => {
        const active = l.href === "/account" ? path === l.href : path.startsWith(l.href);
        return (
          <LLink key={l.href} href={l.href} aria-current={active ? "page" : undefined} className={cn("shrink-0 border-b-2 py-3 text-[14.5px] transition-colors lg:border-b-0 lg:border-l-2 lg:py-2 lg:pl-4", active ? "border-burgundy text-burgundy" : "border-transparent text-charcoal/70 hover:text-burgundy")}>
            {l.label}
          </LLink>
        );
      })}
    </nav>
  );
}
