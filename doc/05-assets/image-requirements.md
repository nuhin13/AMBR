# Image & Asset Requirements

This is everything the website needs from you. Priority **P0** blocks a clean launch, **P1** is needed for launch quality, and **P2** can come later.

When the files are ready, put them in a shared folder (Drive/Dropbox) or in `/brand/incoming/` in this repository, using the folder names below.

## A. Logo files — `logo/` (P0)

| # | File | Format | Spec | Used for |
|---|------|--------|------|----------|
| A1 | Horizontal logo, burgundy (symbol left, wordmark right) | **SVG** + PNG | Transparent background, PNG ≥ 2000 px wide | Desktop header, invoices, emails |
| A2 | Horizontal logo, cream/light version | SVG + PNG | Transparent | Header on dark hero images |
| A3 | Primary stacked logo, burgundy | SVG + PNG | Transparent, PNG ≥ 2000 px | About page, mobile menu |
| A4 | Primary stacked logo, cream | SVG + PNG | Transparent | Footer (on burgundy) |
| A5 | Emblem (ribbon + star only), full-colour and one-colour burgundy | SVG | Transparent, square artboard | Favicon, app icon, loading mark, watermark |
| A6 | Round app/favicon icon (as on the reference board) | SVG or PNG 1024×1024 | | iOS/Android home-screen icon |
| A7 | Wordmark only, "AMBR" without the tagline | SVG | Transparent | Small spaces (mobile header under 120 px wide) |

> The logo is **not** redrawn by me unless you give explicit permission (see missing-information.md, Q1). Your designer's original files are strongly preferred.

## B. Product photography — `products/<product-slug>/` (P0 for every live product)

One set **per product**, plus size-specific shots where the bottle differs between sizes.

| # | Shot | Ratio / size | Notes |
|---|------|--------------|-------|
| B1 | **Front packshot** on a plain blush-cream (`#F7E8E1`) or white seamless background | **4:5, 2000×2500 px** | The main listing image. Same lighting, angle and scale for **every** product so the grid looks consistent. |
| B2 | 45° angle packshot | 4:5, 2000×2500 | Second image, shown on hover |
| B3 | Each size side by side (10 ml + 30 ml; or 3 + 5 + 10 ml roll-ons) | 4:5 | Helps customers understand the sizes |
| B4 | Close-up of the label and cap | 4:5 | |
| B5 | In-hand / scale shot | 4:5 | Very important for small attars |
| B6 | Box / packaging (if any) | 4:5 | |
| B7 | Roll-on applicator detail (attars only) | 4:5 | For the dedicated roll-on presentation |
| B8 | Mood shot with props suggesting the notes (e.g. citrus, wood, flowers) | 4:5 | Optional, but adds a lot to the product page |

**Photography rules:**

- These must be photos of the real product, not renders.
- No designer-brand bottles, boxes or logos in any frame.
- Light retouching only: dust removal and colour correction are fine, but do not change the liquid colour or fill level.
- Deliver JPG or PNG, sRGB, at the highest quality. The website handles compression automatically.

## C. Website imagery — `site/` (P1)

| # | Image | Desktop | Mobile | Notes |
|---|-------|---------|--------|-------|
| C1 | Homepage hero (2–3 options for rotation) | 2400×1050 (16:7) | 1080×1350 (4:5) | **No text in the image.** Headlines are live text. Leave calm space on the left (desktop) and top (mobile) for the text. |
| C2 | Category tile: Inspired Perfumes | 1200×1600 (3:4) | same | Spray bottle(s) |
| C3 | Category tile: Attar / Perfume Oil | 1200×1600 (3:4) | same | Roll-on(s) |
| C4 | Collection covers ×6 (Everyday, Office, Evening, Fresh & Clean, Signature, Gifts Under ৳1,000) | 1200×1600 | same | Lifestyle or styled flat-lay |
| C5 | Brand story / philosophy image | 1600×2000 | same | Lifestyle: person applying fragrance, a candid moment |
| C6 | About page images ×2–3 | 1600×1067 (3:2) | | Team, workspace, blending or quality-check process (only real ones) |
| C7 | Open Graph share image | 1200×630 | | Logo + mood image; the social banner from the kit can be adapted once the logo is fixed |
| C8 | Promo banner template | 2400×600 / 1080×1080 | | Optional, for campaigns |

## D. Icons — `icons/` (P1)

| # | Set | Format | Notes |
|---|-----|--------|-------|
| D1 | Category icons: Perfume, Attar, Body Mist, Car, Home, Pet (as on the reference board) | **SVG**, single-colour line icons, 1.5 px stroke | The board's versions are too small to extract. If your designer has none, a matching open-source line set (Lucide/Phosphor) is the fallback. |
| D2 | Fragrance family icons ×10 (Fresh, Woody, Floral, Sweet, Citrus, Aquatic, Spicy, Oriental, Musky, Gourmand) | SVG line | Optional. Coloured chips work without icons. |
| D3 | Why-AMBR value icons ×4 | SVG line | Optional |

## E. Third-party marks — no action needed from you

Payment logos (bKash, Nagad, Visa, Mastercard, Amex) and courier logos are taken from each provider's **official merchant brand kit** when the integrations are approved, and used according to their guidelines.

## F. What from the current kit is in use now (as built)

| Kit file | Where it's used | Status |
|----------|-----------------|--------|
| `AMBR_Brand_Colour_Guide.svg` | Source of the colour tokens in `src/app/globals.css` | ✅ Final |
| `AMBR_Primary_Logo_Dark.png` | → `public/brand/ambr-logo-cream*.png`: **only the burgundy background removed** (colour-to-alpha), artwork untouched. Used in the burgundy header, footer and emails. | ⚠️ Temporary until A1–A4 |
| ↳ ribbon + star cropped from the same file | → `public/brand/ambr-emblem-cream.png`, `src/app/icon.png`, `apple-icon.png` (favicon/app icon on burgundy) | ⚠️ Temporary until A5/A6 |
| `AMBR_Primary_Logo_Light.png` | Not used. Its leaf-shadow background can't be removed without altering the artwork, which is why the header is burgundy. | ❌ |
| `AMBR_Product_Hero_Crop.png` | → `public/images/temporary/hero-desktop.jpg` / `hero-mobile.jpg` (homepage hero, mood only) | ⚠️ Replace via Admin → Content → Banners |
| `AMBR_Instagram_Post_1080x1080.png` (right half) | → `category-perfumes.jpg` (Perfumes category tile) | ⚠️ Replace via Admin → Categories |
| `AMBR_Hero_Product_Photo_Reference.png` (right part) | → `brand-story.jpg` (homepage philosophy section) | ⚠️ Replace in code (`components/home/brand-story.tsx`) or ask for a CMS field |
| `AMBR_Social_Banner_1200x628.png` | → `public/images/og-default.jpg` (link previews on Facebook/WhatsApp) | ⚠️ Replace with C7 |
| Horizontal/emblem references, labels, social posts, PPTX | Not used | — |

**Products currently have no photos.** Each one shows an honest "Photo coming soon" placeholder until B1–B5 are uploaded in Admin → Products. The renders are never shown as product images.

## G. Delivery checklist

- [ ] A1–A7 logo files
- [ ] B1–B5 for every launch product (B6–B8 optional)
- [ ] C1 hero (at least 1), C2–C3 category tiles
- [ ] C4 collection covers (only for collections you will publish)
- [ ] C5 brand image, C6 about images
- [ ] D1 category icons
