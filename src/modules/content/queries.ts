import "server-only";
import { cache } from "react";
import type { BannerPlacement } from "@prisma/client";
import { db } from "@/lib/db";

const activeWindow = () => {
  const now = new Date();
  return { isActive: true, OR: [{ startsAt: null }, { startsAt: { lte: now } }], AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }] };
};

export const getBanners = cache((placement: BannerPlacement) =>
  db.banner.findMany({ where: { placement, ...activeWindow() }, orderBy: { sortOrder: "asc" } }),
);

export const getPage = cache((slug: string) => db.contentPage.findUnique({ where: { slug } }));

export const getFaqs = cache(() => db.faqItem.findMany({ where: { isActive: true }, orderBy: [{ category: "asc" }, { sortOrder: "asc" }] }));

export const HOMEPAGE_SECTIONS = [
  { key: "categories", label: "Shop by category" },
  { key: "bestSellers", label: "Best sellers" },
  { key: "discover", label: "Find your fragrance" },
  { key: "whyAmbr", label: "Why AMBR" },
  { key: "collections", label: "Featured collections" },
  { key: "story", label: "Brand philosophy" },
  { key: "reviews", label: "Customer reviews" },
  { key: "newsletter", label: "Newsletter" },
] as const;

export type HomepageSectionKey = (typeof HOMEPAGE_SECTIONS)[number]["key"];

export const getHomepageSections = cache(async () => {
  const rows = await db.homepageSection.findMany();
  const byKey = new Map(rows.map((r) => [r.key, r]));
  return HOMEPAGE_SECTIONS.map((s, i) => {
    const r = byKey.get(s.key);
    return { key: s.key as HomepageSectionKey, label: s.label, isEnabled: r?.isEnabled ?? true, sortOrder: r?.sortOrder ?? i, title: r?.title ?? null, subtitle: r?.subtitle ?? null };
  }).sort((a, b) => a.sortOrder - b.sortOrder);
});

/** Latest approved verified-purchase reviews for the homepage. */
export const getFeaturedReviews = cache(() =>
  db.review.findMany({
    where: { status: "APPROVED", rating: { gte: 4 } },
    orderBy: { createdAt: "desc" },
    take: 6,
    include: { user: { select: { name: true } }, product: { select: { name: true, slug: true } }, orderItem: { select: { variantLabel: true } } },
  }),
);

export const POLICY_PAGES = [
  { slug: "shipping-policy", path: "/policies/shipping", label: "Shipping Policy" },
  { slug: "return-policy", path: "/policies/returns", label: "Return & Refund Policy" },
  { slug: "privacy-policy", path: "/policies/privacy", label: "Privacy Policy" },
  { slug: "terms", path: "/policies/terms", label: "Terms & Conditions" },
] as const;
