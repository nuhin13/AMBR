# Brand Asset Audit

**Source reviewed:** `AMBR_Full_Brand_Kit` (copied unchanged to `/brand/original/`)
**Reviewed:** 2026-10-25

## 1. Summary

The kit sets out a clear, consistent identity: a rising fragrance-ribbon symbol with a single four-point star, the "AMBR" serif wordmark, the "ABOVE ORDINARY" tagline between two rules, and a burgundy / blush-cream palette. The direction is strong and suits the "affordable premium" positioning.

However, **none of the files is production-ready for a website yet.** Every logo is a raster crop taken from a generated reference board. None has a transparent background, and the smaller variants are blurry and still contain caption text. The product photography is a generated render, not photos of real AMBR products.

The website can be built now using these files as **temporary stand-ins**, but proper source files are needed before launch (see §4).

## 2. File-by-file review

### 01_Logos

| File | Size | Finding | Usable for web? |
|------|------|---------|-----------------|
| `AMBR_Primary_Logo_Light.png` | 1520×1200 | Burgundy wordmark with a rose-gold ribbon. **A leaf-shadow photo background is baked in**, and there is no transparency. | ⚠️ Only as a full image block (e.g. the About page). Not usable in the nav bar. |
| `AMBR_Primary_Logo_Dark.png` | 1460×1200 | Cream wordmark on a burgundy gradient background. No transparency. | ⚠️ Usable only on matching burgundy blocks (e.g. the footer), with visible edges. |
| `AMBR_Primary_Logo_*.svg` | — | **Not real vectors.** Each is the PNG above, base64-embedded inside an `<svg>` wrapper. | ❌ Gives no benefit over the PNG. |
| `AMBR_Horizontal_Logo_Reference.png` | 1410×960 | Upscaled from a small crop: **visibly blurry**, the "Horizontal Logo" caption is baked in, and a cut-off "LOGO VARIATIONS" heading sits at the top edge. | ❌ Not usable. This is the variant the nav bar needs most. |
| `AMBR_Emblem_Reference.png` | 930×960 | Blurry upscale with the "Monogram Icon" caption baked in. | ❌ Not usable for a favicon or app icon. |

### 02_Banners & 03_Social_Media

| File | Finding |
|------|---------|
| `AMBR_Website_Banner_1920x800.png` | Two halves: the light logo (with its photo background) placed as a box on the left, and a generated bottle render on the right. The headline is set in a fallback serif, not Playfair Display. **Text baked into an image is bad for SEO, accessibility and mobile cropping.** The website hero will be built in HTML/CSS instead. |
| `AMBR_Product_Hero_Crop.png` (1200×1100) | Generated render of a square bottle with a burgundy cap. The label reads **"ABOVÉ ORDINARY"** (garbled accent) and **"EAU DE PARFUM 30 ML"**. |
| `AMBR_Hero_Product_Photo_Reference.png`, `*_Social_Product_Photo_Reference.png`, `AMBR_Instagram_Product_Photo_Reference.png` | Lower-resolution crops of the same renders. |
| Social banner / Instagram post / story | Marketing creatives. Not used on the website, except possibly as the Open Graph share image. |

### 04_Product_Labels

The three labels (30 ml perfume, 10 ml perfume oil, 3 ml perfume oil) contain the placeholder text "YOUR FRAGRANCE" and embed the logo **with its leaf-shadow background** as a rectangle. They are print drafts and are out of scope for the website. Note for print: the logo should sit on the label background directly, not as a photo box.

### 05_Brand_Guide

`AMBR_Brand_Colour_Guide.svg` is a true vector. It confirms the six colours, and they match the brief exactly:

| Token | Hex |
|-------|-----|
| Deep Burgundy | `#4A1022` |
| Dusty Rose | `#C9888B` |
| Blush Cream | `#F7E8E1` |
| Warm Beige | `#E6D3C7` |
| Champagne Gold | `#D4B08A` |
| Charcoal Brown | `#3A2A28` |

### 06_Editable_Canvas

`AMBR_Editable_Brand_Canvas.pptx` (7 slides) contains the same embedded PNGs. It adds no new source material.

### AMBR_Selected_Reference_Board.jpg

This is the master reference (1536×1024). It is the **only** place several things appear:

- the round **App/Favicon icon** variant
- the **stacked logo** variant
- a **category icon set** (Perfume, Attar, Body Mist, Car, Home, Pet fragrance) as thin line icons
- **brand-value icons** (Quality, Long-lasting, Affordable, For Everyone, Tradition)
- packaging (box, gift bag) and a body-mist bottle concept

These are too small to extract (each roughly 100 px). They need to be supplied as SVGs or redrawn by the brand's designer.

## 3. Issues that affect the website

1. **No transparent or vector logo exists.** The nav bar, footer, favicon, invoices, emails and Open Graph images all need one. The brief says the logo must not be redesigned, so **I will not trace or redraw it myself without your explicit permission.** See *missing-information.md* Q1.
2. **The product imagery is generated, not photographed.** Using a render as a product's listing image would show customers a bottle they will not receive, which is a trust and consumer-protection risk. The renders are acceptable **only as mood/hero imagery**, and only until real photography exists.
3. **"EAU DE PARFUM" label text.** The brief describes the inspired perfumes as *oil-based compositions in spray format*. "Eau de Parfum" is a recognised concentration term, normally for alcohol-based perfume at roughly 15–20 %. If the product is not that, the label is misleading. The website will use whatever product-type wording you confirm. Q4.
4. **The garbled "ABOVÉ"** on the render label means this image should not be used large or close-up.
5. **Unsupported claims on the reference board.** "Long Lasting Fragrances" and "Quality Ingredients" are performance or quality claims. The brief forbids unsupported claims, so the website's *Why AMBR* section will use wording that can be backed up (see design-direction.md §6).

## 4. What the temporary stand-ins will be

Until proper files arrive, development will use the following. Every stand-in is marked `TEMPORARY` in code, so it is easy to replace.

| Need | Temporary stand-in | Replace with |
|------|-------------------|--------------|
| Header logo | A cropped region of `AMBR_Primary_Logo_Light.png`, shown on a matching cream background | Transparent horizontal logo (SVG) |
| Footer logo | `AMBR_Primary_Logo_Dark.png` on a burgundy block | Transparent cream logo (SVG) |
| Favicon | Plain monogram letter **"A"** in burgundy. This is a typographic stand-in, **not** a logo substitute, and must be swapped before launch. | Emblem SVG → favicon set |
| Hero image | `AMBR_Product_Hero_Crop.png` (mood image, not linked to a product) | Real hero photography |
| Product images | A neutral blush-cream frame with the product name in text, clearly a placeholder | Real packshots |
