"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Sticky header that tightens slightly once the page scrolls. */
export function HeaderShell({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header
      data-scrolled={scrolled || undefined}
      className={cn("group/header sticky top-0 z-40 bg-burgundy text-cream transition-shadow duration-300", scrolled && "shadow-[0_8px_30px_-12px_rgba(58,12,26,0.55)]")}
    >
      {children}
    </header>
  );
}
