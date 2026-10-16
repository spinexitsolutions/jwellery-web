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

export type MetalRate = { key: string; label: string; perGram: number; showInTicker: boolean };

export type CommerceSettings = {
  gstPercent: number;
  gstin: string;
  legalName: string;
  businessState: string;
  invoicePrefix: string;
  hsnCode: string;
  giftWrapEnabled: boolean;
  giftWrapFee: number;
  emiEnabled: boolean;
  emiMinAmount: number;
  emiMonths: number[];
  emiInterestPercent: number;
  returnWindowDays: number;
  exchangeEnabled: boolean;
  returnPolicy: string;
  deliveryMode: "rules" | "shiprocket";
  deliveryAllPincodes: boolean;
  deliveryPincodePrefixes: string;
  deliveryExpressPrefixes: string;
  deliveryStandardDays: number;
  deliveryExpressDays: number;
  deliveryCodMax: number;
  appointmentSlots: string[];
  appointmentDaysAhead: number;
  tryAtHomeEnabled: boolean;
  tryAtHomePincodes: string;
  videoConsultEnabled: boolean;
  reviewsAutoApprove: boolean;
  ringSizes: string[];
};

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
  /** Price per gram for each metal/purity. Used by live-rate product pricing and the ticker. */
  metalRates: MetalRate[];
  ratesApiUrl: string;
  ratesApiHeaderName: string;
  ratesApiHeaderValue: string;
  /** Maps a metal rate key to a dot-path in the API JSON, with an optional multiplier (e.g. 0.1 for per-10g APIs). */
  ratesApiMap: { key: string; path: string; multiplier: number }[];
  smsProvider: "none" | "twilio" | "fast2sms";
  twilioSid: string;
  twilioToken: string;
  twilioFrom: string;
  fast2smsKey: string;
  shiprocketEnabled: boolean;
  shiprocketEmail: string;
  shiprocketPassword: string;
  shiprocketPickupLocation: string;
  shiprocketPickupPincode: string;
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
        { label: "Boutiques", href: "/stores" },
        { label: "Book an appointment", href: "/book" },
      ],
    },
    {
      title: "Care",
      links: [
        { label: "Track your order", href: "/track" },
        { label: "Your account", href: "/account" },
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
  metalRates: [
    { key: "gold24", label: "Gold 24K", perGram: 7840, showInTicker: true },
    { key: "gold22", label: "Gold 22K", perGram: 7190, showInTicker: true },
    { key: "gold18", label: "Gold 18K", perGram: 5880, showInTicker: true },
    { key: "gold14", label: "Gold 14K", perGram: 4590, showInTicker: false },
    { key: "platinum", label: "Platinum", perGram: 3150, showInTicker: false },
    { key: "silver", label: "Silver", perGram: 96, showInTicker: true },
  ],
  ratesApiUrl: "",
  ratesApiHeaderName: "",
  ratesApiHeaderValue: "",
  ratesApiMap: [{ key: "gold24", path: "rates.gold24", multiplier: 1 }],
  smsProvider: "none",
  twilioSid: "",
  twilioToken: "",
  twilioFrom: "",
  fast2smsKey: "",
  shiprocketEnabled: false,
  shiprocketEmail: "",
  shiprocketPassword: "",
  shiprocketPickupLocation: "Primary",
  shiprocketPickupPincode: "302003",
  webhooks: [],
  customHead: "",
  customBody: "",
};

export const DEFAULT_COMMERCE: CommerceSettings = {
  gstPercent: 3,
  gstin: "",
  legalName: "Kaaya Fine Jewellery Pvt. Ltd.",
  businessState: "Rajasthan",
  invoicePrefix: "KY/INV/",
  hsnCode: "7113",
  giftWrapEnabled: true,
  giftWrapFee: 250,
  emiEnabled: true,
  emiMinAmount: 10000,
  emiMonths: [3, 6, 9, 12],
  emiInterestPercent: 0,
  returnWindowDays: 15,
  exchangeEnabled: true,
  returnPolicy: "Ready-to-wear pieces can be returned within 15 days of delivery in original condition with tags and certificate. Engraved and made-to-order pieces can be exchanged at 100% of gold value.",
  deliveryMode: "rules",
  deliveryAllPincodes: true,
  deliveryPincodePrefixes: "",
  deliveryExpressPrefixes: "110, 400, 560, 600, 700, 500, 302, 411, 380",
  deliveryStandardDays: 6,
  deliveryExpressDays: 3,
  deliveryCodMax: 50000,
  appointmentSlots: ["11:00", "12:30", "14:00", "15:30", "17:00", "18:30"],
  appointmentDaysAhead: 21,
  tryAtHomeEnabled: true,
  tryAtHomePincodes: "302, 110, 400, 560",
  videoConsultEnabled: true,
  reviewsAutoApprove: false,
  ringSizes: ["6", "8", "10", "12", "14", "16", "18", "20", "22", "24"],
};

export const SETTING_DEFAULTS = {
  commerce: DEFAULT_COMMERCE,
  site: DEFAULT_SITE,
  theme: DEFAULT_THEME,
  navigation: DEFAULT_NAV,
  integrations: DEFAULT_INTEGRATIONS,
};

export type SettingKey = keyof typeof SETTING_DEFAULTS;
export type SettingValue<K extends SettingKey> = (typeof SETTING_DEFAULTS)[K];

/** Keys of integrations that must never leave the server. */
export const SECRET_INTEGRATION_KEYS: (keyof Integrations)[] = ["razorpayKeySecret", "smtpPass", "ratesApiHeaderValue", "twilioToken", "fast2smsKey", "shiprocketPassword"];
