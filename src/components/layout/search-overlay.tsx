"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { LLink } from "@/components/i18n/llink";
import { useI18n } from "@/i18n/client";
import { trackSearch } from "@/components/analytics/events";

const Ctx = createContext<{ open: () => void }>({ open: () => {} });
export const useSearch = () => useContext(Ctx);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const router = useRouter();
  const { t, href } = useI18n();
  const go = (term: string) => {
    const s = term.trim();
    if (!s) return;
    trackSearch(s);
    setOpen(false);
    router.push(`${href("/search")}?q=${encodeURIComponent(s)}`);
  };
  return (
    <Ctx.Provider value={{ open: () => setOpen(true) }}>
      {children}
      <Sheet open={isOpen} onOpenChange={setOpen} side="center" title={t.search.title} className="max-w-xl">
        <form
          role="search"
          className="p-6 md:p-8"
          onSubmit={(e) => {
            e.preventDefault();
            go(q);
          }}
        >
          <div className="flex items-center gap-3 border-b border-burgundy pb-3">
            <Search className="size-5 text-burgundy" aria-hidden />
            <input
              autoFocus
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t.search.overlayPlaceholder}
              className="h-11 w-full bg-transparent font-serif text-xl text-charcoal placeholder:text-muted/60 focus:outline-none"
              aria-label={t.search.title}
            />
          </div>
          <p className="eyebrow mt-8 text-muted">{t.search.popular}</p>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
            {t.search.suggestions.map((s) => (
              <button type="button" key={s} onClick={() => go(s)} className="link-underline text-[15px] text-burgundy">
                {s}
              </button>
            ))}
          </div>
          <LLink href="/discover" onClick={() => setOpen(false)} className="link-quiet mt-8 inline-block text-[13px] text-burgundy">
            {t.search.notSure}
          </LLink>
        </form>
      </Sheet>
    </Ctx.Provider>
  );
}
