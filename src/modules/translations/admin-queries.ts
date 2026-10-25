import "server-only";
import { db } from "@/lib/db";
import type { TrEntity, TrStatus } from "@/components/admin/translation-fields";

export const BN = "bn";

type Row = Record<string, unknown> & { status: "DRAFT" | "PUBLISHED" };

/** The Bangla translation row of one item, or null when it doesn't exist yet. */
export async function getBnTranslation(entity: TrEntity, parentId: string): Promise<Row | null> {
  const where = { locale: BN };
  switch (entity) {
    case "product": return db.productTranslation.findUnique({ where: { productId_locale: { productId: parentId, ...where } } });
    case "category": return db.categoryTranslation.findUnique({ where: { categoryId_locale: { categoryId: parentId, ...where } } });
    case "collection": return db.collectionTranslation.findUnique({ where: { collectionId_locale: { collectionId: parentId, ...where } } });
    case "banner": return db.bannerTranslation.findUnique({ where: { bannerId_locale: { bannerId: parentId, ...where } } });
    case "page": return db.contentPageTranslation.findUnique({ where: { pageId_locale: { pageId: parentId, ...where } } });
    case "faq": return db.faqTranslation.findUnique({ where: { faqId_locale: { faqId: parentId, ...where } } });
    case "article": return db.articleTranslation.findUnique({ where: { articleId_locale: { articleId: parentId, ...where } } });
  }
}

export const trStatus = (row: { status: string } | null | undefined): TrStatus => (row ? (row.status as TrStatus) : "MISSING");

/** Props for <TranslationEditor>: current Bangla values + status, as plain strings. */
export async function translationProps(entity: TrEntity, parentId: string) {
  const row = await getBnTranslation(entity, parentId);
  const values: Record<string, string> = {};
  if (row) for (const [k, v] of Object.entries(row)) if (typeof v === "string") values[k] = v;
  return { entity, parentId, status: trStatus(row), values };
}

export type TranslationItem = { entity: TrEntity; id: string; title: string; enState: string; bnStatus: TrStatus; href: string; updatedAt: Date | null };

/** Every translatable item with its Bangla status — powers the translations overview and the launch checklist. */
export async function listTranslationItems(): Promise<TranslationItem[]> {
  const tr = { where: { locale: BN }, select: { status: true, updatedAt: true } } as const;
  const [products, categories, collections, banners, pages, faqs, articles] = await Promise.all([
    db.product.findMany({ where: { status: { not: "ARCHIVED" } }, orderBy: { name: "asc" }, select: { id: true, name: true, status: true, translations: tr } }),
    db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true, status: true, translations: tr } }),
    db.collection.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true, status: true, translations: tr } }),
    db.banner.findMany({ orderBy: [{ placement: "asc" }, { sortOrder: "asc" }], select: { id: true, title: true, placement: true, isActive: true, translations: tr } }),
    db.contentPage.findMany({ orderBy: { slug: "asc" }, select: { id: true, slug: true, title: true, translations: tr } }),
    db.faqItem.findMany({ orderBy: [{ category: "asc" }, { sortOrder: "asc" }], select: { id: true, question: true, isActive: true, translations: tr } }),
    db.article.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, title: true, status: true, translations: tr } }),
  ]);
  const st = (t: { status: string; updatedAt: Date }[]) => ({ bnStatus: trStatus(t[0]), updatedAt: t[0]?.updatedAt ?? null });
  return [
    ...products.map((p) => ({ entity: "product" as const, id: p.id, title: p.name, enState: p.status.toLowerCase(), href: `/admin/products/${p.id}?lang=bn`, ...st(p.translations) })),
    ...categories.map((c) => ({ entity: "category" as const, id: c.id, title: c.name, enState: c.status === "ACTIVE" ? "live" : c.status.toLowerCase(), href: `/admin/categories?edit=${c.id}`, ...st(c.translations) })),
    ...collections.map((c) => ({ entity: "collection" as const, id: c.id, title: c.name, enState: c.status.toLowerCase(), href: `/admin/collections/${c.id}?lang=bn`, ...st(c.translations) })),
    ...banners.map((b) => ({ entity: "banner" as const, id: b.id, title: `${b.title} (${b.placement.toLowerCase().replace("_", " ")})`, enState: b.isActive ? "active" : "inactive", href: `/admin/content/banners?edit=${b.id}`, ...st(b.translations) })),
    ...pages.map((p) => ({ entity: "page" as const, id: p.id, title: p.title, enState: "published", href: `/admin/content/pages/${p.slug}?lang=bn`, ...st(p.translations) })),
    ...faqs.map((f) => ({ entity: "faq" as const, id: f.id, title: f.question, enState: f.isActive ? "active" : "hidden", href: `/admin/content/faq?edit=${f.id}`, ...st(f.translations) })),
    ...articles.map((a) => ({ entity: "article" as const, id: a.id, title: a.title, enState: a.status.toLowerCase(), href: `/admin/content/journal/${a.id}?lang=bn`, ...st(a.translations) })),
  ];
}
