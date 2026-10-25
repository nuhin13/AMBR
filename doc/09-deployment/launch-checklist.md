# Launch Checklist

The admin dashboard shows a live version of this list.

## Brand & content
- [ ] Replace the logo with vector/transparent originals from your designer (`public/brand/`) — *the current files are the kit images with only the background removed*
- [ ] Upload real product photos for every product (see `05-assets/image-requirements.md`)
- [ ] Replace the temporary hero, category and brand-story images (`public/images/temporary/` → Admin → Content / Categories)
- [ ] Review the About page, the four policy pages, the FAQ and the fragrance guide (Admin → Content). The drafts include **return windows (48 hours / 7 days) that you must confirm**
- [ ] Decide how "inspired" products are named (see missing-information Q3) and the product-type wording (Q4)

## Business settings (Admin → Settings / Shipping / Payments)
- [ ] Store contact: phone, WhatsApp, email, address, hours, legal name, trade licence
- [ ] Facebook and Instagram links
- [ ] **Real delivery fees**, free-delivery thresholds and delivery estimates (the seeded ৳70/100/130 are placeholders)
- [ ] Payment methods: COD note; enable bKash/Nagad/Card once the credentials are live
- [ ] SEO default title and description

## Catalogue
- [ ] **Remove demo data** (Admin, or `npm run db:remove-demo`)
- [ ] Add real products: sizes, prices, opening stock, notes, families, occasions
- [ ] Mark best sellers and new arrivals; build collections
- [ ] Leave future categories hidden until their products are ready

## Technical
- [ ] Production environment variables set; `PAYMENT_MODE=live` only after the sandbox tests pass
- [ ] Domain and HTTPS live; www → apex redirect
- [ ] Gateway callbacks and courier webhooks registered
- [ ] Resend domain verified; send a test order email
- [ ] GA4, Meta Pixel and CAPI IDs set; Search Console verified; sitemap submitted
- [ ] Backups scheduled; one restore drill completed
- [ ] Uptime monitor on `/api/health`
- [ ] Owner password changed; staff accounts created with the right roles
- [ ] Place one real order with each live payment method, then refund or cancel it
