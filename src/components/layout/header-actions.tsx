"use client";

import Link from "next/link";
import { ShoppingBag, Search, User } from "lucide-react";
import { useStore } from "@/components/cart/store-provider";
import { useSearch } from "./search-overlay";

export function CartButton() {
  const { cart, setCartOpen } = useStore();
  const count = cart?.count ?? 0;
  return (
    <button onClick={() => setCartOpen(true)} className="relative p-2 text-cream hover:text-gold" aria-label={`Open bag, ${count} item${count === 1 ? "" : "s"}`}>
      <ShoppingBag className="size-[21px]" strokeWidth={1.4} />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex size-[18px] items-center justify-center rounded-full bg-gold text-[10px] font-semibold text-burgundy tabular-nums">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}

export function SearchButton() {
  const { open } = useSearch();
  return (
    <button onClick={open} className="p-2 text-cream hover:text-gold" aria-label="Search">
      <Search className="size-[21px]" strokeWidth={1.4} />
    </button>
  );
}

export function AccountLink() {
  return (
    <Link href="/account" className="p-2 text-cream hover:text-gold" aria-label="Your account">
      <User className="size-[21px]" strokeWidth={1.4} />
    </Link>
  );
}
