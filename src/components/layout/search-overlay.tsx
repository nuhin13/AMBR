"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { trackSearch } from "@/components/analytics/events";

const Ctx = createContext<{ open: () => void }>({ open: () => {} });
export const useSearch = () => useContext(Ctx);

const SUGGESTIONS = ["Woody", "Fresh", "Oud", "Rose", "Vanilla", "Office", "Attar"];

export function SearchProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const router = useRouter();
  const go = (term: string) => {
    const t = term.trim();
    if (!t) return;
    trackSearch(t);
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(t)}`);
  };
  return (
    <Ctx.Provider value={{ open: () => setOpen(true) }}>
      {children}
      <Sheet open={isOpen} onOpenChange={setOpen} side="center" title="Search" description="Find a fragrance by name, note or family" className="max-w-xl">
        <form
          role="search"
          className="p-5"
          onSubmit={(e) => {
            e.preventDefault();
            go(q);
          }}
        >
          <div className="flex items-center gap-3 border-b border-burgundy pb-2">
            <Search className="size-5 text-burgundy" aria-hidden />
            <input
              autoFocus
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Try “oud”, “fresh” or a fragrance name"
              className="h-11 w-full bg-transparent text-lg text-charcoal placeholder:text-muted/70 focus:outline-none"
              aria-label="Search fragrances"
            />
          </div>
          <p className="eyebrow mt-6 text-muted">Popular searches</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button type="button" key={s} onClick={() => go(s)} className="border border-beige bg-white px-3 py-1.5 text-[13px] text-burgundy hover:border-burgundy">
                {s}
              </button>
            ))}
          </div>
          <Link href="/discover" onClick={() => setOpen(false)} className="mt-6 inline-block text-[13px] text-burgundy underline underline-offset-4">
            Not sure? Find your fragrance →
          </Link>
        </form>
      </Sheet>
    </Ctx.Provider>
  );
}
