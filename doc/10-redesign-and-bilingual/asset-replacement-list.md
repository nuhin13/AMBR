# Asset Replacement List (Editorial Redesign)

The redesign never presents an AI render or stand-in photo as an AMBR product. Wherever real photography is missing, the layout falls back to typographic compositions. Upload the following to unlock the full editorial look.

| Priority | Where it appears | What to supply | Spec | Where to upload |
|----------|------------------|----------------|------|-----------------|
| **P0** | Product cards, product gallery, cart, discovery sets | Real packshots of every product: front, 45°, sizes side by side, in-hand, (roll-on detail for attars) | 4:5, 2000×2500 px, consistent light and background | Admin → Products → Images |
| **P0** | Header, footer, emails | Vector or transparent logo files (see `05-assets/image-requirements.md` A1–A7) | SVG + PNG ≥ 2000 px | Replace `/public/brand/*` |
| **P1** | Homepage hero | Campaign photograph (currently a temporary crop of the kit render, which shows the "EAU DE PARFUM" label) | Desktop ≥ 1600×1400 for the right-hand panel; mobile 1080×1350 | Admin → Content → Banners → *Homepage hero* |
| **P1** | "Discover the collections" | Four mood images: For Him, For Her, Unisex, Attar & Oils. **When at least one is uploaded, the section switches from the typographic index to the image composition.** | Tall 1600×2000 (first), others 1600×1280, panorama 2400×700 | Admin → Content → Banners → *Discovery* |
| **P1** | Brand philosophy | Atmospheric fragrance or lifestyle image (currently a temporary kit crop) | 1600×2000 portrait | Admin → Content → Banners → *Story* |
| **P1** | Discovery sets | Styled flat-lay of each set | 3:2, 2400×1600 | Admin → Products (the set product) |
| **P2** | Journal | Cover image per article | 16:9, 2400×1350 | Admin → Content → Journal |
| **P2** | Collections index | Optional thumbnail per collection | 3:2, 1200×800 | Admin → Collections |
| **P2** | Social sharing | Open Graph image per language (optional) | 1200×630 | `/public/images/og-default.jpg` |

Temporary files still in use: `/public/images/temporary/hero-*.jpg` (hero) and `brand-story.jpg` (story). The Discovery tiles no longer use any temporary photo.
