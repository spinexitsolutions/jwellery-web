// Shared (client + server safe) setting shapes and defaults.

export type SiteSettings = {
  brandName: string;
  tagline: string;
  logoUrl: string;
  faviconUrl: string;
  email: string;
  phone: string;
  address: string;
  hours: string;
  currency: string;
  locale: string;
  shippingFlat: number;
  freeShippingAbove: number;
  codEnabled: boolean;
  announcement: string;
  socials: { label: string; href: string }[];
  seoTitle: string;
  seoDescription: string;
  ogImage: string;
  footerNote: string;
};

export type ThemeSettings = {
  preset: string;
  colors: {
    background: string;
    surface: string;
    foreground: string;
    muted: string;
    accent: string;
    accentForeground: string;
    border: string;
    dark: string;
    darkForeground: string;
  };
  headingFont: string;
  bodyFont: string;
  headingItalicAccent: boolean;
  radius: number;
  containerWidth: number;
  animations: boolean;
  smoothScroll: boolean;
  customCursor: boolean;
  grain: boolean;
  preloader: boolean;
  enable3D: boolean;
  headerStyle: "transparent" | "solid";
  buttonStyle: "pill" | "sharp" | "soft";
};

export type NavLink = { label: string; href: string };
export type Navigation = {
  header: NavLink[];
  footer: { title: string; links: NavLink[] }[];
};

export type Webhook = { event: string; url: string; enabled: boolean };

export type Integrations = {
  googleAnalyticsId: string;
  gtmId: string;
  metaPixelId: string;
  whatsappNumber: string;
  whatsappMessage: string;
  razorpayEnabled: boolean;
  razorpayKeyId: string;
  razorpayKeySecret: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  smtpFrom: string;
  notifyEmail: string;
  ratesEnabled: boolean;
  ratesSource: "manual" | "api";
  manualRates: { label: string; value: string }[];
  ratesApiUrl: string;
  ratesApiHeaderName: string;
  ratesApiHeaderValue: string;
  ratesApiMap: { label: string; path: string; suffix: string }[];
  webhooks: Webhook[];
  customHead: string;
  customBody: string;
};

export const FONT_OPTIONS = {
  heading: [
    "Instrument Serif",
    "Cormorant Garamond",
    "Playfair Display",
    "Fraunces",
    "Bodoni Moda",
    "DM Serif Display",
    "Italiana",
    "Marcellus",
    "Cinzel",
    "Gloock",
  ],
  body: ["Inter Tight", "Manrope", "DM Sans", "Jost", "Outfit", "Work Sans", "Figtree", "Urbanist", "Montserrat", "Lato"],
};

export const THEME_PRESETS: Record<string, { label: string; colors: ThemeSettings["colors"] }> = {
  ivory: {
    label: "Ivory & Gold",
    colors: {
      background: "#F3EEE6",
      surface: "#EAE3D7",
      foreground: "#16130F",
      muted: "#6F675C",
      accent: "#A9824B",
      accentForeground: "#FFFFFF",
      border: "#D8CFBF",
      dark: "#14110E",
      darkForeground: "#F3EEE6",
    },
  },
  noir: {
    label: "Noir",
    colors: {
      background: "#0E0D0C",
      surface: "#181614",
      foreground: "#F1ECE3",
      muted: "#9A9186",
      accent: "#C9A46A",
      accentForeground: "#0E0D0C",
      border: "#2C2824",
      dark: "#F1ECE3",
      darkForeground: "#0E0D0C",
    },
  },
  emerald: {
    label: "Emerald Court",
    colors: {
      background: "#F2F1EA",
      surface: "#E4E6DC",
      foreground: "#0F1F1A",
      muted: "#5E6B65",
      accent: "#1F5A47",
      accentForeground: "#F2F1EA",
      border: "#CED3C6",
      dark: "#0E2620",
      darkForeground: "#EDEBDF",
    },
  },
  rose: {
    label: "Rosé",
    colors: {
      background: "#F7F0EC",
      surface: "#EFE2DB",
      foreground: "#2A1A17",
      muted: "#836E68",
      accent: "#B66E5D",
      accentForeground: "#FFFFFF",
      border: "#E3D0C8",
      dark: "#2A1A17",
      darkForeground: "#F7F0EC",
    },
  },
  sapphire: {
    label: "Midnight Sapphire",
    colors: {
      background: "#0C1020",
      surface: "#141A30",
      foreground: "#E9ECF5",
      muted: "#8D95AE",
      accent: "#D6B57A",
      accentForeground: "#0C1020",
      border: "#252C47",
      dark: "#E9ECF5",
      darkForeground: "#0C1020",
    },
  },
};

export const DEFAULT_SITE: SiteSettings = {
  brandName: "Kaaya",
  tagline: "Fine Jewellery · Jaipur · Since 1987",
  logoUrl: "",
  faviconUrl: "",
  email: "atelier@kaaya.in",
  phone: "+91 98290 00000",
  address: "14, Johari Bazaar, Jaipur, Rajasthan 302003",
  hours: "Mon – Sat · 11:00 – 20:00",
  currency: "INR",
  locale: "en-IN",
  shippingFlat: 0,
  freeShippingAbove: 0,
  codEnabled: true,
  announcement: "Complimentary insured shipping across India · Lifetime polishing",
  socials: [
    { label: "Instagram", href: "https://instagram.com" },
    { label: "Pinterest", href: "https://pinterest.com" },
    { label: "YouTube", href: "https://youtube.com" },
  ],
  seoTitle: "Kaaya — Fine Jewellery, Hand-made in Jaipur",
  seoDescription: "Heirloom fine jewellery in gold, diamonds and precious stones — designed and hand-finished in our Jaipur atelier.",
  ogImage: "",
  footerNote: "Every piece is hallmarked, certified and finished by hand in our Jaipur atelier.",
};

export const DEFAULT_THEME: ThemeSettings = {
  preset: "ivory",
  colors: THEME_PRESETS.ivory.colors,
  headingFont: "Instrument Serif",
  bodyFont: "Inter Tight",
  headingItalicAccent: true,
  radius: 2,
  containerWidth: 1440,
  animations: true,
  smoothScroll: true,
  customCursor: true,
  grain: true,
  preloader: true,
  enable3D: true,
  headerStyle: "transparent",
  buttonStyle: "pill",
};

export const DEFAULT_NAV: Navigation = {
  header: [
    { label: "Shop", href: "/shop" },
    { label: "Collections", href: "/collections" },
    { label: "Atelier", href: "/atelier" },
    { label: "Journal", href: "/journal" },
    { label: "Contact", href: "/contact" },
  ],
  footer: [
    {
      title: "Shop",
      links: [
        { label: "All jewellery", href: "/shop" },
        { label: "Collections", href: "/collections" },
        { label: "Bridal", href: "/collections/bridal" },
        { label: "Gifting", href: "/shop?sort=featured" },
      ],
    },
    {
      title: "Maison",
      links: [
        { label: "The Atelier", href: "/atelier" },
        { label: "Journal", href: "/journal" },
        { label: "Book an appointment", href: "/contact" },
      ],
    },
    {
      title: "Care",
      links: [
        { label: "Shipping & returns", href: "/care" },
        { label: "Jewellery care", href: "/care" },
        { label: "FAQ", href: "/care" },
      ],
    },
  ],
};

export const DEFAULT_INTEGRATIONS: Integrations = {
  googleAnalyticsId: "",
  gtmId: "",
  metaPixelId: "",
  whatsappNumber: "",
  whatsappMessage: "Hello! I'd like to know more about a piece.",
  razorpayEnabled: false,
  razorpayKeyId: "",
  razorpayKeySecret: "",
  smtpHost: "",
  smtpPort: 587,
  smtpUser: "",
  smtpPass: "",
  smtpFrom: "",
  notifyEmail: "",
  ratesEnabled: true,
  ratesSource: "manual",
  manualRates: [
    { label: "Gold 24K", value: "₹7,840/g" },
    { label: "Gold 22K", value: "₹7,190/g" },
    { label: "Gold 18K", value: "₹5,880/g" },
    { label: "Silver", value: "₹96/g" },
  ],
  ratesApiUrl: "",
  ratesApiHeaderName: "",
  ratesApiHeaderValue: "",
  ratesApiMap: [{ label: "Gold 24K", path: "rates.gold24", suffix: "/g" }],
  webhooks: [],
  customHead: "",
  customBody: "",
};

export const SETTING_DEFAULTS = {
  site: DEFAULT_SITE,
  theme: DEFAULT_THEME,
  navigation: DEFAULT_NAV,
  integrations: DEFAULT_INTEGRATIONS,
};

export type SettingKey = keyof typeof SETTING_DEFAULTS;
export type SettingValue<K extends SettingKey> = (typeof SETTING_DEFAULTS)[K];

/** Keys of integrations that must never leave the server. */
export const SECRET_INTEGRATION_KEYS: (keyof Integrations)[] = ["razorpayKeySecret", "smtpPass", "ratesApiHeaderValue"];
