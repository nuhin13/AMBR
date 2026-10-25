"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { sanitizeRichText, textToHtml } from "@/lib/sanitize";
import { toActionError, UserFacingError, type ActionResult } from "@/lib/action-result";
import { requirePermission, type Permission } from "@/modules/auth/rbac";
import { audit } from "@/modules/audit/log";
import { formObject, revalidateStore } from "@/modules/reports/form-data";
import { TR_FIELDS, type TrEntity } from "@/components/admin/translation-fields";
import { BN, getBnTranslation } from "./admin-queries";

const PERMISSION: Record<TrEntity, Permission> = {
  product: "catalog:manage",
  category: "catalog:manage",
  collection: "catalog:manage",
  banner: "content:manage",
  page: "content:manage",
  faq: "content:manage",
  article: "content:manage",
};

/** Parent row must exist; returns its English name for the audit log. */
async function parentLabel(entity: TrEntity, id: string): Promise<string | null> {
  switch (entity) {
    case "product": return (await db.product.findUnique({ where: { id }, select: { name: true } }))?.name ?? null;
    case "category": return (await db.category.findUnique({ where: { id }, select: { name: true } }))?.name ?? null;
    case "collection": return (await db.collection.findUnique({ where: { id }, select: { name: true } }))?.name ?? null;
    case "banner": return (await db.banner.findUnique({ where: { id }, select: { title: true } }))?.title ?? null;
    case "page": return (await db.contentPage.findUnique({ where: { id }, select: { title: true } }))?.title ?? null;
    case "faq": return (await db.faqItem.findUnique({ where: { id }, select: { question: true } }))?.question ?? null;
    case "article": return (await db.article.findUnique({ where: { id }, select: { title: true } }))?.title ?? null;
  }
}

type Data = Record<string, string | null> & { status: "DRAFT" | "PUBLISHED" };

async function upsert(entity: TrEntity, id: string, data: Data) {
  const locale = BN;
  // Each branch writes ONLY the Bangla translation row — the English base row is never touched.
  switch (entity) {
    case "product": {
      const d = data as Data & { name: string; shortDescription: string; description: string };
      return db.productTranslation.upsert({ where: { productId_locale: { productId: id, locale } }, create: { productId: id, locale, ...d }, update: d });
    }
    case "category": {
      const d = data as Data & { name: string };
      return db.categoryTranslation.upsert({ where: { categoryId_locale: { categoryId: id, locale } }, create: { categoryId: id, locale, ...d }, update: d });
    }
    case "collection": {
      const d = data as Data & { name: string };
      return db.collectionTranslation.upsert({ where: { collectionId_locale: { collectionId: id, locale } }, create: { collectionId: id, locale, ...d }, update: d });
    }
    case "banner": {
      const d = data as Data & { title: string };
      return db.bannerTranslation.upsert({ where: { bannerId_locale: { bannerId: id, locale } }, create: { bannerId: id, locale, ...d }, update: d });
    }
    case "page": {
      const d = data as Data & { title: string; body: string };
      return db.contentPageTranslation.upsert({ where: { pageId_locale: { pageId: id, locale } }, create: { pageId: id, locale, ...d }, update: d });
    }
    case "faq": {
      const d = data as Data & { question: string; answer: string };
      return db.faqTranslation.upsert({ where: { faqId_locale: { faqId: id, locale } }, create: { faqId: id, locale, ...d }, update: d });
    }
    case "article": {
      const d = data as Data & { title: string; excerpt: string; body: string };
      return db.articleTranslation.upsert({ where: { articleId_locale: { articleId: id, locale } }, create: { articleId: id, locale, ...d }, update: d });
    }
  }
}

async function setStatus(entity: TrEntity, id: string, status: "DRAFT" | "PUBLISHED") {
  const where = { locale: BN };
  switch (entity) {
    case "product": return db.productTranslation.update({ where: { productId_locale: { productId: id, ...where } }, data: { status } });
    case "category": return db.categoryTranslation.update({ where: { categoryId_locale: { categoryId: id, ...where } }, data: { status } });
    case "collection": return db.collectionTranslation.update({ where: { collectionId_locale: { collectionId: id, ...where } }, data: { status } });
    case "banner": return db.bannerTranslation.update({ where: { bannerId_locale: { bannerId: id, ...where } }, data: { status } });
    case "page": return db.contentPageTranslation.update({ where: { pageId_locale: { pageId: id, ...where } }, data: { status } });
    case "faq": return db.faqTranslation.update({ where: { faqId_locale: { faqId: id, ...where } }, data: { status } });
    case "article": return db.articleTranslation.update({ where: { articleId_locale: { articleId: id, ...where } }, data: { status } });
  }
}

async function remove(entity: TrEntity, id: string) {
  const where = { locale: BN };
  switch (entity) {
    case "product": return db.productTranslation.deleteMany({ where: { productId: id, ...where } });
    case "category": return db.categoryTranslation.deleteMany({ where: { categoryId: id, ...where } });
    case "collection": return db.collectionTranslation.deleteMany({ where: { collectionId: id, ...where } });
    case "banner": return db.bannerTranslation.deleteMany({ where: { bannerId: id, ...where } });
    case "page": return db.contentPageTranslation.deleteMany({ where: { pageId: id, ...where } });
    case "faq": return db.faqTranslation.deleteMany({ where: { faqId: id, ...where } });
    case "article": return db.articleTranslation.deleteMany({ where: { articleId: id, ...where } });
  }
}

const base = z.object({
  entity: z.enum(["product", "category", "collection", "banner", "page", "faq", "article"]),
  parentId: z.string().min(1),
  intent: z.enum(["draft", "publish", "unpublish", "delete"]),
});

/**
 * Saves the Bangla version of an item. Intents:
 *  draft     — save content, status DRAFT (not shown on /bn)
 *  publish   — save content, status PUBLISHED (shown on /bn)
 *  unpublish — keep content, back to DRAFT
 *  delete    — remove the Bangla version (the site falls back to English)
 * Never touches the English row and never auto-translates.
 */
export async function saveTranslationAction(fd: FormData): Promise<ActionResult> {
  try {
    const raw = formObject(fd);
    const { entity, parentId, intent } = base.parse(raw);
    const user = await requirePermission(PERMISSION[entity]);
    const label = await parentLabel(entity, parentId);
    if (label === null) throw new UserFacingError("This item no longer exists. Reload the page.");
    const before = await getBnTranslation(entity, parentId);

    if (intent === "delete" || intent === "unpublish") {
      if (!before) throw new UserFacingError("There is no Bangla version yet.");
      if (intent === "delete") await remove(entity, parentId);
      else await setStatus(entity, parentId, "DRAFT");
      await audit({ actorId: user.id, action: `translation.bn.${intent}`, entityType: entity, entityId: parentId, before: { status: before.status }, after: { label } });
      revalidateStore();
      return { ok: true, message: intent === "delete" ? "Bangla version removed — the site shows English instead." : "Bangla version unpublished (kept as draft)." };
    }

    const fieldErrors: Record<string, string> = {};
    const data: Record<string, string | null> = {};
    for (const f of TR_FIELDS[entity]) {
      const v = (raw[f.name] ?? "").trim();
      if (f.required && !v) fieldErrors[f.name] = `${f.label} is required`;
      else if (v.length > f.max) fieldErrors[f.name] = `${f.label} must be at most ${f.max} characters`;
      data[f.name] = !v ? null : f.kind === "html" ? (/<[a-z][\s\S]*>/i.test(v) ? sanitizeRichText(v) : textToHtml(v)) : v;
    }
    if (Object.keys(fieldErrors).length) return { ok: false, error: "Please check the highlighted fields.", fieldErrors };

    const status = intent === "publish" ? "PUBLISHED" : "DRAFT";
    await upsert(entity, parentId, { ...data, status } as Data);
    await audit({
      actorId: user.id,
      action: `translation.bn.${intent}`,
      entityType: entity,
      entityId: parentId,
      before: before ? { status: before.status } : undefined,
      after: { label, status, fields: Object.keys(data).filter((k) => data[k]) },
    });
    revalidateStore();
    return { ok: true, message: status === "PUBLISHED" ? "Bangla version published." : "Bangla draft saved — not visible on the site until published." };
  } catch (e) {
    return toActionError(e);
  }
}
