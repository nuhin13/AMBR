"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, LayoutGrid, List, X } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Opt = { slug: string; name: string; count?: number };

export type FilterOptions = {
  families: Opt[];
  occasions: Opt[];
  categories?: Opt[];
  priceBounds: { min: number; max: number }; // taka
  hide?: ("family" | "occasion")[];
};

const SEASONS = [
  { slug: "summer", name: "Summer" },
  { slug: "monsoon", name: "Monsoon" },
  { slug: "winter", name: "Winter" },
  { slug: "all-year", name: "All year" },
];

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
    <fieldset className="border-b border-beige py-5">
      <legend className="eyebrow mb-3 text-burgundy/80">{title}</legend>
      {children}
    </fieldset>
  );
}

function Checks({ k, options }: { k: string; options: Opt[] }) {
  const { getList, toggle } = useFilterUrl();
  const selected = getList(k);
  return (
    <ul className="space-y-2">
      {options.map((o) => (
        <li key={o.slug}>
          <label className={cn("flex cursor-pointer items-center gap-3 text-[14px]", o.count === 0 && !selected.includes(o.slug) && "opacity-45")}>
            <input type="checkbox" className="size-4 accent-burgundy" checked={selected.includes(o.slug)} onChange={() => toggle(k, o.slug)} />
            <span className="flex-1">{o.name}</span>
            {o.count !== undefined && <span className="text-[12px] text-muted">{o.count}</span>}
          </label>
        </li>
      ))}
    </ul>
  );
}

function PriceRange({ bounds }: { bounds: { min: number; max: number } }) {
  const { get, push } = useFilterUrl();
  const [min, setMin] = useState(get("min"));
  const [max, setMax] = useState(get("max"));
  return (
    <form
      className="flex items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        push((p) => {
          if (min) p.set("min", min); else p.delete("min");
          if (max) p.set("max", max); else p.delete("max");
        });
      }}
    >
      <label className="flex-1 text-[12px] text-muted">
        Min ৳
        <input inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))} placeholder={String(bounds.min)} className="mt-1 h-10 w-full border border-beige bg-white px-2 text-[14px] text-charcoal focus:border-burgundy focus:outline-none" />
      </label>
      <label className="flex-1 text-[12px] text-muted">
        Max ৳
        <input inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))} placeholder={String(bounds.max)} className="mt-1 h-10 w-full border border-beige bg-white px-2 text-[14px] text-charcoal focus:border-burgundy focus:outline-none" />
      </label>
      <button type="submit" className="h-10 border border-burgundy px-3 text-[11px] font-semibold uppercase tracking-wider text-burgundy hover:bg-burgundy hover:text-cream">Go</button>
    </form>
  );
}

function Toggles() {
  const { get, set } = useFilterUrl();
  return (
    <div className="space-y-2 text-[14px]">
      <label className="flex cursor-pointer items-center gap-3">
        <input type="checkbox" className="size-4 accent-burgundy" checked={get("stock") === "1"} onChange={(e) => set("stock", e.target.checked ? "1" : null)} />
        In stock only
      </label>
      <label className="flex cursor-pointer items-center gap-3">
        <input type="checkbox" className="size-4 accent-burgundy" checked={get("new") === "1"} onChange={(e) => set("new", e.target.checked ? "1" : null)} />
        New arrivals
      </label>
    </div>
  );
}

function Panel({ options }: { options: FilterOptions }) {
  return (
    <div>
      <Group title="Availability"><Toggles /></Group>
      {options.categories && options.categories.length > 1 && (
        <Group title="Category"><CategoryLinks categories={options.categories} /></Group>
      )}
      {!options.hide?.includes("family") && <Group title="Fragrance family"><Checks k="family" options={options.families} /></Group>}
      {!options.hide?.includes("occasion") && <Group title="Occasion"><Checks k="occasion" options={options.occasions} /></Group>}
      <Group title="Season"><Checks k="season" options={SEASONS} /></Group>
      <Group title="Price"><PriceRange bounds={options.priceBounds} /></Group>
    </div>
  );
}

function CategoryLinks({ categories }: { categories: Opt[] }) {
  const { router, params } = useFilterUrl();
  return (
    <ul className="space-y-2 text-[14px]">
      {categories.map((c) => (
        <li key={c.slug}>
          <button className="text-left hover:text-burgundy hover:underline" onClick={() => router.push(`/${c.slug}?${params.toString()}`)}>
            {c.name} {c.count !== undefined && <span className="text-[12px] text-muted">({c.count})</span>}
          </button>
        </li>
      ))}
    </ul>
  );
}

export function FilterSidebar({ options }: { options: FilterOptions }) {
  return (
    <aside className="hidden lg:block" aria-label="Filters">
      <Panel options={options} />
      <ClearAll />
    </aside>
  );
}

function ClearAll() {
  const { params, router, pathname } = useFilterUrl();
  const keys = ["family", "occasion", "season", "min", "max", "stock", "new"];
  if (!keys.some((k) => params.has(k))) return null;
  return (
    <button
      onClick={() => {
        const p = new URLSearchParams(params.toString());
        keys.forEach((k) => p.delete(k));
        p.delete("page");
        router.push(p.toString() ? `${pathname}?${p}` : pathname, { scroll: false });
      }}
      className="mt-5 text-[12px] font-semibold uppercase tracking-[0.14em] text-burgundy underline underline-offset-4"
    >
      Clear all filters
    </button>
  );
}

export function CatalogToolbar({ options, total }: { options: FilterOptions; total: number }) {
  const { get, set } = useFilterUrl();
  const [open, setOpen] = useState(false);
  const view = get("view") === "list" ? "list" : "grid";
  return (
    <div className="mb-8 flex items-center justify-between gap-3 border-y border-beige py-3">
      <div className="flex items-center gap-3">
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-burgundy lg:hidden">
          <SlidersHorizontal className="size-4" /> Filter
        </button>
        <p className="hidden text-[13px] text-muted lg:block" aria-live="polite">{total} fragrance{total === 1 ? "" : "s"}</p>
      </div>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-[13px] text-muted">
          <span className="hidden sm:inline">Sort by</span>
          <select
            value={get("sort") || "popular"}
            onChange={(e) => set("sort", e.target.value === "popular" ? null : e.target.value)}
            className="h-9 border border-beige bg-white px-2 text-[13px] text-charcoal focus:border-burgundy focus:outline-none"
          >
            <option value="popular">Most popular</option>
            <option value="best-sellers">Best sellers</option>
            <option value="newest">Newest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
        </label>
        <div className="hidden items-center border border-beige sm:flex" role="group" aria-label="View">
          <button onClick={() => set("view", null)} aria-pressed={view === "grid"} className={cn("p-2", view === "grid" ? "bg-burgundy text-cream" : "text-burgundy")} aria-label="Grid view"><LayoutGrid className="size-4" /></button>
          <button onClick={() => set("view", "list")} aria-pressed={view === "list"} className={cn("p-2", view === "list" ? "bg-burgundy text-cream" : "text-burgundy")} aria-label="List view"><List className="size-4" /></button>
        </div>
      </div>
      <Sheet open={open} onOpenChange={setOpen} side="left" title="Filter" footer={<Button full onClick={() => setOpen(false)}>Show {total} result{total === 1 ? "" : "s"}</Button>}>
        <div className="px-5">
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
    <div className="-mt-4 mb-8 flex flex-wrap gap-2">
      {labels.map((l) => (
        <button
          key={`${l.key}-${l.value}`}
          onClick={() => (["min", "max", "stock", "new", "q"].includes(l.key) ? set(l.key, null) : toggle(l.key, l.value))}
          className="inline-flex items-center gap-1.5 rounded-full border border-burgundy/30 bg-white px-3 py-1 text-[12.5px] text-burgundy hover:border-burgundy"
        >
          {l.label} <X className="size-3" aria-label="remove" />
        </button>
      ))}
    </div>
  );
}
