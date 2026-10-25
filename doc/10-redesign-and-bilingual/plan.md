# Editorial Redesign + Bilingual (English/Bangla): Audit & Plan

**Date:** 2026-10-25 · **Status:** ✅ Implemented. See [implementation.md](implementation.md) · **Scope:** storefront redesign + full `en`/`bn` support. The admin gets bilingual editing only; its visual design is unchanged.

## 1. Audit: why the storefront feels "boxy"

| Source | Component(s) | Problem |
|--------|--------------|---------|
| Bordered product tiles + full-width outline "Add to bag" button | `product/product-card.tsx` | Every product reads as a form control, and the button competes with the image |
| Framed colour blocks (`inset-4 border`) | `home/category-tiles.tsx`, `home/featured-collections.tsx`, `collections/page.tsx` | The same rectangle inside a rectangle, four times in a row |
| Hairline grid of 4 equal feature cards | `home/why-ambr.tsx` | A generic SaaS "features" pattern |
| Bordered tiers | `product/notes-pyramid.tsx` | Three stacked boxes |
| Band header with bottom border on every page | `layout/page-header.tsx` | Every page opens with the same grey band |
| Pills / bordered chips | `home/fragrance-finder.tsx`, filter chips | Pill overload |
| Bordered review figures, boxed summaries | `home/reviews-strip.tsx`, cart and checkout asides | Dashboard feel |
| Size selector as boxed buttons with a strike-through | `product/purchase-panel.tsx` | Heavy |
| Identical section rhythm (eyebrow → H2 → grid) everywhere | all home sections | Monotonous |

**What works and stays:** the colour tokens, the burgundy header with the cream logo, the type pairing, server-authoritative cart/checkout logic, ISR, and the data model.

## 2. Design system changes (`src/app/globals.css`, `src/components/ui`)
- **Type scale tokens:** `display`, `h1`–`h3`, `lead`, `body`, `small` and `eyebrow`, fluid via `clamp()`. A **Bangla variant** (`:lang(bn)`) uses Noto Serif Bengali / Noto Sans Bengali with a taller line-height, no uppercase tracking, and slightly smaller display sizes so conjuncts never clip.
- **Section widths:** `--w-text` (~38rem), `--w-content` (1280px), `--w-wide` (1440px), plus full-bleed.
- **Editorial layout primitives** (`ui/editorial.tsx`): `Bleed`, `SplitFeature` (asymmetric 7/5 with image offset), `Stagger` (offset grid for mixed proportions), `Kicker` (eyebrow + rule), `Reveal` (fade-in on scroll; respects reduced motion).
- **Image ratios:** `portrait 4/5` (products), `tall 3/4`, `landscape 3/2`, `cinema 16/9` (mobile `4/5`).
- **Buttons:** primary (solid burgundy), **quiet** (text + animated underline). Pills are used only for filter chips.
- **Motion:** 200–700 ms ease-out; image zoom ≤ 1.04; all disabled under `prefers-reduced-motion`.

## 3. Homepage (new structure)
1. Thin announcement strip (CMS)
2. Sticky header: Shop · For Him · For Her · Unisex · Attar & Oils · Our Story | search · account · bag · **EN/বাং switch**
3. **Hero campaign**, full-bleed image, minimal copy, one CTA (CMS banner)
4. **Discover the collections**: asymmetric composition (one tall, two stacked, one wide) from the new `DISCOVERY` banners
5. **Best sellers**, image-first, borderless, quiet "Add" action
6. **Philosophy**, "Above Ordinary. Beyond the Everyday." Oversized type over an atmospheric image (`STORY` banner)
7. **Find your signature scent**: 5-step finder (family, occasion, budget, presence, format) → filtered shop
8. **Discovery sets & bundles**: products from active *Discovery/Gift/Mini* categories (the section hides if there are none)
9. **Reviews**: verified only; hidden until there are at least 3
10. **Journal teaser**: new bilingual articles
11. **Footer**: brand story, collections, help, delivery/returns, socials, newsletter

## 4. Shop, product, other pages
- **Shop:** an airy catalogue grid (2 columns on mobile, 3 or 4 on desktop, with an occasional wide "editorial" tile), a borderless filter sidebar, a mobile filter drawer, and new filters for gender, format and presence. Every existing filter is kept.
- **Product page:** an editorial two-column layout; a sticky gallery with thumbnails; inspiration reference (only when set); **format switch** (spray/roll-on) and size selection; a notes "ladder" without boxes; a delivery estimate; sections below for profile, occasions, usage, verified performance only, related products and reviews. A sticky mobile add-to-bag bar.
- **Cart, checkout, account, content pages:** reskinned with the same tokens. **All logic is unchanged.**

## 5. Bilingual architecture
- **Routing:** `/en/...` and `/bn/...` under `app/[locale]` (the root layout sets `<html lang>`). `proxy.ts` redirects un-prefixed URLs, choosing the language by cookie → `Accept-Language` → `en`, so **every existing URL keeps working**. Switching language keeps the same page. The choice is remembered in the `NEXT_LOCALE` cookie.
- **Admin** moves to the `app/(admin)` route group with its own root layout. The URL stays `/admin`, and it stays in English.
- **UI strings:** typed dictionaries `src/i18n/dictionaries/{en,bn}.ts`. Key parity is enforced by TypeScript and a unit test.
- **Content:** English stays in the existing tables (no data moves). Bangla lives in translation tables with an independent `status` (DRAFT/PUBLISHED), so publishing one language never overwrites the other. If a Bangla translation is missing, the page shows English marked `lang="en"`.
- **Commerce:** the same product, SKU, stock and price in both languages. Prices show Bangla digits on `/bn` (same value). Validation, server errors, checkout, payment instructions and emails are localised (`Order.locale` is stored). Search matches English and published Bangla names, notes and families. Reviews are shown in their original language (`Review.locale`).
- **SEO:** localised titles and descriptions, canonical URLs per locale, `hreflang` alternates (`en`, `bn`, `x-default`), and a sitemap with alternates.

## 6. Schema changes (additive only, one migration)
`Product.gender` · `ProductVariant.format` · `TranslationStatus` enum · extended `ProductTranslation` · new `CategoryTranslation`, `CollectionTranslation`, `BannerTranslation`, `ContentPageTranslation`, `FaqTranslation` · `nameBn`/`descriptionBn` on families, occasions and notes · `HomepageSection.titleBn/subtitleBn` · `Article` + `ArticleTranslation` (journal) · `Order.locale` · `Review.locale` · `BannerPlacement` += `DISCOVERY`, `STORY`. No columns are removed or renamed.

## 7. Stages & checks
After each stage: typecheck, lint, unit tests, a production build, and Playwright (both locales, mobile and desktop).

1. Audit and plan (this document)
2. Schema, seed (including starter Bangla content) and i18n infrastructure
3. Design system and layout primitives
4. Homepage
5. Shop, collections, search
6. Product page
7. Cart, checkout, account, content and journal pages (localised)
8. Admin bilingual editing (separate workstream; admin visuals unchanged)
9. Tests, both locales, production and Docker builds

## 8. Images
No new product photography exists. The layouts are built so that missing images degrade to typographic and colour compositions, never to fake product photos. See `asset-replacement-list.md`.
