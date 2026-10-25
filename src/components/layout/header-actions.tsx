"use client";

import { ShoppingBag, Search, User } from "lucide-react";
import { useStore } from "@/components/cart/store-provider";
import { LLink } from "@/components/i18n/llink";
import { useI18n } from "@/i18n/client";
import { useSearch } from "./search-overlay";

export function CartButton() {
  const { cart, setCartOpen } = useStore();
  const { t, fmt } = useI18n();
  const count = cart?.count ?? 0;
  return (
    <button onClick={() => setCartOpen(true)} className="relative p-2 text-cream/90 transition-colors hover:text-cream" aria-label={fmt(t.nav.openBag, { count })}>
      <ShoppingBag className="size-[20px]" strokeWidth={1.3} />
      {count > 0 && (
        <span className="absolute right-0.5 top-0.5 flex size-[16px] items-center justify-center rounded-full bg-gold text-[9.5px] font-semibold text-burgundy tabular-nums">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}

export function SearchButton() {
  const { open } = useSearch();
  const { t } = useI18n();
  return (
    <button onClick={open} className="p-2 text-cream/90 transition-colors hover:text-cream" aria-label={t.common.search}>
      <Search className="size-[20px]" strokeWidth={1.3} />
    </button>
  );
}

export function AccountLink() {
  const { t } = useI18n();
  return (
    <LLink href="/account" className="p-2 text-cream/90 transition-colors hover:text-cream" aria-label={t.nav.yourAccount}>
      <User className="size-[20px]" strokeWidth={1.3} />
    </LLink>
  );
}
