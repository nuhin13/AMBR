# Component Architecture

## Layers

```
components/
  ui/            # shadcn/ui primitives, restyled with AMBR tokens (Button, Input, Dialog, Sheet…)
  brand/         # Logo, Eyebrow, SectionHeading, GoldRule, NotesPyramid
  layout/        # Header, MobileNav, SearchOverlay, Footer, AnnouncementBar, Container, Breadcrumbs
  product/       # ProductCard, ProductGrid, ProductGallery, SizeSelector, PriceTag,
                 # StockIndicator, QuickViewModal, FamilyChip, RelatedProducts, ProductTabs
  catalog/       # FilterPanel, FilterDrawer, SortSelect, ViewToggle, ActiveFilters, Pagination
  cart/          # CartDrawer, CartLine, QuantityStepper, CouponField, OrderSummary
  checkout/      # CheckoutForm, AddressFields (District→Upazila), PhoneInput,
                 # DeliveryOptions, PaymentMethodPicker, PlaceOrderButton
  account/       # AccountNav, OrderList, OrderTimeline, AddressBook, WishlistGrid
  home/          # Hero, CategoryTiles, BestSellers, FragranceFinder, WhyAmbr,
                 # FeaturedCollections, BrandStory, ReviewsStrip, Newsletter
  reviews/       # ReviewList, ReviewForm (verified buyers only), RatingStars
  admin/         # AdminShell, Sidebar, DataTable, StatCard, SalesChart, ImageUploader,
                 # ProductForm, VariantTable, NotesEditor, OrderStatusControl, InvoiceView
  analytics/     # AnalyticsProvider, consent banner, event helpers
```

## Server vs client components

| Server (default; no JS shipped) | Client islands (`"use client"`) |
|---------------------------------|----------------------------------|
| Page shells, ProductGrid, ProductCard body, NotesPyramid, Footer, BrandStory, ReviewList, admin tables (initial render) | SizeSelector + AddToBag, CartDrawer, MobileNav, SearchOverlay, FilterDrawer, ProductGallery (swipe), QuantityStepper, CheckoutForm, FragranceFinder tabs, Newsletter form, admin forms and charts |

## Data flow

```
Page (server) ──► modules/*/queries (cached, tagged) ──► Prisma ──► Postgres
Client island ──► Server Action ──► Zod validate ──► auth/RBAC check ──► module service
                                                      (transaction) ──► revalidateTag()
Gateway/Courier ──► /api/* webhook ──► signature/query verify ──► module service
```

## Conventions

- One component per file, named exports, and props typed with explicit interfaces.
- Money is always rendered by `<Price amount={poisha} />`, which formats `৳1,250` (Bangla numerals when the locale is `bn`).
- Images are always rendered through `next/image` with explicit `sizes`. Alt text comes from the CMS, falling back to the product name and size.
- No component fetches data on the client for its first render.
