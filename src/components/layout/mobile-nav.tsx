"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, ChevronRight } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { NAV_ALL } from "./nav-links";

export function MobileNav({ whatsappHref }: { whatsappHref: string | null }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="-ml-2 p-2 text-cream lg:hidden" aria-label="Open menu">
        <Menu className="size-6" strokeWidth={1.4} />
      </button>
      <Sheet open={open} onOpenChange={setOpen} side="left" title="Menu">
        <nav aria-label="Mobile" className="flex h-full flex-col">
          <ul className="divide-y divide-beige border-b border-beige">
            {NAV_ALL.map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={close} className="flex items-center justify-between px-5 py-4 font-serif text-[19px] text-burgundy">
                  {l.label}
                  <ChevronRight className="size-4 text-rose" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
          <div className="space-y-1 px-5 py-6 text-[14px]">
            <p className="eyebrow mb-3 text-muted">Discover</p>
            <Link href="/discover" onClick={close} className="block py-1.5 text-charcoal">Find your fragrance</Link>
            <Link href="/shop?sort=best-sellers" onClick={close} className="block py-1.5 text-charcoal">Best sellers</Link>
            <Link href="/shop?new=1" onClick={close} className="block py-1.5 text-charcoal">New arrivals</Link>
          </div>
          <div className="space-y-1 border-t border-beige px-5 py-6 text-[14px]">
            <Link href="/account" onClick={close} className="block py-1.5 text-charcoal">My account</Link>
            <Link href="/track-order" onClick={close} className="block py-1.5 text-charcoal">Track order</Link>
            <Link href="/faq" onClick={close} className="block py-1.5 text-charcoal">Help & FAQ</Link>
            {whatsappHref && (
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="block py-1.5 text-charcoal">Chat on WhatsApp</a>
            )}
          </div>
        </nav>
      </Sheet>
    </>
  );
}
