/**
 * Bilingual + editorial starter content (idempotent). Called from seed.ts.
 *
 * Starter Bangla content was written during development, like the English starter drafts, and
 * is seeded as PUBLISHED so both languages work out of the box. The admin launch checklist asks
 * the owner to review it. Nothing is machine-translated at runtime; translations created later
 * in the admin start as DRAFT and are only published by an administrator.
 */
import type { Gender, PrismaClient } from "@prisma/client";

const tk = (n: number) => n * 100;

const FAMILIES_BN: Record<string, [string, string]> = {
  fresh: ["ফ্রেশ", "পরিষ্কার, হালকা ও উজ্জ্বল — গরমে সহজে ব্যবহারযোগ্য।"],
  woody: ["উডি", "সিডার, চন্দন ও ভেটিভার — শান্ত ও স্থির।"],
  floral: ["ফ্লোরাল", "গোলাপ, জুঁই ও কোমল পাপড়ি — মার্জিত ও প্রকাশময়।"],
  sweet: ["মিষ্টি", "কোমল, আরামদায়ক মিষ্টতা।"],
  citrus: ["সাইট্রাস", "লেবু, বারগামট ও কমলা — ঝলমলে ও প্রাণবন্ত।"],
  aquatic: ["অ্যাকুয়াটিক", "সমুদ্রের হাওয়া আর শীতল জলের নোট।"],
  spicy: ["স্পাইসি", "এলাচ, জাফরান ও মরিচ — উষ্ণ ও আত্মবিশ্বাসী।"],
  oriental: ["ওরিয়েন্টাল", "অ্যাম্বার, রেজিন ও উদ — গভীর ও জড়ানো।"],
  musky: ["মাস্কি", "ত্বকের মতো কোমল, কাছাকাছি থাকে।"],
  gourmand: ["গুরম্যান্ড", "ভ্যানিলা, ক্যারামেল ও টোনকা — মিষ্টি উষ্ণতা।"],
};

const OCCASIONS_BN: Record<string, string> = {
  office: "অফিস",
  university: "বিশ্ববিদ্যালয়",
  "daily-wear": "প্রতিদিন",
  "casual-outings": "ঘোরাঘুরি",
  evening: "সন্ধ্যা",
  "special-occasions": "বিশেষ উপলক্ষ",
  gifts: "উপহার",
};

const NOTES_BN: Record<string, string> = {
  Bergamot: "বারগামট", "Pink Pepper": "গোলাপি মরিচ", Cedarwood: "সিডারউড", Iris: "আইরিস", Amber: "অ্যাম্বার", Vanilla: "ভ্যানিলা", Musk: "মাস্ক",
  "Sea Notes": "সামুদ্রিক নোট", Lemon: "লেবু", Lavender: "ল্যাভেন্ডার", Neroli: "নেরোলি", "White Musk": "হোয়াইট মাস্ক", Ambrette: "অ্যামব্রেট",
  Mandarin: "ম্যান্ডারিন", Grapefruit: "গ্রেপফ্রুট", "Green Tea": "গ্রিন টি", Petitgrain: "পেটিটগ্রেইন", Vetiver: "ভেটিভার", Lychee: "লিচু", Rose: "গোলাপ",
  Peony: "পিওনি", Patchouli: "প্যাচুলি", Cardamom: "এলাচ", Saffron: "জাফরান", Cinnamon: "দারুচিনি", Oud: "উদ", Sandalwood: "চন্দন", Pear: "নাশপাতি",
  "Lily of the Valley": "লিলি অব দ্য ভ্যালি", "Petrichor Accord": "বৃষ্টিভেজা মাটি", Caramel: "ক্যারামেল", "Tonka Bean": "টোনকা বিন", Benzoin: "বেনজয়েন",
};

const CATEGORIES_BN: Record<string, { name: string; tagline: string; description?: string }> = {
  perfumes: { name: "ইন্সপায়ার্ড পারফিউম", tagline: "১০ মিলি ও ৩০ মিলি স্প্রে", description: "আমাদের পারফিউমগুলো জনপ্রিয় সুবাস-প্রোফাইল থেকে অনুপ্রাণিত স্বতন্ত্র কম্পোজিশন — প্রতিদিন ব্যবহারের জন্য।" },
  attar: { name: "আতর ও পারফিউম অয়েল", tagline: "৩, ৫ ও ১০ মিলি রোল-অন", description: "রোল-অন বোতলে ঘন পারফিউম অয়েল — অল্পেই যথেষ্ট।" },
  "body-mist": { name: "বডি মিস্ট", tagline: "সারা গায়ে হালকা সতেজতা" },
  "car-fragrance": { name: "কার ফ্রেগ্রেন্স", tagline: "পথের সঙ্গী সুবাস" },
  "home-fragrance": { name: "হোম ফ্রেগ্রেন্স", tagline: "ঘর হোক আপনার মতো" },
  "pet-fragrance": { name: "পেট ফ্রেগ্রেন্স", tagline: "পোষা প্রাণীর জন্য কোমল সতেজতা" },
  "mini-fragrance": { name: "মিনি ফ্রেগ্রেন্স", tagline: "আগে চেখে দেখুন" },
  "gift-collections": { name: "গিফট কালেকশন", tagline: "যত্নে সাজানো উপহার সেট" },
  "discovery-sets": { name: "ডিসকভারি সেট", tagline: "ছোট সাইজে একাধিক সুবাস", description: "নিজের সিগনেচার খুঁজতে বা উপহার দিতে — একসাথে কয়েকটি সুবাস।" },
};

const COLLECTIONS_BN: Record<string, [string, string]> = {
  "everyday-essentials": ["প্রতিদিনের প্রিয়", "সহজ, বহুমুখী সুবাস — প্রতিদিনের জন্য।"],
  "office-collection": ["অফিস কালেকশন", "পরিপাটি, সংযত সুবাস — কাজের দিনের জন্য।"],
  "evening-collection": ["সন্ধ্যার কালেকশন", "গাঢ়, সমৃদ্ধ সুবাস — সন্ধ্যার পরের জন্য।"],
  "fresh-and-clean": ["ফ্রেশ ও ক্লিন", "উজ্জ্বল, হালকা সুবাস — গরমের দিনের জন্য।"],
  "signature-collection": ["সিগনেচার কালেকশন", "যে সুবাসগুলো AMBR-কে চেনায়।"],
  "gifts-under-bdt-1-000": ["৳১,০০০-এর মধ্যে উপহার", "বাজেটের মধ্যে যত্নের উপহার।"],
};

const PRODUCT_GENDER: Record<string, Gender> = {
  velour: "MASCULINE", "monsoon-linen": "UNISEX", "citrine-hour": "MASCULINE", "rose-ledger": "FEMININE", "velvet-spice": "MASCULINE",
  "oud-noor": "UNISEX", "white-musk": "FEMININE", "mitti-sandal": "UNISEX", "vanilla-dusk": "FEMININE",
  "perfume-discovery-set": "UNISEX", "attar-trio": "UNISEX",
};

const PERFUME_USAGE_BN = "প্রায় ১৫ সেমি দূর থেকে পালস পয়েন্ট বা কাপড়ে ২–৩ বার স্প্রে করুন। ঘষবেন না, স্থির হতে দিন।";
const ATTAR_USAGE_BN = "কবজি, গলা বা কানের পেছনে আলতো করে রোল করুন। এক-দুবারই যথেষ্ট।";
const SAFETY_BN = "চোখের সংস্পর্শ এড়িয়ে চলুন। কাটা বা জ্বালাযুক্ত ত্বকে ব্যবহার করবেন না। কাপড়ে ব্যবহারের আগে অদৃশ্য অংশে পরীক্ষা করুন। শিশু, তাপ ও আগুন থেকে দূরে রাখুন।";

const PRODUCTS_BN: Record<string, { short: string; description: string }> = {
  velour: { short: "নরম ভ্যানিলা আর সিডারে মোড়া উষ্ণ অ্যাম্বার।", description: "ভেলুর শুরু হয় বারগামট আর গোলাপি মরিচের উজ্জ্বলতায়, তারপর থিতু হয় মসৃণ সিডার আর পাউডারি আইরিসে। শেষে থাকে অ্যাম্বার, ভ্যানিলা ও মাস্কের উষ্ণ, জড়ানো ভিত্তি — মনে রাখার মতো সন্ধ্যার সুবাস।" },
  "monsoon-linen": { short: "বৃষ্টির পর পরিষ্কার সমুদ্র-হাওয়া আর তাজা লিনেন।", description: "মনসুন লিনেন ধরে রাখে বৃষ্টিধোয়া বাতাসের শীতল সতেজতা: ঝকঝকে লেবু আর সামুদ্রিক নোট, তার নিচে ল্যাভেন্ডার ও নেরোলির কোমল হৃদয়, শেষে পরিষ্কার হোয়াইট মাস্ক। সহজ, হালকা, সারাদিন ব্যবহারযোগ্য।" },
  "citrine-hour": { short: "ঝলমলে সাইট্রাস, শান্ত গ্রিন টি-র হৃদয়।", description: "বারগামট, ম্যান্ডারিন আর গ্রেপফ্রুটের ঝলক — যেন উজ্জ্বল সকালের প্রথম ঘণ্টা। গ্রিন টি আর পেটিটগ্রেইন একে সংযত রাখে; ভেটিভার ও মাস্ক দেয় শান্ত গভীরতা।" },
  "rose-ledger": { short: "রসালো লিচু আর গোলাপ, কোমল প্যাচুলির ওপর।", description: "রোজ লেজারে মিষ্টি লিচু আর এক চিমটি গোলাপি মরিচের সাথে মেলে গোলাপ ও পিওনির ভরা হৃদয়। প্যাচুলি ও মাস্ক ফুলের সুবাসকে দেয় আধুনিক, আত্মবিশ্বাসী সমাপ্তি।" },
  "velvet-spice": { short: "জাফরান, এলাচ আর উদ — সমৃদ্ধ ও আত্মবিশ্বাসী।", description: "ভেলভেট স্পাইস খোলে এলাচ ও জাফরানে, দারুচিনি আর গোলাপে উষ্ণ হয়, তারপর থিতু হয় উদ ও অ্যাম্বারের গভীর ভিত্তিতে। শীতের সন্ধ্যা আর বড় আয়োজনের জন্য।" },
  "oud-noor": { short: "গভীর উদ ও চন্দনের ওপর জাফরান আর গোলাপ।", description: "একটি ক্লাসিক, ঘন আতর: দীপ্ত জাফরান, গোলাপের হৃদয়, আর উদ ও ক্রিমি চন্দনের গভীর ভিত্তি। মনে ঐতিহ্যবাহী, চরিত্রে পরিশীলিত।" },
  "white-musk": { short: "কোমল, পরিষ্কার মাস্ক যা ত্বকের কাছাকাছি থাকে।", description: "প্রতিদিনের এক কোমল আতর: নরম নাশপাতি আর লিলি অব দ্য ভ্যালি, পরিষ্কার হোয়াইট মাস্কের ওপর। আরামদায়ক, শান্ত, যেকোনো জায়গায় ব্যবহারযোগ্য।" },
  "mitti-sandal": { short: "বৃষ্টিভেজা মাটি আর ভেটিভার, ক্রিমি চন্দনের ওপর।", description: "গরম মাটিতে প্রথম বৃষ্টির ঘ্রাণে অনুপ্রাণিত মিট্টি স্যান্ডেল মিলিয়েছে বৃষ্টিভেজা মাটির অ্যাকর্ড ও ভেটিভারকে মসৃণ চন্দনের সাথে। স্থির ও স্মৃতিময়।" },
  "vanilla-dusk": { short: "ক্যারামেল আর টোনকা মিশে যায় উষ্ণ ভ্যানিলায়।", description: "আরামদায়ক এক গুরম্যান্ড আতর: নরম ক্যারামেল ও টোনকা বিন, ভ্যানিলা আর বেনজয়েনের উষ্ণ ভিত্তির ওপর। মিষ্টি, কিন্তু ভারী নয়।" },
  "perfume-discovery-set": { short: "পাঁচটি পারফিউম, ৩ মিলি করে — সিগনেচার খোঁজার সহজ উপায়।", description: "ভেলুর, মনসুন লিনেন, সিট্রিন আওয়ার, রোজ লেজার ও ভেলভেট স্পাইস — প্রতিটি ৩ মিলি স্প্রেতে। কয়েক দিন ধরে ব্যবহার করে দেখুন, তারপর বেছে নিন আপনার প্রিয়টি।" },
  "attar-trio": { short: "তিনটি আতর, ৩ মিলি রোল-অনে — উপহারের জন্য দারুণ।", description: "উদ নূর, হোয়াইট মাস্ক ও মিট্টি স্যান্ডেল — প্রতিটি ৩ মিলি রোল-অনে, একটি বাক্সে।" },
};

const PAGES_BN: Record<string, { title: string; seoDescription: string; body: string }> = {
  about: {
    title: "AMBR সম্পর্কে",
    seoDescription: "AMBR বিশ্বাস করে সুবাস আপনার পরিচয়ের অংশ। জানুন আমাদের গল্প ও সহজলভ্য বিলাসিতার দর্শন।",
    body: `<p>AMBR শুরু হয়েছিল একটি সহজ বিশ্বাস থেকে: সুবাস শুধু একটি গন্ধ নয় — এটি একটি অনুভূতি। প্রেজেন্টেশনে যাওয়ার আত্মবিশ্বাস, কেউ আপনাকে যেভাবে মনে রাখে, আপনার প্রতিদিনের নীরব স্বাক্ষর।</p>
<p>তবুও আমাদের অনেকের কাছে সুন্দর সুবাস ছিল নাগালের বাইরে — অল্প কয়েকজনের দামে, আমাদের বাস্তব জীবনের জন্য নয়। AMBR শুরু করেছি সেটা বদলাতে।</p>
<h2>আমরা যা তৈরি করি</h2>
<p>আমরা তৈরি করি <strong>ইন্সপায়ার্ড পারফিউম</strong> — জনপ্রিয় আন্তর্জাতিক সুবাস-প্রোফাইল থেকে দিকনির্দেশনা নেওয়া স্বতন্ত্র কম্পোজিশন — এবং <strong>আতর ও পারফিউম অয়েল</strong>, যে ঘন পারফিউম-অয়েলের ঐতিহ্য প্রজন্ম ধরে আমাদের অঞ্চলকে সুবাসিত করেছে।</p>
<h2>আমরা যেভাবে কাজ করি</h2>
<ul><li>প্রতিটি কম্পোজিশন কালেকশনে যোগ করার আগে যত্নে বাছাই করি।</li><li>প্রতিটি সুবাসের ধরন, নোট ও চরিত্র সৎভাবে বর্ণনা করি, যাতে আপনি আত্মবিশ্বাসের সাথে বেছে নিতে পারেন।</li><li>ন্যায্য দাম রাখি, কারণ সুন্দর সুবাস প্রতিদিনের জীবনের অংশ হওয়া উচিত, শুধু বিশেষ দিনের নয়।</li></ul>
<h2>আমাদের স্বাতন্ত্র্য</h2>
<p>AMBR একটি স্বতন্ত্র ব্র্যান্ড। আমাদের ইন্সপায়ার্ড সুবাসগুলো আমাদের নিজস্ব কম্পোজিশন এবং কোনো ডিজাইনার পারফিউম হাউসের সাথে যুক্ত, অনুমোদিত বা সম্পর্কিত নয়।</p>
<p><em>AMBR — সাধারণের ঊর্ধ্বে।</em></p>`,
  },
  "shipping-policy": {
    title: "ডেলিভারি নীতি",
    seoDescription: "সারা বাংলাদেশে AMBR অর্ডারের ডেলিভারি এলাকা, চার্জ ও সময়।",
    body: `<p>বিশ্বস্ত কুরিয়ার পার্টনারের মাধ্যমে আমরা সারা বাংলাদেশে ডেলিভারি দিই।</p>
<h2>ডেলিভারি চার্জ</h2><p>ডেলিভারি চার্জ আপনার জেলা ও এলাকার ওপর নির্ভর করে এবং অর্ডার করার আগে চেকআউটে দেখানো হয়। ফ্রি ডেলিভারি অফার প্রযোজ্য হলে অর্ডারের সারসংক্ষেপে দেখতে পাবেন।</p>
<h2>ডেলিভারির সময়</h2><p>আপনার এলাকার আনুমানিক ডেলিভারি সময় চেকআউটে দেখানো হয়। বেশিরভাগ অর্ডার নিশ্চিত হওয়ার এক কর্মদিবসের মধ্যে পাঠানো হয়। সরকারি ছুটি, খারাপ আবহাওয়া বা কুরিয়ারের সমস্যায় দেরি হতে পারে — আমরা আপনাকে জানাব।</p>
<h2>অর্ডার নিশ্চিতকরণ</h2><p>ক্যাশ অন ডেলিভারি অর্ডারের ক্ষেত্রে পাঠানোর আগে আমাদের টিম কল বা মেসেজ করে অর্ডার নিশ্চিত করতে পারে। অনুগ্রহ করে ফোনটি সচল রাখুন।</p>
<h2>ট্র্যাকিং</h2><p>অর্ডার পাঠানোর পর অর্ডার নম্বর ও ফোন নম্বর দিয়ে <a href="/bn/track-order">অর্ডার ট্র্যাক</a> পাতায় দেখতে পারবেন।</p>
<h2>ডেলিভারি ব্যর্থ হলে</h2><p>বারবার চেষ্টা করেও কুরিয়ার আপনাকে না পেলে পার্সেল আমাদের কাছে ফেরত আসতে পারে। পুনরায় ডেলিভারির জন্য আমাদের সাথে যোগাযোগ করুন।</p>`,
  },
  "return-policy": {
    title: "রিটার্ন ও রিফান্ড নীতি",
    seoDescription: "AMBR-এ রিটার্ন, রিপ্লেসমেন্ট ও রিফান্ড যেভাবে কাজ করে।",
    body: `<p>আমরা চাই আপনি আপনার AMBR সুবাস ভালোবাসুন। কিছু ঠিক না থাকলে আমরা সাহায্য করব।</p>
<h2>ভাঙা, লিক করা বা ভুল পণ্য</h2><p>পার্সেল হাতে পেয়ে দেখে নিন। কোনো পণ্য ভাঙা, লিক করা বা ভুল হলে ডেলিভারির <strong>৪৮ ঘণ্টার মধ্যে</strong> অর্ডার নম্বর ও একটি ছবি বা ছোট ভিডিওসহ যোগাযোগ করুন। আমরা বিনা খরচে রিপ্লেসমেন্ট বা রিফান্ডের ব্যবস্থা করব।</p>
<h2>মত পরিবর্তন</h2><p>স্বাস্থ্যবিধির কারণে খোলা বা ব্যবহৃত সুবাস মত পরিবর্তনের জন্য ফেরত নেওয়া যায় না। মূল অবস্থায় না খোলা পণ্য ডেলিভারির ৭ দিনের মধ্যে ফেরত দেওয়া যাবে; ফেরতের ডেলিভারি চার্জ ক্রেতা বহন করবেন।</p>
<h2>রিফান্ড</h2><p>অনুমোদিত রিফান্ড মূল পেমেন্ট পদ্ধতিতে (বিকাশ, নগদ বা কার্ড) দেওয়া হয়; ক্যাশ অন ডেলিভারির ক্ষেত্রে আপনার দেওয়া বিকাশ/নগদ নম্বরে। অনুমোদনের পর সাধারণত ৭ কর্মদিবসের মধ্যে রিফান্ড সম্পন্ন হয়।</p>
<h2>কীভাবে অনুরোধ করবেন</h2><p>অর্ডার নম্বরসহ হোয়াটসঅ্যাপে বা <a href="/bn/contact">যোগাযোগ পাতা</a> থেকে মেসেজ করুন।</p>`,
  },
  "privacy-policy": {
    title: "গোপনীয়তা নীতি",
    seoDescription: "AMBR কীভাবে আপনার ব্যক্তিগত তথ্য সংগ্রহ, ব্যবহার ও সুরক্ষিত রাখে।",
    body: `<p>ambrbd.com ব্যবহারের সময় আমরা কী তথ্য সংগ্রহ করি এবং কীভাবে ব্যবহার করি, এই নীতিতে তা ব্যাখ্যা করা হয়েছে।</p>
<h2>যা সংগ্রহ করি</h2><ul><li>অর্ডারের তথ্য: আপনার নাম, ফোন নম্বর, ডেলিভারির ঠিকানা এবং ঐচ্ছিকভাবে ইমেইল।</li><li>অ্যাকাউন্ট খুললে অ্যাকাউন্টের তথ্য (পাসওয়ার্ড শুধু নিরাপদ হ্যাশ হিসেবে সংরক্ষিত হয়)।</li><li>নিরাপত্তা ও প্রতারণা রোধে আইপি ঠিকানা ও ব্রাউজারের ধরনসহ মৌলিক প্রযুক্তিগত তথ্য।</li><li>চালু থাকলে, সাইট কীভাবে ব্যবহৃত হয় বুঝতে বেনামি অ্যানালিটিক্স (Google Analytics, Meta Pixel)।</li></ul>
<h2>যেভাবে ব্যবহার করি</h2><p>আপনার অর্ডার প্রক্রিয়া ও ডেলিভারি, অর্ডার নিয়ে যোগাযোগ, প্রতারণা রোধ, এবং — শুধু সাবস্ক্রাইব করলে — খবর ও অফার পাঠাতে। যেকোনো সময় আনসাবস্ক্রাইব করতে পারেন।</p>
<h2>যাদের সাথে শেয়ার করি</h2><p>শুধু অর্ডার সম্পন্ন করতে প্রয়োজনীয় পার্টনারদের সাথে: কুরিয়ার পার্টনার (নাম, ফোন, ঠিকানা) এবং পেমেন্ট গেটওয়ে (বিকাশ, নগদ, SSLCommerz)। আমরা কখনো আপনার ব্যক্তিগত তথ্য বিক্রি করি না। কার্ডের তথ্য পেমেন্ট গেটওয়ের নিরাপদ পাতায় দেওয়া হয় এবং আমাদের সার্ভারে আসে না।</p>
<h2>আপনার পছন্দ</h2><p>আপনার অ্যাকাউন্টে তথ্য দেখতে ও হালনাগাদ করতে পারেন, অথবা আইনগতভাবে যা রাখতে হয় তা ছাড়া তথ্যের কপি বা মুছে ফেলার অনুরোধ জানাতে আমাদের সাথে যোগাযোগ করতে পারেন।</p>`,
  },
  terms: {
    title: "শর্তাবলি",
    seoDescription: "AMBR-এ কেনাকাটার শর্তাবলি।",
    body: `<p>ambrbd.com-এ অর্ডার করার মাধ্যমে আপনি এই শর্তাবলিতে সম্মত হচ্ছেন।</p>
<h2>পণ্য</h2><p>AMBR-এর ইন্সপায়ার্ড সুবাসগুলো সুবাস-প্রোফাইল থেকে অনুপ্রাণিত স্বতন্ত্র কম্পোজিশন। এগুলো মূল ডিজাইনার পণ্য নয় এবং AMBR কোনো ডিজাইনার ব্র্যান্ডের সাথে যুক্ত নয়। পণ্যের ছবি উদাহরণস্বরূপ; স্ক্রিন ও ব্যাচভেদে রঙ সামান্য ভিন্ন হতে পারে।</p>
<h2>দাম ও পেমেন্ট</h2><p>সব দাম বাংলাদেশি টাকায় (৳) এবং অন্যভাবে উল্লেখ না থাকলে প্রযোজ্য কর অন্তর্ভুক্ত। পেমেন্ট গেটওয়ে যাচাই করার পরই অনলাইন পেমেন্ট নিশ্চিত হয়। স্পষ্ট দামের ভুলে প্রভাবিত অর্ডার আমরা বাতিল করতে পারি এবং সম্পূর্ণ টাকা ফেরত দেব।</p>
<h2>অর্ডার</h2><p>অর্ডার নিশ্চিত করতে আমরা যোগাযোগ করতে পারি, এবং নিশ্চিত করা যায়নি বা প্রতারণামূলক মনে হয় এমন অর্ডার বাতিল করতে পারি।</p>
<h2>ব্যবহার ও নিরাপত্তা</h2><p>ব্যবহারের আগে প্রতিটি পণ্যের পাতায় থাকা ব্যবহার ও নিরাপত্তা নির্দেশনা এবং আমাদের <a href="/bn/fragrance-guide">সুবাস গাইড</a> পড়ুন।</p>
<h2>যোগাযোগ</h2><p>এই শর্তাবলি নিয়ে প্রশ্ন? <a href="/bn/contact">যোগাযোগ করুন</a>।</p>`,
  },
  "fragrance-guide": {
    title: "সুবাস গাইড — ব্যবহার ও নিরাপত্তা",
    seoDescription: "পারফিউম ও আতর কীভাবে লাগাবেন, এবং কীভাবে নিরাপদে ব্যবহার ও সংরক্ষণ করবেন।",
    body: `<h2>পারফিউম স্প্রে যেভাবে লাগাবেন</h2><p>প্রায় ১৫ সেমি দূর থেকে পালস পয়েন্টে — গলা, কবজি, কনুইয়ের ভাঁজে — বা কাপড়ে স্প্রে করুন। ঘষবেন না, স্থির হতে দিন। দুই-তিনবার দিয়ে শুরু করুন; প্রয়োজনে পরে আরও দেওয়া যায়।</p>
<h2>আতর যেভাবে লাগাবেন</h2><p>পালস পয়েন্টে বা হাতের উল্টো পিঠে অল্প পরিমাণে রোল করে ছড়িয়ে দিন। আতর ঘন — এক-দুবারই সাধারণত যথেষ্ট।</p>
<h2>নোট বোঝা</h2><p><strong>টপ নোট</strong> যা প্রথমে টের পান। <strong>হার্ট নোট</strong> সুবাস থিতু হলে ফুটে ওঠে। <strong>বেস নোট</strong> হলো ভিত্তি, যা সবচেয়ে বেশি সময় থাকে। ত্বক, আবহাওয়া ও কাপড়ভেদে সুবাসের বিকাশ ভিন্ন হয়।</p>
<h2>নিরাপত্তা</h2><ul><li>প্রতিটি পণ্যের ব্যবহারবিধি মেনে চলুন।</li><li>যে পণ্য কাপড়ে ব্যবহারের জন্য, তা সরাসরি ত্বকে দেবেন না।</li><li>চোখের সংস্পর্শ এড়িয়ে চলুন। লাগলে পরিষ্কার পানি দিয়ে ধুয়ে ফেলুন।</li><li>কাটা বা জ্বালাযুক্ত ত্বকে ব্যবহার করবেন না। জ্বালা হলে ব্যবহার বন্ধ করুন।</li><li>সুবাস-তেল কিছু কাপড়ে দাগ ফেলতে পারে — বিশেষ করে সিল্ক ও হালকা রঙে আগে অদৃশ্য অংশে পরীক্ষা করুন।</li><li>শিশুদের নাগালের বাইরে রাখুন।</li><li>পারফিউম স্প্রে দাহ্য — তাপ, স্ফুলিঙ্গ ও আগুন থেকে দূরে রাখুন।</li></ul>
<h2>সংরক্ষণ</h2><p>বোতল সোজা করে, শক্ত করে বন্ধ রেখে, সরাসরি রোদ ও তাপ থেকে দূরে ঠান্ডা, অন্ধকার জায়গায় রাখুন। গরম গাড়িতে সুবাস রেখে যাবেন না।</p>`,
  },
};

const FAQ_BN: Record<string, [string, string, string]> = {
  "How long does delivery take?": ["অর্ডার ও ডেলিভারি", "ডেলিভারিতে কত দিন লাগে?", "আপনার এলাকার আনুমানিক ডেলিভারি সময় চেকআউটে দেখানো হয়। বেশিরভাগ অর্ডার নিশ্চিত হওয়ার এক কর্মদিবসের মধ্যে পাঠানো হয়।"],
  "How much is delivery?": ["অর্ডার ও ডেলিভারি", "ডেলিভারি চার্জ কত?", "ডেলিভারি চার্জ আপনার জেলা ও এলাকার ওপর নির্ভর করে এবং অর্ডার নিশ্চিত করার আগে চেকআউটে দেখানো হয়।"],
  "How can I track my order?": ["অর্ডার ও ডেলিভারি", "অর্ডার কীভাবে ট্র্যাক করব?", "অর্ডার ট্র্যাক পাতায় অর্ডার নম্বর ও চেকআউটে দেওয়া ফোন নম্বর দিন। সাইন ইন করা গ্রাহকরা অ্যাকাউন্টেও অর্ডার দেখতে পাবেন।"],
  "Which payment methods do you accept?": ["পেমেন্ট", "কোন কোন পেমেন্ট পদ্ধতি আছে?", "সারা বাংলাদেশে ক্যাশ অন ডেলিভারি আছে। অনলাইন পেমেন্ট চালু থাকলে তা চেকআউটে দেখা যাবে।"],
  "Is it safe to pay online?": ["পেমেন্ট", "অনলাইনে পেমেন্ট কি নিরাপদ?", "হ্যাঁ। অনলাইন পেমেন্ট অফিশিয়াল পেমেন্ট গেটওয়ের নিরাপদ পাতায় হয়। আমরা কখনো আপনার পিন বা কার্ডের তথ্য দেখি না বা সংরক্ষণ করি না।"],
  "What does “inspired” mean?": ["পণ্য", "“ইন্সপায়ার্ড” মানে কী?", "আমাদের ইন্সপায়ার্ড পারফিউমগুলো জনপ্রিয় সুবাস-প্রোফাইল থেকে দিকনির্দেশনা নেওয়া AMBR-এর স্বতন্ত্র কম্পোজিশন। এগুলো মূল ডিজাইনার পণ্য নয় এবং আমরা কোনো ডিজাইনার ব্র্যান্ডের সাথে যুক্ত নই।"],
  "What is the difference between perfume and attar?": ["পণ্য", "পারফিউম আর আতরের পার্থক্য কী?", "আমাদের পারফিউমগুলো স্প্রে, ত্বকে বা কাপড়ে সহজে দেওয়া যায়। আতর হলো রোল-অন বোতলে ঘন পারফিউম অয়েল — অল্পেই যথেষ্ট এবং ত্বকের কাছাকাছি থাকে।"],
  "Which size should I choose?": ["পণ্য", "কোন সাইজ নেব?", "ছোট সাইজ নতুন সুবাস চেখে দেখার বা সাথে রাখার জন্য দারুণ। প্রিয় সুবাস পেয়ে গেলে বড় সাইজে বেশি সাশ্রয়।"],
  "What if my bottle arrives damaged?": ["রিটার্ন", "বোতল ভাঙা অবস্থায় এলে কী করব?", "ডেলিভারির ৪৮ ঘণ্টার মধ্যে অর্ডার নম্বর ও ছবিসহ যোগাযোগ করুন। আমরা রিপ্লেসমেন্ট বা রিফান্ডের ব্যবস্থা করব।"],
};

const ARTICLES: { slug: string; en: { title: string; excerpt: string; body: string }; bn: { title: string; excerpt: string; body: string } }[] = [
  {
    slug: "perfume-or-attar-how-to-choose",
    en: {
      title: "Perfume or attar? How to choose",
      excerpt: "Two ways to wear scent, two different experiences. Here's how to decide which suits your day.",
      body: `<p>Perfume and attar can share the same notes and still feel completely different on you. The difference is mostly in how they're made and how they sit on the skin.</p>
<h2>Perfume spray: easy and airy</h2><p>A spray mists fragrance over a wider area — skin or clothes — so it feels light and open. It's quick to apply in the morning and simple to top up. Many people reach for sprays for the office, university and everyday wear.</p>
<h2>Attar: close and concentrated</h2><p>Attar is perfume oil. You roll a small amount onto the skin, where it warms and unfolds slowly. Because it sits close, it feels personal — a scent for you and the people near you.</p>
<h2>A simple way to decide</h2><ul><li>Want something quick for the day? Try a spray.</li><li>Prefer a quiet, intimate scent? Try an attar.</li><li>Not sure? A discovery set lets you wear several over a week before choosing.</li></ul><p>There is no rule — many of our customers keep one of each.</p>`,
    },
    bn: {
      title: "পারফিউম নাকি আতর? কীভাবে বেছে নেবেন",
      excerpt: "সুবাস ব্যবহারের দুটি উপায়, দুটি আলাদা অভিজ্ঞতা। আপনার দিনের সাথে কোনটা মানাবে, জেনে নিন।",
      body: `<p>পারফিউম আর আতরে একই নোট থাকলেও আপনার গায়ে দুটো সম্পূর্ণ ভিন্ন লাগতে পারে। পার্থক্যটা মূলত তৈরির পদ্ধতি আর ত্বকে থাকার ধরনে।</p>
<h2>পারফিউম স্প্রে: সহজ ও হালকা</h2><p>স্প্রে সুবাসকে ত্বক বা কাপড়ের বড় জায়গায় ছড়িয়ে দেয়, তাই হালকা ও খোলামেলা লাগে। সকালে দ্রুত দেওয়া যায়, দিনে আবার দেওয়াও সহজ। অফিস, বিশ্ববিদ্যালয় আর প্রতিদিনের জন্য অনেকেই স্প্রে বেছে নেন।</p>
<h2>আতর: কাছাকাছি ও ঘন</h2><p>আতর হলো পারফিউম অয়েল। অল্প একটু ত্বকে রোল করলে তা উষ্ণ হয়ে ধীরে ধীরে খোলে। কাছাকাছি থাকে বলে খুব ব্যক্তিগত লাগে — আপনার আর আপনার কাছের মানুষের জন্য।</p>
<h2>সহজে বেছে নেওয়ার উপায়</h2><ul><li>দিনের জন্য দ্রুত কিছু চান? স্প্রে চেষ্টা করুন।</li><li>শান্ত, ব্যক্তিগত সুবাস পছন্দ? আতর চেষ্টা করুন।</li><li>নিশ্চিত নন? ডিসকভারি সেটে এক সপ্তাহ ধরে কয়েকটি ব্যবহার করে তারপর বেছে নিন।</li></ul><p>কোনো নিয়ম নেই — আমাদের অনেক গ্রাহকই দুটোই রাখেন।</p>`,
    },
  },
  {
    slug: "wearing-fragrance-in-the-heat",
    en: {
      title: "Wearing fragrance in Bangladesh's heat",
      excerpt: "Humid summers and long monsoons change how scent behaves. A few habits help you enjoy it more.",
      body: `<p>Heat and humidity make fragrance feel stronger and develop faster. That isn't a problem — it just means choosing and applying a little differently.</p>
<h2>Choose lighter families for the day</h2><p>Fresh, citrus and aquatic scents feel comfortable in the heat. Save rich amber, oud and gourmand fragrances for cooler evenings and winter.</p>
<h2>Apply less, more thoughtfully</h2><p>In warm weather, one or two sprays — or a single touch of attar — is often enough. Pulse points and clothing both work; test oils on fabric first.</p>
<h2>Store it well</h2><p>Keep bottles away from sunlight and out of hot cars. A cool drawer or cupboard keeps fragrance at its best.</p>`,
    },
    bn: {
      title: "বাংলাদেশের গরমে সুবাস ব্যবহার",
      excerpt: "আর্দ্র গ্রীষ্ম আর দীর্ঘ বর্ষা সুবাসের আচরণ বদলে দেয়। কয়েকটি অভ্যাস আপনাকে আরও ভালোভাবে উপভোগ করতে সাহায্য করবে।",
      body: `<p>গরম আর আর্দ্রতায় সুবাস বেশি তীব্র লাগে এবং দ্রুত বিকশিত হয়। এটা কোনো সমস্যা নয় — শুধু বেছে নেওয়া আর লাগানোর ধরন একটু বদলাতে হয়।</p>
<h2>দিনের জন্য হালকা ধরন বেছে নিন</h2><p>ফ্রেশ, সাইট্রাস আর অ্যাকুয়াটিক সুবাস গরমে আরামদায়ক। গাঢ় অ্যাম্বার, উদ আর গুরম্যান্ড সুবাস রাখুন ঠান্ডা সন্ধ্যা আর শীতের জন্য।</p>
<h2>কম দিন, ভেবে দিন</h2><p>গরমে এক-দুবার স্প্রে — বা আতরের একটি ছোঁয়া — প্রায়ই যথেষ্ট। পালস পয়েন্ট ও কাপড় দুটোতেই চলে; অয়েল আগে কাপড়ে পরীক্ষা করে নিন।</p>
<h2>ঠিকভাবে রাখুন</h2><p>বোতল রোদ থেকে দূরে রাখুন, গরম গাড়িতে রাখবেন না। ঠান্ডা ড্রয়ার বা আলমারিতে সুবাস সবচেয়ে ভালো থাকে।</p>`,
    },
  },
];

async function upsertBannerTr(db: PrismaClient, bannerId: string, data: { eyebrow?: string; title: string; subtitle?: string; ctaLabel?: string; cta2Label?: string; imageAlt?: string }) {
  await db.bannerTranslation.upsert({ where: { bannerId_locale: { bannerId, locale: "bn" } }, create: { bannerId, locale: "bn", status: "PUBLISHED", ...data }, update: {} });
}

export async function seedBilingual(db: PrismaClient, demo: boolean) {
  // Taxonomy names
  for (const [slug, [nameBn, descriptionBn]] of Object.entries(FAMILIES_BN)) {
    await db.fragranceFamily.updateMany({ where: { slug, nameBn: null }, data: { nameBn, descriptionBn } });
  }
  for (const [slug, nameBn] of Object.entries(OCCASIONS_BN)) await db.occasion.updateMany({ where: { slug, nameBn: null }, data: { nameBn } });
  for (const [name, nameBn] of Object.entries(NOTES_BN)) await db.fragranceNote.updateMany({ where: { name, nameBn: null }, data: { nameBn } });

  // Discovery-sets category exists hidden; demo seeding activates it with demo sets.
  await db.category.upsert({
    where: { slug: "discovery-sets" },
    create: { slug: "discovery-sets", name: "Discovery Sets", type: "MINI", tagline: "Several scents in small sizes", description: "To find your signature, or to give one — several fragrances together.", status: "HIDDEN", sortOrder: 2 },
    update: {},
  });
  for (const [slug, tr] of Object.entries(CATEGORIES_BN)) {
    const c = await db.category.findUnique({ where: { slug } });
    if (c) await db.categoryTranslation.upsert({ where: { categoryId_locale: { categoryId: c.id, locale: "bn" } }, create: { categoryId: c.id, locale: "bn", status: "PUBLISHED", ...tr }, update: {} });
  }

  // Pages & FAQ
  for (const [slug, tr] of Object.entries(PAGES_BN)) {
    const p = await db.contentPage.findUnique({ where: { slug } });
    if (p) await db.contentPageTranslation.upsert({ where: { pageId_locale: { pageId: p.id, locale: "bn" } }, create: { pageId: p.id, locale: "bn", status: "PUBLISHED", ...tr }, update: {} });
  }
  for (const f of await db.faqItem.findMany()) {
    const tr = FAQ_BN[f.question];
    if (tr) await db.faqTranslation.upsert({ where: { faqId_locale: { faqId: f.id, locale: "bn" } }, create: { faqId: f.id, locale: "bn", status: "PUBLISHED", category: tr[0], question: tr[1], answer: tr[2] }, update: {} });
  }

  // Homepage sections for the editorial layout
  for (const [i, key] of ["discovery", "bestSellers", "story", "finder", "sets", "reviews", "journal", "newsletter"].entries()) {
    await db.homepageSection.upsert({ where: { key }, create: { key, sortOrder: i }, update: {} });
  }

  // Banners: hero (refresh seeded copy only if untouched), announcement, discovery tiles, story
  const hero = await db.banner.findFirst({ where: { placement: "HOME_HERO" }, orderBy: { sortOrder: "asc" } });
  if (hero && hero.title === "A Feeling." && hero.eyebrow === "More than a fragrance") {
    await db.banner.update({
      where: { id: hero.id },
      data: { eyebrow: "AMBR — Above Ordinary", title: "More Than a Fragrance. A Feeling.", subtitle: "Discover scents that become part of your story.", ctaLabel: "Explore the collection", ctaHref: "/shop", cta2Label: null, cta2Href: null },
    });
  }
  if (hero) await upsertBannerTr(db, hero.id, { eyebrow: "AMBR — সাধারণের ঊর্ধ্বে", title: "শুধু সুবাস নয়। একটি অনুভূতি।", subtitle: "এমন সুবাস খুঁজে নিন, যা হয়ে উঠবে আপনার গল্পের অংশ।", ctaLabel: "কালেকশন দেখুন", imageAlt: "উষ্ণ পাথরের ওপর গাঢ় লাল ফুলের পাশে একটি AMBR পারফিউমের বোতল" });

  const ann = await db.banner.findFirst({ where: { placement: "ANNOUNCEMENT" } });
  if (ann) await upsertBannerTr(db, ann.id, { title: "সারা বাংলাদেশে ক্যাশ অন ডেলিভারি", ctaLabel: "এখনই কিনুন" });

  if ((await db.banner.count({ where: { placement: "DISCOVERY" } })) === 0) {
    const tiles = [
      { title: "For Him", subtitle: "Woods, spice and citrus — confident scents.", ctaLabel: "Shop for him", ctaHref: "/shop?for=him", bn: { title: "পুরুষদের জন্য", subtitle: "কাঠ, মশলা আর সাইট্রাস — আত্মবিশ্বাসী সুবাস।", ctaLabel: "পুরুষদের সুবাস" } },
      { title: "For Her", subtitle: "Florals, musk and soft sweetness.", ctaLabel: "Shop for her", ctaHref: "/shop?for=her", bn: { title: "নারীদের জন্য", subtitle: "ফুল, মাস্ক আর কোমল মিষ্টতা।", ctaLabel: "নারীদের সুবাস" } },
      { title: "Unisex", subtitle: "Fragrance has no rules.", ctaLabel: "Shop unisex", ctaHref: "/shop?for=unisex", bn: { title: "ইউনিসেক্স", subtitle: "সুবাসের কোনো নিয়ম নেই।", ctaLabel: "ইউনিসেক্স সুবাস" } },
      { title: "Attar & Oils", subtitle: "Concentrated roll-ons, close to the skin.", ctaLabel: "Discover attars", ctaHref: "/attar", bn: { title: "আতর ও অয়েল", subtitle: "ঘন রোল-অন, ত্বকের কাছাকাছি।", ctaLabel: "আতর দেখুন" } },
    ];
    for (const [i, t] of tiles.entries()) {
      const { bn, ...data } = t;
      const b = await db.banner.create({ data: { placement: "DISCOVERY", sortOrder: i, ...data } });
      await upsertBannerTr(db, b.id, bn);
    }
  }
  if ((await db.banner.count({ where: { placement: "STORY" } })) === 0) {
    const b = await db.banner.create({
      data: {
        placement: "STORY",
        eyebrow: "Our philosophy",
        title: "Above Ordinary. Beyond the Everyday.",
        subtitle:
          "A fragrance is the most personal thing you wear. At AMBR we compose inspired perfumes and attars that feel considered, honest and made for real days — the meeting, the commute, the wedding, the quiet evening at home.",
        imageDesktop: "/images/temporary/brand-story.jpg",
        imageAlt: "An AMBR bottle beside deep red flowers",
        ctaLabel: "Read our story",
        ctaHref: "/about",
      },
    });
    await upsertBannerTr(db, b.id, {
      eyebrow: "আমাদের দর্শন",
      title: "সাধারণের ঊর্ধ্বে। প্রতিদিনের বাইরে।",
      subtitle: "সুবাস আপনার সবচেয়ে ব্যক্তিগত সাজ। AMBR-এ আমরা এমন ইন্সপায়ার্ড পারফিউম ও আতর তৈরি করি যা যত্নশীল, সৎ এবং বাস্তব দিনের জন্য — মিটিং, যাতায়াত, বিয়ের অনুষ্ঠান কিংবা ঘরের শান্ত সন্ধ্যা।",
      ctaLabel: "আমাদের গল্প পড়ুন",
      imageAlt: "গাঢ় লাল ফুলের পাশে একটি AMBR বোতল",
    });
  }

  // Journal (starter guides)
  for (const a of ARTICLES) {
    const existing = await db.article.findUnique({ where: { slug: a.slug } });
    const article = existing ?? (await db.article.create({ data: { slug: a.slug, status: "PUBLISHED", publishedAt: new Date(), authorName: "AMBR", ...a.en } }));
    await db.articleTranslation.upsert({ where: { articleId_locale: { articleId: article.id, locale: "bn" } }, create: { articleId: article.id, locale: "bn", status: "PUBLISHED", ...a.bn }, update: {} });
  }

  if (!demo) return;

  // ── DEMO only ──
  const sets = await db.category.findUniqueOrThrow({ where: { slug: "discovery-sets" } });
  await db.category.update({ where: { id: sets.id }, data: { status: "ACTIVE" } });
  const demoSets = [
    { slug: "perfume-discovery-set", name: "Perfume Discovery Set", short: "Five perfumes, 3 ml each — the easiest way to find your signature.", description: "Velour, Monsoon Linen, Citrine Hour, Rose Ledger and Velvet Spice in 3 ml sprays. Wear them over a few days, then choose your favourite.", sizeMl: 15, label: "5 × 3 ml", format: "SPRAY" as const, price: 650, stock: 25, type: "Discovery set · Spray" },
    { slug: "attar-trio", name: "Attar Trio", short: "Three attars in 3 ml roll-ons — a lovely gift.", description: "Oud Noor, White Musk and Mitti Sandal in 3 ml roll-ons, boxed together.", sizeMl: 9, label: "3 × 3 ml", format: "ROLL_ON" as const, price: 520, stock: 18, type: "Discovery set · Roll-on" },
  ];
  const unisex = await db.fragranceFamily.findUnique({ where: { slug: "fresh" } });
  const gifts = await db.occasion.findUnique({ where: { slug: "gifts" } });
  for (const s of demoSets) {
    if (await db.product.findUnique({ where: { slug: s.slug } })) continue;
    await db.product.create({
      data: {
        slug: s.slug,
        name: s.name,
        categoryId: sets.id,
        shortDescription: s.short,
        description: `<p>${s.description}</p>`,
        productType: s.type,
        intensity: "MODERATE",
        gender: "UNISEX",
        seasons: ["ALL_YEAR"],
        status: "PUBLISHED",
        isFeatured: true,
        isDemo: true,
        publishedAt: new Date(),
        ...(unisex ? { families: { create: [{ familyId: unisex.id, isPrimary: true }] } } : {}),
        ...(gifts ? { occasions: { create: [{ occasionId: gifts.id }] } } : {}),
        variants: { create: [{ sku: `DEMO-${s.slug.toUpperCase().slice(0, 12)}`, sizeMl: s.sizeMl, label: s.label, format: s.format, price: tk(s.price), inventory: { create: { onHand: s.stock } } }] },
      },
    });
  }

  for (const [slug, gender] of Object.entries(PRODUCT_GENDER)) await db.product.updateMany({ where: { slug, isDemo: true }, data: { gender } });

  for (const p of await db.product.findMany({ where: { isDemo: true }, include: { category: true } })) {
    const tr = PRODUCTS_BN[p.slug];
    if (!tr) continue;
    const isAttar = p.category.type === "ATTAR";
    const isSet = p.category.slug === "discovery-sets";
    await db.productTranslation.upsert({
      where: { productId_locale: { productId: p.id, locale: "bn" } },
      create: {
        productId: p.id,
        locale: "bn",
        status: "PUBLISHED",
        name: p.name,
        shortDescription: tr.short,
        description: `<p>${tr.description}</p>`,
        productType: isSet ? "ডিসকভারি সেট" : isAttar ? "আতর · রোল-অন" : "পারফিউম · স্প্রে",
        applicationMethod: isAttar ? "রোল-অন" : "স্প্রে",
        usageInstructions: isAttar ? ATTAR_USAGE_BN : PERFUME_USAGE_BN,
        safetyNote: SAFETY_BN,
      },
      update: {},
    });
  }

  for (const [slug, [name, description]] of Object.entries(COLLECTIONS_BN)) {
    const c = await db.collection.findUnique({ where: { slug } });
    if (c) await db.collectionTranslation.upsert({ where: { collectionId_locale: { collectionId: c.id, locale: "bn" } }, create: { collectionId: c.id, locale: "bn", status: "PUBLISHED", name, description }, update: {} });
  }
}
