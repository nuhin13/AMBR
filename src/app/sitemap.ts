import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { siteUrl } from "@/lib/env";
import { visibleProduct } from "@/modules/catalog/queries";

export const revalidate = 3600;

/** Only published, visible content — hidden categories and draft products never appear. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, collections, families] = await Promise.all([
    db.product.findMany({ where: visibleProduct, select: { slug: true, updatedAt: true } }),
    db.category.findMany({ where: { status: "ACTIVE" }, select: { slug: true, updatedAt: true } }),
    db.collection.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
    db.fragranceFamily.findMany({ select: { slug: true } }),
  ]);
  const staticPaths = ["", "/shop", "/collections", "/discover", "/about", "/contact", "/faq", "/fragrance-guide", "/track-order", "/policies/shipping", "/policies/returns", "/policies/privacy", "/policies/terms"];
  return [
    ...staticPaths.map((p) => ({ url: `${siteUrl}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.6 })),
    ...categories.map((c) => ({ url: `${siteUrl}${c.slug === "perfumes" || c.slug === "attar" ? `/${c.slug}` : `/category/${c.slug}`}`, lastModified: c.updatedAt, priority: 0.8 })),
    ...collections.map((c) => ({ url: `${siteUrl}/collections/${c.slug}`, lastModified: c.updatedAt, priority: 0.6 })),
    ...families.map((f) => ({ url: `${siteUrl}/discover/${f.slug}`, priority: 0.5 })),
    ...products.map((p) => ({ url: `${siteUrl}/product/${p.slug}`, lastModified: p.updatedAt, priority: 0.9 })),
  ];
}
