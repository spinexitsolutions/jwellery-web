import type { Collection, Product } from "@prisma/client";
import { parseJSON } from "./utils";

export type ProductView = Omit<Product, "images" | "details"> & {
  images: string[];
  details: { label: string; value: string }[];
  collection?: Pick<Collection, "name" | "slug"> | null;
};

export function toProductView(p: Product & { collection?: Collection | null }): ProductView {
  return {
    ...p,
    images: parseJSON<string[]>(p.images, []),
    details: parseJSON<{ label: string; value: string }[]>(p.details, []),
    collection: p.collection ? { name: p.collection.name, slug: p.collection.slug } : null,
  };
}

export type CartItem = { id: string; slug: string; name: string; price: number; image: string; qty: number; variant?: string };
