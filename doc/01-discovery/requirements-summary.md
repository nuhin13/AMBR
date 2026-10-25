# Requirements Summary

A condensed version of the owner's brief, so it can be checked quickly during development. The full brief remains the authority.

## Business

- **AMBR** sells inspired perfumes and attars in Bangladesh. Tagline: *Above Ordinary.* Philosophy: *"More than a fragrance. A feeling."*
- Positioning: affordable premium, quality-focused, modern, young, accessible.
- Audience: students, young professionals, corporate staff, enthusiasts, attar users, gift buyers. Customers earn about BDT 50k/month and are price-conscious.
- Customers mostly arrive on mobile from Facebook and Instagram, so **mobile-first** design is the default.

## Catalogue at launch

| Category | Sizes | Key content |
|----------|-------|-------------|
| Inspired Perfumes (spray) | 10 ml, 30 ml | family, profile, top/heart/base notes, occasions, seasons, intensity, *tested* longevity/projection only when the data exists |
| Attar / Perfume Oil (roll-on) | 3 ml, 5 ml, 10 ml | profile, family, occasions, intensity, application method |

**Future categories** must exist in the database but stay hidden until activated in the admin: Body Mist, Car, Home, Pet, Mini, Gift Collections.

## Storefront

Homepage (11 sections) · Shop with filters and sort · Category pages · Collections · Product detail (gallery, size→price switch, notes pyramid, stock, Buy Now) · Cart · Guest checkout · Order tracking · Account (orders, addresses, wishlist) · About · Contact · FAQ · 4 policy pages.

## Commerce rules

- Currency BDT (৳). Bangladesh mobile validation (`01[3-9]XXXXXXXX`). District → upazila addresses.
- Payment methods: COD, bKash, Nagad, cards. **Official gateways only.** An order is never marked paid without server-side confirmation from the gateway.
- Delivery charges are configured by the admin (inside Dhaka / outside Dhaka / special / free-delivery threshold). Nothing is hard-coded.
- Courier integration architecture for Pathao and Steadfast.
- Inventory is tracked per variant (size), with a movement ledger. Overselling must be impossible on the server.
- Each order snapshots the product name, size and unit price at the time of purchase.

## Admin

Dashboard KPIs and charts · products, variants, images, notes, families, categories, collections · inventory · orders (status flow, history, courier tracking, invoices) · customers · coupons and campaigns · CMS (banners, pages, FAQ, policies) · reports with CSV export · audit log · role-based access.

## Non-negotiable rules (from brief §18)

1. No fake payments. 2. No fake reviews. 3. No invented performance data. 4. Never redesign the logo. 5. Never replace the brand colours. 6. Never expose secrets. 7. No placeholder presented as complete. 8. No dead buttons. 9. No frontend-only inventory or order logic. 10. Mobile responsiveness always. 11. Future categories hidden until activated. 12. No designer-brand logos or implied affiliation.

Demo seed data must be clearly marked as demo data.
