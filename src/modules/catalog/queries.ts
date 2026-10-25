import "server-only";
import { cache } from "react";
import type { Prisma, Season } from "@prisma/client";
import { db } from "@/lib/db";
import { sellable } from "@/modules/inventory/service";

/**
 * Storefront read model. Every query here only returns products that are
 * PUBLISHED and belong to an ACTIVE category, so hidden/future categories can
 * never leak onto the site.
 */
export const visibleProduct: Prisma.ProductWhereInput = {
  status: "PUBLISHED",
  category: { status: "ACTIVE" },
  variants: { some: { status: "ACTIVE" } },
};

const cardInclude = {
  category: { select: { slug: true, name: true, type: true } },
  images: { orderBy: { sortOrder: "asc" }, take: 2, select: { url: true, alt: true } },
  variants: {
    where: { status: "ACTIVE" },
    orderBy: { sizeMl: "asc" },
    select: { id: true, label: true, sizeMl: true, price: true, compareAtPrice: true, inventory: { select: { onHand: true, reserved: true } } },
  },
  families: { orderBy: { isPrimary: "desc" }, select: { family: { select: { name: true, slug: true } } } },
} satisfies Prisma.ProductInclude;

type CardRow = Prisma.ProductGetPayload<{ include: typeof cardInclude }>;

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  categoryName: string;
  categoryType: string;
  family: string | null;
  images: { url: string; alt: string }[];
  fromPrice: number;
  fromCompareAt: number | null;
  variants: { id: string; label: string; price: number; compareAtPrice: number | null; available: number }[];
  inStock: boolean;
  badge: "Best Seller" | "New" | "Sale" | null;
  isDemo: boolean;
  rating: { average: number; count: number } | null;
};

function toCard(p: CardRow, ratings: Map<string, { average: number; count: number }>): ProductCardData {
  const variants = p.variants.map((v) => ({ id: v.id, label: v.label, price: v.price, compareAtPrice: v.compareAtPrice, available: sellable(v.inventory) }));
  const cheapest = [...variants].sort((a, b) => a.price - b.price)[0];
  const onSale = variants.some((v) => v.compareAtPrice && v.compareAtPrice > v.price);
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    shortDescription: p.shortDescription,
    categoryName: p.category.name,
    categoryType: p.category.type,
    family: p.families[0]?.family.name ?? null,
    images: p.images,
    fromPrice: cheapest?.price ?? 0,
    fromCompareAt: cheapest?.compareAtPrice && cheapest.compareAtPrice > cheapest.price ? cheapest.compareAtPrice : null,
    variants,
    inStock: variants.some((v) => v.available > 0),
    badge: p.isBestSeller ? "Best Seller" : p.isNewArrival ? "New" : onSale ? "Sale" : null,
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

async function cards(where: Prisma.ProductWhereInput, orderBy: Prisma.ProductOrderByWithRelationInput[] = [{ salesCount: "desc" }], take?: number) {
  const rows = await db.product.findMany({ where: { AND: [visibleProduct, where] }, include: cardInclude, orderBy, take });
  const ratings = await ratingsFor(rows.map((r) => r.id));
  return rows.map((r) => toCard(r, ratings));
}

// ───────────── Listing with filters ─────────────

export type SortKey = "popular" | "newest" | "price-asc" | "price-desc" | "best-sellers";

export type ProductFilters = {
  q?: string;
  category?: string;
  collection?: string;
  families?: string[];
  occasions?: string[];
  seasons?: Season[];
  minPrice?: number; // poisha
  maxPrice?: number; // poisha
  inStock?: boolean;
  newArrivals?: boolean;
  sort?: SortKey;
  page?: number;
  pageSize?: number;
};

export async function listProducts(f: ProductFilters) {
  const and: Prisma.ProductWhereInput[] = [];
  if (f.category) and.push({ category: { slug: f.category } });
  if (f.collection) and.push({ collections: { some: { collection: { slug: f.collection, status: "PUBLISHED" } } } });
  if (f.families?.length) and.push({ families: { some: { family: { slug: { in: f.families } } } } });
  if (f.occasions?.length) and.push({ occasions: { some: { occasion: { slug: { in: f.occasions } } } } });
  if (f.seasons?.length) and.push({ seasons: { hasSome: f.seasons } });
  if (f.newArrivals) and.push({ isNewArrival: true });
  if (f.sort === "best-sellers") and.push({ isBestSeller: true });
  if (f.minPrice !== undefined || f.maxPrice !== undefined) {
    and.push({ variants: { some: { status: "ACTIVE", price: { gte: f.minPrice ?? 0, lte: f.maxPrice ?? Number.MAX_SAFE_INTEGER } } } });
  }
  if (f.q?.trim()) {
    const q = f.q.trim().slice(0, 80);
    and.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { shortDescription: { contains: q, mode: "insensitive" } },
        { notes: { some: { note: { name: { contains: q, mode: "insensitive" } } } } },
        { families: { some: { family: { name: { contains: q, mode: "insensitive" } } } } },
        { category: { name: { contains: q, mode: "insensitive" } } },
      ],
    });
  }

  // Catalogue size is small (hundreds of products), so price sorting is done in memory on the
  // filtered set; this keeps "from" price semantics exact (lowest active variant).
  let items = await cards({ AND: and }, f.sort === "newest" ? [{ publishedAt: "desc" }, { createdAt: "desc" }] : [{ salesCount: "desc" }, { createdAt: "desc" }]);
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

export const getBestSellers = cache((take = 8) => cards({ isBestSeller: true }, [{ salesCount: "desc" }], take));
export const getNewArrivals = cache((take = 8) => cards({ isNewArrival: true }, [{ publishedAt: "desc" }], take));
export const getProductsByFamily = (slug: string, take = 4) => cards({ families: { some: { family: { slug } } } }, [{ salesCount: "desc" }], take);
export const getProductsByOccasion = (slug: string, take = 4) => cards({ occasions: { some: { occasion: { slug } } } }, [{ salesCount: "desc" }], take);

// ───────────── Product detail ─────────────

export const getProductBySlug = cache(async (slug: string) => {
  const p = await db.product.findFirst({
    where: { AND: [visibleProduct, { slug }] },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
      variants: { where: { status: "ACTIVE" }, orderBy: { sizeMl: "asc" }, include: { inventory: true } },
      families: { orderBy: { isPrimary: "desc" }, include: { family: true } },
      notes: { orderBy: { sortOrder: "asc" }, include: { note: true } },
      occasions: { include: { occasion: true }, orderBy: { occasion: { sortOrder: "asc" } } },
      performance: true,
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
  const tiers = (t: "TOP" | "HEART" | "BASE") => p.notes.filter((n) => n.tier === t).map((n) => n.note.name);
  return {
    ...p,
    variants: p.variants.map((v) => ({ id: v.id, label: v.label, sizeMl: v.sizeMl, sku: v.sku, price: v.price, compareAtPrice: v.compareAtPrice, available: sellable(v.inventory) })),
    notesByTier: { top: tiers("TOP"), heart: tiers("HEART"), base: tiers("BASE") },
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      body: r.body,
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

export async function getRelatedProducts(productId: string, categoryId: string, familySlugs: string[], take = 4) {
  const sameFamily = familySlugs.length
    ? await cards({ id: { not: productId }, families: { some: { family: { slug: { in: familySlugs } } } } }, [{ salesCount: "desc" }], take)
    : [];
  if (sameFamily.length >= take) return sameFamily;
  const more = await cards({ id: { notIn: [productId, ...sameFamily.map((p) => p.id)] }, categoryId }, [{ salesCount: "desc" }], take - sameFamily.length);
  return [...sameFamily, ...more];
}

// ───────────── Taxonomy ─────────────

export const getActiveCategories = cache(() =>
  db.category.findMany({
    where: { status: "ACTIVE", parentId: null },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: { where: visibleProduct } } } },
  }),
);

export const getCategoryBySlug = cache((slug: string) => db.category.findFirst({ where: { slug, status: "ACTIVE" } }));

export const getFamilies = cache(() =>
  db.fragranceFamily.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: { where: { product: visibleProduct } } } } } }),
);

export const getOccasions = cache(() =>
  db.occasion.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: { where: { product: visibleProduct } } } } } }),
);

export const getPublishedCollections = cache(() =>
  db.collection.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }],
    include: { _count: { select: { products: { where: { product: visibleProduct } } } } },
  }),
);

export const getCollectionBySlug = cache((slug: string) => db.collection.findFirst({ where: { slug, status: "PUBLISHED" } }));

export async function getCollectionProducts(collectionId: string) {
  const links = await db.collectionProduct.findMany({ where: { collectionId }, orderBy: { sortOrder: "asc" }, select: { productId: true } });
  const ids = links.map((l) => l.productId);
  const list = await cards({ id: { in: ids } });
  return list.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
}

export async function getPriceBounds() {
  const agg = await db.productVariant.aggregate({ where: { status: "ACTIVE", product: visibleProduct }, _min: { price: true }, _max: { price: true } });
  return { min: agg._min.price ?? 0, max: agg._max.price ?? 0 };
}

export const SEASON_LABELS: Record<Season, string> = { SUMMER: "Summer", MONSOON: "Monsoon", WINTER: "Winter", ALL_YEAR: "All year" };
