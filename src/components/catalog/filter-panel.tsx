"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, LayoutGrid, List, X } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/utils";

type Opt = { slug: string; name: string; count?: number };

export type FilterOptions = {
  families: Opt[];
  occasions: Opt[];
  categories?: Opt[];
  priceBounds: { min: number; max: number }; // taka
  hide?: ("family" | "occasion" | "for")[];
};

function useFilterUrl() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const get = (k: string) => params.get(k) ?? "";
  const getList = (k: string) => get(k).split(",").filter(Boolean);
  const push = (mut: (p: URLSearchParams) => void) => {
    const p = new URLSearchParams(params.toString());
    mut(p);
    p.delete("page");
    const qs = p.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };
  const toggle = (k: string, v: string) =>
    push((p) => {
      const cur = (p.get(k) ?? "").split(",").filter(Boolean);
      const next = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v];
      if (next.length) p.set(k, next.join(","));
      else p.delete(k);
    });
  const set = (k: string, v: string | null) => push((p) => (v ? p.set(k, v) : p.delete(k)));
  return { get, getList, toggle, set, push, params, pathname, router };
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="py-6 first:pt-0">
      <legend className="eyebrow mb-4 text-burgundy/75">{title}</legend>
      {children}
    </fieldset>
  );
}

/** Option rows: text with a small tick mark — quieter than checkbox boxes. */
function Checks({ k, options }: { k: string; options: Opt[] }) {
  const { getList, toggle } = useFilterUrl();
  const selected = getList(k);
  return (
    <ul className="space-y-1">
      {options.map((o) => {
        const on = selected.includes(o.slug);
        return (
          <li key={o.slug}>
            <button
              type="button"
              role="checkbox"
              aria-checked={on}
              onClick={() => toggle(k, o.slug)}
              className={cn("flex w-full items-center gap-3 py-1 text-left text-[14.5px] transition-colors", on ? "text-burgundy" : "text-charcoal/80 hover:text-burgundy", o.count === 0 && !on && "opacity-40")}
            >
              <span className={cn("flex size-3.5 shrink-0 items-center justify-center border transition-colors", on ? "border-burgundy bg-burgundy" : "border-burgundy/35")} aria-hidden>
                {on && <span className="size-1.5 bg-cream" />}
              </span>
              <span className="flex-1">{o.name}</span>
              {o.count !== undefined && <span className="text-[12px] tabular-nums text-muted">{o.count}</span>}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function PriceRange({ bounds }: { bounds: { min: number; max: number } }) {
  const { get, push } = useFilterUrl();
  const { t } = useI18n();
  const [min, setMin] = useState(get("min"));
  const [max, setMax] = useState(get("max"));
  const digits = (s: string) => s.replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d))).replace(/\D/g, "");
  return (
    <form
      className="flex items-end gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        push((p) => {
          if (min) p.set("min", min); else p.delete("min");
          if (max) p.set("max", max); else p.delete("max");
        });
      }}
    >
      <label className="flex-1 text-[12px] text-muted">
        {t.catalog.min}
        <input inputMode="numeric" value={min} onChange={(e) => setMin(digits(e.target.value))} placeholder={String(bounds.min)} className="mt-1 h-9 w-full border-b border-burgundy/25 bg-transparent text-[14px] text-charcoal focus:border-burgundy focus:outline-none" />
      </label>
      <label className="flex-1 text-[12px] text-muted">
        {t.catalog.max}
        <input inputMode="numeric" value={max} onChange={(e) => setMax(digits(e.target.value))} placeholder={String(bounds.max)} className="mt-1 h-9 w-full border-b border-burgundy/25 bg-transparent text-[14px] text-charcoal focus:border-burgundy focus:outline-none" />
      </label>
      <button type="submit" className="btn-text h-9 text-[11px] text-burgundy">{t.catalog.go}</button>
    </form>
  );
}

function Panel({ options }: { options: FilterOptions }) {
  const { t } = useI18n();
  const { get, set } = useFilterUrl();
  return (
    <div className="divide-y divide-burgundy/10">
      <Group title={t.catalog.availability}>
        <div className="space-y-1 text-[14.5px]">
          {[
            { k: "stock", label: t.catalog.inStockOnly },
            { k: "new", label: t.catalog.newArrivals },
          ].map((x) => {
            const on = get(x.k) === "1";
            return (
              <button key={x.k} type="button" role="checkbox" aria-checked={on} onClick={() => set(x.k, on ? null : "1")} className={cn("flex w-full items-center gap-3 py-1 text-left", on ? "text-burgundy" : "text-charcoal/80 hover:text-burgundy")}>
                <span className={cn("flex size-3.5 items-center justify-center border", on ? "border-burgundy bg-burgundy" : "border-burgundy/35")} aria-hidden>{on && <span className="size-1.5 bg-cream" />}</span>
                {x.label}
              </button>
            );
          })}
        </div>
      </Group>
      {!options.hide?.includes("for") && (
        <Group title={t.catalog.forWhom}>
          <Checks k="for" options={[{ slug: "him", name: t.labels.gender.MASCULINE }, { slug: "her", name: t.labels.gender.FEMININE }, { slug: "unisex", name: t.labels.gender.UNISEX }]} />
        </Group>
      )}
      {!options.hide?.includes("family") && <Group title={t.catalog.family}><Checks k="family" options={options.families} /></Group>}
      {!options.hide?.includes("occasion") && <Group title={t.catalog.occasion}><Checks k="occasion" options={options.occasions} /></Group>}
      <Group title={t.catalog.presence}>
        <Checks k="presence" options={[{ slug: "soft", name: t.labels.intensity.LIGHT }, { slug: "moderate", name: t.labels.intensity.MODERATE }, { slug: "bold", name: t.labels.intensity.STRONG }]} />
      </Group>
      <Group title={t.catalog.format}>
        <Checks k="format" options={[{ slug: "spray", name: t.labels.format.SPRAY }, { slug: "roll-on", name: t.labels.format.ROLL_ON }]} />
      </Group>
      <Group title={t.catalog.season}>
        <Checks k="season" options={(["SUMMER", "MONSOON", "WINTER", "ALL_YEAR"] as const).map((s) => ({ slug: s.toLowerCase().replace("_", "-"), name: t.labels.season[s] }))} />
      </Group>
      <Group title={t.catalog.price}><PriceRange bounds={options.priceBounds} /></Group>
    </div>
  );
}

const FILTER_KEYS = ["family", "occasion", "season", "min", "max", "stock", "new", "for", "format", "presence"];

function ClearAll() {
  const { params, router, pathname } = useFilterUrl();
  const { t } = useI18n();
  if (!FILTER_KEYS.some((k) => params.has(k))) return null;
  return (
    <button
      onClick={() => {
        const p = new URLSearchParams(params.toString());
        FILTER_KEYS.forEach((k) => p.delete(k));
        p.delete("page");
        router.push(p.toString() ? `${pathname}?${p}` : pathname, { scroll: false });
      }}
      className="btn-text link-quiet mt-6 text-[11px] text-burgundy"
    >
      {t.catalog.clearAll}
    </button>
  );
}

export function FilterSidebar({ options }: { options: FilterOptions }) {
  const { t } = useI18n();
  return (
    <aside className="hidden lg:block" aria-label={t.catalog.filters}>
      <div className="sticky top-[100px] max-h-[calc(100svh-120px)] overflow-y-auto pr-2 no-scrollbar">
        <Panel options={options} />
        <ClearAll />
      </div>
    </aside>
  );
}

export function CatalogToolbar({ options, total }: { options: FilterOptions; total: number }) {
  const { get, set } = useFilterUrl();
  const { t, fmt } = useI18n();
  const [open, setOpen] = useState(false);
  const view = get("view") === "list" ? "list" : "grid";
  const countLabel = fmt(total === 1 ? t.common.fragrances_one : t.common.fragrances_other, { count: total });
  return (
    <div className="mb-10 flex items-center justify-between gap-3 border-b border-burgundy/10 pb-4">
      <div className="flex items-center gap-4">
        <button onClick={() => setOpen(true)} className="btn-text inline-flex items-center gap-2 text-[11px] text-burgundy lg:hidden">
          <SlidersHorizontal className="size-4" /> {t.catalog.filter}
        </button>
        <p className="hidden text-[13px] text-muted lg:block" aria-live="polite">{countLabel}</p>
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-[13px] text-muted">
          <span className="hidden sm:inline">{t.catalog.sortBy}</span>
          <select
            value={get("sort") || "popular"}
            onChange={(e) => set("sort", e.target.value === "popular" ? null : e.target.value)}
            className="h-9 border-b border-burgundy/25 bg-transparent pr-1 text-[13.5px] text-charcoal focus:border-burgundy focus:outline-none"
          >
            {(["popular", "best-sellers", "newest", "price-asc", "price-desc"] as const).map((k) => (
              <option key={k} value={k}>{t.catalog.sort[k]}</option>
            ))}
          </select>
        </label>
        <div className="hidden items-center gap-1 sm:flex" role="group">
          <button onClick={() => set("view", null)} aria-pressed={view === "grid"} className={cn("p-1.5 transition-colors", view === "grid" ? "text-burgundy" : "text-burgundy/35 hover:text-burgundy")} aria-label={t.catalog.gridView}><LayoutGrid className="size-4" strokeWidth={1.5} /></button>
          <button onClick={() => set("view", "list")} aria-pressed={view === "list"} className={cn("p-1.5 transition-colors", view === "list" ? "text-burgundy" : "text-burgundy/35 hover:text-burgundy")} aria-label={t.catalog.listView}><List className="size-4" strokeWidth={1.5} /></button>
        </div>
      </div>
      <Sheet open={open} onOpenChange={setOpen} side="bottom" title={t.catalog.filters} footer={<Button full onClick={() => setOpen(false)}>{fmt(total === 1 ? t.catalog.showResults_one : t.catalog.showResults_other, { count: total })}</Button>}>
        <div className="px-5 pb-4 pt-5">
          <Panel options={options} />
          <ClearAll />
        </div>
      </Sheet>
    </div>
  );
}

export function ActiveFilters({ labels }: { labels: { key: string; value: string; label: string }[] }) {
  const { toggle, set } = useFilterUrl();
  if (labels.length === 0) return null;
  return (
    <div className="-mt-6 mb-10 flex flex-wrap gap-x-5 gap-y-2">
      {labels.map((l) => (
        <button
          key={`${l.key}-${l.value}`}
          onClick={() => (["min", "max", "stock", "new", "q"].includes(l.key) ? set(l.key, null) : toggle(l.key, l.value))}
          className="inline-flex items-center gap-1.5 text-[13px] text-burgundy hover:text-burgundy-soft"
        >
          <X className="size-3" aria-hidden /> <span className="link-underline">{l.label}</span>
        </button>
      ))}
    </div>
  );
}
