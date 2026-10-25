# Website Sitemap

All URLs are lowercase and use hyphenated slugs. Locale prefixes (`/bn/...`) will be added when Bangla launches; English stays at the root.

## Storefront (public)

```
/                                   Home
/shop                               All products (filters + sort via ?query)
/shop?family=woody&occasion=office  ← filter state lives in the URL (shareable)
/perfumes                           Category: Inspired Perfumes
/attar                              Category: Attar / Perfume Oil
/category/[slug]                    Future categories (404 until activated)
/collections                        All published collections
/collections/[slug]                 One collection (e.g. /collections/office)
/discover                           Find Your Fragrance (family + occasion explorer)
/discover/[family]                  e.g. /discover/fresh → filtered listing
/product/[slug]                     Product details
/search?q=                          Search results
/cart                               Cart (also available as a slide-out drawer)
/checkout                           Checkout (guest or logged in)
/checkout/payment/[orderNo]         Redirect handoff to the gateway
/order/[orderNo]/confirmation       Order confirmation (token-protected for guests)
/track-order                        Track by order no. + phone number
/about                              About AMBR
/contact                            Contact (form + WhatsApp + map/hours)
/faq                                FAQ
/fragrance-guide                    Usage & safety information
/policies/shipping                  Shipping Policy
/policies/returns                   Return & Refund Policy
/policies/privacy                   Privacy Policy
/policies/terms                     Terms & Conditions
```

## Authentication

```
/login   /register   /forgot-password   /reset-password/[token]   /verify-email/[token]
```

## Customer account (login required)

```
/account                            Overview
/account/orders                     Order history
/account/orders/[orderNo]           Order details + tracking timeline
/account/addresses                  Saved addresses
/account/wishlist                   Wishlist
/account/profile                    Profile & password
```

## Admin (staff roles only, `noindex`)

```
/admin                              Dashboard (KPIs, charts, low stock)
/admin/orders            /admin/orders/[id]          (+ /invoice print view)
/admin/products          /admin/products/new         /admin/products/[id]
/admin/inventory                    Stock per variant, adjustments, movement log
/admin/categories                   Incl. activate/deactivate future categories
/admin/collections
/admin/fragrance-families  /admin/notes  /admin/occasions
/admin/customers         /admin/customers/[id]
/admin/reviews                      Moderation queue
/admin/promotions/coupons   /admin/promotions/campaigns
/admin/content/banners   /admin/content/pages   /admin/content/faq   /admin/content/homepage
/admin/shipping                     Zones, district mapping, rates, free threshold
/admin/payments                     Method on/off, payment log
/admin/newsletter                   Subscribers + CSV export
/admin/reports                      Sales / product / category / inventory + CSV
/admin/settings                     Store info, contact, social links, SEO defaults
/admin/staff                        Staff users & roles (OWNER only)
/admin/audit-log
```

## System routes

```
/api/payments/bkash/callback    /api/payments/nagad/callback
/api/payments/sslcommerz/ipn    /api/payments/sslcommerz/{success,fail,cancel}
/api/couriers/pathao/webhook    /api/couriers/steadfast/webhook
/api/cron/release-reservations  /api/cron/abandoned-carts
/sitemap.xml   /robots.txt   /manifest.webmanifest
```

## Navigation

- **Header:** Logo · Home · Shop · Perfumes · Attar · Collections · About AMBR · Contact · [Search] [Account] [Bag (count)]
- **Mobile:** Logo (centre) · menu drawer (left) · search + bag (right). A sticky "Add to Bag" bar on product pages.
- **Footer:** see the homepage wireframe, section 11.
