# Design Direction & Design System

## 1. Feel

**Editorial, warm, quiet luxury.** Think of a fragrance house's printed lookbook rather than a marketplace:

- generous blush-cream space
- burgundy serif headlines
- small letter-spaced caps (echoing "ABOVE ORDINARY")
- thin rules
- product photography doing the heavy lifting

Restraint is the premium signal. That means few colours per screen, almost no gradients, gold used as a hairline accent rather than a fill, and motion limited to subtle fades and drawer slides.

## 2. Colour tokens

| Token | Hex | Role |
|-------|-----|------|
| `--burgundy` | `#4A1022` | Primary: headings, primary buttons, footer, active states, price |
| `--cream` | `#F7E8E1` | Page background |
| `--beige` | `#E6D3C7` | Secondary surfaces: cards, filter panel, input fills, dividers |
| `--rose` | `#C9888B` | Highlights: badges, focus rings, hover underlines, illustrations |
| `--gold` | `#D4B08A` | Accent only: hairline rules, star icon, small ornaments, on-burgundy text |
| `--charcoal` | `#3A2A28` | Body text |
| `--white` | `#FFFFFF` | Product image wells only (for clean packshots) |

Functional colours (for errors and success) are derived from the palette: error `#9B2335` (a burgundy-red, distinct from the brand burgundy) and success `#4F6B4A` (muted olive). They are used sparingly and always with an icon and text, never colour alone.

### Accessibility rules (WCAG contrast, measured)

| Pairing | Ratio | Allowed use |
|---------|-------|-------------|
| Burgundy on Cream | 12.7 : 1 | ✅ All text |
| Charcoal on Cream | 11.4 : 1 | ✅ Body text |
| Burgundy / Charcoal on Beige | 10.5 / 9.4 : 1 | ✅ All text |
| Cream on Burgundy | 12.7 : 1 | ✅ Button labels, footer text |
| Gold on Burgundy | 7.5 : 1 | ✅ Footer headings, accent text on dark |
| Rose on Burgundy | 5.3 : 1 | ✅ Text on dark |
| Burgundy on Rose | 5.3 : 1 | ✅ Badge text |
| **Rose on Cream** | **2.4 : 1** | ❌ **Never for text.** Decorative only. |
| **Gold on Cream** | **1.7 : 1** | ❌ **Never for text.** Hairlines and ornaments only. |
| White on Rose | 2.9 : 1 | ❌ Never |

## 3. Typography

| Use | Font | Notes |
|-----|------|-------|
| Display & headings | **Playfair Display** (400/500, italic for accents) | As on the brand board. Used at restrained sizes, never bold-heavy. |
| Body & UI | **Montserrat** (400/500/600) | As on the brand board |
| Eyebrows / labels | Montserrat 500, UPPERCASE, `letter-spacing: 0.2em`, 11–12 px | Echoes "ABOVE ORDINARY" |
| Bangla (later) | **Noto Serif Bengali** for headings, **Hind Siliguri** for body | Pre-selected so the Bangla launch needs no redesign |

Fonts are self-hosted through `next/font`, which means no layout shift and no Google request at runtime.

**Type scale (mobile → desktop):**

| Style | Size |
|-------|------|
| Display | 36 → 64 px |
| H1 | 30 → 44 |
| H2 | 24 → 34 |
| H3 | 19 → 22 |
| Body | 15 → 16 |
| Small | 13 |
| Eyebrow | 11–12 |

Line length is capped at about 65 characters.

## 4. Shape, space & depth

- **Radius:** 2 px on buttons and inputs, 0 on images, 4 px on cards. This is deliberately not "rounded-card" Shopify style.
- **Spacing:** a 4 px base. Section padding is 64 px on mobile and 112 px on desktop.
- **Borders:** 1 px `beige`. Gold hairlines are reserved for section dividers.
- **Shadows:** almost none. Only overlays (drawer, modal) get a soft shadow.
- **Images:** product images are a fixed **4:5** ratio everywhere, so the grid never jumps. Category and collection tiles are 4:5 (mobile) and 3:4 (desktop). The hero is 4:5 on mobile and 16:7 on desktop.

## 5. Motion

150–250 ms ease-out fades, drawer slides, and a gentle image zoom on hover (desktop only). Everything respects `prefers-reduced-motion`. There are no parallax effects, carousels that auto-advance, or loading spinners on navigation.

## 6. Copy & claims guardrails

- **Why AMBR, approved wording:** "Carefully selected compositions", "Thoughtfully presented", "Priced for everyday wear", "A fragrance for every lifestyle", "Quality-checked before dispatch". The last one is used **only if** you confirm a QC step exists.
- **Avoid unless evidence is supplied:** "long-lasting", "8+ hours", "beast mode", "premium ingredients", "dermatologically tested", "same as the original".
- **Longevity/projection fields** appear on a product only when the admin has entered *tested* values with a test note. Otherwise the block is hidden, not shown as "N/A".
- **Inspired products:** never use designer logos, bottle shapes or brand names in titles or images. Wording follows Q3 in missing-information.md.
- **Ratings:** star ratings are hidden until a product has at least one approved verified-purchase review.

## 7. Component inventory (Phase 2)

| Group | Components |
|-------|------------|
| Primitives | Button (primary burgundy / secondary outline / text link), IconButton, Input, Textarea, Select, Checkbox, Radio, PhoneInput (+880), Badge (New, Best Seller, Sale, Low stock, Sold out), Price (with strike-through), Rating, Divider (gold hairline), Eyebrow, Skeleton, Toast |
| Overlays | Drawer (cart, mobile nav, filters), Modal (Quick View), Popover |
| Commerce | ProductCard (grid and list), SizeSelector (radio pills with price), QuantityStepper, AddToBagButton (loading/success/sold-out states), NotesPyramid, FamilyChip, OccasionChip, StockIndicator, CartLine, OrderSummary, CouponField, DeliveryEstimate, AddressForm (district → upazila), PaymentMethodPicker, OrderTimeline |
| Layout | Header, MobileNav, SearchOverlay, Footer, Breadcrumbs, Section, SectionHeading (eyebrow + title + rule), Container |
| Admin | DataTable, FilterBar, StatCard, Chart, ImageUploader, FormSection, StatusBadge, ConfirmDialog |

## 8. Signature element: the notes pyramid

On the product page, three stacked tiers form a soft pyramid outline in thin gold hairlines:

```
            ┌───────────┐
            │  TOP      │   Bergamot · Pink Pepper        (opens · first 15 min)
         ┌──┴───────────┴──┐
         │  HEART          │   Rose · Jasmine · Iris     (develops)
      ┌──┴─────────────────┴──┐
      │  BASE                 │   Amber · Musk · Vanilla (lingers)
      └───────────────────────┘
```

Each note is a small chip, with an optional small ingredient icon. On mobile the tiers stack full-width. The timing labels are general descriptions of how perfume notes behave, not product-specific claims.
