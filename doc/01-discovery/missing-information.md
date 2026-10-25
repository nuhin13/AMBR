# Missing Information — Questions for the Owner

The questions are ranked by how much they block work. **Phase 2–3 can start once Q1–Q4 are answered.** Everything else can be filled in through the admin panel or later phases.

## 🔴 Blocking (needed before design/build starts)

### Q1. Logo source files
The kit only has raster crops with baked-in backgrounds (see brand-asset-audit.md). Please choose one:
- **(a)** Send the original files from your designer: SVG/AI/EPS/PDF, or at minimum transparent PNGs at 2000 px+, for the primary, horizontal, emblem, and the light and dark versions; **or**
- **(b)** Explicitly authorise a *faithful vector trace* of the existing logo. That means the same shapes, proportions and letterforms, with no redesign, and you approve it before use.

Without (a) or (b), the nav-bar logo will look blurry or boxed.

### Q2. Approval of the architecture and design direction
Review `02-planning/technical-architecture.md`, `03-design/design-direction.md` and `03-design/homepage-wireframe.md`.

### Q3. How should "inspired" products be named?
Naming designer brands, e.g. "Inspired by Sauvage", carries trademark risk in Bangladesh and with Meta ad policies. Options:
- **(a)** Own names only (e.g. "AMBR Velour"), with **no** designer reference anywhere *(safest)*
- **(b)** Own name, plus a "scent profile similar to…" line in the description only, never in the title or ads
- **(c)** Something else that you have confirmed with legal advice

### Q4. Product type wording
The renders say **"Eau de Parfum"**, but the brief says the perfumes are *oil-based compositions in spray format*. What is the exact product type to show (e.g. "Perfume Oil Spray", "Extrait", "Eau de Parfum")? What concentration is it?

## 🟠 Needed before launch (can be added via admin; development continues)

### Q5. Real product photography
Do photos of the actual bottles exist? If not, see `05-assets/image-requirements.md` for the shot list. The generated renders will **not** be used as product listing images.

### Q6. Launch catalogue
For each product: name · category · family · top/heart/base notes · occasions · seasons · intensity · sizes · price per size · opening stock per size · any *tested* longevity/projection data (and how it was tested). A spreadsheet is fine, and an import template will be provided.

### Q7. Business and contact details
Legal business name · trade licence no. · registered address · support phone · WhatsApp number · support email · Facebook/Instagram URLs · business hours.

### Q8. Delivery rules
- Charges for Inside Dhaka, Dhaka suburbs (Savar, Gazipur, Narayanganj, Keraniganj?) and Outside Dhaka
- The free-delivery threshold, if any
- Delivery time promises
- Which courier(s) you will start with: Pathao, Steadfast, or both

### Q9. Policies
- Return/refund rules: the window in days, and whether opened bottles can be returned
- The COD advance/partial-payment rule, if any (many BD stores take the delivery charge in advance to reduce fake orders)
- The cancellation rule

## 🟡 Needed for the integration phase (Phase 6)

### Q10. Payment merchant accounts
Which of these do you already have, or have applied for?
- bKash **Merchant / PGW (Tokenized Checkout)** account. Note: a personal or "Send Money" number cannot be integrated.
- Nagad **Merchant** (Payment Gateway) account
- **SSLCommerz** store (for cards, and it can also cover bKash/Nagad as a single gateway)

All of these need a trade licence, a bank account and a live website with the policy pages. That is why the policy pages are built early.

### Q11. Courier merchant accounts
Pathao Merchant and/or Steadfast: API credentials once the accounts are approved.

### Q12. Hosting, domain and email
- Who controls the DNS for `ambrbd.com`, and where is it registered?
- Monthly hosting budget (see architecture §8 for options)
- An email address for sending order mail, e.g. `orders@ambrbd.com`

### Q13. Bangla
Do you want Bangla content at launch, or English at launch with Bangla later? The architecture supports both either way.

### Q14. Marketing IDs
GA4 Measurement ID, Meta Pixel ID, and Meta CAPI access token. These are needed when the integrations go live.
