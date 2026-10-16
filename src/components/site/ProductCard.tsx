"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import type { ProductView } from "@/lib/types";
import { useCart } from "./Cart";
import { Reveal, SafeImage } from "./motion";
import { usePrice } from "./SiteProvider";

export function ProductCard({ product, index = 0, size = "md" }: { product: ProductView; index?: number; size?: "md" | "lg" }) {
  const price = usePrice();
  const { add } = useCart();
  const [a, b] = product.images;
  const soldOut = product.stock <= 0;
  return (
    <Reveal delay={(index % 4) * 0.08} className="group">
      <Link href={`/shop/${product.slug}`} className="block" data-cursor="View">
        <div className={`relative overflow-hidden rounded-[var(--radius)] bg-surface ${size === "lg" ? "aspect-[3/4]" : "aspect-[4/5]"}`}>
          <SafeImage src={a} alt={product.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.06]" />
          {b && (
            <SafeImage
              src={b}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100"
            />
          )}
          <div className="absolute left-3 top-3 flex gap-2">
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="rounded-full bg-bg/90 px-3 py-1 text-[10px] uppercase tracking-[0.16em]">Offer</span>
            )}
            {soldOut && <span className="rounded-full bg-fg px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-bg">Made to order</span>}
          </div>
          <motion.button
            type="button"
            aria-label={`Add ${product.name} to bag`}
            onClick={(e) => {
              e.preventDefault();
              add({ id: product.id, slug: product.slug, name: product.name, price: product.price, image: a || "" });
            }}
            className="absolute bottom-3 right-3 grid h-11 w-11 translate-y-3 place-items-center rounded-full bg-bg text-fg opacity-0 shadow-sm transition-all duration-500 hover:bg-fg hover:text-bg group-hover:translate-y-0 group-hover:opacity-100 max-md:translate-y-0 max-md:opacity-100"
          >
            <Plus size={16} />
          </motion.button>
        </div>
        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="display text-[1.45rem] leading-tight">{product.name}</h3>
            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted">{product.metal}</p>
          </div>
          <div className="shrink-0 text-right text-sm tabular-nums">
            <p>{price(product.price)}</p>
            {product.compareAtPrice && product.compareAtPrice > product.price && <p className="text-xs text-muted line-through">{price(product.compareAtPrice)}</p>}
          </div>
        </div>
      </Link>
    </Reveal>
  );
}
