import type { Collection, Product } from "@prisma/client";
import { computePrice, parsePricing, type PricingConfig } from "./pricing";
import { parseJSON } from "./utils";

export type ProductView = Omit<Product, "images" | "details" | "pricing"> & {
  images: string[];
  details: { label: string; value: string }[];
  pricing: PricingConfig;
  collection?: Pick<Collection, "name" | "slug"> | null;
  rating?: { avg: number; count: number };
};

export type PricingContext = { rates: Record<string, number>; gstPercent: number };

/** Converts a DB product to a view. With a pricing context, `price` becomes the live default-variant price. */
export function toProductView(p: Product & { collection?: Collection | null }, ctx?: PricingContext): ProductView {
  const pricing = parsePricing(p.pricing);
  const price = ctx && pricing.mode === "rate" ? computePrice(p.price, pricing, ctx.rates, {}, ctx.gstPercent).total : p.price;
  return {
    ...p,
    price,
    images: parseJSON<string[]>(p.images, []),
    details: parseJSON<{ label: string; value: string }[]>(p.details, []),
    pricing,
    collection: p.collection ? { name: p.collection.name, slug: p.collection.slug } : null,
  };
}

export type CartItem = {
  /** Unique per product + variant. */
  key: string;
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  qty: number;
  variant?: string;
  selection?: { metal?: string; quality?: string; size?: string };
};
