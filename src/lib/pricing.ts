// Shared (client + server) product pricing: variants and live metal-rate pricing.

export type MetalOption = { label: string; rateKey: string; delta: number };
export type QualityOption = { label: string; stoneValue: number; delta: number };

export type PricingConfig = {
  /** fixed: product price + option deltas. rate: weight × metal rate + stone + making + GST. */
  mode: "fixed" | "rate";
  metalWeight: number;
  stoneValue: number;
  makingType: "percent" | "perGram" | "flat";
  makingValue: number;
  /** In fixed mode the price already includes GST; in rate mode GST is added. */
  metals: MetalOption[];
  qualities: QualityOption[];
  sizes: string[];
  sizeLabel: string;
};

export const DEFAULT_PRICING: PricingConfig = {
  mode: "fixed",
  metalWeight: 0,
  stoneValue: 0,
  makingType: "percent",
  makingValue: 14,
  metals: [],
  qualities: [],
  sizes: [],
  sizeLabel: "Ring size",
};

export type Selection = { metal?: string; quality?: string; size?: string };

export type PriceBreakup = {
  metal: number;
  stone: number;
  making: number;
  subtotal: number;
  gst: number;
  total: number;
  gstPercent: number;
  rateUsed?: number;
  weight?: number;
  metalLabel?: string;
};

export function parsePricing(raw: string | null | undefined): PricingConfig {
  try {
    const v = JSON.parse(raw || "{}");
    return { ...DEFAULT_PRICING, ...(v && typeof v === "object" ? v : {}) };
  } catch {
    return DEFAULT_PRICING;
  }
}

export function defaultSelection(cfg: PricingConfig): Selection {
  return { metal: cfg.metals[0]?.label, quality: cfg.qualities[0]?.label, size: undefined };
}

/** Validates a selection against the config; unknown values fall back to defaults. */
export function normalizeSelection(cfg: PricingConfig, sel: Selection | undefined): Selection {
  const s = sel ?? {};
  return {
    metal: cfg.metals.find((m) => m.label === s.metal)?.label ?? cfg.metals[0]?.label,
    quality: cfg.qualities.find((q) => q.label === s.quality)?.label ?? cfg.qualities[0]?.label,
    size: s.size && cfg.sizes.includes(s.size) ? s.size : undefined,
  };
}

const round = (n: number) => Math.round(n);

export function computePrice(basePrice: number, cfg: PricingConfig, rates: Record<string, number>, sel: Selection, gstPercent: number, fallbackRateKey = "gold22"): PriceBreakup {
  const s = normalizeSelection(cfg, sel);
  const metal = cfg.metals.find((m) => m.label === s.metal);
  const quality = cfg.qualities.find((q) => q.label === s.quality);

  if (cfg.mode === "rate" && cfg.metalWeight > 0) {
    const rateKey = metal?.rateKey || fallbackRateKey;
    const rate = rates[rateKey] ?? 0;
    const metalValue = cfg.metalWeight * rate;
    const stone = quality ? quality.stoneValue : cfg.stoneValue;
    const making = cfg.makingType === "percent" ? (metalValue * cfg.makingValue) / 100 : cfg.makingType === "perGram" ? cfg.metalWeight * cfg.makingValue : cfg.makingValue;
    const subtotal = metalValue + stone + making;
    const gst = (subtotal * gstPercent) / 100;
    return {
      metal: round(metalValue),
      stone: round(stone),
      making: round(making),
      subtotal: round(subtotal),
      gst: round(gst),
      total: round(subtotal + gst),
      gstPercent,
      rateUsed: rate,
      weight: cfg.metalWeight,
      metalLabel: metal?.label,
    };
  }

  // Fixed price (GST inclusive) plus option deltas.
  const total = Math.max(0, basePrice + (metal?.delta ?? 0) + (quality?.delta ?? 0));
  const subtotal = total / (1 + gstPercent / 100);
  return { metal: 0, stone: 0, making: 0, subtotal: round(subtotal), gst: round(total - subtotal), total: round(total), gstPercent, metalLabel: metal?.label };
}

export function variantLabel(sel: Selection, cfg: PricingConfig) {
  return [sel.metal, sel.quality, sel.size ? `${cfg.sizeLabel || "Size"} ${sel.size}` : ""].filter(Boolean).join(" · ");
}

export function variantKey(productId: string, sel: Selection) {
  return [productId, sel.metal ?? "", sel.quality ?? "", sel.size ?? ""].join("|");
}

/** Indian ring size → inner circumference / diameter (mm). Circumference ≈ 40 + size. */
export function ringSizeMm(size: number) {
  const circumference = 40 + size;
  return { circumference, diameter: Math.round((circumference / Math.PI) * 10) / 10 };
}

export function emiPerMonth(total: number, months: number, annualInterest: number) {
  if (!annualInterest) return Math.ceil(total / months);
  const r = annualInterest / 12 / 100;
  return Math.ceil((total * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1));
}
