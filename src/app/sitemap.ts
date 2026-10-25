import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { siteUrl } from "@/lib/env";
import { LOCALES, localePath } from "@/i18n/config";
import { visibleProduct } from "@/modules/catalog/queries";

export const revalidate = 3600;

/** Published content only, one entry per page with en/bn hreflang alternates. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, collections, families, articles] = await Promise.all([
    db.product.findMany({ where: visibleProduct, select: { slug: true, updatedAt: true } }),
    db.category.findMany({ where: { status: "ACTIVE" }, select: { slug: true, updatedAt: true } }),
    db.collection.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
    db.fragranceFamily.findMany({ select: { slug: true } }),
    db.article.findMany({ where: { status: "PUBLISHED", publishedAt: { lte: new Date() } }, select: { slug: true, updatedAt: true } }),
  ]);
  const entry = (path: string, priority: number, lastModified?: Date): MetadataRoute.Sitemap[number] => ({
    url: `${siteUrl}${localePath("en", path)}`,
    lastModified,
    priority,
    alternates: { languages: Object.fromEntries([...LOCALES.map((l) => [l === "bn" ? "bn-BD" : "en", `${siteUrl}${localePath(l, path)}`]), ["x-default", `${siteUrl}${localePath("en", path)}`]]) },
  });
  const staticPaths = ["/", "/shop", "/shop?for=him", "/shop?for=her", "/shop?for=unisex", "/collections", "/discover", "/journal", "/about", "/contact", "/faq", "/fragrance-guide", "/track-order", "/policies/shipping", "/policies/returns", "/policies/privacy", "/policies/terms"];
  return [
    ...staticPaths.map((p) => entry(p, p === "/" ? 1 : 0.6)),
    ...categories.map((c) => entry(c.slug === "perfumes" || c.slug === "attar" ? `/${c.slug}` : `/category/${c.slug}`, 0.8, c.updatedAt)),
    ...collections.map((c) => entry(`/collections/${c.slug}`, 0.6, c.updatedAt)),
    ...families.map((f) => entry(`/discover/${f.slug}`, 0.5)),
    ...articles.map((a) => entry(`/journal/${a.slug}`, 0.5, a.updatedAt)),
    ...products.map((p) => entry(`/product/${p.slug}`, 0.9, p.updatedAt)),
  ];
}
