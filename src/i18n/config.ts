export const LOCALES = ["en", "bn"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "NEXT_LOCALE";
export const LOCALE_HEADER = "x-ambr-locale";

export const isLocale = (v: unknown): v is Locale => typeof v === "string" && (LOCALES as readonly string[]).includes(v);

export const LOCALE_LABEL: Record<Locale, string> = { en: "English", bn: "বাংলা" };
export const LOCALE_SHORT: Record<Locale, string> = { en: "EN", bn: "বাং" };
export const OG_LOCALE: Record<Locale, string> = { en: "en_BD", bn: "bn_BD" };
export const INTL_LOCALE: Record<Locale, string> = { en: "en-IN", bn: "bn-BD" };

/** Prefixes a storefront path with the locale: ("bn", "/shop") → "/bn/shop". */
export function localePath(locale: Locale, path = "/"): string {
  if (/^https?:\/\//.test(path)) return path;
  const clean = path.startsWith("/") ? path : `/${path}`;
  const stripped = stripLocale(clean);
  return stripped === "/" ? `/${locale}` : `/${locale}${stripped}`;
}

/** Removes a leading locale segment: "/bn/shop?x=1" → "/shop?x=1". */
export function stripLocale(path: string): string {
  const m = path.match(/^\/(en|bn)(?=\/|\?|#|$)/);
  if (!m) return path || "/";
  const rest = path.slice(m[0].length);
  return rest === "" ? "/" : rest.startsWith("/") ? rest : `/${rest}`;
}

/** Simple {placeholder} interpolation for dictionary strings. */
export function fmt(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}
