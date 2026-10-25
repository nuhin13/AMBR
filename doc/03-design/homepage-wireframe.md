# Homepage Wireframe

The mobile layout is designed first, at 375 px width. The desktop version (≥ 1280 px) follows. Each section can be shown, hidden and reordered from **Admin → Content → Homepage**, and all copy and images in it can be edited there.

## Mobile (375 px)

```
┌─────────────────────────────────┐
│ ▔ Free delivery over ৳X · COD ▔ │  0. Announcement bar (admin text, dismissible)
├─────────────────────────────────┤
│ ☰        [ AMBR logo ]    🔍 👜2 │  1. Header (sticky, shrinks on scroll)
├─────────────────────────────────┤
│                                 │
│        [ hero image 4:5 ]       │  2. Hero
│                                 │
│  MORE THAN A FRAGRANCE          │     eyebrow
│  A Feeling.                     │     Playfair, burgundy
│  Discover fragrances that       │
│  express your personality…      │
│  [ Explore Perfumes ]           │     primary (burgundy)
│  [ Discover Attars  ]           │     secondary (outline)
├─────────────────────────────────┤
│  SHOP BY CATEGORY ───           │  3. Categories (2 tall tiles, side by side)
│ ┌─────────────┐ ┌─────────────┐ │
│ │  [img 4:5]  │ │  [img 4:5]  │ │
│ │ Inspired    │ │ Attar /     │ │
│ │ Perfumes →  │ │ Perfume Oil→│ │
│ └─────────────┘ └─────────────┘ │
├─────────────────────────────────┤
│  BEST SELLERS ───      View all │  4. Best sellers (horizontal swipe on mobile)
│ ┌──────────┐ ┌──────────┐ ┌──   │
│ │[img 4:5] │ │[img 4:5] │ │     │
│ │♡ BEST    │ │          │ │     │
│ │Velour    │ │Noir Oud  │ │     │
│ │Woody     │ │Oriental  │ │     │
│ │from ৳350 │ │from ৳180 │ │     │
│ │10·30 ml  │ │3·5·10 ml │ │     │
│ │[Add 👜]  │ │[Add 👜]  │ │     │
│ └──────────┘ └──────────┘ └──   │
├─────────────────────────────────┤
│  FIND YOUR FRAGRANCE ───        │  5. Discovery
│  [ By scent ] [ By occasion ]   │     tab toggle
│  (Fresh)(Woody)(Floral)(Sweet)  │     chips wrap; tap → shows 4 matching
│  (Citrus)(Aquatic)(Spicy)…      │     products inline + "See all Woody →"
│  ┌──────┐┌──────┐               │
│  │ prod ││ prod │  …            │
│  └──────┘└──────┘               │
├─────────────────────────────────┤
│  WHY AMBR ───                   │  6. Why AMBR (4 items, 2×2, line icons)
│  ◇ Carefully    ◇ Priced for    │
│    selected       everyday      │
│  ◇ Every        ◇ Thoughtfully  │
│    lifestyle      presented     │
├─────────────────────────────────┤
│  COLLECTIONS ───                │  7. Featured collections (swipe cards)
│ ┌───────────────┐┌──────        │
│ │ [img 3:4]     ││              │
│ │ Office        ││ Evening      │
│ │ Collection →  ││              │
│ └───────────────┘└──────        │
├─────────────────────────────────┤
│ ███████ burgundy block ████████ │  8. Brand philosophy
│  Every Scent                    │     cream Playfair on burgundy
│  Tells Your Story.              │
│  At AMBR, we believe… (3 lines) │
│  Our story →                    │     gold link
├─────────────────────────────────┤
│  FROM OUR CUSTOMERS ───         │  9. Reviews (verified only)
│  ★★★★★  "…"                     │     HIDDEN entirely until ≥3 approved
│  — R.A. · Velour 30 ml · Oct 26 │     verified reviews exist
├─────────────────────────────────┤
│  Join the AMBR circle           │ 10. Newsletter
│  New scents & offers, rarely.   │
│  [ email or phone      ][Join]  │
├─────────────────────────────────┤
│ ███████ burgundy footer ███████ │ 11. Footer
│  [AMBR logo, cream]             │
│  More than a fragrance…         │
│  ▸ Shop          (accordions    │
│  ▸ Help            on mobile)   │
│  ▸ About                        │
│  ▸ Policies                     │
│  📞 · ✉ · WhatsApp              │
│  (f) (ig) (wa)                  │
│  [COD][bKash][Nagad][Cards]     │  only methods that are actually enabled
│  © 2026 AMBR. All rights…       │
└─────────────────────────────────┘
  [ 💬 WhatsApp ] floating button (bottom-right, sits above the sticky bar)
```

## Desktop (1280 px)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│               Free delivery inside Dhaka over ৳X · Cash on Delivery           │
├──────────────────────────────────────────────────────────────────────────────┤
│ [AMBR horizontal logo]  Home Shop Perfumes Attar Collections About Contact  🔍 👤 👜│
├──────────────────────────────────────┬───────────────────────────────────────┤
│                                      │                                       │
│  MORE THAN A FRAGRANCE               │                                       │
│  A Feeling.                          │        [ hero photography 16:7 ]      │
│  Discover fragrances that express…   │        (right ~55%, full bleed)       │
│  [Explore Perfumes] [Discover Attars]│                                       │
│                                      │                                       │
├──────────────────────────────────────┴───────────────────────────────────────┤
│  SHOP BY CATEGORY                                                             │
│  ┌───────────────────────────────┐   ┌───────────────────────────────┐        │
│  │  [ image 3:4 ]                 │   │  [ image 3:4 ]                 │        │
│  │  Inspired Perfumes · 10/30 ml →│   │  Attar · 3/5/10 ml →           │        │
│  └───────────────────────────────┘   └───────────────────────────────┘        │
├──────────────────────────────────────────────────────────────────────────────┤
│  BEST SELLERS                                                     View all → │
│  [card] [card] [card] [card]        ← 4 columns; Quick View on hover        │
├──────────────────────────────────────────────────────────────────────────────┤
│  FIND YOUR FRAGRANCE     [By scent | By occasion]                             │
│  chips row ……………………………………                 [4 matching product cards]       │
├──────────────────────────────────────────────────────────────────────────────┤
│  WHY AMBR    ◇ … │ ◇ … │ ◇ … │ ◇ …                       (4 columns, hairlines)│
├──────────────────────────────────────────────────────────────────────────────┤
│  COLLECTIONS  [ large tile 2/3 width ] [ tile ]                               │
│               [ tile ] [ tile ] [ tile ]                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│ ███ Every Scent Tells Your Story.  │  [ lifestyle image ]   ████████████████ │
├──────────────────────────────────────────────────────────────────────────────┤
│  FROM OUR CUSTOMERS   [review] [review] [review]   (hidden until reviews)    │
├──────────────────────────────────────────────────────────────────────────────┤
│  Join the AMBR circle  ────────────────  [ email ][ Subscribe ]              │
├──────────────────────────────────────────────────────────────────────────────┤
│ ███ [logo] blurb │ Shop │ Help │ About │ Policies │ Contact + socials ██████ │
│ ███ © 2026 AMBR · payment badges ███████████████████████████████████████████ │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Product card anatomy

```
┌──────────────────────┐
│ BEST SELLER      ♡   │  badge (max 1) · wishlist
│                      │
│     [ image 4:5 ]    │  hover (desktop): 2nd image + [Quick View]
│                      │
├──────────────────────┤
│ WOODY · AMBER        │  family eyebrow
│ Velour               │  Playfair 18px
│ Warm amber & soft    │  1-line description
│ vanilla              │
│ from ৳350   10 · 30ml│  starting price · sizes
│ ★ 4.8 (12)           │  only if verified reviews exist
│ [  Add to Bag  ]     │  adds the cheapest in-stock size; asks if ambiguous
└──────────────────────┘
```

## Behaviour notes

- **Add to Bag on a card** with more than one size opens a compact size sheet (a bottom sheet on mobile) rather than silently choosing a size.
- **Sold-out** variants stay visible but are disabled, with the label "Sold out". The product shows "Sold out" only when all of its variants are.
- **Empty sections hide themselves.** No best sellers flagged → the section is hidden. No collections → hidden. No reviews → hidden. There is never a dead block.
- The **WhatsApp button** opens `wa.me/<number>` with a pre-filled message. On product pages it includes the product name.
