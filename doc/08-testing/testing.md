# Testing

| Layer | Tool | Where | Run |
|-------|------|-------|-----|
| Unit | Vitest | `tests/unit` | `npm test` |
| Integration (real Postgres) | Vitest | `tests/integration` | `npm test` (uses the `ambr_test` database, migrated automatically) |
| End-to-end (mobile + desktop) | Playwright | `tests/e2e` | `npm run test:e2e` (needs the demo seed and a running app) |

## What is covered

**Unit (pure logic)**
- Pricing: percentage, fixed and free-shipping coupons; caps; minimum spend; expiry/not-yet-active/inactive/exhausted codes; discounts that never exceed the subtotal.
- Delivery: zone fee, free threshold (checked after discount), free-shipping coupon.
- Totals: lines − discount + delivery.
- Bangladesh phone validation and normalisation; BDT formatting (`৳1,25,000`).
- Order status machine, including "online orders can't be confirmed until paid".
- RBAC permission matrix.
- Checkout schema validation; catalogue URL-filter sanitising.

**Integration (database transactions)**
- **No overselling:** 12 concurrent checkouts against 5 units → exactly 5 succeed.
- A failed transaction rolls back its stock reservation.
- Stock adjustments can't go below reserved stock.
- Cancel releases stock; ship deducts stock; delivering a COD order marks it paid and counts the sale; return with restock; illegal transitions are rejected.
- Expired unpaid online orders are cancelled automatically and their stock released.
- Payment verification: paid only on an amount match; duplicate callbacks are idempotent; failures never mark an order paid.
- Coupons: a single-use code redeemed once under concurrency; per-customer limit by phone.

**End-to-end (Pixel 7 + desktop Chrome)**
- The homepage renders the brand, hero and best sellers.
- Hidden future categories return 404.
- Choosing a size updates the price.
- URL filters narrow the catalogue.
- A guest places a cash-on-delivery order.
- An invalid phone number is rejected at checkout.
- A wrong password shows an error.
- Non-staff users can't open `/admin`.

## Latest results (2026-10-25, after the redesign and bilingual work)
- `npm test`: **65 passed** (adds i18n parity/formatting tests and bilingual integration tests).
- `npx playwright test`: **36 passed** (18 scenarios × Pixel 7 + desktop, including `tests/e2e/bangla.spec.ts`). The E2E global setup resets rate-limit counters, because the suite places real demo orders.

## Manual QA checklist before launch
- [ ] Real phone (Android Chrome and iPhone Safari): browse → filter → product → add → checkout (COD)
- [ ] Each enabled gateway in sandbox: success, failure, cancel, closing the tab (IPN), and the 30-minute expiry
- [ ] Admin: create a product with images and sizes → appears on the site; archive → disappears
- [ ] Order lifecycle in the admin: confirm → dispatch → deliver; customer emails received
- [ ] Lighthouse mobile ≥ 90 on home, product and shop pages
