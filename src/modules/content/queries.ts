import "server-only";
import { cache } from "react";
import type { BannerPlacement } from "@prisma/client";
import { db } from "@/lib/db";
import type { Locale } from "@/i18n/config";

/**
 * Localised CMS reads. English is on the base rows; a PUBLISHED translation replaces it for
 * `bn`. When no published translation exists the English row is returned with `lang: "en"`.
 */
const published = (locale: Locale) => ({ where: { locale, status: "PUBLISHED" as const } });

const activeWindow = () => {
  const now = new Date();
  return { isActive: true, OR: [{ startsAt: null }, { startsAt: { lte: now } }], AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }] };
};

export const getBanners = cache(async (placement: BannerPlacement, locale: Locale = "en") => {
  const rows = await db.banner.findMany({ where: { placement, ...activeWindow() }, orderBy: { sortOrder: "asc" }, include: { translations: published(locale) } });
  return rows.map(({ translations, ...b }) => {
    const tr = locale !== "en" ? translations[0] : undefined;
    return {
      ...b,
      eyebrow: tr ? tr.eyebrow : b.eyebrow,
      title: tr?.title ?? b.title,
      subtitle: tr ? tr.subtitle : b.subtitle,
      imageAlt: tr?.imageAlt ?? b.imageAlt,
      ctaLabel: tr?.ctaLabel ?? b.ctaLabel,
      cta2Label: tr?.cta2Label ?? b.cta2Label,
      lang: (tr ? locale : "en") as Locale,
    };
  });
});

export const getPage = cache(async (slug: string, locale: Locale = "en") => {
  const p = await db.contentPage.findUnique({ where: { slug }, include: { translations: published(locale) } });
  if (!p) return null;
  const tr = locale !== "en" ? p.translations[0] : undefined;
  return {
    slug: p.slug,
    title: tr?.title ?? p.title,
    body: tr?.body ?? p.body,
    seoDescription: tr?.seoDescription ?? p.seoDescription,
    updatedAt: tr?.updatedAt ?? p.updatedAt,
    lang: (tr ? locale : "en") as Locale,
  };
});

export const getFaqs = cache(async (locale: Locale = "en") => {
  const rows = await db.faqItem.findMany({ where: { isActive: true }, orderBy: [{ category: "asc" }, { sortOrder: "asc" }], include: { translations: published(locale) } });
  return rows.map(({ translations, ...f }) => {
    const tr = locale !== "en" ? translations[0] : undefined;
    return { id: f.id, question: tr?.question ?? f.question, answer: tr?.answer ?? f.answer, category: tr?.category ?? f.category, lang: (tr ? locale : "en") as Locale };
  });
});

export const HOMEPAGE_SECTIONS = [
  { key: "discovery", label: "Discover the collections" },
  { key: "bestSellers", label: "Best sellers" },
  { key: "story", label: "Brand philosophy" },
  { key: "finder", label: "Find your signature scent" },
  { key: "sets", label: "Discovery sets & bundles" },
  { key: "reviews", label: "Customer reviews" },
  { key: "journal", label: "Journal" },
  { key: "newsletter", label: "Newsletter" },
] as const;

export type HomepageSectionKey = (typeof HOMEPAGE_SECTIONS)[number]["key"];

export const getHomepageSections = cache(async (locale: Locale = "en") => {
  const rows = await db.homepageSection.findMany();
  const byKey = new Map(rows.map((r) => [r.key, r]));
  return HOMEPAGE_SECTIONS.map((s, i) => {
    const r = byKey.get(s.key);
    const title = locale === "bn" ? (r?.titleBn ?? null) : (r?.title ?? null);
    const subtitle = locale === "bn" ? (r?.subtitleBn ?? null) : (r?.subtitle ?? null);
    return { key: s.key as HomepageSectionKey, label: s.label, isEnabled: r?.isEnabled ?? true, sortOrder: r?.sortOrder ?? i, title, subtitle };
  }).sort((a, b) => a.sortOrder - b.sortOrder);
});

/** Latest approved verified-purchase reviews for the homepage (shown in the language they were written in). */
export const getFeaturedReviews = cache(async (locale: Locale = "en") => {
  const rows = await db.review.findMany({
    where: { status: "APPROVED", rating: { gte: 4 } },
    orderBy: { createdAt: "desc" },
    take: 6,
    include: {
      user: { select: { name: true } },
      product: { select: { name: true, slug: true, translations: published(locale) } },
      orderItem: { select: { variantLabel: true } },
    },
  });
  return rows.map((r) => ({ ...r, productName: r.product.translations[0]?.name ?? r.product.name }));
});

// ───────────── Journal ─────────────

const articleView = (a: { slug: string; title: string; excerpt: string; body: string; coverImage: string | null; coverAlt: string | null; authorName: string | null; seoTitle: string | null; seoDescription: string | null; publishedAt: Date | null; updatedAt: Date; translations: { title: string; excerpt: string; body: string; coverAlt: string | null; seoTitle: string | null; seoDescription: string | null }[] }, locale: Locale) => {
  const tr = locale !== "en" ? a.translations[0] : undefined;
  const body = tr?.body ?? a.body;
  return {
    slug: a.slug,
    title: tr?.title ?? a.title,
    excerpt: tr?.excerpt ?? a.excerpt,
    body,
    coverImage: a.coverImage,
    coverAlt: tr?.coverAlt ?? a.coverAlt,
    authorName: a.authorName,
    seoTitle: tr?.seoTitle ?? a.seoTitle,
    seoDescription: tr?.seoDescription ?? a.seoDescription,
    publishedAt: a.publishedAt,
    updatedAt: a.updatedAt,
    readMinutes: Math.max(1, Math.round(body.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length / 200)),
    lang: (tr ? locale : "en") as Locale,
  };
};

export const getArticles = cache(async (locale: Locale = "en", take?: number) => {
  const rows = await db.article.findMany({ where: { status: "PUBLISHED", publishedAt: { lte: new Date() } }, orderBy: { publishedAt: "desc" }, take, include: { translations: published(locale) } });
  return rows.map((a) => articleView(a, locale));
});

export const getArticle = cache(async (slug: string, locale: Locale = "en") => {
  const a = await db.article.findFirst({ where: { slug, status: "PUBLISHED", publishedAt: { lte: new Date() } }, include: { translations: published(locale) } });
  return a ? articleView(a, locale) : null;
});

export const POLICY_PAGES = [
  { slug: "shipping-policy", path: "/policies/shipping", key: "delivery" },
  { slug: "return-policy", path: "/policies/returns", key: "returns" },
  { slug: "privacy-policy", path: "/policies/privacy", key: "privacy" },
  { slug: "terms", path: "/policies/terms", key: "terms" },
] as const;
