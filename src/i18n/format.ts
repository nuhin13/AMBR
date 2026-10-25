import { INTL_LOCALE, type Locale } from "./config";

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

/** Western digits → Bangla digits (prices, dates, counts on /bn). */
export const toBnDigits = (s: string) => s.replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
/** Bangla digits → Western digits (accepts phone numbers typed in Bangla). */
export const fromBnDigits = (s: string) => s.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));

export function formatNumber(n: number, locale: Locale) {
  const s = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(n);
  return locale === "bn" ? toBnDigits(s) : s;
}

/** ৳1,250 / ৳১,২৫০ — same value in both languages, Indian digit grouping as used in Bangladesh. */
export function formatPrice(poisha: number, locale: Locale) {
  const sign = poisha < 0 ? "−" : "";
  return `${sign}৳${formatNumber(Math.abs(poisha) / 100, locale)}`;
}

export function formatDateL(d: Date | string, locale: Locale, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], { timeZone: "Asia/Dhaka", numberingSystem: locale === "bn" ? "beng" : "latn", ...opts }).format(new Date(d));
}

export const formatDateTimeL = (d: Date | string, locale: Locale) =>
  formatDateL(d, locale, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

/** "10 ml" → "১০ মিলি" on /bn; other labels (e.g. "5 × 3 ml") get Bangla digits and units. */
export function formatSizeLabel(label: string, locale: Locale) {
  if (locale !== "bn") return label;
  return toBnDigits(label.replace(/\bml\b/gi, "মিলি"));
}
