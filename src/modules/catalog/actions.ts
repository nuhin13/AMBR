"use server";

import { z } from "zod";
import { getProductsByFamily, getProductsByOccasion, type ProductCardData } from "./queries";

const input = z.object({ kind: z.enum(["family", "occasion"]), slug: z.string().regex(/^[a-z0-9-]{1,60}$/) });

export async function discoverProductsAction(kind: string, slug: string): Promise<ProductCardData[]> {
  const parsed = input.safeParse({ kind, slug });
  if (!parsed.success) return [];
  return parsed.data.kind === "family" ? getProductsByFamily(parsed.data.slug, 4) : getProductsByOccasion(parsed.data.slug, 4);
}
