"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { sanitizeRichText, textToHtml } from "@/lib/sanitize";
import { toActionError, UserFacingError, type ActionResult } from "@/lib/action-result";
import { requirePermission } from "@/modules/auth/rbac";
import { audit } from "@/modules/audit/log";
import { deleteStoredImage, storeImage } from "@/modules/media/storage";
import { fdAll, formObject, revalidateStore, zBool, zInt, zOptDate, zOptInt, zOptText, zText } from "@/modules/reports/form-data";

// ───────────── Products ─────────────

const variantRow = z.object({
  id: z.string().optional(),
  sizeMl: z.coerce.number().int().min(1, "Size must be at least 1 ml").max(1000),
  label: z.string().trim().max(30).optional(),
  sku: z.string().trim().min(2, "SKU is required").max(60).regex(/^[A-Za-z0-9._-]+$/, "SKU: letters, numbers, dot, dash, underscore"),
  price: z.coerce.number().positive("Price must be more than 0").max(1_000_000),
  compareAtPrice: z.preprocess((v) => (v === "" || v === null || v === undefined ? undefined : v), z.coerce.number().positive().max(1_000_000).optional()),
  status: z.enum(["ACTIVE", "ARCHIVED"]).default("ACTIVE"),
  format: z.enum(["SPRAY", "ROLL_ON", "OIL"]).default("SPRAY"),
  openingStock: z.preprocess((v) => (v === "" || v === undefined ? 0 : v), z.coerce.number().int().min(0).max(100000)),
  lowStockThreshold: z.preprocess((v) => (v === "" || v === undefined ? 5 : v), z.coerce.number().int().min(0).max(10000)),
});

const productSchema = z
  .object({
    id: z.string().optional(),
    name: zText(120).min(2, "Name is required"),
    slug: zOptText(80),
    categoryId: z.string().min(1, "Choose a category"),
    shortDescription: zText(220).min(5, "Add a one-line description"),
    description: z.string().trim().max(20000).min(10, "Add a description"),
    productType: zText(60).min(2, "Product type is required (e.g. Perfume · Spray)"),
    intensity: z.enum(["LIGHT", "MODERATE", "STRONG"]),
    gender: z.enum(["MASCULINE", "FEMININE", "UNISEX"]).default("UNISEX"),
    applicationMethod: zOptText(60),
    usageInstructions: zOptText(1000),
    safetyNote: zOptText(1000),
    inspirationNote: zOptText(300),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
    isBestSeller: zBool,
    isNewArrival: zBool,
    isFeatured: zBool,
    seoTitle: zOptText(70),
    seoDescription: zOptText(170),
    notesTop: zOptText(500),
    notesHeart: zOptText(500),
    notesBase: zOptText(500),
    primaryFamily: zOptText(40),
    longevity: zOptText(80),
    projection: zOptText(80),
    testMethodNote: zOptText(500),
    testedAt: zOptDate,
    variantsJson: z.string(),
  })
  .superRefine((v, ctx) => {
    if ((v.longevity || v.projection) && (!v.testMethodNote || !v.testedAt)) {
      ctx.addIssue({ code: "custom", path: ["testMethodNote"], message: "Longevity/projection can only be shown with a test method note and test date — never estimates." });
    }
  });

const splitNotes = (s?: string) => (s ?? "").split(/[,\n·]/).map((x) => x.trim()).filter(Boolean).slice(0, 12);

export async function saveProductAction(fd: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requirePermission("catalog:manage");
    const input = productSchema.parse(formObject(fd));
    const variants = z.array(variantRow).min(1, "Add at least one size").max(10).parse(JSON.parse(input.variantsJson || "[]"));
    const sizes = variants.map((v) => v.sizeMl);
    if (new Set(sizes).size !== sizes.length) throw new UserFacingError("Each size can only appear once.");
    const skus = variants.map((v) => v.sku.toUpperCase());
    if (new Set(skus).size !== skus.length) throw new UserFacingError("SKUs must be unique.");
    for (const v of variants) if (v.compareAtPrice !== undefined && v.compareAtPrice <= v.price) throw new UserFacingError(`Compare-at price for ${v.sizeMl} ml must be higher than its price (or leave it empty).`);
    if (input.status === "PUBLISHED" && !variants.some((v) => v.status === "ACTIVE")) throw new UserFacingError("A published product needs at least one active size.");

    const families = fdAll(fd, "families");
    const occasions = fdAll(fd, "occasions");
    const seasons = fdAll(fd, "seasons").filter((s) => ["SUMMER", "MONSOON", "WINTER", "ALL_YEAR"].includes(s)) as ("SUMMER" | "MONSOON" | "WINTER" | "ALL_YEAR")[];
    const slug = slugify(input.slug || input.name);
    if (!slug) throw new UserFacingError("Please give the product a name with letters or numbers.");
    const clash = await db.product.findFirst({ where: { slug, id: input.id ? { not: input.id } : undefined } });
    if (clash) throw new UserFacingError(`The URL “${slug}” is already used by ${clash.name}. Choose another slug.`);
    const skuClash = await db.productVariant.findFirst({ where: { sku: { in: skus, mode: "insensitive" }, productId: input.id ? { not: input.id } : undefined }, include: { product: true } });
    if (skuClash) throw new UserFacingError(`SKU ${skuClash.sku} is already used by ${skuClash.product.name}.`);

    const description = /<[a-z][\s\S]*>/i.test(input.description) ? sanitizeRichText(input.description) : textToHtml(input.description);
    const before = input.id ? await db.product.findUnique({ where: { id: input.id }, include: { variants: true } }) : null;
    if (input.id && !before) throw new UserFacingError("Product not found.");

    const data = {
      name: input.name,
      slug,
      categoryId: input.categoryId,
      shortDescription: input.shortDescription,
      description,
      productType: input.productType,
      intensity: input.intensity,
      gender: input.gender,
      seasons,
      applicationMethod: input.applicationMethod ?? null,
      usageInstructions: input.usageInstructions ?? null,
      safetyNote: input.safetyNote ?? null,
      inspirationNote: input.inspirationNote ?? null,
      status: input.status,
      isBestSeller: input.isBestSeller,
      isNewArrival: input.isNewArrival,
      isFeatured: input.isFeatured,
      seoTitle: input.seoTitle ?? null,
      seoDescription: input.seoDescription ?? null,
      publishedAt: input.status === "PUBLISHED" ? (before?.publishedAt ?? new Date()) : before?.publishedAt ?? null,
    };

    const id = await db.$transaction(async (tx) => {
      const product = input.id ? await tx.product.update({ where: { id: input.id }, data }) : await tx.product.create({ data });

      await tx.productFamily.deleteMany({ where: { productId: product.id } });
      if (families.length) {
        const primary = input.primaryFamily && families.includes(input.primaryFamily) ? input.primaryFamily : families[0];
        await tx.productFamily.createMany({ data: families.map((familyId) => ({ productId: product.id, familyId, isPrimary: familyId === primary })) });
      }
      await tx.productOccasion.deleteMany({ where: { productId: product.id } });
      if (occasions.length) await tx.productOccasion.createMany({ data: occasions.map((occasionId) => ({ productId: product.id, occasionId })) });

      await tx.productNote.deleteMany({ where: { productId: product.id } });
      for (const [tier, list] of [["TOP", splitNotes(input.notesTop)], ["HEART", splitNotes(input.notesHeart)], ["BASE", splitNotes(input.notesBase)]] as const) {
        for (const [i, name] of list.entries()) {
          const s = slugify(name);
          if (!s) continue;
          const note = await tx.fragranceNote.upsert({ where: { slug: s }, create: { slug: s, name }, update: {} });
          await tx.productNote.upsert({
            where: { productId_noteId_tier: { productId: product.id, noteId: note.id, tier } },
            create: { productId: product.id, noteId: note.id, tier, sortOrder: i },
            update: { sortOrder: i },
          });
        }
      }

      if (input.longevity || input.projection) {
        const perf = { longevity: input.longevity ?? null, projection: input.projection ?? null, testMethodNote: input.testMethodNote!, testedAt: input.testedAt! };
        await tx.productPerformance.upsert({ where: { productId: product.id }, create: { productId: product.id, ...perf }, update: perf });
      } else {
        await tx.productPerformance.deleteMany({ where: { productId: product.id } });
      }

      // Variants: update existing, create new, archive/delete removed.
      const keepIds = new Set(variants.filter((v) => v.id).map((v) => v.id!));
      const existing = await tx.productVariant.findMany({ where: { productId: product.id }, include: { _count: { select: { orderItems: true } } } });
      for (const ex of existing) {
        if (keepIds.has(ex.id)) continue;
        if (ex._count.orderItems > 0) {
          // Sizes with past orders are kept (order history references them) but archived.
          await tx.productVariant.update({ where: { id: ex.id }, data: { status: "ARCHIVED" } });
          const reAdded = variants.find((v) => !v.id && v.sizeMl === ex.sizeMl);
          if (reAdded) throw new UserFacingError(`${ex.sizeMl} ml already exists as an archived size with past orders. Keep that row and set it back to Active instead of adding it again.`);
        } else await tx.productVariant.delete({ where: { id: ex.id } });
      }
      const retained = existing.filter((ex) => !keepIds.has(ex.id) && ex._count.orderItems > 0);
      // Free up sizes first to avoid transient unique collisions when sizes are swapped.
      for (const [i, v] of variants.entries()) if (v.id) await tx.productVariant.update({ where: { id: v.id }, data: { sizeMl: 100000 + i } });
      for (const v of variants) if (!v.id && retained.some((r) => r.sizeMl === v.sizeMl)) throw new UserFacingError(`${v.sizeMl} ml already exists as an archived size.`);
      for (const [i, v] of variants.entries()) {
        const row = {
          sizeMl: v.sizeMl,
          label: v.label?.trim() || `${v.sizeMl} ml`,
          format: v.format,
          sku: v.sku.toUpperCase(),
          price: Math.round(v.price * 100),
          compareAtPrice: v.compareAtPrice !== undefined ? Math.round(v.compareAtPrice * 100) : null,
          status: v.status,
          sortOrder: i,
        };
        if (v.id) {
          const owned = existing.find((e) => e.id === v.id);
          if (!owned) throw new UserFacingError("A size no longer belongs to this product. Reload and try again.");
          await tx.productVariant.update({ where: { id: v.id }, data: row });
          await tx.inventory.upsert({ where: { variantId: v.id }, create: { variantId: v.id, lowStockThreshold: v.lowStockThreshold }, update: { lowStockThreshold: v.lowStockThreshold } });
        } else {
          const created = await tx.productVariant.create({
            data: { ...row, productId: product.id, inventory: { create: { onHand: v.openingStock, lowStockThreshold: v.lowStockThreshold } } },
          });
          if (v.openingStock > 0) {
            await tx.inventoryMovement.create({ data: { variantId: created.id, type: "PURCHASE_IN", quantity: v.openingStock, onHandAfter: v.openingStock, reservedAfter: 0, userId: user.id, reason: "Opening stock" } });
          }
        }
      }
      await audit({ actorId: user.id, action: input.id ? "product.update" : "product.create", entityType: "Product", entityId: product.id, before: before ? { name: before.name, status: before.status, variants: before.variants.map((v) => ({ sku: v.sku, price: v.price, status: v.status })) } : undefined, after: { name: data.name, status: data.status, variants: variants.map((v) => ({ sku: v.sku, price: v.price, status: v.status })) } }, tx);
      return product.id;
    }, { timeout: 20_000 });

    revalidateStore();
    return { ok: true, data: { id }, message: input.id ? "Product saved." : "Product created." };
  } catch (e) {
    if (e instanceof SyntaxError) return { ok: false, error: "Sizes could not be read. Reload and try again." };
    return toActionError(e);
  }
}

export async function deleteProductAction(fd: FormData): Promise<ActionResult> {
  try {
    const user = await requirePermission("catalog:manage");
    const id = z.string().parse(fd.get("id"));
    const p = await db.product.findUnique({ where: { id }, include: { variants: { include: { _count: { select: { orderItems: true } } } } } });
    if (!p) throw new UserFacingError("Product not found.");
    const hasOrders = p.variants.some((v) => v._count.orderItems > 0);
    if (hasOrders) {
      await db.product.update({ where: { id }, data: { status: "ARCHIVED" } });
      await audit({ actorId: user.id, action: "product.archive", entityType: "Product", entityId: id, before: { status: p.status }, after: { status: "ARCHIVED" } });
      revalidateStore();
      return { ok: true, message: `${p.name} has past orders, so it was archived instead of deleted.` };
    }
    const images = await db.productImage.findMany({ where: { productId: id }, select: { storageId: true } });
    await db.product.delete({ where: { id } });
    await Promise.all(images.map((i) => deleteStoredImage(i.storageId)));
    await audit({ actorId: user.id, action: "product.delete", entityType: "Product", entityId: id, before: { name: p.name } });
    revalidateStore();
    return { ok: true, message: `${p.name} deleted.` };
  } catch (e) {
    return toActionError(e);
  }
}

export async function setProductStatusAction(fd: FormData): Promise<ActionResult> {
  try {
    const user = await requirePermission("catalog:manage");
    const { id, status } = z.object({ id: z.string(), status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]) }).parse(formObject(fd));
    const p = await db.product.findUnique({ where: { id }, include: { variants: { where: { status: "ACTIVE" } } } });
    if (!p) throw new UserFacingError("Product not found.");
    if (status === "PUBLISHED" && p.variants.length === 0) throw new UserFacingError("Add at least one active size before publishing.");
    await db.product.update({ where: { id }, data: { status, publishedAt: status === "PUBLISHED" ? (p.publishedAt ?? new Date()) : p.publishedAt } });
    await audit({ actorId: user.id, action: "product.status", entityType: "Product", entityId: id, before: { status: p.status }, after: { status } });
    revalidateStore();
    return { ok: true, message: `${p.name} is now ${status.toLowerCase()}.` };
  } catch (e) {
    return toActionError(e);
  }
}

// ───────────── Product images ─────────────

export async function uploadProductImagesAction(fd: FormData): Promise<ActionResult> {
  try {
    const user = await requirePermission("catalog:manage");
    const productId = z.string().parse(fd.get("productId"));
    const alt = (fd.get("alt") as string | null)?.trim() || null;
    const files = fd.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
    if (files.length === 0) throw new UserFacingError("Choose at least one image.");
    if (files.length > 10) throw new UserFacingError("Upload up to 10 images at a time.");
    const product = await db.product.findUnique({ where: { id: productId }, include: { images: { orderBy: { sortOrder: "desc" }, take: 1 } } });
    if (!product) throw new UserFacingError("Product not found.");
    let order = (product.images[0]?.sortOrder ?? -1) + 1;
    for (const file of files) {
      const stored = await storeImage(file, "products");
      await db.productImage.create({ data: { productId, url: stored.url, storageId: stored.storageId, width: stored.width, height: stored.height, alt: alt ?? `${product.name} — AMBR`, sortOrder: order++ } });
    }
    await audit({ actorId: user.id, action: "product.images.upload", entityType: "Product", entityId: productId, after: { count: files.length } });
    revalidateStore();
    return { ok: true, message: `${files.length} image${files.length === 1 ? "" : "s"} uploaded.` };
  } catch (e) {
    return toActionError(e);
  }
}

export async function updateProductImageAction(fd: FormData): Promise<ActionResult> {
  try {
    const user = await requirePermission("catalog:manage");
    const { id, alt, op } = z.object({ id: z.string(), alt: zOptText(200), op: z.enum(["alt", "up", "down", "delete", "first"]) }).parse(formObject(fd));
    const img = await db.productImage.findUnique({ where: { id } });
    if (!img) throw new UserFacingError("Image not found.");
    if (op === "delete") {
      await db.productImage.delete({ where: { id } });
      await deleteStoredImage(img.storageId);
    } else if (op === "alt") {
      await db.productImage.update({ where: { id }, data: { alt: alt || img.alt } });
    } else {
      const all = await db.productImage.findMany({ where: { productId: img.productId }, orderBy: { sortOrder: "asc" } });
      const idx = all.findIndex((x) => x.id === id);
      const next = [...all];
      next.splice(idx, 1);
      const to = op === "first" ? 0 : op === "up" ? Math.max(0, idx - 1) : Math.min(all.length - 1, idx + 1);
      next.splice(to, 0, img);
      await db.$transaction(next.map((x, i) => db.productImage.update({ where: { id: x.id }, data: { sortOrder: i } })));
    }
    await audit({ actorId: user.id, action: `product.image.${op}`, entityType: "Product", entityId: img.productId, after: { imageId: id } });
    revalidateStore();
    return { ok: true, message: op === "delete" ? "Image removed." : "Image updated." };
  } catch (e) {
    return toActionError(e);
  }
}

// ───────────── Categories ─────────────

const categorySchema = z.object({
  id: z.string().optional(),
  name: zText(60).min(2),
  slug: zOptText(60),
  type: z.enum(["PERFUME", "ATTAR", "BODY_MIST", "CAR", "HOME", "PET", "MINI", "GIFT", "OTHER"]),
  tagline: zOptText(120),
  description: zOptText(600),
  imageAlt: zOptText(160),
  status: z.enum(["ACTIVE", "HIDDEN", "ARCHIVED"]),
  sortOrder: zInt(0, 999),
  removeImage: zBool.optional(),
});

export async function saveCategoryAction(fd: FormData): Promise<ActionResult> {
  try {
    const user = await requirePermission("catalog:manage");
    const input = categorySchema.parse(formObject(fd));
    const slug = slugify(input.slug || input.name);
    const clash = await db.category.findFirst({ where: { slug, id: input.id ? { not: input.id } : undefined } });
    if (clash) throw new UserFacingError(`The URL “${slug}” is already used.`);
    if (input.id && ["perfumes", "attar"].includes((await db.category.findUnique({ where: { id: input.id } }))?.slug ?? "") && slug !== (await db.category.findUnique({ where: { id: input.id } }))?.slug) {
      throw new UserFacingError("The Perfumes and Attar URLs are fixed because the main menu links to them.");
    }
    const file = fd.get("image");
    let imageUrl: string | null | undefined;
    if (file instanceof File && file.size > 0) imageUrl = (await storeImage(file, "categories")).url;
    else if (input.removeImage) imageUrl = null;
    const before = input.id ? await db.category.findUnique({ where: { id: input.id } }) : null;
    const data = { name: input.name, slug, type: input.type, tagline: input.tagline ?? null, description: input.description ?? null, imageAlt: input.imageAlt ?? null, status: input.status, sortOrder: input.sortOrder, ...(imageUrl !== undefined ? { imageUrl } : {}) };
    const cat = input.id ? await db.category.update({ where: { id: input.id }, data }) : await db.category.create({ data });
    await audit({ actorId: user.id, action: input.id ? "category.update" : "category.create", entityType: "Category", entityId: cat.id, before, after: data });
    revalidateStore();
    return { ok: true, message: `${cat.name} saved${cat.status === "ACTIVE" ? " — visible on the site" : " — hidden from the site"}.` };
  } catch (e) {
    return toActionError(e);
  }
}

export async function setCategoryStatusAction(fd: FormData): Promise<ActionResult> {
  try {
    const user = await requirePermission("catalog:manage");
    const { id, status } = z.object({ id: z.string(), status: z.enum(["ACTIVE", "HIDDEN"]) }).parse(formObject(fd));
    const before = await db.category.findUnique({ where: { id } });
    if (!before) throw new UserFacingError("Category not found.");
    await db.category.update({ where: { id }, data: { status } });
    await audit({ actorId: user.id, action: "category.status", entityType: "Category", entityId: id, before: { status: before.status }, after: { status } });
    revalidateStore();
    return { ok: true, message: status === "ACTIVE" ? `${before.name} is now live on the site.` : `${before.name} is now hidden from the site.` };
  } catch (e) {
    return toActionError(e);
  }
}

// ───────────── Collections ─────────────

const collectionSchema = z.object({
  id: z.string().optional(),
  name: zText(80).min(2),
  slug: zOptText(80),
  description: zOptText(400),
  imageAlt: zOptText(160),
  status: z.enum(["PUBLISHED", "HIDDEN"]),
  isFeatured: zBool,
  sortOrder: zInt(0, 999),
  removeImage: zBool.optional(),
});

export async function saveCollectionAction(fd: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requirePermission("catalog:manage");
    const input = collectionSchema.parse(formObject(fd));
    const productIds = fdAll(fd, "productIds");
    const slug = slugify(input.slug || input.name.replace("৳", "bdt "));
    const clash = await db.collection.findFirst({ where: { slug, id: input.id ? { not: input.id } : undefined } });
    if (clash) throw new UserFacingError(`The URL “${slug}” is already used.`);
    const file = fd.get("image");
    let imageUrl: string | null | undefined;
    if (file instanceof File && file.size > 0) imageUrl = (await storeImage(file, "collections")).url;
    else if (input.removeImage) imageUrl = null;
    const data = { name: input.name, slug, description: input.description ?? null, imageAlt: input.imageAlt ?? null, status: input.status, isFeatured: input.isFeatured, sortOrder: input.sortOrder, ...(imageUrl !== undefined ? { imageUrl } : {}) };
    const id = await db.$transaction(async (tx) => {
      const c = input.id ? await tx.collection.update({ where: { id: input.id }, data }) : await tx.collection.create({ data });
      await tx.collectionProduct.deleteMany({ where: { collectionId: c.id } });
      const unique = [...new Set(productIds)];
      if (unique.length) await tx.collectionProduct.createMany({ data: unique.map((productId, i) => ({ collectionId: c.id, productId, sortOrder: i })) });
      await audit({ actorId: user.id, action: input.id ? "collection.update" : "collection.create", entityType: "Collection", entityId: c.id, after: { ...data, products: unique.length } }, tx);
      return c.id;
    });
    revalidateStore();
    return { ok: true, data: { id }, message: "Collection saved." };
  } catch (e) {
    return toActionError(e);
  }
}

export async function deleteCollectionAction(fd: FormData): Promise<ActionResult> {
  try {
    const user = await requirePermission("catalog:manage");
    const id = z.string().parse(fd.get("id"));
    const c = await db.collection.delete({ where: { id } });
    await audit({ actorId: user.id, action: "collection.delete", entityType: "Collection", entityId: id, before: { name: c.name } });
    revalidateStore();
    return { ok: true, message: `${c.name} deleted.` };
  } catch (e) {
    return toActionError(e);
  }
}

// ───────────── Families, occasions, notes ─────────────

const taxonomyKinds = z.enum(["family", "occasion", "note"]);

export async function saveTaxonomyAction(fd: FormData): Promise<ActionResult> {
  try {
    const user = await requirePermission("catalog:manage");
    const input = z.object({ kind: taxonomyKinds, id: z.string().optional(), name: zText(60).min(2), nameBn: zOptText(60), description: zOptText(300), descriptionBn: zOptText(300), sortOrder: zOptInt(0, 999) }).parse(formObject(fd));
    const slug = slugify(input.name);
    if (input.kind === "family") {
      const data = { name: input.name, nameBn: input.nameBn ?? null, description: input.description ?? null, descriptionBn: input.descriptionBn ?? null, sortOrder: input.sortOrder ?? 0, ...(input.id ? {} : { slug }) };
      if (input.id) await db.fragranceFamily.update({ where: { id: input.id }, data });
      else await db.fragranceFamily.create({ data: { ...data, slug } });
    } else if (input.kind === "occasion") {
      const data = { name: input.name, nameBn: input.nameBn ?? null, sortOrder: input.sortOrder ?? 0 };
      if (input.id) await db.occasion.update({ where: { id: input.id }, data });
      else await db.occasion.create({ data: { ...data, slug } });
    } else {
      if (input.id) await db.fragranceNote.update({ where: { id: input.id }, data: { name: input.name, nameBn: input.nameBn ?? null } });
      else await db.fragranceNote.create({ data: { name: input.name, nameBn: input.nameBn ?? null, slug } });
    }
    await audit({ actorId: user.id, action: `${input.kind}.${input.id ? "update" : "create"}`, entityType: input.kind, entityId: input.id, after: input });
    revalidateStore();
    return { ok: true, message: "Saved." };
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") return { ok: false, error: "That name already exists." };
    return toActionError(e);
  }
}

export async function deleteTaxonomyAction(fd: FormData): Promise<ActionResult> {
  try {
    const user = await requirePermission("catalog:manage");
    const { kind, id } = z.object({ kind: taxonomyKinds, id: z.string() }).parse(formObject(fd));
    const used = kind === "family" ? await db.productFamily.count({ where: { familyId: id } }) : kind === "occasion" ? await db.productOccasion.count({ where: { occasionId: id } }) : await db.productNote.count({ where: { noteId: id } });
    if (used > 0) throw new UserFacingError(`Still used by ${used} product${used === 1 ? "" : "s"}. Remove it from those products first.`);
    if (kind === "family") await db.fragranceFamily.delete({ where: { id } });
    else if (kind === "occasion") await db.occasion.delete({ where: { id } });
    else await db.fragranceNote.delete({ where: { id } });
    await audit({ actorId: user.id, action: `${kind}.delete`, entityType: kind, entityId: id });
    revalidateStore();
    return { ok: true, message: "Deleted." };
  } catch (e) {
    return toActionError(e);
  }
}

// ───────────── Demo data ─────────────

/**
 * Removes everything the seed flagged as demo: demo orders, demo products (archived instead
 * when real orders reference them), collections left empty, and the DEMO10 coupon.
 */
export async function removeDemoDataAction(): Promise<ActionResult> {
  try {
    const user = await requirePermission("settings:manage");
    const summary = await db.$transaction(async (tx) => {
      const demoOrders = await tx.order.findMany({ where: { isDemo: true }, select: { id: true } });
      const orderIds = demoOrders.map((o) => o.id);
      if (orderIds.length) {
        // Release any stock those orders still hold, then remove them.
        const items = await tx.orderItem.findMany({ where: { orderId: { in: orderIds }, order: { status: { in: ["PENDING", "CONFIRMED", "PROCESSING"] } } } });
        for (const it of items) await tx.$executeRaw`UPDATE "Inventory" SET "reserved" = GREATEST("reserved" - ${it.quantity}, 0) WHERE "variantId" = ${it.variantId}`;
        await tx.inventoryMovement.deleteMany({ where: { orderId: { in: orderIds } } });
        await tx.review.deleteMany({ where: { orderItem: { orderId: { in: orderIds } } } });
        await tx.order.deleteMany({ where: { id: { in: orderIds } } });
      }
      const demoProducts = await tx.product.findMany({ where: { isDemo: true }, include: { variants: { include: { _count: { select: { orderItems: true } } } } } });
      let deleted = 0;
      let archived = 0;
      for (const p of demoProducts) {
        if (p.variants.some((v) => v._count.orderItems > 0)) {
          await tx.product.update({ where: { id: p.id }, data: { status: "ARCHIVED" } });
          archived++;
        } else {
          await tx.product.delete({ where: { id: p.id } });
          deleted++;
        }
      }
      const emptyCollections = await tx.collection.findMany({ where: { products: { none: {} } }, select: { id: true } });
      await tx.collection.deleteMany({ where: { id: { in: emptyCollections.map((c) => c.id) } } });
      const coupon = await tx.coupon.findUnique({ where: { code: "DEMO10" }, include: { _count: { select: { redemptions: true } } } });
      if (coupon) {
        if (coupon._count.redemptions === 0) await tx.coupon.delete({ where: { id: coupon.id } });
        else await tx.coupon.update({ where: { id: coupon.id }, data: { isActive: false } });
      }
      const s = { orders: orderIds.length, productsDeleted: deleted, productsArchived: archived, collectionsRemoved: emptyCollections.length, coupon: Boolean(coupon) };
      await audit({ actorId: user.id, action: "demo.remove", entityType: "System", after: s }, tx);
      return s;
    }, { timeout: 60_000 });
    revalidateStore();
    return { ok: true, message: `Demo data removed: ${summary.productsDeleted} products deleted, ${summary.productsArchived} archived, ${summary.orders} demo orders, ${summary.collectionsRemoved} empty collections.` };
  } catch (e) {
    return toActionError(e);
  }
}
