"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useI18n } from "@/i18n/client";

/** next/link that prefixes storefront paths with the current locale (/shop → /bn/shop). */
export function LLink({ href, ...props }: Omit<ComponentProps<typeof Link>, "href"> & { href: string }) {
  const { href: lh } = useI18n();
  const external = /^(https?:|mailto:|tel:|#)/.test(href);
  return <Link href={external ? href : lh(href)} {...props} />;
}
