import "server-only";
import { cache } from "react";
import { z } from "zod";
import { db } from "@/lib/db";

/**
 * Store settings live in the StoreSetting table so the owner can change them in
 * Admin → Settings without touching code. Missing keys fall back to these defaults.
 * Contact details default to empty and are hidden on the site until filled in.
 */
export const storeSchema = z.object({
  name: z.string().default("AMBR"),
  tagline: z.string().default("Above Ordinary."),
  description: z
    .string()
    .default("AMBR creates inspired perfumes and attars for people who love smelling good — thoughtfully composed, honestly priced, made for everyday life in Bangladesh."),
  legalName: z.string().default(""),
  tradeLicense: z.string().default(""),
  email: z.string().default(""),
  phone: z.string().default(""),
  whatsapp: z.string().default(""),
  address: z.string().default(""),
  hours: z.string().default(""),
});

export const socialSchema = z.object({
  facebook: z.string().default(""),
  instagram: z.string().default(""),
});

export const paymentSettingsSchema = z.object({
  cod: z.boolean().default(true),
  bkash: z.boolean().default(false),
  nagad: z.boolean().default(false),
  card: z.boolean().default(false),
  codNote: z.string().default("Pay in cash when your order arrives. We'll call to confirm your order before dispatch."),
});

export const seoSchema = z.object({
  defaultTitle: z.string().default("AMBR — Inspired Perfumes & Attars in Bangladesh"),
  defaultDescription: z
    .string()
    .default("Discover AMBR inspired perfumes and attars — thoughtfully composed fragrances at honest prices. Cash on delivery across Bangladesh."),
});

export const checkoutSchema = z.object({
  maxQtyPerItem: z.number().int().min(1).max(20).default(10),
  orderNote: z.string().default(""),
});

const schemas = {
  store: storeSchema,
  social: socialSchema,
  payments: paymentSettingsSchema,
  seo: seoSchema,
  checkout: checkoutSchema,
} as const;

export type SettingsKey = keyof typeof schemas;
export type Settings = { [K in SettingsKey]: z.infer<(typeof schemas)[K]> };
export const settingsSchemas = schemas;

export const getSettings = cache(async (): Promise<Settings> => {
  const rows = await db.storeSetting.findMany();
  const byKey = new Map(rows.map((r) => [r.key, r.value]));
  const out = {} as Record<string, unknown>;
  for (const [key, schema] of Object.entries(schemas)) {
    const parsed = schema.safeParse(byKey.get(key) ?? {});
    out[key] = parsed.success ? parsed.data : schema.parse({});
  }
  return out as Settings;
});

export function whatsappLink(number: string, message?: string) {
  const digits = number.replace(/\D/g, "");
  if (!digits) return null;
  const intl = digits.startsWith("880") ? digits : digits.startsWith("0") ? `88${digits}` : digits;
  return `https://wa.me/${intl}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}
