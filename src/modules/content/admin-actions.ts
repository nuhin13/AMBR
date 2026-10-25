"use server";

import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { sanitizeRichText, textToHtml } from "@/lib/sanitize";
import { toActionError, UserFacingError, type ActionResult } from "@/lib/action-result";
import { requirePermission } from "@/modules/auth/rbac";
import { audit } from "@/modules/audit/log";
import { storeImage } from "@/modules/media/storage";
import { formObject, revalidateStore, zBool, zInt, zOptDate, zOptText, zText } from "@/modules/reports/form-data";
import { getSettings, settingsSchemas, type SettingsKey } from "./settings";
import { HOMEPAGE_SECTIONS } from "./queries";

const href = z.preprocess((v) => (v === "" ? undefined : v), z.string().trim().max(300).regex(/^(\/|https?:\/\/)/, "Links must start with / or https://").optional());

// ───────────── Banners ─────────────

const bannerSchema = z.object({
  id: z.string().optional(),
  placement: z.enum(["HOME_HERO", "ANNOUNCEMENT", "PROMO", "DISCOVERY", "STORY"]),
  eyebrow: zOptText(60),
  title: zText(160).min(2, "Title is required"),
  subtitle: zOptText(300),
  imageAlt: zOptText(160),
  ctaLabel: zOptText(40),
  ctaHref: href,
  cta2Label: zOptText(40),
  cta2Href: href,
  startsAt: zOptDate,
  endsAt: zOptDate,
  sortOrder: zInt(0, 999),
  isActive: zBool,
  campaignId: zOptText(40),
  removeDesktop: zBool.optional(),
  removeMobile: zBool.optional(),
});

export async function saveBannerAction(fd: FormData): Promise<ActionResult> {
  try {
    const user = await requirePermission("content:manage");
    const input = bannerSchema.parse(formObject(fd));
    const upload = async (key: string) => {
      const f = fd.get(key);
      return f instanceof File && f.size > 0 ? (await storeImage(f, "banners")).url : undefined;
    };
    const desktop = await upload("imageDesktopFile");
    const mobile = await upload("imageMobileFile");
    const data = {
      placement: input.placement,
      eyebrow: input.eyebrow ?? null,
      title: input.title,
      subtitle: input.subtitle ?? null,
      imageAlt: input.imageAlt ?? null,
      ctaLabel: input.ctaLabel ?? null,
      ctaHref: input.ctaHref ?? null,
      cta2Label: input.cta2Label ?? null,
      cta2Href: input.cta2Href ?? null,
      startsAt: input.startsAt ? new Date(input.startsAt.getTime() - 6 * 3600_000) : null,
      endsAt: input.endsAt ? new Date(input.endsAt.getTime() + 18 * 3600_000 - 1) : null,
      sortOrder: input.sortOrder,
      isActive: input.isActive,
      campaignId: input.campaignId || null,
      ...(desktop ? { imageDesktop: desktop } : input.removeDesktop ? { imageDesktop: null } : {}),
      ...(mobile ? { imageMobile: mobile } : input.removeMobile ? { imageMobile: null } : {}),
    };
    if (input.placement === "HOME_HERO" && !input.id && !desktop) throw new UserFacingError("A homepage hero needs a desktop image.");
    const b = input.id ? await db.banner.update({ where: { id: input.id }, data }) : await db.banner.create({ data });
    await audit({ actorId: user.id, action: input.id ? "banner.update" : "banner.create", entityType: "Banner", entityId: b.id, after: data });
    revalidateStore();
    return { ok: true, message: "Banner saved." };
  } catch (e) {
    return toActionError(e);
  }
}

export async function deleteBannerAction(fd: FormData): Promise<ActionResult> {
  try {
    const user = await requirePermission("content:manage");
    const id = z.string().parse(fd.get("id"));
    await db.banner.delete({ where: { id } });
    await audit({ actorId: user.id, action: "banner.delete", entityType: "Banner", entityId: id });
    revalidateStore();
    return { ok: true, message: "Banner deleted." };
  } catch (e) {
    return toActionError(e);
  }
}

// ───────────── Homepage sections ─────────────

export async function saveHomepageSectionsAction(fd: FormData): Promise<ActionResult> {
  try {
    const user = await requirePermission("content:manage");
    const order = z.array(z.string()).parse(JSON.parse(String(fd.get("order") ?? "[]")));
    const keys = HOMEPAGE_SECTIONS.map((s) => s.key as string);
    if (order.length !== keys.length || !order.every((k) => keys.includes(k))) throw new UserFacingError("Section list is out of date. Reload and try again.");
    const obj = formObject(fd);
    const text = (k: string) => obj[k]?.trim().slice(0, 300) || null;
    const sectionFields = (key: string) => ({
      isEnabled: fd.get(`enabled_${key}`) === "on",
      title: text(`title_${key}`),
      subtitle: text(`subtitle_${key}`),
      titleBn: text(`titleBn_${key}`),
      subtitleBn: text(`subtitleBn_${key}`),
    });
    await db.$transaction(
      order.map((key, i) =>
        db.homepageSection.upsert({
          where: { key },
          create: { key, sortOrder: i, ...sectionFields(key) },
          update: { sortOrder: i, ...sectionFields(key) },
        }),
      ),
    );
    await audit({ actorId: user.id, action: "homepage.sections", entityType: "HomepageSection", after: { order } });
    revalidateStore();
    return { ok: true, message: "Homepage updated." };
  } catch (e) {
    return toActionError(e);
  }
}

// ───────────── Pages ─────────────

export async function savePageAction(fd: FormData): Promise<ActionResult> {
  try {
    const user = await requirePermission("content:manage");
    const input = z.object({ slug: z.string().regex(/^[a-z0-9-]+$/), title: zText(120).min(2), body: z.string().max(60000).min(10, "Page content is too short"), seoDescription: zOptText(170) }).parse(formObject(fd));
    const body = /<[a-z][\s\S]*>/i.test(input.body) ? sanitizeRichText(input.body) : textToHtml(input.body);
    const before = await db.contentPage.findUnique({ where: { slug: input.slug } });
    await db.contentPage.upsert({ where: { slug: input.slug }, create: { slug: input.slug, title: input.title, body, seoDescription: input.seoDescription ?? null }, update: { title: input.title, body, seoDescription: input.seoDescription ?? null } });
    await audit({ actorId: user.id, action: "page.update", entityType: "ContentPage", entityId: input.slug, before: before ? { title: before.title, length: before.body.length } : undefined, after: { title: input.title, length: body.length } });
    revalidateStore();
    return { ok: true, message: "Page published." };
  } catch (e) {
    return toActionError(e);
  }
}

// ───────────── FAQ ─────────────

export async function saveFaqAction(fd: FormData): Promise<ActionResult> {
  try {
    const user = await requirePermission("content:manage");
    const input = z.object({ id: z.string().optional(), question: zText(200).min(5), answer: zText(2000).min(5), category: zText(60).min(2), sortOrder: zInt(0, 999), isActive: zBool }).parse(formObject(fd));
    const { id, ...data } = input;
    const f = id ? await db.faqItem.update({ where: { id }, data }) : await db.faqItem.create({ data });
    await audit({ actorId: user.id, action: id ? "faq.update" : "faq.create", entityType: "FaqItem", entityId: f.id, after: data });
    revalidateStore();
    return { ok: true, message: "FAQ saved." };
  } catch (e) {
    return toActionError(e);
  }
}

export async function deleteFaqAction(fd: FormData): Promise<ActionResult> {
  try {
    const user = await requirePermission("content:manage");
    const id = z.string().parse(fd.get("id"));
    await db.faqItem.delete({ where: { id } });
    await audit({ actorId: user.id, action: "faq.delete", entityType: "FaqItem", entityId: id });
    revalidateStore();
    return { ok: true, message: "FAQ deleted." };
  } catch (e) {
    return toActionError(e);
  }
}

// ───────────── Settings ─────────────

/** Saves one settings group. Checkbox fields are read as booleans, numbers coerced, everything validated by the group's schema. */
export async function saveSettingsAction(fd: FormData): Promise<ActionResult> {
  try {
    const group = z.enum(["store", "social", "payments", "seo", "checkout"]).parse(fd.get("group")) as SettingsKey;
    const user = await requirePermission(group === "payments" ? "settings:manage" : "settings:manage");
    const current = (await getSettings())[group] as Record<string, unknown>;
    const obj = formObject(fd);
    const next: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(current)) {
      if (typeof v === "boolean") next[k] = fd.has(`present_${k}`) ? obj[k] === "on" : v;
      else if (typeof v === "number") next[k] = k in obj ? Number(obj[k]) : v;
      else next[k] = k in obj ? obj[k].trim() : v;
    }
    if (group === "payments" && !Object.values(next).some((v) => v === true)) throw new UserFacingError("Keep at least one payment method enabled, or customers can't check out.");
    if (group === "social") for (const k of ["facebook", "instagram"]) if (next[k] && !/^https:\/\//.test(String(next[k]))) throw new UserFacingError("Social links must start with https://");
    if (group === "store" && next.email && !z.string().email().safeParse(next.email).success) throw new UserFacingError("Enter a valid support email.");
    const parsed = (settingsSchemas[group] as z.ZodType).parse(next) as Prisma.InputJsonValue;
    await db.storeSetting.upsert({ where: { key: group }, create: { key: group, value: parsed }, update: { value: parsed } });
    await audit({ actorId: user.id, action: `settings.${group}`, entityType: "StoreSetting", entityId: group, before: current, after: parsed });
    revalidateStore();
    return { ok: true, message: "Settings saved." };
  } catch (e) {
    return toActionError(e);
  }
}

// ───────────── Inbox & newsletter ─────────────

export async function markMessageAction(fd: FormData): Promise<ActionResult> {
  try {
    await requirePermission("customers:view");
    const { id, read } = z.object({ id: z.string(), read: zBool }).parse(formObject(fd));
    await db.contactMessage.update({ where: { id }, data: { isRead: read } });
    return { ok: true, message: read ? "Marked as read." : "Marked as unread." };
  } catch (e) {
    return toActionError(e);
  }
}

export async function setSubscriberStatusAction(fd: FormData): Promise<ActionResult> {
  try {
    const user = await requirePermission("promotions:manage");
    const { id, status } = z.object({ id: z.string(), status: z.enum(["SUBSCRIBED", "UNSUBSCRIBED"]) }).parse(formObject(fd));
    await db.newsletterSubscriber.update({ where: { id }, data: { status } });
    await audit({ actorId: user.id, action: "newsletter.status", entityType: "NewsletterSubscriber", entityId: id, after: { status } });
    return { ok: true, message: "Updated." };
  } catch (e) {
    return toActionError(e);
  }
}

// ───────────── Journal (articles) ─────────────

const articleSchema = z.object({
  id: z.string().optional(),
  title: zText(160).min(3, "Title is required"),
  slug: zOptText(90),
  excerpt: zText(400).min(10, "Add a short excerpt"),
  body: z.string().trim().min(20, "The article is too short").max(60000),
  coverAlt: zOptText(160),
  authorName: zOptText(80),
  seoTitle: zOptText(70),
  seoDescription: zOptText(170),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  removeCover: zBool.optional(),
});

/** Saves the ENGLISH article. The Bangla version is edited separately and has its own status. */
export async function saveArticleAction(fd: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requirePermission("content:manage");
    const input = articleSchema.parse(formObject(fd));
    const { slugify } = await import("@/lib/utils");
    const slug = slugify(input.slug || input.title);
    if (!slug) throw new UserFacingError("Give the article a title with letters or numbers.");
    const clash = await db.article.findFirst({ where: { slug, id: input.id ? { not: input.id } : undefined } });
    if (clash) throw new UserFacingError(`The address “${slug}” is already used by another article.`);
    const before = input.id ? await db.article.findUnique({ where: { id: input.id } }) : null;
    if (input.id && !before) throw new UserFacingError("Article not found.");
    const file = fd.get("cover");
    const cover = file instanceof File && file.size > 0 ? (await storeImage(file, "journal")).url : undefined;
    const body = /<[a-z][\s\S]*>/i.test(input.body) ? sanitizeRichText(input.body) : textToHtml(input.body);
    const data = {
      slug,
      title: input.title,
      excerpt: input.excerpt,
      body,
      coverAlt: input.coverAlt ?? null,
      authorName: input.authorName ?? null,
      seoTitle: input.seoTitle ?? null,
      seoDescription: input.seoDescription ?? null,
      status: input.status,
      // First publication date is kept when re-publishing.
      publishedAt: input.status === "PUBLISHED" ? (before?.publishedAt ?? new Date()) : (before?.publishedAt ?? null),
      ...(cover ? { coverImage: cover } : input.removeCover ? { coverImage: null } : {}),
    };
    const a = input.id ? await db.article.update({ where: { id: input.id }, data }) : await db.article.create({ data });
    await audit({ actorId: user.id, action: input.id ? "article.update" : "article.create", entityType: "Article", entityId: a.id, before: before ? { title: before.title, status: before.status } : undefined, after: { title: a.title, status: a.status } });
    revalidateStore();
    return { ok: true, data: { id: a.id }, message: input.status === "PUBLISHED" ? "Article saved and published." : "Article saved as draft." };
  } catch (e) {
    return toActionError(e);
  }
}

export async function deleteArticleAction(fd: FormData): Promise<ActionResult> {
  try {
    const user = await requirePermission("content:manage");
    const id = z.string().parse(fd.get("id"));
    const a = await db.article.delete({ where: { id } });
    await audit({ actorId: user.id, action: "article.delete", entityType: "Article", entityId: id, before: { title: a.title } });
    revalidateStore();
    return { ok: true, message: "Article deleted (both languages)." };
  } catch (e) {
    return toActionError(e);
  }
}
