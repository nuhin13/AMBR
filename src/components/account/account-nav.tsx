"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/wishlist", label: "Wishlist" },
  { href: "/account/profile", label: "Profile & password" },
];

export function AccountNav() {
  const path = usePathname();
  return (
    <nav aria-label="Account" className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0">
      {LINKS.map((l) => {
        const active = l.href === "/account" ? path === l.href : path.startsWith(l.href);
        return (
          <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined} className={cn("shrink-0 px-4 py-2.5 text-[14px] lg:border-l-2 lg:px-4", active ? "bg-burgundy text-cream lg:border-burgundy lg:bg-transparent lg:text-burgundy lg:font-medium" : "text-charcoal hover:text-burgundy lg:border-transparent")}>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
