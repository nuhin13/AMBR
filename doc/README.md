# AMBR — Project Documentation

**Brand:** AMBR — *Above Ordinary.* · **Domain:** ambrbd.com · **Market:** Bangladesh

This folder holds the planning, design and architecture documents for the AMBR e-commerce platform. They are written in order, and each phase builds on the one before it.

**Current status (2026-10-25):** Phases 1–7 are built: storefront, accounts, checkout, admin dashboard, integrations in sandbox-ready form, and tests. The site runs locally with a clearly flagged demo catalogue. Phase 8 (production deployment) is documented and waits on the owner's accounts, domain access and real content. See the launch checklist.

## Index

| # | Folder / file | What it contains | Status |
|---|---------------|------------------|--------|
| 01 | [01-discovery/brand-asset-audit.md](01-discovery/brand-asset-audit.md) | Review of every file in the brand kit: what can be used, what can't, and why | ✅ Done |
| 01 | [01-discovery/requirements-summary.md](01-discovery/requirements-summary.md) | Condensed business requirements and non-negotiable rules | ✅ Done |
| 01 | [01-discovery/missing-information.md](01-discovery/missing-information.md) | **Questions the owner must answer** (ranked by how much they block work) | ⏳ Built with recommended defaults; answers still needed before launch |
| 02 | [02-planning/technical-architecture.md](02-planning/technical-architecture.md) | Final stack, hosting, module boundaries, payment/courier/security design | ✅ Built |
| 02 | [02-planning/sitemap.md](02-planning/sitemap.md) | Every public, account and admin route | ✅ Built |
| 02 | [02-planning/implementation-roadmap.md](02-planning/implementation-roadmap.md) | Phases 1–8 with deliverables and exit criteria | ✅ Built |
| 03 | [03-design/design-direction.md](03-design/design-direction.md) | Colour tokens, typography, accessibility rules, component inventory | ✅ Built |
| 03 | [03-design/homepage-wireframe.md](03-design/homepage-wireframe.md) | Mobile and desktop homepage wireframes, section by section | ✅ Built |
| 03 | [03-design/component-architecture.md](03-design/component-architecture.md) | UI component tree and folder structure | ✅ Built |
| 04 | [04-database/erd.md](04-database/erd.md) | Database ERD (Mermaid), entity notes, constraints, transaction boundaries | ✅ Built |
| 05 | [05-assets/image-requirements.md](05-assets/image-requirements.md) | **Every image/asset needed**, with specs and priority | ⏳ Owner to supply |
| 06 | [06-api/api-reference.md](06-api/api-reference.md) | Server actions, route handlers, permissions | ✅ |
| 07 | [07-integrations/integrations.md](07-integrations/integrations.md) | bKash, Nagad, SSLCommerz, Pathao, Steadfast, email, images, analytics | ✅ Sandbox-ready |
| 08 | [08-testing/testing.md](08-testing/testing.md) | Test strategy, coverage, latest results, manual QA | ✅ |
| 09 | [09-deployment/deployment-guide.md](09-deployment/deployment-guide.md) | Vercel/VPS deployment, domain, monitoring, security | ✅ |
| 09 | [09-deployment/backup-and-recovery.md](09-deployment/backup-and-recovery.md) | Backups, restore drill, recovering from mistakes | ✅ |
| 09 | [09-deployment/launch-checklist.md](09-deployment/launch-checklist.md) | Everything to finish before going live | ⏳ Owner |

## Related folders in the repository

- `/brand/original/` — an **untouched** copy of the brand kit supplied by the owner (source of truth; never edited).
- `/public/brand/` — web-ready logo files: the kit's dark-background logo with **only its background removed** (artwork untouched), plus an emblem crop used for the favicon. Replace these when vector originals arrive.
- `/public/images/temporary/` — mood crops from the kit renders, used for the hero, category and brand-story images until real photography exists.
