import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { makeSection, SECTION_MAP } from "../src/lib/sections";
import { SETTING_DEFAULTS } from "../src/lib/settings-types";

const db = new PrismaClient();

const u = (id: string, w = 1200) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

const IMG = {
  ring1: u("1605100804763-247f67b3557e"),
  rings: u("1515562141207-7a88fb7ce338"),
  necklace1: u("1599643478518-a784e5dc4c8f"),
  earrings1: u("1535632066927-ab7c9ab60908"),
  bracelet1: u("1611591437281-460bfbe1220a"),
  necklace2: u("1617038220319-276d3cfab638"),
  bracelet2: u("1611085583191-a3b181a88401"),
  necklace3: u("1602751584552-8ba73aad10e1"),
  ring2: u("1603561591411-07134e71a2a9"),
  earrings2: u("1573408301185-9146fe634ad0"),
  pearl: u("1601121141461-9d6647bca1ed"),
  earrings3: u("1599643477877-530eb83abc8e"),
  ring3: u("1588444837495-c6cfeb53f32d"),
  earrings4: u("1596944924616-7b38e7cfac36"),
  model: u("1617038260897-41a1f14a8ca0"),
  rings2: u("1608042314453-ae338d80c427"),
};

async function main() {
  // Admin user
  const email = process.env.ADMIN_EMAIL || "admin@kaaya.in";
  const password = process.env.ADMIN_PASSWORD || "admin12345";
  await db.user.upsert({
    where: { email },
    update: {},
    create: { email, name: "Studio Admin", role: "admin", passwordHash: await bcrypt.hash(password, 10) },
  });

  // Settings (only create if missing so re-seeding never overwrites admin edits)
  for (const [key, value] of Object.entries(SETTING_DEFAULTS)) {
    await db.setting.upsert({ where: { key }, update: {}, create: { key, value: JSON.stringify(value) } });
  }

  if ((await db.product.count()) > 0) {
    console.log("Content already present — skipped catalogue seed.");
    await upgrade();
    return;
  }

  const collections = [
    { name: "Bridal", slug: "bridal", tagline: "For the first look", description: "Polki, kundan and diamond sets for the wedding day — and every anniversary after.", image: IMG.necklace2, featured: true, sortOrder: 1 },
    { name: "Solstice", slug: "solstice", tagline: "Light at its longest", description: "Our 2026 collection: sun-warmed 18K gold and stones that catch the last light.", image: IMG.necklace1, featured: true, sortOrder: 2 },
    { name: "Haveli", slug: "haveli", tagline: "Carved from memory", description: "Jaali patterns, jharokha arches and temple motifs, drawn from the courtyards of old Jaipur.", image: IMG.bracelet2, featured: true, sortOrder: 3 },
    { name: "Everyday", slug: "everyday", tagline: "Quiet gold", description: "Fine pieces light enough to forget you're wearing, precious enough never to take off.", image: IMG.earrings1, featured: true, sortOrder: 4 },
    { name: "Solitaires", slug: "solitaires", tagline: "One stone, perfectly", description: "Certified solitaires in hand-raised settings.", image: IMG.ring1, featured: true, sortOrder: 5 },
  ];
  const col: Record<string, string> = {};
  for (const c of collections) {
    const row = await db.collection.create({ data: c });
    col[c.slug] = row.id;
  }

  const details = (metal: string, stone: string, weight: string) =>
    JSON.stringify([
      { label: "Metal", value: metal },
      { label: "Stone", value: stone },
      { label: "Weight", value: weight },
      { label: "Certification", value: "BIS Hallmark · IGI" },
      { label: "Lead time", value: "Ready to ship in 3–5 days" },
    ]);

  const products = [
    { name: "Ember Solitaire Ring", c: "solitaires", price: 184000, compare: null, images: [IMG.ring1, IMG.rings], metal: "18K Yellow Gold", purity: "18K", gem: "Diamond 1.02ct", weight: "4.2 g", featured: true },
    { name: "Solstice Collar", c: "solstice", price: 326000, compare: 349000, images: [IMG.necklace1, IMG.necklace3], metal: "22K Gold", purity: "22K", gem: "Uncut diamonds", weight: "38.5 g", featured: true },
    { name: "Dewdrop Earrings", c: "everyday", price: 48500, compare: null, images: [IMG.earrings1, IMG.earrings3], metal: "18K Rose Gold", purity: "18K", gem: "Pearl", weight: "5.1 g", featured: true },
    { name: "Banyan Cuff", c: "haveli", price: 212000, compare: null, images: [IMG.bracelet2, IMG.bracelet1], metal: "22K Gold", purity: "22K", gem: "—", weight: "31.0 g", featured: true },
    { name: "Rani Polki Set", c: "bridal", price: 685000, compare: null, images: [IMG.necklace2, IMG.model], metal: "22K Gold", purity: "22K", gem: "Polki & emerald", weight: "92.4 g", featured: true },
    { name: "Jharokha Studs", c: "haveli", price: 36500, compare: 42000, images: [IMG.earrings2, IMG.earrings4], metal: "18K Yellow Gold", purity: "18K", gem: "Ruby", weight: "3.4 g", featured: true },
    { name: "Halo Eternity Band", c: "solitaires", price: 128000, compare: null, images: [IMG.ring2, IMG.rings2], metal: "Platinum", purity: "PT950", gem: "Diamond 1.4ctw", weight: "5.8 g", featured: true },
    { name: "Moti Strand", c: "everyday", price: 64000, compare: null, images: [IMG.pearl, IMG.necklace3], metal: "18K Yellow Gold", purity: "18K", gem: "Basra-style pearls", weight: "12.0 g", featured: true },
    { name: "Gulmohar Drops", c: "solstice", price: 92000, compare: null, images: [IMG.earrings3, IMG.earrings1], metal: "18K Rose Gold", purity: "18K", gem: "Pink tourmaline", weight: "7.6 g", featured: false },
    { name: "Sutra Chain Bracelet", c: "everyday", price: 41000, compare: null, images: [IMG.bracelet1, IMG.bracelet2], metal: "18K Yellow Gold", purity: "18K", gem: "—", weight: "6.2 g", featured: false },
    { name: "Mehrab Pendant", c: "haveli", price: 58000, compare: null, images: [IMG.necklace3, IMG.necklace1], metal: "22K Gold", purity: "22K", gem: "Emerald", weight: "8.9 g", featured: false },
    { name: "Noor Choker", c: "bridal", price: 412000, compare: null, images: [IMG.model, IMG.necklace2], metal: "22K Gold", purity: "22K", gem: "Kundan & pearl", weight: "64.0 g", featured: false },
    { name: "Aurora Cocktail Ring", c: "solstice", price: 156000, compare: null, images: [IMG.ring3, IMG.ring1], metal: "18K White Gold", purity: "18K", gem: "Sapphire 2.1ct", weight: "6.4 g", featured: false },
    { name: "Chandbali Earrings", c: "bridal", price: 138000, compare: 152000, images: [IMG.earrings4, IMG.earrings2], metal: "22K Gold", purity: "22K", gem: "Polki", weight: "18.3 g", featured: false },
    { name: "Twin Stack Rings", c: "everyday", price: 54000, compare: null, images: [IMG.rings2, IMG.ring2], metal: "18K Yellow & Rose Gold", purity: "18K", gem: "Diamond pavé", weight: "4.9 g", featured: false },
    { name: "Ojas Signet", c: "haveli", price: 72000, compare: null, images: [IMG.rings, IMG.ring3], metal: "22K Gold", purity: "22K", gem: "—", weight: "11.2 g", featured: false },
  ];

  let i = 0;
  for (const p of products) {
    i++;
    const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
    await db.product.create({
      data: {
        name: p.name,
        slug,
        sku: `KY-${String(1000 + i)}`,
        shortDescription: `${p.metal} · ${p.gem === "—" ? "Hand-finished" : p.gem}`,
        description: `A Kaaya original, drawn in gouache and made by hand in our Jaipur atelier.\n\n**${p.name}** is crafted in ${p.metal.toLowerCase()} and finished with a soft hand-polish that deepens with wear. Each piece is hallmarked and arrives in our signature walnut box with its certificate of authenticity.\n\n- Lifetime complimentary polishing\n- 100% gold value on exchange\n- Insured, signature-on-delivery shipping`,
        price: p.price,
        compareAtPrice: p.compare,
        images: JSON.stringify(p.images),
        metal: p.metal,
        purity: p.purity,
        gemstone: p.gem,
        weight: p.weight,
        details: details(p.metal, p.gem, p.weight),
        stock: 6,
        featured: p.featured,
        sortOrder: i,
        collectionId: col[p.c],
        tags: p.c,
      },
    });
  }

  const posts = [
    {
      title: "The quiet art of polki",
      slug: "the-quiet-art-of-polki",
      excerpt: "Uncut diamonds, foil backing and a technique older than the Mughal courts — why polki still feels new.",
      coverImage: IMG.necklace2,
      category: "Craft",
      content: "Polki is diamond in its most honest form — cut only enough to reveal its light, never enough to hide its origin.\n\n## A technique of patience\n\nEach stone is backed with a thin sheet of gold foil, then set into pure 24K gold using the *kundan* method, where gold is pressed around the stone cold, by hand.\n\n> \"You cannot rush polki. The gold tells you when it is ready.\" — Ustad Rafiq, our master setter\n\nThe result is a softer, more romantic brilliance — the light of a lamp rather than a spotlight.",
    },
    {
      title: "How to choose an engagement solitaire",
      slug: "how-to-choose-an-engagement-solitaire",
      excerpt: "Cut before carat, setting before size — our gemologist's honest guide.",
      coverImage: IMG.ring1,
      category: "Guides",
      content: "Most people begin with carat. We gently suggest you begin with **cut** — it decides how much a diamond sparkles more than any other factor.\n\n## Our order of importance\n\n1. Cut — excellent or ideal only\n2. Colour — G to I looks white in yellow gold\n3. Clarity — eye-clean is enough; VS2 is the sweet spot\n4. Carat — whatever feels right on *your* hand\n\nBook an appointment and we'll lay out five stones side by side. You'll know.",
    },
    {
      title: "Solstice: notes on a collection",
      slug: "solstice-notes-on-a-collection",
      excerpt: "Twelve pieces inspired by the longest day of the year in the Thar.",
      coverImage: IMG.necklace1,
      category: "Collections",
      content: "Solstice began on a rooftop in Jaisalmer, watching the sand turn from gold to rose to violet in the space of twenty minutes.\n\nWe wanted pieces that held that change — 18K gold warmed with a touch of copper, stones chosen for how they behave at dusk rather than under a jeweller's lamp.",
    },
  ];
  for (const p of posts) await db.post.create({ data: { ...p, author: "Kaaya Atelier" } });

  const s = (type: string, data?: Record<string, unknown>) => {
    if (!SECTION_MAP[type]) throw new Error(type);
    return makeSection(type, data);
  };

  const home = [
    s("hero"),
    s("marquee"),
    s("manifesto"),
    s("collections"),
    s("products"),
    s("story"),
    s("showcase3d"),
    s("banner"),
    s("steps", { tone: "default" }),
    s("testimonials"),
    s("gallery"),
    s("journal"),
    s("newsletter"),
  ];

  const atelier = [
    s("pageHeader", {
      eyebrow: "The atelier",
      title: "Twenty-two benches, *one* haveli",
      subtitle: "Since 1987 we have worked from the same carved doorway in Johari Bazaar — three generations of karigars, one standard.",
      image: IMG.model,
    }),
    s("manifesto", { eyebrow: "(Since 1987)", text: "Our grandfather set his first stone by the light of a kerosene lamp. We still check every setting by daylight, at the window, the way he taught us.", signature: "— The Kaaya family" }),
    s("story", { imagePosition: "right", image: IMG.bracelet2, imageSecondary: IMG.earrings4, ctaLabel: "Book a visit", ctaHref: "/contact" }),
    s("steps"),
    s("stats"),
    s("gallery", { title: "Inside *the haveli*" }),
    s("cta"),
  ];

  const contact = [
    s("contactForm"),
    s("faq", { tone: "surface" }),
  ];

  const care = [
    s("pageHeader", { eyebrow: "Client care", title: "Looked after, *for life*", subtitle: "Shipping, returns, sizing and caring for your pieces." }),
    s("richText", {
      content:
        "## Shipping\n\nEvery order ships fully insured with signature on delivery. Ready-to-wear pieces leave the atelier within 3–5 working days; made-to-order pieces within 3–4 weeks.\n\n## Returns & exchange\n\nReady-to-wear pieces may be returned within **15 days** in their original condition. We offer **lifetime exchange** at 100% of the prevailing gold value.\n\n## Sizing\n\nRing resizing is complimentary within the first year. Not sure of your size? Ask for our free ring sizer.\n\n## Caring for your jewellery\n\n- Put jewellery on last, after perfume and lotions\n- Store pieces separately in the pouch provided\n- Visit us once a year for a complimentary clean and polish",
    }),
    s("faq"),
  ];

  await db.page.createMany({
    data: [
      { slug: "home", title: "Home", sections: JSON.stringify(home), seoTitle: "", seoDescription: "" },
      { slug: "atelier", title: "Atelier", sections: JSON.stringify(atelier), showInNav: true },
      { slug: "contact", title: "Contact", sections: JSON.stringify(contact), showInNav: true },
      { slug: "care", title: "Client care", sections: JSON.stringify(care) },
    ],
  });

  await upgrade();
  console.log(`Seeded. Admin login → ${email} / ${password}`);
}

/** Idempotent additions for commerce features — safe to run on an existing database. */
async function upgrade() {
  const ringSizes = ["8", "10", "12", "14", "16", "18", "20"];
  const variants: Record<string, object> = {
    "ember-solitaire-ring": {
      mode: "rate",
      metalWeight: 4.2,
      stoneValue: 142000,
      makingType: "percent",
      makingValue: 16,
      metals: [
        { label: "18K Yellow Gold", rateKey: "gold18", delta: 0 },
        { label: "18K Rose Gold", rateKey: "gold18", delta: 0 },
        { label: "18K White Gold", rateKey: "gold18", delta: 0 },
        { label: "Platinum", rateKey: "platinum", delta: 0 },
      ],
      qualities: [
        { label: "SI-IJ", stoneValue: 118000, delta: 0 },
        { label: "VS-GH", stoneValue: 142000, delta: 0 },
        { label: "VVS-EF", stoneValue: 196000, delta: 0 },
      ],
      sizes: ringSizes,
      sizeLabel: "Ring size",
    },
    "halo-eternity-band": {
      mode: "fixed",
      metalWeight: 0,
      stoneValue: 0,
      makingType: "percent",
      makingValue: 0,
      metals: [
        { label: "Platinum", rateKey: "platinum", delta: 0 },
        { label: "18K White Gold", rateKey: "gold18", delta: -9000 },
      ],
      qualities: [],
      sizes: ringSizes,
      sizeLabel: "Ring size",
    },
    "twin-stack-rings": {
      mode: "fixed",
      metalWeight: 0,
      stoneValue: 0,
      makingType: "percent",
      makingValue: 0,
      metals: [
        { label: "18K Yellow Gold", rateKey: "gold18", delta: 0 },
        { label: "18K Rose Gold", rateKey: "gold18", delta: 0 },
      ],
      qualities: [],
      sizes: ringSizes,
      sizeLabel: "Ring size",
    },
    "banyan-cuff": {
      mode: "rate",
      metalWeight: 31,
      stoneValue: 0,
      makingType: "perGram",
      makingValue: 950,
      metals: [{ label: "22K Yellow Gold", rateKey: "gold22", delta: 0 }],
      qualities: [],
      sizes: ["2.4", "2.6", "2.8"],
      sizeLabel: "Bangle size",
    },
    "ojas-signet": {
      mode: "rate",
      metalWeight: 11.2,
      stoneValue: 0,
      makingType: "percent",
      makingValue: 12,
      metals: [{ label: "22K Yellow Gold", rateKey: "gold22", delta: 0 }],
      qualities: [],
      sizes: ["16", "18", "20", "22", "24"],
      sizeLabel: "Ring size",
    },
  };
  for (const [slug, pricing] of Object.entries(variants)) {
    await db.product.updateMany({ where: { slug, pricing: "{}" }, data: { pricing: JSON.stringify(pricing) } });
  }
  await db.product.updateMany({ where: { slug: "ember-solitaire-ring", certificateNo: null }, data: { certificateLab: "IGI", certificateNo: "LG598314267", huid: "AB12C9" } });
  await db.product.updateMany({ where: { slug: "halo-eternity-band", certificateNo: null }, data: { certificateLab: "GIA", certificateNo: "2215963784" } });
  await db.product.updateMany({ where: { slug: "solstice-collar", huid: null }, data: { huid: "K7P2QX" } });

  if ((await db.store.count()) === 0) {
    await db.store.createMany({
      data: [
        { name: "The Haveli", city: "Jaipur", address: "14, Johari Bazaar, Jaipur, Rajasthan 302003", phone: "+91 98290 00000", hours: "Mon – Sat · 11:00 – 20:00", lat: 26.9196, lng: 75.8235, services: "store,tryathome,video", sortOrder: 1 },
        { name: "Mehrauli Salon", city: "New Delhi", address: "Kalka Das Marg, Mehrauli, New Delhi 110030", phone: "+91 98100 00000", hours: "Tue – Sun · 11:00 – 20:00", lat: 28.5245, lng: 77.1855, services: "store,tryathome,video", sortOrder: 2 },
        { name: "Kala Ghoda Atelier", city: "Mumbai", address: "Rampart Row, Kala Ghoda, Fort, Mumbai 400001", phone: "+91 98200 00000", hours: "Mon – Sat · 11:30 – 20:30", lat: 18.9281, lng: 72.8318, services: "store,video", sortOrder: 3 },
      ],
    });
  }

  if ((await db.coupon.count()) === 0) {
    await db.coupon.createMany({
      data: [
        { code: "WELCOME10", description: "10% off your first piece (up to ₹15,000)", type: "percent", value: 10, maxDiscount: 15000, minOrder: 20000 },
        { code: "FESTIVE5000", description: "₹5,000 off orders above ₹1,00,000", type: "flat", value: 5000, minOrder: 100000 },
      ],
    });
  }

  if ((await db.review.count()) === 0) {
    const bySlug = async (slug: string) => (await db.product.findUnique({ where: { slug } }))?.id;
    const reviews: [string, string, number, string, string, boolean][] = [
      ["ember-solitaire-ring", "Priya S.", 5, "Better than the photos", "The stone throws light across the room. Sizing was perfect using the on-screen sizer.", true],
      ["ember-solitaire-ring", "Arjun M.", 5, "She said yes", "The video consultation helped me pick VS-GH over VVS — honestly can't tell the difference and saved a lot.", true],
      ["ember-solitaire-ring", "Neha K.", 4, "Beautiful, delivery took a week", "Gorgeous ring, packaging is lovely. Took a couple of days longer than estimated.", false],
      ["dewdrop-earrings", "Ritika", 5, "Everyday favourites", "Light, comfortable and the rose gold is so soft. Wearing them daily.", true],
      ["solstice-collar", "Mrs. Bhandari", 5, "An heirloom", "Wore it for my daughter's sangeet. The craftsmanship is extraordinary.", true],
      ["banyan-cuff", "Kavya", 4, "Heavy and luxurious", "Substantial piece. The price breakup on the site made the making charges very clear.", true],
    ];
    for (const [slug, name, rating, title, body, verified] of reviews) {
      const productId = await bySlug(slug);
      if (productId) await db.review.create({ data: { productId, name, rating, title, body, verified, status: "approved" } });
    }
  }

  // Add new footer links to an existing navigation without overwriting edits.
  const navRow = await db.setting.findUnique({ where: { key: "navigation" } });
  if (navRow) {
    const nav = JSON.parse(navRow.value) as { header: { label: string; href: string }[]; footer: { title: string; links: { label: string; href: string }[] }[] };
    const flat = JSON.stringify(nav);
    const care = nav.footer.find((c) => c.title === "Care") ?? nav.footer[nav.footer.length - 1];
    const maison = nav.footer.find((c) => c.title === "Maison") ?? nav.footer[0];
    if (care && !flat.includes('"/track"')) care.links.unshift({ label: "Track your order", href: "/track" }, { label: "Your account", href: "/account" });
    if (maison && !flat.includes('"/stores"')) maison.links.push({ label: "Boutiques", href: "/stores" });
    if (!flat.includes('"/book"')) {
      const existing = nav.footer.flatMap((c) => c.links).find((l) => l.label === "Book an appointment");
      if (existing) existing.href = "/book";
      else maison?.links.push({ label: "Book an appointment", href: "/book" });
    }
    await db.setting.update({ where: { key: "navigation" }, data: { value: JSON.stringify(nav) } });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
