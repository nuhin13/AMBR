# Implementation Roadmap

Each phase ends with a review. The next phase starts only after owner sign-off. Every phase adds its documentation to `/doc`.

## Phase 1 — Discovery & Planning ✅ (this delivery)
**Delivered:** brand asset audit, requirements summary, missing-information questions, architecture, ERD, sitemap, design direction, homepage wireframe, component architecture, image requirements.
**Exit:** the owner approves the architecture and design direction and answers Q1–Q4.

## Phase 2 — Foundation & Design System
- Scaffold Next.js + TS + Tailwind + shadcn/ui, lint/format, Vitest, Playwright, CI (GitHub Actions)
- Design tokens (colours, type scale, spacing, radii, shadows)
- Components: Button, Input, Select, Radio cards (size selector), Badge, Price, ProductCard, Drawer, Modal, Toast, Header, MobileNav, Footer, Breadcrumbs, Rating (shows nothing when there are no reviews), NotesPyramid, Skeletons
- A `/design-system` preview page (dev only)

**Exit:** the owner approves the components on a real phone and on desktop.

## Phase 3 — Storefront UI (connected to real DB reads)
Home, Shop with filters, Category, Collection, Discover, Product details, Cart drawer and page, Checkout UI, About, Contact, FAQ, Policies, Auth pages, Account pages.

The Prisma schema and demo seed are brought forward into this phase, so the pages render real data rather than hard-coded mockups.

**Exit:** every page is responsive at 360 / 768 / 1280 px, Lighthouse mobile scores ≥ 90 (Performance, Accessibility, SEO), and there are no dead links.

## Phase 4 — Backend & Commerce Logic
Auth (register, login, reset, sessions, RBAC) · catalog services · variant pricing · inventory with atomic deduction and the movement ledger · cart (guest cookie, merged into the user cart on login) · coupons · shipping zones and rates · checkout transaction · orders and status machine · COD end-to-end · emails · rate limiting · audit log · `.env.example` · API docs.

**Exit:** a COD order can be placed as a guest and as a user, stock decrements correctly, and overselling is proven impossible by a concurrency test.

## Phase 5 — Admin Dashboard
Dashboard KPIs and charts · product/variant/image CRUD · inventory adjustments · categories (including future-category activation) · collections · orders (filters, status updates, tracking numbers, printable invoice) · customers · reviews moderation · coupons and campaigns · CMS (banners, homepage sections, pages, FAQ, policies, settings) · shipping configuration · reports with CSV · staff and roles · audit log viewer.

**Exit:** the owner can run the store for one simulated week without touching code.

## Phase 6 — Integrations (sandbox first)
bKash Tokenized Checkout · Nagad PGW · SSLCommerz (cards) · Pathao and Steadfast consignment creation and status webhooks · GA4 · Meta Pixel + CAPI · Search Console verification · SMS notifications (optional).

**Exit:** each payment method passes the gateway's sandbox test cases, including failed, cancelled and timeout cases. Live keys are switched on only after merchant approval.

## Phase 7 — Testing & Hardening
Unit tests: pricing, coupon rules, shipping calculation, status machine, phone validation. Integration tests: checkout transaction, inventory concurrency, payment verification, RBAC. E2E (Playwright, mobile and desktop): browse → cart → checkout (COD and sandbox online), account, admin order flow. Accessibility audit (axe). Security checklist review. Load smoke test.

**Exit:** green CI and no open critical or high issues.

## Phase 8 — Deployment & Launch
Production environment · migrations · real catalogue import · DNS for `ambrbd.com` + HTTPS · email domain (SPF/DKIM/DMARC) · backups and a restore drill · Sentry and uptime monitoring · deployment guide · backup and recovery guide · owner handover session.

**Exit:** the site is live, a test order has been completed with each live payment method, and backups have been verified.
