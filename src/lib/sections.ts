// Section registry: drives both the public renderer and the admin page builder.
// Each section type declares its editable fields; the admin form is generated from them.

export type Field =
  | { name: string; label: string; type: "text" | "textarea" | "markdown" | "url" | "image" | "color" | "html"; help?: string; placeholder?: string }
  | { name: string; label: string; type: "number"; min?: number; max?: number; step?: number; help?: string }
  | { name: string; label: string; type: "boolean"; help?: string }
  | { name: string; label: string; type: "select"; options: { label: string; value: string }[]; help?: string }
  | { name: string; label: string; type: "collection"; help?: string }
  | { name: string; label: string; type: "list"; fields: Field[]; itemLabel?: string; help?: string };

export type SectionData = Record<string, unknown>;

export type Section = { id: string; type: string; hidden?: boolean; data: SectionData };

export type SectionDef = {
  type: string;
  label: string;
  description: string;
  fields: Field[];
  defaults: SectionData;
};

const metalOptions = [
  { label: "Yellow gold", value: "gold" },
  { label: "Rose gold", value: "rose" },
  { label: "Platinum / white gold", value: "platinum" },
];

const gemOptions = [
  { label: "Diamond", value: "diamond" },
  { label: "Emerald", value: "emerald" },
  { label: "Ruby", value: "ruby" },
  { label: "Sapphire", value: "sapphire" },
  { label: "Pink tourmaline", value: "pink" },
];

const toneOptions = [
  { label: "Default", value: "default" },
  { label: "Surface (tinted)", value: "surface" },
  { label: "Dark", value: "dark" },
];

const tone: Field = { name: "tone", label: "Background tone", type: "select", options: toneOptions };

export const SECTION_DEFS: SectionDef[] = [
  {
    type: "hero",
    label: "Hero",
    description: "Opening statement with 3D jewel, image or split layout.",
    fields: [
      {
        name: "variant",
        label: "Layout",
        type: "select",
        options: [
          { label: "3D jewel (interactive)", value: "3d" },
          { label: "Full image", value: "image" },
          { label: "Editorial split", value: "split" },
        ],
      },
      { name: "eyebrow", label: "Eyebrow", type: "text" },
      { name: "titleLine1", label: "Headline — line 1", type: "text", help: "Wrap words in *asterisks* for the italic accent." },
      { name: "titleLine2", label: "Headline — line 2", type: "text" },
      { name: "subtitle", label: "Supporting text", type: "textarea" },
      { name: "ctaLabel", label: "Primary button label", type: "text" },
      { name: "ctaHref", label: "Primary button link", type: "url" },
      { name: "secondaryLabel", label: "Secondary link label", type: "text" },
      { name: "secondaryHref", label: "Secondary link", type: "url" },
      { name: "image", label: "Image (image / split layouts, and 3D fallback)", type: "image" },
      { name: "metal", label: "3D metal", type: "select", options: metalOptions },
      { name: "gem", label: "3D gemstone", type: "select", options: gemOptions },
      { name: "metaLeft", label: "Corner note (left)", type: "text" },
      { name: "metaRight", label: "Corner note (right)", type: "text" },
    ],
    defaults: {
      variant: "3d",
      eyebrow: "Fine jewellery · Est. 1987",
      titleLine1: "Light, *held*",
      titleLine2: "for ever.",
      subtitle: "Heirloom pieces in recycled gold and ethically traced stones — drawn, set and polished by hand in our Jaipur atelier.",
      ctaLabel: "Explore the collection",
      ctaHref: "/shop",
      secondaryLabel: "Book a private viewing",
      secondaryHref: "/contact",
      image: "",
      metal: "gold",
      gem: "diamond",
      metaLeft: "26.9124° N, 75.7873° E",
      metaRight: "Collection Nº 07 — Solstice",
    },
  },
  {
    type: "marquee",
    label: "Marquee",
    description: "Endless scrolling band of words.",
    fields: [
      { name: "items", label: "Items", type: "list", itemLabel: "text", fields: [{ name: "text", label: "Text", type: "text" }] },
      { name: "speed", label: "Speed (seconds per loop)", type: "number", min: 5, max: 120 },
      { name: "outlined", label: "Outlined serif style", type: "boolean" },
      tone,
    ],
    defaults: {
      items: [{ text: "Hallmarked gold" }, { text: "Certified diamonds" }, { text: "Hand-set in Jaipur" }, { text: "Lifetime care" }],
      speed: 40,
      outlined: true,
      tone: "default",
    },
  },
  {
    type: "manifesto",
    label: "Manifesto (scroll text)",
    description: "Large statement whose words light up as you scroll.",
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text" },
      { name: "text", label: "Statement", type: "textarea" },
      { name: "signature", label: "Signature", type: "text" },
      tone,
    ],
    defaults: {
      eyebrow: "(Our belief)",
      text: "We make few things, slowly. Every stone is chosen by eye, every setting raised by hand, so that what you wear today can be worn by someone you love, a hundred years from now.",
      signature: "— Meera Kaaya, Founder",
      tone: "default",
    },
  },
  {
    type: "collections",
    label: "Collections",
    description: "Featured collections as a pinned horizontal scroll or grid.",
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text" },
      { name: "title", label: "Title", type: "text" },
      {
        name: "layout",
        label: "Layout",
        type: "select",
        options: [
          { label: "Horizontal scroll (pinned)", value: "horizontal" },
          { label: "Grid", value: "grid" },
        ],
      },
      { name: "onlyFeatured", label: "Only featured collections", type: "boolean" },
      tone,
    ],
    defaults: { eyebrow: "Collections", title: "Worlds, *in miniature*", layout: "horizontal", onlyFeatured: true, tone: "dark" },
  },
  {
    type: "products",
    label: "Product grid",
    description: "A curated selection of products.",
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text" },
      { name: "title", label: "Title", type: "text" },
      {
        name: "source",
        label: "Products to show",
        type: "select",
        options: [
          { label: "Featured", value: "featured" },
          { label: "Newest", value: "latest" },
          { label: "From a collection", value: "collection" },
        ],
      },
      { name: "collection", label: "Collection (if source = collection)", type: "collection" },
      { name: "limit", label: "How many", type: "number", min: 1, max: 24 },
      { name: "ctaLabel", label: "Link label", type: "text" },
      { name: "ctaHref", label: "Link", type: "url" },
      tone,
    ],
    defaults: { eyebrow: "The edit", title: "Pieces of *the season*", source: "featured", collection: "", limit: 8, ctaLabel: "View all jewellery", ctaHref: "/shop", tone: "default" },
  },
  {
    type: "story",
    label: "Image + text",
    description: "Editorial image with text, optional stats and button.",
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text" },
      { name: "title", label: "Title", type: "text" },
      { name: "body", label: "Body", type: "markdown" },
      { name: "image", label: "Image", type: "image" },
      { name: "imageSecondary", label: "Small overlapping image", type: "image" },
      {
        name: "imagePosition",
        label: "Image side",
        type: "select",
        options: [
          { label: "Left", value: "left" },
          { label: "Right", value: "right" },
        ],
      },
      { name: "ctaLabel", label: "Button label", type: "text" },
      { name: "ctaHref", label: "Button link", type: "url" },
      {
        name: "stats",
        label: "Stats",
        type: "list",
        itemLabel: "label",
        fields: [
          { name: "value", label: "Value", type: "text" },
          { name: "label", label: "Label", type: "text" },
        ],
      },
      tone,
    ],
    defaults: {
      eyebrow: "The atelier",
      title: "Made by *hand*, not by hurry",
      body: "Behind a carved haveli door in Johari Bazaar, twenty-two karigars work at benches their grandfathers sat at. Each piece passes through eleven pairs of hands — from wax to final polish — before it carries our mark.",
      image: "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=1400&q=80",
      imageSecondary: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=800&q=80",
      imagePosition: "left",
      ctaLabel: "Inside the atelier",
      ctaHref: "/atelier",
      stats: [
        { value: "37", label: "Years at the bench" },
        { value: "22", label: "Master karigars" },
        { value: "11", label: "Hands per piece" },
      ],
      tone: "default",
    },
  },
  {
    type: "showcase3d",
    label: "3D configurator",
    description: "Interactive 3D ring visitors can restyle in metal and stone.",
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text" },
      { name: "title", label: "Title", type: "text" },
      { name: "body", label: "Body", type: "textarea" },
      { name: "ctaLabel", label: "Button label", type: "text" },
      { name: "ctaHref", label: "Button link", type: "url" },
      tone,
    ],
    defaults: {
      eyebrow: "Bespoke",
      title: "Compose *your* solitaire",
      body: "Choose the metal, choose the stone. Our gemologists will source it and our karigars will set it — usually within four weeks.",
      ctaLabel: "Start a commission",
      ctaHref: "/contact",
      tone: "surface",
    },
  },
  {
    type: "steps",
    label: "Process steps",
    description: "Numbered steps that reveal on scroll.",
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text" },
      { name: "title", label: "Title", type: "text" },
      {
        name: "items",
        label: "Steps",
        type: "list",
        itemLabel: "title",
        fields: [
          { name: "title", label: "Title", type: "text" },
          { name: "body", label: "Body", type: "textarea" },
          { name: "image", label: "Image", type: "image" },
        ],
      },
      tone,
    ],
    defaults: {
      eyebrow: "Process",
      title: "From sketch *to heirloom*",
      items: [
        { title: "Drawing", body: "Every piece begins as a gouache painting at full scale.", image: "" },
        { title: "Casting", body: "Recycled 18K and 22K gold, alloyed and cast in-house.", image: "" },
        { title: "Setting", body: "Stones are set under the loupe, claw by claw.", image: "" },
        { title: "Finishing", body: "Hand-polished, hallmarked and certified before it leaves.", image: "" },
      ],
      tone: "default",
    },
  },
  {
    type: "stats",
    label: "Stats",
    description: "Big animated numbers.",
    fields: [
      {
        name: "items",
        label: "Stats",
        type: "list",
        itemLabel: "label",
        fields: [
          { name: "value", label: "Value (number)", type: "text" },
          { name: "suffix", label: "Suffix", type: "text" },
          { name: "label", label: "Label", type: "text" },
        ],
      },
      tone,
    ],
    defaults: {
      items: [
        { value: "1987", suffix: "", label: "Founded in Jaipur" },
        { value: "12000", suffix: "+", label: "Pieces made" },
        { value: "100", suffix: "%", label: "Recycled gold" },
        { value: "4.9", suffix: "/5", label: "Client rating" },
      ],
      tone: "surface",
    },
  },
  {
    type: "testimonials",
    label: "Testimonials",
    description: "Rotating client quotes.",
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text" },
      {
        name: "items",
        label: "Quotes",
        type: "list",
        itemLabel: "name",
        fields: [
          { name: "quote", label: "Quote", type: "textarea" },
          { name: "name", label: "Name", type: "text" },
          { name: "role", label: "Detail", type: "text" },
        ],
      },
      tone,
    ],
    defaults: {
      eyebrow: "Kind words",
      items: [
        { quote: "They redesigned my grandmother's kundan choker without losing a single memory in it. I cried when I opened the box.", name: "Ananya R.", role: "Mumbai · Heirloom restoration" },
        { quote: "The most patient jewellers I have ever met. Four sketches, two wax models, and a ring that feels like it was always mine.", name: "Kabir & Isha", role: "Delhi · Engagement ring" },
        { quote: "Quiet, beautiful, impeccably made. Kaaya is the only place I buy gold now.", name: "Sara M.", role: "London · Client since 2016" },
      ],
      tone: "default",
    },
  },
  {
    type: "gallery",
    label: "Gallery",
    description: "Staggered image gallery with parallax.",
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text" },
      { name: "title", label: "Title", type: "text" },
      {
        name: "images",
        label: "Images",
        type: "list",
        itemLabel: "caption",
        fields: [
          { name: "src", label: "Image", type: "image" },
          { name: "caption", label: "Caption", type: "text" },
          { name: "href", label: "Link (optional)", type: "url" },
        ],
      },
      tone,
    ],
    defaults: {
      eyebrow: "Worn",
      title: "On *you*",
      images: [
        { src: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=80", caption: "Solstice necklace", href: "" },
        { src: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1000&q=80", caption: "Dewdrop earrings", href: "" },
        { src: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1000&q=80", caption: "Ember solitaire", href: "" },
        { src: "https://images.unsplash.com/photo-1611085583191-a3b181a88401?auto=format&fit=crop&w=1000&q=80", caption: "Banyan cuff", href: "" },
      ],
      tone: "default",
    },
  },
  {
    type: "journal",
    label: "Journal posts",
    description: "Latest journal stories.",
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text" },
      { name: "title", label: "Title", type: "text" },
      { name: "limit", label: "How many", type: "number", min: 1, max: 9 },
      tone,
    ],
    defaults: { eyebrow: "Journal", title: "Notes from *the bench*", limit: 3, tone: "default" },
  },
  {
    type: "banner",
    label: "Image banner",
    description: "Full-bleed parallax image with headline.",
    fields: [
      { name: "image", label: "Image", type: "image" },
      { name: "eyebrow", label: "Eyebrow", type: "text" },
      { name: "title", label: "Title", type: "text" },
      { name: "ctaLabel", label: "Button label", type: "text" },
      { name: "ctaHref", label: "Button link", type: "url" },
      { name: "height", label: "Height (vh)", type: "number", min: 40, max: 120 },
    ],
    defaults: {
      image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=2000&q=80",
      eyebrow: "Bridal 2026",
      title: "For the *first* look, and every one after.",
      ctaLabel: "Discover bridal",
      ctaHref: "/collections/bridal",
      height: 90,
    },
  },
  {
    type: "cta",
    label: "Call to action",
    description: "Centered invitation with button.",
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text" },
      { name: "title", label: "Title", type: "text" },
      { name: "body", label: "Body", type: "textarea" },
      { name: "ctaLabel", label: "Button label", type: "text" },
      { name: "ctaHref", label: "Button link", type: "url" },
      tone,
    ],
    defaults: {
      eyebrow: "By appointment",
      title: "Visit the *haveli*",
      body: "Sit with our designers over chai, try pieces from the vault, or bring an heirloom to be reimagined.",
      ctaLabel: "Book a visit",
      ctaHref: "/contact",
      tone: "dark",
    },
  },
  {
    type: "newsletter",
    label: "Newsletter",
    description: "Email signup.",
    fields: [
      { name: "title", label: "Title", type: "text" },
      { name: "body", label: "Body", type: "textarea" },
      { name: "buttonLabel", label: "Button label", type: "text" },
      tone,
    ],
    defaults: { title: "Letters from *Jaipur*", body: "New collections, atelier stories and private previews — a few times a year, never more.", buttonLabel: "Subscribe", tone: "surface" },
  },
  {
    type: "faq",
    label: "FAQ",
    description: "Accordion of questions.",
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text" },
      { name: "title", label: "Title", type: "text" },
      {
        name: "items",
        label: "Questions",
        type: "list",
        itemLabel: "q",
        fields: [
          { name: "q", label: "Question", type: "text" },
          { name: "a", label: "Answer", type: "textarea" },
        ],
      },
      tone,
    ],
    defaults: {
      eyebrow: "Questions",
      title: "Good to *know*",
      items: [
        { q: "Is your gold hallmarked?", a: "Yes. Every piece is BIS hallmarked with HUID, and diamonds above 0.30ct carry an IGI or GIA certificate." },
        { q: "Do you ship internationally?", a: "We ship insured to 40+ countries. Duties are calculated at checkout where applicable." },
        { q: "Can I return or exchange?", a: "Ready-to-wear pieces can be returned within 15 days. Bespoke commissions are final, but we offer lifetime exchange at 100% of gold value." },
        { q: "How should I care for my jewellery?", a: "Store pieces separately in the pouch provided, avoid perfume and chlorine, and visit us once a year for a complimentary polish." },
      ],
      tone: "default",
    },
  },
  {
    type: "pageHeader",
    label: "Page header",
    description: "Title block for inner pages.",
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text" },
      { name: "title", label: "Title", type: "text" },
      { name: "subtitle", label: "Subtitle", type: "textarea" },
      { name: "image", label: "Image (optional)", type: "image" },
      tone,
    ],
    defaults: { eyebrow: "", title: "Page *title*", subtitle: "", image: "", tone: "default" },
  },
  {
    type: "richText",
    label: "Rich text",
    description: "Free text written in Markdown.",
    fields: [
      { name: "content", label: "Content", type: "markdown" },
      {
        name: "width",
        label: "Width",
        type: "select",
        options: [
          { label: "Narrow", value: "narrow" },
          { label: "Wide", value: "wide" },
        ],
      },
      tone,
    ],
    defaults: { content: "## Heading\n\nWrite something lovely here.", width: "narrow", tone: "default" },
  },
  {
    type: "contactForm",
    label: "Contact form",
    description: "Enquiry / appointment form with your contact details.",
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text" },
      { name: "title", label: "Title", type: "text" },
      { name: "body", label: "Body", type: "textarea" },
      { name: "showDetails", label: "Show address, phone & hours", type: "boolean" },
      { name: "mapEmbedUrl", label: "Google Maps embed URL", type: "url" },
      tone,
    ],
    defaults: {
      eyebrow: "Write to us",
      title: "Let's *talk*",
      body: "Tell us about the piece you're imagining, or request a private appointment at the haveli. We reply within a day.",
      showDetails: true,
      mapEmbedUrl: "",
      tone: "default",
    },
  },
  {
    type: "html",
    label: "Custom HTML / embed",
    description: "Paste any embed code (video, widget, map…).",
    fields: [
      { name: "html", label: "HTML", type: "html" },
      tone,
    ],
    defaults: { html: "<div style='text-align:center;padding:4rem'>Custom embed</div>", tone: "default" },
  },
];

export const SECTION_MAP: Record<string, SectionDef> = Object.fromEntries(SECTION_DEFS.map((d) => [d.type, d]));

export function makeSection(type: string, data?: SectionData): Section {
  const def = SECTION_MAP[type];
  return {
    id: Math.random().toString(36).slice(2, 10),
    type,
    data: JSON.parse(JSON.stringify({ ...(def?.defaults ?? {}), ...(data ?? {}) })),
  };
}
