/**
 * AMBR seed script — idempotent (safe to run repeatedly).
 *
 *   npm run db:seed                      reference data + owner account
 *   SEED_DEMO=true npm run db:seed       …plus clearly-flagged DEMO products/collections
 *
 * Reference data: Bangladesh divisions/districts/upazilas, delivery zones, fragrance families,
 * occasions, categories (future categories HIDDEN), homepage sections, draft content pages, FAQ.
 * No reviews are ever seeded. No performance (longevity/projection) data is ever seeded.
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient, type CategoryType, type Intensity, type NoteTier, type Season } from "@prisma/client";
import { hash } from "@node-rs/argon2";

const db = new PrismaClient();
const tk = (taka: number) => taka * 100;
const slug = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// ───────────── Delivery zones (placeholder fees — owner must set real rates in Admin → Shipping) ─────────────
const ZONES = [
  { slug: "inside-dhaka", name: "Inside Dhaka", fee: tk(70), freeShippingThreshold: null, estimatedDays: "1–2 days", sortOrder: 0 },
  { slug: "dhaka-suburbs", name: "Dhaka Suburbs", fee: tk(100), freeShippingThreshold: null, estimatedDays: "2–3 days", sortOrder: 1 },
  { slug: "outside-dhaka", name: "Outside Dhaka", fee: tk(130), freeShippingThreshold: null, estimatedDays: "2–4 days", sortOrder: 2 },
];
const SUBURB_DISTRICTS = ["Gazipur", "Narayanganj"];
const SUBURB_UPAZILAS = ["Savar", "Dhamrai", "Keraniganj", "Nawabganj", "Dohar"];

async function seedGeography() {
  for (const z of ZONES) await db.shippingZone.upsert({ where: { slug: z.slug }, create: z, update: {} });
  const zones = Object.fromEntries((await db.shippingZone.findMany()).map((z) => [z.slug, z.id]));
  const geo: { name: string; bn: string; districts: { name: string; bn: string; upazilas: { name: string; bn: string | null; cityArea?: boolean }[] }[] }[] =
    JSON.parse(readFileSync(path.join(__dirname, "data", "bd-geo.json"), "utf8"));

  for (const div of geo) {
    const d = await db.division.upsert({ where: { name: div.name }, create: { name: div.name, nameBn: div.bn }, update: {} });
    for (const dist of div.districts) {
      const zone = dist.name === "Dhaka" ? zones["inside-dhaka"] : SUBURB_DISTRICTS.includes(dist.name) ? zones["dhaka-suburbs"] : zones["outside-dhaka"];
      const district = await db.district.upsert({
        where: { name: dist.name },
        create: { name: dist.name, nameBn: dist.bn, divisionId: d.id, shippingZoneId: zone },
        update: {},
      });
      for (const u of dist.upazilas) {
        const override = dist.name === "Dhaka" && SUBURB_UPAZILAS.includes(u.name) ? zones["dhaka-suburbs"] : null;
        await db.upazila.upsert({
          where: { districtId_name: { districtId: district.id, name: u.name } },
          create: { districtId: district.id, name: u.name, nameBn: u.bn, isCityArea: Boolean(u.cityArea), shippingZoneId: override },
          update: {},
        });
      }
    }
  }
}

// ───────────── Taxonomy ─────────────
const FAMILIES = [
  ["Fresh", "Clean, airy and bright — easy to wear in the heat."],
  ["Woody", "Cedar, sandalwood and vetiver — calm and grounded."],
  ["Floral", "Rose, jasmine and soft petals — elegant and expressive."],
  ["Sweet", "Soft, comforting sweetness."],
  ["Citrus", "Lemon, bergamot and mandarin — sparkling and uplifting."],
  ["Aquatic", "Sea air and cool water notes."],
  ["Spicy", "Cardamom, saffron and pepper — warm and confident."],
  ["Oriental", "Amber, resins and oud — rich and enveloping."],
  ["Musky", "Skin-like softness that stays close."],
  ["Gourmand", "Vanilla, caramel and tonka — edible warmth."],
];
const OCCASIONS = ["Office", "University", "Daily Wear", "Casual Outings", "Evening", "Special Occasions", "Gifts"];

const CATEGORIES: { slug: string; name: string; type: CategoryType; tagline: string; status: "ACTIVE" | "HIDDEN"; sortOrder: number; imageUrl?: string; description?: string }[] = [
  {
    slug: "perfumes",
    name: "Inspired Perfumes",
    type: "PERFUME",
    tagline: "Spray fragrances in 10 ml and 30 ml",
    description: "Our perfumes are independent compositions inspired by well-loved fragrance profiles — made to be worn every day.",
    status: "ACTIVE",
    sortOrder: 0,
    imageUrl: "/images/temporary/category-perfumes.jpg",
  },
  {
    slug: "attar",
    name: "Attar & Perfume Oil",
    type: "ATTAR",
    tagline: "Roll-on perfume oils in 3, 5 and 10 ml",
    description: "Concentrated perfume oils in roll-on bottles — a little goes a long way.",
    status: "ACTIVE",
    sortOrder: 1,
  },
  // Future categories — exist in the database but stay HIDDEN until activated in Admin → Categories.
  { slug: "body-mist", name: "Body Mist", type: "BODY_MIST", tagline: "Light, all-over freshness", status: "HIDDEN", sortOrder: 2 },
  { slug: "car-fragrance", name: "Car Fragrance", type: "CAR", tagline: "Scents for the drive", status: "HIDDEN", sortOrder: 3 },
  { slug: "home-fragrance", name: "Home Fragrance", type: "HOME", tagline: "Make home smell like you", status: "HIDDEN", sortOrder: 4 },
  { slug: "pet-fragrance", name: "Pet Fragrance", type: "PET", tagline: "Gentle freshness for pets", status: "HIDDEN", sortOrder: 5 },
  { slug: "mini-fragrance", name: "Mini Fragrance", type: "MINI", tagline: "Try before you commit", status: "HIDDEN", sortOrder: 6 },
  { slug: "gift-collections", name: "Gift Collections", type: "GIFT", tagline: "Thoughtful gift sets", status: "HIDDEN", sortOrder: 7 },
];

async function seedTaxonomy() {
  for (const [i, [name, description]] of FAMILIES.entries()) {
    await db.fragranceFamily.upsert({ where: { slug: slug(name) }, create: { slug: slug(name), name, description, sortOrder: i }, update: {} });
  }
  for (const [i, name] of OCCASIONS.entries()) {
    await db.occasion.upsert({ where: { slug: slug(name) }, create: { slug: slug(name), name, sortOrder: i }, update: {} });
  }
  for (const c of CATEGORIES) {
    await db.category.upsert({ where: { slug: c.slug }, create: c, update: {} });
  }
}

// ───────────── Content ─────────────
const PAGES: { slug: string; title: string; seoDescription: string; body: string }[] = [
  {
    slug: "about",
    title: "About AMBR",
    seoDescription: "AMBR believes fragrance is part of who you are. Discover our story and our approach to accessible, everyday luxury.",
    body: `<p>AMBR began with a simple belief: a fragrance is more than a smell — it is a feeling. It is the confidence you carry into a presentation, the memory someone keeps of you, the quiet signature of your everyday life.</p>
<p>Yet for many of us, beautiful fragrance has felt out of reach — priced for a few, not made for the way we actually live. We started AMBR to change that.</p>
<h2>What we make</h2>
<p>We create <strong>inspired perfumes</strong> — independent compositions that take their direction from well-loved international fragrance profiles — and <strong>attars and perfume oils</strong>, the concentrated perfume-oil tradition that has scented our region for generations.</p>
<h2>How we work</h2>
<ul><li>We select every composition carefully before it joins our collection.</li><li>We describe each scent honestly — its family, its notes, its character — so you can choose with confidence.</li><li>We price fairly, because smelling good should be part of everyday life, not a special occasion.</li></ul>
<h2>Our independence</h2>
<p>AMBR is an independent brand. Our inspired fragrances are our own compositions and are not affiliated with, endorsed by, or connected to any designer fragrance house.</p>
<p><em>AMBR — Above Ordinary.</em></p>`,
  },
  {
    slug: "shipping-policy",
    title: "Shipping Policy",
    seoDescription: "Delivery areas, charges and timelines for AMBR orders across Bangladesh.",
    body: `<p>We deliver across Bangladesh through trusted courier partners.</p>
<h2>Delivery charges</h2><p>Delivery charges depend on your district and area and are shown at checkout before you place your order. When a free-delivery offer applies, you will see it in your order summary.</p>
<h2>Delivery time</h2><p>The estimated delivery time for your area is shown at checkout. Most orders are dispatched within one working day after confirmation. Delays can occur during public holidays, severe weather or courier disruptions — we will keep you informed.</p>
<h2>Order confirmation</h2><p>For cash-on-delivery orders, our team may call or message you to confirm your order before dispatch. Please keep your phone reachable.</p>
<h2>Tracking</h2><p>Once your order is shipped you can follow it on the <a href="/track-order">Track Order</a> page using your order number and phone number.</p>
<h2>Failed delivery</h2><p>If the courier cannot reach you after repeated attempts, the parcel may be returned to us. Please contact us to arrange re-delivery.</p>`,
  },
  {
    slug: "return-policy",
    title: "Return & Refund Policy",
    seoDescription: "How returns, replacements and refunds work at AMBR.",
    body: `<p>We want you to love your AMBR fragrance. If something isn't right, we'll help.</p>
<h2>Damaged, leaking or incorrect items</h2><p>Please check your parcel when it arrives. If an item is damaged, leaking or not what you ordered, contact us within <strong>48 hours of delivery</strong> with your order number and a photo or short video. We will arrange a replacement or refund at no cost to you.</p>
<h2>Change of mind</h2><p>For hygiene reasons, fragrances that have been opened or used cannot be returned for change of mind. Unopened items in their original condition may be returned within 7 days of delivery; the return delivery charge is paid by the customer.</p>
<h2>Refunds</h2><p>Approved refunds are issued to the original payment method (bKash, Nagad or card) or, for cash-on-delivery orders, to a bKash/Nagad number you provide. Refunds are usually processed within 7 working days after approval.</p>
<h2>How to request</h2><p>Message us on WhatsApp or through the <a href="/contact">contact page</a> with your order number.</p>`,
  },
  {
    slug: "privacy-policy",
    title: "Privacy Policy",
    seoDescription: "How AMBR collects, uses and protects your personal information.",
    body: `<p>This policy explains what information we collect when you use ambrbd.com and how we use it.</p>
<h2>What we collect</h2><ul><li>Order details: your name, phone number, delivery address and, optionally, email.</li><li>Account details if you create an account (your password is stored only as a secure hash).</li><li>Basic technical data such as IP address and browser type, used for security and fraud prevention.</li><li>If enabled, anonymous analytics (Google Analytics, Meta Pixel) to understand how the site is used.</li></ul>
<h2>How we use it</h2><p>To process and deliver your orders, contact you about them, prevent fraud, and — only if you subscribe — send news and offers. You can unsubscribe at any time.</p>
<h2>Who we share it with</h2><p>Only with the partners needed to complete your order: our courier partners (name, phone, address) and payment gateways (bKash, Nagad, SSLCommerz). We never sell your personal data. Card details are entered on the payment gateway's secure page and never reach our servers.</p>
<h2>Your choices</h2><p>You can view and update your details in your account, or contact us to request a copy or deletion of your data, subject to records we must keep by law.</p>`,
  },
  {
    slug: "terms",
    title: "Terms & Conditions",
    seoDescription: "The terms that apply when you shop at AMBR.",
    body: `<p>By placing an order on ambrbd.com you agree to these terms.</p>
<h2>Products</h2><p>AMBR inspired fragrances are independent compositions inspired by fragrance profiles. They are not the original designer products and AMBR is not affiliated with any designer brand. Product images are for illustration; colours may vary slightly between screens and batches.</p>
<h2>Prices and payment</h2><p>All prices are in Bangladeshi Taka (৳) and include applicable taxes unless stated otherwise. Online payments are confirmed only after the payment gateway verifies them. We may cancel orders affected by obvious pricing errors and will refund any payment in full.</p>
<h2>Orders</h2><p>We may contact you to confirm an order and may cancel orders that cannot be confirmed or appear fraudulent.</p>
<h2>Use and safety</h2><p>Please read the usage and safety guidance on each product page and our <a href="/fragrance-guide">fragrance guide</a> before use.</p>
<h2>Contact</h2><p>Questions about these terms? <a href="/contact">Contact us</a>.</p>`,
  },
  {
    slug: "fragrance-guide",
    title: "Fragrance Guide — Usage & Safety",
    seoDescription: "How to apply perfume and attar, and how to use and store fragrance safely.",
    body: `<h2>Applying perfume spray</h2><p>Spray from about 15 cm onto pulse points — neck, wrists, inner elbows — or onto clothing. Let it settle rather than rubbing it in. Start with two or three sprays; you can always add more.</p>
<h2>Applying attar</h2><p>Roll a small amount onto pulse points or onto the back of the hand and transfer. Attar is concentrated — one or two touches are usually enough.</p>
<h2>Understanding notes</h2><p><strong>Top notes</strong> are what you smell first. <strong>Heart notes</strong> emerge as the fragrance settles. <strong>Base notes</strong> are the foundation that stays the longest. How a fragrance develops varies with skin, weather and fabric.</p>
<h2>Safety</h2><ul><li>Follow the application instructions on each product.</li><li>Avoid direct skin application where a product is intended for clothing use.</li><li>Avoid contact with eyes. If contact occurs, rinse with clean water.</li><li>Do not apply to broken or irritated skin. Stop using a product if irritation occurs.</li><li>Fragrance oils can mark some fabrics — test on an inconspicuous area first, especially on silk and light colours.</li><li>Keep out of reach of children.</li><li>Perfume sprays are flammable — keep away from heat, sparks and open flames.</li></ul>
<h2>Storage</h2><p>Store bottles upright, tightly closed, in a cool, dark place away from direct sunlight and heat. Avoid leaving fragrance in a hot car.</p>`,
  },
];

const FAQS: [string, string, string][] = [
  ["Orders & Delivery", "How long does delivery take?", "The estimated delivery time for your area is shown at checkout. Most orders are dispatched within one working day after confirmation."],
  ["Orders & Delivery", "How much is delivery?", "Delivery charges depend on your district and area and are shown at checkout before you confirm your order."],
  ["Orders & Delivery", "How can I track my order?", "Use the Track Order page with your order number and the phone number you used at checkout. Signed-in customers can also see orders in their account."],
  ["Payments", "Which payment methods do you accept?", "Cash on Delivery is available across Bangladesh. Online payment options appear at checkout when they are available."],
  ["Payments", "Is it safe to pay online?", "Yes. Online payments are processed on the official payment gateway's secure page. We never see or store your PIN or card details."],
  ["Products", "What does “inspired” mean?", "Our inspired perfumes are independent AMBR compositions that take their direction from well-loved fragrance profiles. They are not the original designer products and we are not affiliated with any designer brand."],
  ["Products", "What is the difference between perfume and attar?", "Our perfumes are sprays, easy to apply on skin or clothing. Attars are concentrated perfume oils in roll-on bottles — a small amount is enough and they sit closer to the skin."],
  ["Products", "Which size should I choose?", "Smaller sizes are perfect for trying a scent or carrying with you. Larger sizes offer better value once you've found a favourite."],
  ["Returns", "What if my bottle arrives damaged?", "Contact us within 48 hours of delivery with your order number and a photo. We'll arrange a replacement or refund."],
];

async function seedContent() {
  for (const p of PAGES) await db.contentPage.upsert({ where: { slug: p.slug }, create: p, update: {} });
  if ((await db.faqItem.count()) === 0) {
    await db.faqItem.createMany({ data: FAQS.map(([category, question, answer], i) => ({ category, question, answer, sortOrder: i })) });
  }
  const sections = ["categories", "bestSellers", "discover", "whyAmbr", "collections", "story", "reviews", "newsletter"];
  for (const [i, key] of sections.entries()) await db.homepageSection.upsert({ where: { key }, create: { key, sortOrder: i }, update: {} });

  if ((await db.banner.count({ where: { placement: "HOME_HERO" } })) === 0) {
    await db.banner.create({
      data: {
        placement: "HOME_HERO",
        eyebrow: "More than a fragrance",
        title: "A Feeling.",
        subtitle: "Discover fragrances that express your personality, elevate your everyday moments, and stay with you.",
        imageDesktop: "/images/temporary/hero-desktop.jpg",
        imageMobile: "/images/temporary/hero-mobile.jpg",
        imageAlt: "An AMBR perfume bottle on warm stone with deep red flowers",
        ctaLabel: "Explore Perfumes",
        ctaHref: "/perfumes",
        cta2Label: "Discover Attars",
        cta2Href: "/attar",
      },
    });
  }
  if ((await db.banner.count({ where: { placement: "ANNOUNCEMENT" } })) === 0) {
    await db.banner.create({ data: { placement: "ANNOUNCEMENT", title: "Cash on delivery across Bangladesh", ctaLabel: "Shop now", ctaHref: "/shop" } });
  }
}

async function seedOwner() {
  const email = (process.env.SEED_OWNER_EMAIL ?? "owner@ambr.local").toLowerCase();
  const password = process.env.SEED_OWNER_PASSWORD ?? (process.env.NODE_ENV === "production" ? undefined : "ChangeMe!2026");
  if (!password) throw new Error("Set SEED_OWNER_PASSWORD to create the owner account in production.");
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return;
  await db.user.create({
    data: {
      email,
      name: "AMBR Owner",
      role: "OWNER",
      passwordHash: await hash(password, { memoryCost: 19456, timeCost: 2, parallelism: 1, outputLen: 32 }),
    },
  });
  console.log(`  ✓ Owner account created: ${email}${process.env.SEED_OWNER_PASSWORD ? "" : " / ChangeMe!2026  ← change this password after first login"}`);
}

// ───────────── DEMO data (only with SEED_DEMO=true) ─────────────
type DemoProduct = {
  name: string;
  category: "perfumes" | "attar";
  short: string;
  description: string;
  families: string[];
  notes: Record<Lowercase<NoteTier>, string[]>;
  occasions: string[];
  seasons: Season[];
  intensity: Intensity;
  variants: [number, number, number][]; // [ml, price ৳, stock]
  bestSeller?: boolean;
  newArrival?: boolean;
};

const PERFUME_USAGE = "Spray 2–3 times from about 15 cm onto pulse points or clothing. Let it settle — don't rub.";
const ATTAR_USAGE = "Roll gently onto wrists, neck or behind the ears. One or two touches are enough.";
const SAFETY = "Avoid contact with eyes. Do not apply to broken or irritated skin. Test on an inconspicuous area of fabric first. Keep away from children, heat and open flames.";

const DEMO_PRODUCTS: DemoProduct[] = [
  {
    name: "Velour",
    category: "perfumes",
    short: "Warm amber wrapped in soft vanilla and cedar.",
    description: "Velour opens with a bright lift of bergamot and pink pepper before settling into polished cedar and powdery iris. The base is a warm, enveloping blend of amber, vanilla and musk — a scent for evenings that deserve to be remembered.",
    families: ["Woody", "Oriental"],
    notes: { top: ["Bergamot", "Pink Pepper"], heart: ["Cedarwood", "Iris"], base: ["Amber", "Vanilla", "Musk"] },
    occasions: ["Evening", "Special Occasions", "Gifts"],
    seasons: ["WINTER", "MONSOON"],
    intensity: "STRONG",
    variants: [[10, 350, 30], [30, 850, 15]],
    bestSeller: true,
  },
  {
    name: "Monsoon Linen",
    category: "perfumes",
    short: "Clean sea air and fresh linen after the rain.",
    description: "Monsoon Linen captures the cool freshness of rain-washed air: crisp lemon and sea notes over a soft heart of lavender and neroli, drying down to a clean white musk. Easy, light and endlessly wearable.",
    families: ["Fresh", "Aquatic"],
    notes: { top: ["Sea Notes", "Lemon"], heart: ["Lavender", "Neroli"], base: ["White Musk", "Ambrette"] },
    occasions: ["Office", "University", "Daily Wear"],
    seasons: ["SUMMER", "MONSOON"],
    intensity: "LIGHT",
    variants: [[10, 350, 40], [30, 850, 4]],
    bestSeller: true,
    newArrival: true,
  },
  {
    name: "Citrine Hour",
    category: "perfumes",
    short: "Sparkling citrus with a calm green-tea heart.",
    description: "A burst of bergamot, mandarin and grapefruit that feels like the first hour of a bright morning. Green tea and petitgrain keep it composed; vetiver and musk give it quiet depth.",
    families: ["Citrus", "Fresh"],
    notes: { top: ["Bergamot", "Mandarin", "Grapefruit"], heart: ["Green Tea", "Petitgrain"], base: ["Vetiver", "Musk"] },
    occasions: ["Office", "Daily Wear", "Casual Outings"],
    seasons: ["SUMMER"],
    intensity: "MODERATE",
    variants: [[10, 320, 25], [30, 780, 12]],
  },
  {
    name: "Rose Ledger",
    category: "perfumes",
    short: "Juicy lychee and rose over a soft patchouli base.",
    description: "Rose Ledger pairs sweet lychee and a pinch of pink pepper with a lush heart of rose and peony. Patchouli and musk give the florals a modern, confident finish.",
    families: ["Floral", "Sweet"],
    notes: { top: ["Lychee", "Pink Pepper"], heart: ["Rose", "Peony"], base: ["Patchouli", "Musk"] },
    occasions: ["Evening", "Gifts", "Casual Outings"],
    seasons: ["ALL_YEAR"],
    intensity: "MODERATE",
    variants: [[10, 350, 20], [30, 850, 10]],
    newArrival: true,
  },
  {
    name: "Velvet Spice",
    category: "perfumes",
    short: "Saffron, cardamom and oud — rich and confident.",
    description: "Velvet Spice opens with cardamom and saffron, warms through cinnamon and rose, and settles into a deep base of oud and amber. Made for cool evenings and grand occasions.",
    families: ["Spicy", "Oriental"],
    notes: { top: ["Cardamom", "Saffron"], heart: ["Cinnamon", "Rose"], base: ["Oud", "Amber"] },
    occasions: ["Evening", "Special Occasions"],
    seasons: ["WINTER"],
    intensity: "STRONG",
    variants: [[10, 380, 0], [30, 920, 8]],
  },
  {
    name: "Oud Noor",
    category: "attar",
    short: "Saffron and rose resting on deep oud and sandalwood.",
    description: "A classic, concentrated attar: radiant saffron, a heart of rose, and a deep foundation of oud and creamy sandalwood. Traditional in spirit, refined in character.",
    families: ["Oriental", "Woody"],
    notes: { top: ["Saffron"], heart: ["Rose"], base: ["Oud", "Sandalwood"] },
    occasions: ["Special Occasions", "Evening", "Gifts"],
    seasons: ["WINTER", "ALL_YEAR"],
    intensity: "STRONG",
    variants: [[3, 220, 50], [5, 340, 35], [10, 620, 20]],
    bestSeller: true,
  },
  {
    name: "White Musk",
    category: "attar",
    short: "Soft, clean musk that sits close to the skin.",
    description: "A gentle, everyday attar of soft pear and lily of the valley over a clean white musk. Comforting, quiet and easy to wear anywhere.",
    families: ["Musky", "Fresh"],
    notes: { top: ["Pear"], heart: ["Lily of the Valley"], base: ["White Musk"] },
    occasions: ["Daily Wear", "University", "Office"],
    seasons: ["ALL_YEAR"],
    intensity: "LIGHT",
    variants: [[3, 180, 60], [5, 280, 45], [10, 520, 25]],
    bestSeller: true,
  },
  {
    name: "Mitti Sandal",
    category: "attar",
    short: "Earthy petrichor and vetiver over creamy sandalwood.",
    description: "Inspired by the scent of first rain on warm earth, Mitti Sandal blends a petrichor accord and vetiver with smooth sandalwood. Grounding and nostalgic.",
    families: ["Woody", "Fresh"],
    notes: { top: ["Petrichor Accord"], heart: ["Vetiver"], base: ["Sandalwood"] },
    occasions: ["Daily Wear", "Casual Outings"],
    seasons: ["MONSOON", "SUMMER"],
    intensity: "MODERATE",
    variants: [[3, 200, 40], [5, 300, 3], [10, 560, 15]],
    newArrival: true,
  },
  {
    name: "Vanilla Dusk",
    category: "attar",
    short: "Caramel and tonka melting into warm vanilla.",
    description: "A cosy gourmand attar: soft caramel and tonka bean over a warm base of vanilla and benzoin. Sweet without being heavy.",
    families: ["Gourmand", "Sweet"],
    notes: { top: ["Caramel"], heart: ["Tonka Bean"], base: ["Vanilla", "Benzoin"] },
    occasions: ["Casual Outings", "Evening", "Gifts"],
    seasons: ["WINTER"],
    intensity: "MODERATE",
    variants: [[3, 190, 30], [5, 290, 20], [10, 540, 10]],
  },
];

const DEMO_COLLECTIONS: { name: string; description: string; products: string[]; featured: boolean }[] = [
  { name: "Everyday Essentials", description: "Easy, versatile scents for every day.", products: ["Monsoon Linen", "White Musk", "Citrine Hour", "Mitti Sandal"], featured: true },
  { name: "Office Collection", description: "Polished, considerate fragrances for work.", products: ["Citrine Hour", "Monsoon Linen", "White Musk"], featured: true },
  { name: "Evening Collection", description: "Deeper, richer scents for after dark.", products: ["Velour", "Velvet Spice", "Oud Noor", "Rose Ledger"], featured: true },
  { name: "Fresh & Clean", description: "Bright, airy scents for warm days.", products: ["Monsoon Linen", "Citrine Hour", "Mitti Sandal"], featured: true },
  { name: "Signature Collection", description: "The fragrances that define AMBR.", products: ["Velour", "Oud Noor", "Rose Ledger"], featured: false },
  { name: "Gifts Under ৳1,000", description: "Thoughtful gifts that don't overspend.", products: ["Velour", "Rose Ledger", "Oud Noor", "Vanilla Dusk", "White Musk"], featured: false },
];

async function seedDemo() {
  const cats = Object.fromEntries((await db.category.findMany()).map((c) => [c.slug, c.id]));
  const fams = Object.fromEntries((await db.fragranceFamily.findMany()).map((f) => [f.name, f.id]));
  const occs = Object.fromEntries((await db.occasion.findMany()).map((o) => [o.name, o.id]));

  for (const p of DEMO_PRODUCTS) {
    const s = slug(p.name);
    if (await db.product.findUnique({ where: { slug: s } })) continue;
    const isAttar = p.category === "attar";
    const product = await db.product.create({
      data: {
        slug: s,
        name: p.name,
        categoryId: cats[p.category],
        shortDescription: p.short,
        description: `<p>${p.description}</p>`,
        productType: isAttar ? "Attar · Roll-on" : "Perfume · Spray",
        intensity: p.intensity,
        seasons: p.seasons,
        applicationMethod: isAttar ? "Roll-on" : "Spray",
        usageInstructions: isAttar ? ATTAR_USAGE : PERFUME_USAGE,
        safetyNote: SAFETY,
        status: "PUBLISHED",
        isBestSeller: Boolean(p.bestSeller),
        isNewArrival: Boolean(p.newArrival),
        isDemo: true,
        publishedAt: new Date(),
        families: { create: p.families.map((f, i) => ({ familyId: fams[f], isPrimary: i === 0 })) },
        occasions: { create: p.occasions.map((o) => ({ occasionId: occs[o] })) },
        variants: {
          create: p.variants.map(([ml, price, stock], i) => ({
            sku: `DEMO-${s.toUpperCase().slice(0, 10)}-${ml}ML`,
            sizeMl: ml,
            label: `${ml} ml`,
            price: tk(price),
            sortOrder: i,
            inventory: { create: { onHand: stock, lowStockThreshold: 5 } },
          })),
        },
      },
      include: { variants: true },
    });
    for (const v of product.variants) {
      const inv = await db.inventory.findUniqueOrThrow({ where: { variantId: v.id } });
      if (inv.onHand > 0) {
        await db.inventoryMovement.create({ data: { variantId: v.id, type: "PURCHASE_IN", quantity: inv.onHand, onHandAfter: inv.onHand, reservedAfter: 0, reason: "Demo opening stock" } });
      }
    }
    for (const tier of ["top", "heart", "base"] as const) {
      for (const [i, n] of p.notes[tier].entries()) {
        const note = await db.fragranceNote.upsert({ where: { slug: slug(n) }, create: { slug: slug(n), name: n }, update: {} });
        await db.productNote.create({ data: { productId: product.id, noteId: note.id, tier: tier.toUpperCase() as NoteTier, sortOrder: i } });
      }
    }
  }

  const products = Object.fromEntries((await db.product.findMany({ where: { isDemo: true } })).map((p) => [p.name, p.id]));
  for (const [i, c] of DEMO_COLLECTIONS.entries()) {
    const s = slug(c.name.replace("৳", "bdt "));
    if (await db.collection.findUnique({ where: { slug: s } })) continue;
    await db.collection.create({
      data: {
        slug: s,
        name: c.name,
        description: c.description,
        status: "PUBLISHED",
        isFeatured: c.featured,
        sortOrder: i,
        products: { create: c.products.filter((n) => products[n]).map((n, j) => ({ productId: products[n], sortOrder: j })) },
      },
    });
  }

  await db.coupon.upsert({
    where: { code: "DEMO10" },
    create: { code: "DEMO10", description: "[DEMO] 10% off orders over ৳800 (max ৳150)", type: "PERCENT", value: 10, maxDiscount: tk(150), minSubtotal: tk(800) },
    update: {},
  });
  console.log(`  ✓ Demo catalogue: ${DEMO_PRODUCTS.length} products, ${DEMO_COLLECTIONS.length} collections, coupon DEMO10 (all flagged as demo)`);
}

async function main() {
  console.log("Seeding AMBR…");
  await seedGeography();
  console.log("  ✓ Geography & delivery zones");
  await seedTaxonomy();
  console.log("  ✓ Families, occasions, categories (6 future categories hidden)");
  await seedContent();
  console.log("  ✓ Pages, FAQ, homepage sections, banners");
  await seedOwner();
  if (process.env.SEED_DEMO === "true") await seedDemo();
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
