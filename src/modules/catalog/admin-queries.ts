import "server-only";
import type { Prisma, ProductStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { sellable } from "@/modules/inventory/service";

export type ProductAdminFilters = { q?: string; category?: string; status?: string; demo?: string; stock?: string; page?: string };

export async function listProductsAdmin(f: ProductAdminFilters, pageSize = 30) {
  const and: Prisma.ProductWhereInput[] = [];
  if (f.q?.trim()) and.push({ OR: [{ name: { contains: f.q.trim(), mode: "insensitive" } }, { variants: { some: { sku: { contains: f.q.trim(), mode: "insensitive" } } } }] });
  if (f.category) and.push({ categoryId: f.category });
  if (f.status) and.push({ status: f.status as ProductStatus });
  else and.push({ status: { not: "ARCHIVED" } });
  if (f.demo === "1") and.push({ isDemo: true });
  const where: Prisma.ProductWhereInput = { AND: and };
  const total = await db.product.count({ where });
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, Number(f.page) || 1), pages);
  const rows = await db.product.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }],
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: {
      category: { select: { name: true, status: true } },
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      variants: { orderBy: { sizeMl: "asc" }, include: { inventory: true } },
      families: { where: { isPrimary: true }, include: { family: true } },
    },
  });
  const products = rows.map((p) => {
    const active = p.variants.filter((v) => v.status === "ACTIVE");
    const prices = active.map((v) => v.price);
    return {
      ...p,
      minPrice: prices.length ? Math.min(...prices) : null,
      maxPrice: prices.length ? Math.max(...prices) : null,
      sellable: active.reduce((s, v) => s + sellable(v.inventory), 0),
      soldOutSizes: active.filter((v) => sellable(v.inventory) === 0).length,
      lowSizes: active.filter((v) => { const s = sellable(v.inventory); return s > 0 && s <= (v.inventory?.lowStockThreshold ?? 5); }).length,
    };
  });
  const filtered = f.stock === "out" ? products.filter((p) => p.soldOutSizes > 0) : f.stock === "low" ? products.filter((p) => p.lowSizes > 0) : products;
  return { products: filtered, total, page, pages };
}

export async function getProductForEdit(id: string) {
  return db.product.findUnique({
    where: { id },
    include: {
      variants: { orderBy: [{ sortOrder: "asc" }, { sizeMl: "asc" }], include: { inventory: true, _count: { select: { orderItems: true } } } },
      images: { orderBy: { sortOrder: "asc" } },
      families: true,
      occasions: true,
      notes: { orderBy: { sortOrder: "asc" }, include: { note: true } },
      performance: true,
      _count: { select: { reviews: true } },
    },
  });
}

export async function productFormOptions() {
  const [categories, families, occasions] = await Promise.all([
    db.category.findMany({ where: { status: { not: "ARCHIVED" } }, orderBy: { sortOrder: "asc" } }),
    db.fragranceFamily.findMany({ orderBy: { sortOrder: "asc" } }),
    db.occasion.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  return { categories, families, occasions };
}

export async function listCategoriesAdmin() {
  return db.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });
}

export async function listCollectionsAdmin() {
  return db.collection.findMany({ orderBy: [{ sortOrder: "asc" }], include: { _count: { select: { products: true } } } });
}

export async function getCollectionForEdit(id: string) {
  return db.collection.findUnique({
    where: { id },
    include: { products: { orderBy: { sortOrder: "asc" }, include: { product: { select: { id: true, name: true, status: true, isDemo: true } } } } },
  });
}

export async function allProductsLite() {
  return db.product.findMany({ where: { status: { not: "ARCHIVED" } }, orderBy: { name: "asc" }, select: { id: true, name: true, status: true } });
}

export async function taxonomyAdmin() {
  const [families, occasions, notes] = await Promise.all([
    db.fragranceFamily.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: true } } } }),
    db.occasion.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: true } } } }),
    db.fragranceNote.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { products: true } } } }),
  ]);
  return { families, occasions, notes };
}
