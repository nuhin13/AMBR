/**
 * Which fields of each content type can be translated into Bangla.
 * Shared by the admin translation editor (client) and saveTranslationAction (server).
 * Images, links, prices, SKUs and stock are never translated — they're shared by both languages.
 */
export type TrEntity = "product" | "category" | "collection" | "banner" | "page" | "faq" | "article";
export type TrStatus = "MISSING" | "DRAFT" | "PUBLISHED";
export type TrField = { name: string; label: string; kind: "text" | "textarea" | "html"; required?: boolean; max: number; rows?: number };

export const TR_FIELDS: Record<TrEntity, TrField[]> = {
  product: [
    { name: "name", label: "Product name", kind: "text", required: true, max: 120 },
    { name: "shortDescription", label: "One-line description", kind: "text", required: true, max: 220 },
    { name: "description", label: "Full description", kind: "html", required: true, max: 20000, rows: 7 },
    { name: "productType", label: "Product type", kind: "text", max: 60 },
    { name: "applicationMethod", label: "Application method", kind: "text", max: 60 },
    { name: "usageInstructions", label: "Usage instructions", kind: "textarea", max: 1000, rows: 3 },
    { name: "safetyNote", label: "Safety note", kind: "textarea", max: 1000, rows: 3 },
    { name: "inspirationNote", label: "Inspiration note", kind: "text", max: 300 },
    { name: "seoTitle", label: "SEO title", kind: "text", max: 70 },
    { name: "seoDescription", label: "SEO description", kind: "textarea", max: 170, rows: 2 },
  ],
  category: [
    { name: "name", label: "Name", kind: "text", required: true, max: 80 },
    { name: "tagline", label: "Tagline", kind: "text", max: 120 },
    { name: "description", label: "Description", kind: "textarea", max: 1000, rows: 3 },
  ],
  collection: [
    { name: "name", label: "Name", kind: "text", required: true, max: 80 },
    { name: "description", label: "Description", kind: "textarea", max: 500, rows: 3 },
  ],
  banner: [
    { name: "eyebrow", label: "Small heading", kind: "text", max: 60 },
    { name: "title", label: "Title / announcement text", kind: "text", required: true, max: 160 },
    { name: "subtitle", label: "Supporting text", kind: "textarea", max: 400, rows: 3 },
    { name: "imageAlt", label: "Image description (alt text)", kind: "text", max: 160 },
    { name: "ctaLabel", label: "Button label", kind: "text", max: 40 },
    { name: "cta2Label", label: "Second button label", kind: "text", max: 40 },
  ],
  page: [
    { name: "title", label: "Title", kind: "text", required: true, max: 120 },
    { name: "body", label: "Content", kind: "html", required: true, max: 60000, rows: 18 },
    { name: "seoDescription", label: "SEO description", kind: "textarea", max: 170, rows: 2 },
  ],
  faq: [
    { name: "category", label: "Group", kind: "text", max: 60 },
    { name: "question", label: "Question", kind: "text", required: true, max: 200 },
    { name: "answer", label: "Answer", kind: "textarea", required: true, max: 2000, rows: 4 },
  ],
  article: [
    { name: "title", label: "Title", kind: "text", required: true, max: 160 },
    { name: "excerpt", label: "Excerpt", kind: "textarea", required: true, max: 400, rows: 3 },
    { name: "body", label: "Article body", kind: "html", required: true, max: 60000, rows: 16 },
    { name: "coverAlt", label: "Cover image description (alt text)", kind: "text", max: 160 },
    { name: "seoTitle", label: "SEO title", kind: "text", max: 70 },
    { name: "seoDescription", label: "SEO description", kind: "textarea", max: 170, rows: 2 },
  ],
};

export const TR_ENTITY_PLURAL: Record<TrEntity, string> = {
  product: "Products",
  category: "Categories",
  collection: "Collections",
  banner: "Banners",
  page: "Pages",
  faq: "FAQs",
  article: "Journal articles",
};

export const TR_ENTITY_LABEL: Record<TrEntity, string> = {
  product: "Product",
  category: "Category",
  collection: "Collection",
  banner: "Banner",
  page: "Page",
  faq: "FAQ",
  article: "Journal article",
};

/** Shows simple HTML (only paragraphs/line breaks) as plain text in editors; richer HTML is shown as-is. */
export function htmlForEditing(h: string) {
  if (/<(ul|ol|h2|h3|h4|a|blockquote|strong|em)\b/i.test(h)) return h;
  return h
    .replace(/<\/p>\s*<p>/g, "\n\n")
    .replace(/<br\s*\/?>/g, "\n")
    .replace(/<\/?p>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}
