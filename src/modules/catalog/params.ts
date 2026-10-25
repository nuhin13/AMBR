import type { Season } from "@prisma/client";
import type { ProductFilters, SortKey } from "./queries";

export type RawSearchParams = Record<string, string | string[] | undefined>;

const SORTS: SortKey[] = ["popular", "newest", "price-asc", "price-desc", "best-sellers"];
const SEASONS: Season[] = ["SUMMER", "MONSOON", "WINTER", "ALL_YEAR"];

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const list = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v.join(",") : (v ?? ""))
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^[a-z0-9-]{1,60}$/.test(s));
const taka = (v: string | undefined) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : undefined;
};

/** Parses (and sanitises) catalogue filters from the URL. */
export function parseFilters(sp: RawSearchParams): ProductFilters & { view: "grid" | "list" } {
  const sort = one(sp.sort) as SortKey | undefined;
  return {
    q: one(sp.q)?.slice(0, 80),
    families: list(sp.family),
    occasions: list(sp.occasion),
    seasons: list(sp.season).map((s) => s.toUpperCase().replace("-", "_")).filter((s): s is Season => SEASONS.includes(s as Season)),
    minPrice: taka(one(sp.min)),
    maxPrice: taka(one(sp.max)),
    inStock: one(sp.stock) === "1",
    newArrivals: one(sp.new) === "1",
    sort: sort && SORTS.includes(sort) ? sort : "popular",
    page: Math.max(1, Number(one(sp.page)) || 1),
    view: one(sp.view) === "list" ? "list" : "grid",
  };
}
