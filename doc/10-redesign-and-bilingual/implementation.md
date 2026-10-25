# Editorial Redesign + Bilingual: As Built

**Date:** 2026-10-25 · Plan: [plan.md](plan.md) · Images: [asset-replacement-list.md](asset-replacement-list.md)

## 1. What changed for customers

| Area | Before | Now |
|------|--------|-----|
| **Navigation** | Home · Shop · Perfumes · Attar · Collections · About · Contact | Shop · For Him · For Her · Unisex · Attar & Oils · Our Story, plus an **EN / বাং** switch, search, account and bag. The header is sticky and tightens on scroll. |
| **Hero** | Text beside an image, two buttons | Split editorial campaign: oversized headline (second line in italic rose), one call to action. On phones the image sits on top with the text overlaid. |
| **Collections** | Four framed colour tiles | **Adaptive.** Without photography they become a typographic index: oversized italic names on hairline rows. As soon as the admin uploads images to the *Discovery* banners, an asymmetric image composition takes over (tall, portrait, landscape, panorama). |
| **Best sellers** | Bordered cards with full-width outline buttons | Image-first, borderless cards in a staggered grid. Desktop has a hover "quick add" strip; phones have a small round "+". The row swipes on mobile. |
| **Philosophy** | 50/50 split | "Above Ordinary. Beyond the Everyday." Oversized type overlapping an image that bleeds off the edge. |
| **Find your signature scent** | Family/occasion chips | A 5-question finder (family, occasion, budget, presence, format). Answers become ordinary shop filters, so results are always real catalogue items. |
| **Discovery sets** | — | A new section giving sets and bundles a prominent, alternating editorial layout. It hides itself when none exist. |
| **Journal** | — | New bilingual articles (`/journal`), with a homepage teaser. |
| **Shop** | Bordered filter boxes and pills | A borderless catalogue: quiet tick-rows, hairline groups, new **For / Presence / Format** filters, an underline sort control, a bottom-sheet filter on mobile. |
| **Product page** | Boxed notes pyramid, boxed size buttons | Sticky gallery, editorial purchase column, underlined size choices, a **format switch** (spray / roll-on) when a product has both, a notes "ladder", a profile list, usage, delivery and safety in three columns, a sticky mobile add-to-bag bar. |
| **Footer** | Logo, columns | A large brand line, newsletter, four link groups, contact, payment methods, language switch. |

Motion: CSS scroll-driven section reveals (no JavaScript; content stays visible without support), gentle image zoom on hover, drawn-in underlines, and a cross-fading gallery. All motion is disabled under `prefers-reduced-motion`.

## 2. Design system
- **Tokens** (`src/app/globals.css`): the brand palette only; a fluid type scale (`t-display`, `t-h1`, `t-h2`, `t-h3`, `t-lead`, `eyebrow`); widths (`--w-text`, `--w-content`, `--w-wide`); section rhythm (`section-y`); image ratios; a motion easing curve.
- **Primitives:** `Kicker`, `SectionIntro` (asymmetric opener), `PageIntro` (band-less page header), `Button` with a new **quiet** variant (text + drawn underline + arrow), `LLink` (locale-aware link), `LanguageSwitch`.
- **Bangla typography:** under `:lang(bn)` the fonts switch to **Noto Serif Bengali** (headings) and **Noto Sans Bengali** (body), with a taller line-height (1.85 body / 1.3 headings), slightly smaller display sizes so conjuncts never clip, no uppercase tracking, and **no faux italic** (Bengali has no true italic).

## 3. Bilingual architecture

```
/            → 307 → /en or /bn   (cookie NEXT_LOCALE → Accept-Language → English)
/shop        → 307 → /{locale}/shop   (every pre-i18n URL keeps working)
/en/...  /bn/...  storefront    · app/[locale]/(store)/…  (root layout sets <html lang>)
/admin/...        admin (English) · app/(admin)/admin/…   (separate root layout)
/api/...          unchanged
```

- `src/proxy.ts`: locale detection and redirects. It remembers the choice in a cookie and forwards the locale to Server Actions in an `x-ambr-locale` header.
- **UI strings:** `src/i18n/dictionaries/en.ts` and `bn.ts`. TypeScript and a unit test enforce identical keys and placeholders. Server Components use `getT()`; client components use `useI18n()`.
- **Content:** English stays on the existing rows. Bangla lives in `*Translation` tables, each with its **own `status` (DRAFT/PUBLISHED)**. A missing or draft translation falls back to English and is marked `lang="en"`, with a short notice on long pages.
- **Commerce:** the same product, SKU, stock and price in both languages. Prices show Bangla digits on `/bn` (same value). Phone numbers typed with Bangla digits are accepted. Checkout validation, server errors, payment pages, order pages and emails are localised. Each order stores its `locale`, so emails, payment callbacks and tracking links come back in the customer's language. Reviews keep the language they were written in (`Review.locale`).
- **Search:** matches English and **published** Bangla product names and descriptions, plus Bangla family, occasion and note names, from either language.
- **SEO:** a localised title and description per page, a per-locale canonical, `hreflang` alternates (`en`, `bn-BD`, `x-default`), a sitemap with alternates, `inLanguage` in structured data, and `robots.txt` disallowing private pages in both locales.

## 4. Admin (bilingual content management)
- **English | বাংলা** tabs on products, categories, collections, banners, content pages, FAQ and journal articles. The বাংলা tab has its own **Save draft / Publish / Unpublish** buttons and a status badge: *Missing translation / Draft / Published*. Saving one language never touches the other.
- **Translations overview** (`/admin/content/translations`) with Missing / Draft / Published filters.
- **Journal** admin (`/admin/content/journal`).
- New fields: product **Gender**, per-size **Format**; Bangla names for families, occasions, notes and delivery zones; Bangla homepage-section titles; Bangla store description, COD note and SEO defaults.
- New banner placements: **Discovery** (collection tiles) and **Story** (philosophy section).
- Two new items on the dashboard checklist: *Review Bangla translations* and *Review starter content in both languages*.
- Nothing is machine-translated. The **starter Bangla content** (pages, FAQ, banners, demo products) was written during development, like the English starter drafts, and is seeded as *Published* so both languages work out of the box. Please proofread it before launch.

## 5. Schema changes (additive; no data moved or removed)
Migrations `…_bilingual_editorial` and `…_shipping_zone_bn`: `Product.gender`, `ProductVariant.format` (existing attar sizes set to roll-on), the `TranslationStatus` enum, an extended `ProductTranslation`, the new `Category/Collection/Banner/ContentPage/Faq/ArticleTranslation` tables, `Article`, `nameBn`/`descriptionBn` on taxonomy, `ShippingZone.nameBn/estimatedDaysBn`, `HomepageSection.titleBn/subtitleBn`, `Order.locale`, `Review.locale`, `BannerPlacement` += `DISCOVERY`, `STORY`.

## 6. Verification (2026-10-25)
- `tsc` and ESLint are clean for the whole project.
- **Vitest: 65 passed.** New tests: dictionary key and placeholder parity, locale paths, Bangla digit and price formatting, Bangla-digit phone input, localised messages, editorial filters, Bangla content publish/fallback, Bangla search.
- **Playwright: 36 passed** (18 scenarios × Pixel 7 and desktop). New: Bangla `lang` attribute and hreflang; the language switch keeps the page and filters; the preference is remembered; the Bangla product page uses Bangla digits; Bangla search; a full **Bangla checkout** with Bangla validation and Bangla-digit phone input; the localised 404; old URLs redirect; For Him filtering; the signature finder.
- `next build` passes, with ISR pages for both locales. The Docker image builds at **384 MB**.

## 7. Known limitations
- A product can mix formats, but each size must be unique per product (e.g. a 10 ml spray *and* a 10 ml roll-on would need a schema change).
- Variant labels such as "10 ml" are shown as "১০ মিলি" on `/bn` automatically. Free-text labels are only digit-converted.
- Order snapshots (zone name, product names) keep the language of the moment the order was placed, so admin always sees the English snapshot.
