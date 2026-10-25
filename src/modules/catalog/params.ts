import type { Gender, Intensity, Season, VariantFormat } from "@prisma/client";
import type { ProductFilters, SortKey } from "./queries";

export type RawSearchParams = Record<string, string | string[] | undefined>;

const SORTS: SortKey[] = ["popular", "newest", "price-asc", "price-desc", "best-sellers"];
const SEASONS: Season[] = ["SUMMER", "MONSOON", "WINTER", "ALL_YEAR"];

/** URL slug ↔ enum maps for the new editorial filters (URLs stay readable and language-neutral). */
export const GENDER_SLUG: Record<string, Gender> = { him: "MASCULINE", her: "FEMININE", unisex: "UNISEX" };
export const FORMAT_SLUG: Record<string, VariantFormat> = { spray: "SPRAY", "roll-on": "ROLL_ON", oil: "OIL" };
export const PRESENCE_SLUG: Record<string, Intensity> = { soft: "LIGHT", moderate: "MODERATE", bold: "STRONG" };
export const slugOf = <T extends string>(map: Record<string, T>, v: T) => Object.keys(map).find((k) => map[k] === v)!;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const list = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v.join(",") : (v ?? ""))
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^[a-z0-9-]{1,60}$/.test(s));
const mapped = <T>(v: string | string[] | undefined, map: Record<string, T>) => list(v).flatMap((s) => (s in map ? [map[s]] : []));
const taka = (v: string | undefined) => {
  const n = Number(v);
  return v !== undefined && v !== "" && Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : undefined;
};

/** Parses (and sanitises) catalogue filters from the URL. */
export function parseFilters(sp: RawSearchParams): ProductFilters & { view: "grid" | "list" } {
  const sort = one(sp.sort) as SortKey | undefined;
  return {
    q: one(sp.q)?.slice(0, 80),
    families: list(sp.family),
    occasions: list(sp.occasion),
    seasons: list(sp.season).map((s) => s.toUpperCase().replace("-", "_")).filter((s): s is Season => SEASONS.includes(s as Season)),
    genders: mapped(sp.for, GENDER_SLUG),
    formats: mapped(sp.format, FORMAT_SLUG),
    intensities: mapped(sp.presence, PRESENCE_SLUG),
    minPrice: taka(one(sp.min)),
    maxPrice: taka(one(sp.max)),
    inStock: one(sp.stock) === "1",
    newArrivals: one(sp.new) === "1",
    sort: sort && SORTS.includes(sort) ? sort : "popular",
    page: Math.max(1, Number(one(sp.page)) || 1),
    view: one(sp.view) === "list" ? "list" : "grid",
  };
}
