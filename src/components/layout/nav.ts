import type { Dictionary } from "@/i18n/dictionaries/en";

type NavKey = keyof Dictionary["nav"];

/** Primary storefront navigation (paths are locale-less; links add /en or /bn). */
export const NAV_PRIMARY: { href: string; key: NavKey }[] = [
  { href: "/shop", key: "shop" },
  { href: "/shop?for=him", key: "forHim" },
  { href: "/shop?for=her", key: "forHer" },
  { href: "/shop?for=unisex", key: "unisex" },
  { href: "/attar", key: "attar" },
  { href: "/about", key: "story" },
];
