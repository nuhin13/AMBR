import "server-only";
import { cache } from "react";
import type { Gender, Intensity, Prisma, Season, VariantFormat } from "@prisma/client";
import { db } from "@/lib/db";
import type { Locale } from "@/i18n/config";
import { sellable } from "@/modules/inventory/service";

/**
 * Storefront read model. Every query here only returns products that are
 * PUBLISHED and belong to an ACTIVE category, so hidden/future categories can
 * never leak onto the site.
 *
 * Localisation: English lives on the base rows. For `bn`, a PUBLISHED translation is used
 * when one exists; otherwise English is returned and `lang` tells the UI to mark it lang="en".
 */
export const visibleProduct: Prisma.ProductWhereInput = {
  status: "PUBLISHED",
  category: { status: "ACTIVE" },
  variants: { some: { status: "ACTIVE" } },
};

const published = (locale: Locale) => ({ where: { locale, status: "PUBLISHED" as const } });
const bnName = <T extends { name: string; nameBn?: string | null }>(row: T, locale: Locale) => (locale === "bn" && row.nameBn ? row.nameBn : row.name);

const cardInclude = (locale: Locale) =>
  ({
    category: { select: { slug: true, name: true, type: true, translations: { ...published(locale), select: { name: true } } } },
    images: { orderBy: { sortOrder: "asc" }, take: 2, select: { url: true, alt: true } },
    variants: {
      where: { status: "ACTIVE" },
      orderBy: [{ format: "asc" }, { sizeMl: "asc" }],
      select: { id: true, label: true, sizeMl: true, format: true, price: true, compareAtPrice: true, inventory: { select: { onHand: true, reserved: true } } },
    },
    families: { orderBy: { isPrimary: "desc" }, select: { family: { select: { name: true, nameBn: true, slug: true } } } },
    translations: { ...published(locale), select: { name: true, shortDescription: true, inspirationNote: true } },
  }) satisfies Prisma.ProductInclude;

type CardRow = Prisma.ProductGetPayload<{ include: ReturnType<typeof cardInclude> }>;

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  /** Language the name/description are actually in (fallback → "en"). */
  lang: Locale;
  categoryName: string;
  categoryType: string;
  family: string | null;
  gender: Gender;
  intensity: Intensity;
  inspirationNote: string | null;
  images: { url: string; alt: string }[];
  fromPrice: number;
  fromCompareAt: number | null;
  formats: VariantFormat[];
  variants: { id: string; label: string; format: VariantFormat; price: number; compareAtPrice: number | null; available: number }[];
  inStock: boolean;
  badge: "bestSeller" | "new" | "sale" | null;
  isDemo: boolean;
  rating: { average: number; count: number } | null;
};

function toCard(p: CardRow, ratings: Map<string, { average: number; count: number }>, locale: Locale): ProductCardData {
  const tr = locale !== "en" ? p.translations[0] : undefined;
  const variants = p.variants.map((v) => ({ id: v.id, label: v.label, format: v.format, price: v.price, compareAtPrice: v.compareAtPrice, available: sellable(v.inventory) }));
  const cheapest = [...variants].sort((a, b) => a.price - b.price)[0];
  const onSale = variants.some((v) => v.compareAtPrice && v.compareAtPrice > v.price);
  return {
    id: p.id,
    slug: p.slug,
    name: tr?.name ?? p.name,
    shortDescription: tr?.shortDescription ?? p.shortDescription,
    lang: tr ? locale : "en",
    categoryName: p.category.translations[0]?.name ?? p.category.name,
    categoryType: p.category.type,
    family: p.families[0] ? bnName(p.families[0].family, locale) : null,
    gender: p.gender,
    intensity: p.intensity,
    inspirationNote: (tr?.inspirationNote ?? p.inspirationNote) || null,
    images: p.images,
    fromPrice: cheapest?.price ?? 0,
    fromCompareAt: cheapest?.compareAtPrice && cheapest.compareAtPrice > cheapest.price ? cheapest.compareAtPrice : null,
    formats: [...new Set(variants.map((v) => v.format))],
    variants,
    inStock: variants.some((v) => v.available > 0),
    badge: p.isBestSeller ? "bestSeller" : p.isNewArrival ? "new" : onSale ? "sale" : null,
    isDemo: p.isDemo,
    rating: ratings.get(p.id) ?? null,
  };
}

async function ratingsFor(productIds: string[]) {
  if (productIds.length === 0) return new Map<string, { average: number; count: number }>();
  const rows = await db.review.groupBy({
    by: ["productId"],
    where: { productId: { in: productIds }, status: "APPROVED" },
    _avg: { rating: true },
    _count: { _all: true },
  });
  return new Map(rows.map((r) => [r.productId, { average: Math.round((r._avg.rating ?? 0) * 10) / 10, count: r._count._all }]));
}

async function cards(locale: Locale, where: Prisma.ProductWhereInput, orderBy: Prisma.ProductOrderByWithRelationInput[] = [{ salesCount: "desc" }], take?: number) {
  const rows = await db.product.findMany({ where: { AND: [visibleProduct, where] }, include: cardInclude(locale), orderBy, take });
  const ratings = await ratingsFor(rows.map((r) => r.id));
  return rows.map((r) => toCard(r, ratings, locale));
}

// ───────────── Listing with filters ─────────────

export type SortKey = "popular" | "newest" | "price-asc" | "price-desc" | "best-sellers";

export type ProductFilters = {
  q?: string;
  category?: string;
  categoryTypes?: string[];
  collection?: string;
  families?: string[];
  occasions?: string[];
  seasons?: Season[];
  genders?: Gender[];
  formats?: VariantFormat[];
  intensities?: Intensity[];
  minPrice?: number; // poisha
  maxPrice?: number; // poisha
  inStock?: boolean;
  newArrivals?: boolean;
  sort?: SortKey;
  page?: number;
  pageSize?: number;
};

export async function listProducts(f: ProductFilters, locale: Locale = "en") {
  const and: Prisma.ProductWhereInput[] = [];
  if (f.category) and.push({ category: { slug: f.category } });
  if (f.categoryTypes?.length) and.push({ category: { type: { in: f.categoryTypes as never } } });
  if (f.collection) and.push({ collections: { some: { collection: { slug: f.collection, status: "PUBLISHED" } } } });
  if (f.families?.length) and.push({ families: { some: { family: { slug: { in: f.families } } } } });
  if (f.occasions?.length) and.push({ occasions: { some: { occasion: { slug: { in: f.occasions } } } } });
  if (f.seasons?.length) and.push({ seasons: { hasSome: f.seasons } });
  // "For him" also shows unisex scents; "unisex" shows only unisex.
  if (f.genders?.length) and.push({ gender: { in: f.genders.includes("UNISEX") ? f.genders : [...f.genders, "UNISEX"] } });
  if (f.formats?.length) and.push({ variants: { some: { status: "ACTIVE", format: { in: f.formats } } } });
  if (f.intensities?.length) and.push({ intensity: { in: f.intensities } });
  if (f.newArrivals) and.push({ isNewArrival: true });
  if (f.sort === "best-sellers") and.push({ isBestSeller: true });
  if (f.minPrice !== undefined || f.maxPrice !== undefined) {
    and.push({ variants: { some: { status: "ACTIVE", price: { gte: f.minPrice ?? 0, lte: f.maxPrice ?? Number.MAX_SAFE_INTEGER } } } });
  }
  if (f.q?.trim()) {
    const q = f.q.trim().slice(0, 80);
    const contains = { contains: q, mode: "insensitive" as const };
    // English and published Bangla names, notes and families are all searchable from either language.
    and.push({
      OR: [
        { name: contains },
        { shortDescription: contains },
        { translations: { some: { status: "PUBLISHED", OR: [{ name: contains }, { shortDescription: contains }] } } },
        { notes: { some: { note: { OR: [{ name: contains }, { nameBn: contains }] } } } },
        { families: { some: { family: { OR: [{ name: contains }, { nameBn: contains }] } } } },
        { occasions: { some: { occasion: { OR: [{ name: contains }, { nameBn: contains }] } } } },
        { category: { OR: [{ name: contains }, { translations: { some: { status: "PUBLISHED", name: contains } } }] } },
      ],
    });
  }

  // Catalogue size is small (hundreds of products), so price sorting is done in memory on the
  // filtered set; this keeps "from" price semantics exact (lowest active variant).
  let items = await cards(locale, { AND: and }, f.sort === "newest" ? [{ publishedAt: "desc" }, { createdAt: "desc" }] : [{ salesCount: "desc" }, { createdAt: "desc" }]);
  if (f.inStock) items = items.filter((i) => i.inStock);
  if (f.sort === "price-asc") items.sort((a, b) => a.fromPrice - b.fromPrice);
  if (f.sort === "price-desc") items.sort((a, b) => b.fromPrice - a.fromPrice);
  // Sold-out products sink to the end but stay visible.
  items.sort((a, b) => Number(b.inStock) - Number(a.inStock));

  const pageSize = f.pageSize ?? 12;
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, f.page ?? 1), pages);
  return { items: items.slice((page - 1) * pageSize, page * pageSize), total, page, pages };
}

export const getBestSellers = cache((locale: Locale, take = 8) => cards(locale, { isBestSeller: true }, [{ salesCount: "desc" }], take));
export const getNewArrivals = cache((locale: Locale, take = 8) => cards(locale, { isNewArrival: true }, [{ publishedAt: "desc" }], take));
export const getProductsByFamily = (locale: Locale, slug: string, take = 4) => cards(locale, { families: { some: { family: { slug } } } }, [{ salesCount: "desc" }], take);
export const getProductsByOccasion = (locale: Locale, slug: string, take = 4) => cards(locale, { occasions: { some: { occasion: { slug } } } }, [{ salesCount: "desc" }], take);

/** Discovery sets & bundles: products in active Mini / Gift categories. Empty → the section hides. */
export const getDiscoverySets = cache((locale: Locale, take = 3) => cards(locale, { category: { type: { in: ["MINI", "GIFT"] } } }, [{ isFeatured: "desc" }, { salesCount: "desc" }], take));

// ───────────── Product detail ─────────────

export const getProductBySlug = cache(async (slug: string, locale: Locale = "en") => {
  const p = await db.product.findFirst({
    where: { AND: [visibleProduct, { slug }] },
    include: {
      category: { include: { translations: published(locale) } },
      images: { orderBy: { sortOrder: "asc" } },
      variants: { where: { status: "ACTIVE" }, orderBy: [{ format: "asc" }, { sizeMl: "asc" }], include: { inventory: true } },
      families: { orderBy: { isPrimary: "desc" }, include: { family: true } },
      notes: { orderBy: { sortOrder: "asc" }, include: { note: true } },
      occasions: { include: { occasion: true }, orderBy: { occasion: { sortOrder: "asc" } } },
      performance: true,
      translations: published(locale),
    },
  });
  if (!p) return null;
  const [reviews, agg] = await Promise.all([
    db.review.findMany({
      where: { productId: p.id, status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { user: { select: { name: true } }, orderItem: { select: { variantLabel: true } } },
    }),
    db.review.aggregate({ where: { productId: p.id, status: "APPROVED" }, _avg: { rating: true }, _count: { _all: true } }),
  ]);
  const tr = locale !== "en" ? p.translations[0] : undefined;
  const noteName = (n: { name: string; nameBn: string | null }) => bnName(n, locale);
  const tiers = (t: "TOP" | "HEART" | "BASE") => p.notes.filter((n) => n.tier === t).map((n) => noteName(n.note));
  return {
    ...p,
    name: tr?.name ?? p.name,
    shortDescription: tr?.shortDescription ?? p.shortDescription,
    description: tr?.description ?? p.description,
    productType: tr?.productType ?? p.productType,
    applicationMethod: tr?.applicationMethod ?? p.applicationMethod,
    usageInstructions: tr?.usageInstructions ?? p.usageInstructions,
    safetyNote: tr?.safetyNote ?? p.safetyNote,
    inspirationNote: (tr?.inspirationNote ?? p.inspirationNote) || null,
    seoTitle: tr?.seoTitle ?? p.seoTitle,
    seoDescription: tr?.seoDescription ?? p.seoDescription,
    lang: (tr ? locale : "en") as Locale,
    categoryName: p.category.translations[0]?.name ?? p.category.name,
    familyNames: p.families.map((f) => ({ slug: f.family.slug, name: bnName(f.family, locale) })),
    occasionNames: p.occasions.map((o) => ({ slug: o.occasion.slug, name: bnName(o.occasion, locale) })),
    variants: p.variants.map((v) => ({ id: v.id, label: v.label, sizeMl: v.sizeMl, format: v.format, sku: v.sku, price: v.price, compareAtPrice: v.compareAtPrice, available: sellable(v.inventory) })),
    notesByTier: { top: tiers("TOP"), heart: tiers("HEART"), base: tiers("BASE") },
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      body: r.body,
      locale: r.locale,
      createdAt: r.createdAt,
      author: initialsName(r.user.name),
      variantLabel: r.orderItem.variantLabel,
    })),
    rating: agg._count._all > 0 ? { average: Math.round((agg._avg.rating ?? 0) * 10) / 10, count: agg._count._all } : null,
  };
});

export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;

/** "Rahim Ahmed" → "Rahim A." — reviews show first name + initial only. */
export function initialsName(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
}

export async function getRelatedProducts(locale: Locale, productId: string, categoryId: string, familySlugs: string[], take = 4) {
  const sameFamily = familySlugs.length
    ? await cards(locale, { id: { not: productId }, families: { some: { family: { slug: { in: familySlugs } } } } }, [{ salesCount: "desc" }], take)
    : [];
  if (sameFamily.length >= take) return sameFamily;
  const more = await cards(locale, { id: { notIn: [productId, ...sameFamily.map((p) => p.id)] }, categoryId }, [{ salesCount: "desc" }], take - sameFamily.length);
  return [...sameFamily, ...more];
}

// ───────────── Taxonomy ─────────────

export const getActiveCategories = cache(async (locale: Locale = "en") => {
  const rows = await db.category.findMany({
    where: { status: "ACTIVE", parentId: null },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: { where: visibleProduct } } }, translations: published(locale) },
  });
  return rows.map(({ translations, ...c }) => ({
    ...c,
    name: translations[0]?.name ?? c.name,
    tagline: translations[0]?.tagline ?? c.tagline,
    description: translations[0]?.description ?? c.description,
  }));
});

export const getCategoryBySlug = cache(async (slug: string, locale: Locale = "en") => {
  const c = await db.category.findFirst({ where: { slug, status: "ACTIVE" }, include: { translations: published(locale) } });
  if (!c) return null;
  const tr = c.translations[0];
  return { ...c, name: tr?.name ?? c.name, tagline: tr?.tagline ?? c.tagline, description: tr?.description ?? c.description, lang: (tr ? locale : "en") as Locale };
});

export const getFamilies = cache(async (locale: Locale = "en") => {
  const rows = await db.fragranceFamily.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: { where: { product: visibleProduct } } } } } });
  return rows.map((f) => ({ ...f, name: bnName(f, locale), description: locale === "bn" && f.descriptionBn ? f.descriptionBn : f.description }));
});

export const getOccasions = cache(async (locale: Locale = "en") => {
  const rows = await db.occasion.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: { where: { product: visibleProduct } } } } } });
  return rows.map((o) => ({ ...o, name: bnName(o, locale) }));
});

export const getPublishedCollections = cache(async (locale: Locale = "en") => {
  const rows = await db.collection.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }],
    include: { _count: { select: { products: { where: { product: visibleProduct } } } }, translations: published(locale) },
  });
  return rows.map(({ translations, ...c }) => ({ ...c, name: translations[0]?.name ?? c.name, description: translations[0]?.description ?? c.description }));
});

export const getCollectionBySlug = cache(async (slug: string, locale: Locale = "en") => {
  const c = await db.collection.findFirst({ where: { slug, status: "PUBLISHED" }, include: { translations: published(locale) } });
  if (!c) return null;
  const tr = c.translations[0];
  return { ...c, name: tr?.name ?? c.name, description: tr?.description ?? c.description, lang: (tr ? locale : "en") as Locale };
});

export async function getCollectionProducts(collectionId: string, locale: Locale = "en") {
  const links = await db.collectionProduct.findMany({ where: { collectionId }, orderBy: { sortOrder: "asc" }, select: { productId: true } });
  const ids = links.map((l) => l.productId);
  const list = await cards(locale, { id: { in: ids } });
  return list.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
}

export async function getPriceBounds() {
  const agg = await db.productVariant.aggregate({ where: { status: "ACTIVE", product: visibleProduct }, _min: { price: true }, _max: { price: true } });
  return { min: agg._min.price ?? 0, max: agg._max.price ?? 0 };
}
