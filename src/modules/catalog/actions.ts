"use server";

import { z } from "zod";
import { getRequestLocale } from "@/i18n/server";
import { listProducts, type ProductCardData } from "./queries";
import { parseFilters } from "./params";

/** Fragrance finder: returns the top matches for the chosen answers (same filters as the shop URL). */
export async function finderMatchesAction(params: Record<string, string>): Promise<{ items: ProductCardData[]; total: number }> {
  const clean = z.record(z.string(), z.string().max(80)).safeParse(params);
  if (!clean.success) return { items: [], total: 0 };
  const locale = await getRequestLocale();
  const { items, total } = await listProducts({ ...parseFilters(clean.data), pageSize: 4 }, locale);
  return { items, total };
}
