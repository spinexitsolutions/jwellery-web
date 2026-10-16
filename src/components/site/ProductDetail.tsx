"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Check, Minus, Plus, ShieldCheck, Sparkles, Truck } from "lucide-react";
import type { ProductView } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useCart } from "./Cart";
import { Magnetic, Reveal, SafeImage, SplitText } from "./motion";
import { usePrice, useSite } from "./SiteProvider";

export function ProductDetail({ product, descriptionHtml }: { product: ProductView; descriptionHtml: string }) {
  const price = usePrice();
  const site = useSite();
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [open, setOpen] = useState<string | null>("details");
  const [active, setActive] = useState(0);
  const images = product.images.length ? product.images : [""];
  const wa = site.whatsappNumber
    ? `https://wa.me/${site.whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hello! I'm interested in ${product.name} (${product.sku ?? product.slug}).`)}`
    : `/contact?subject=${encodeURIComponent(product.name)}`;

  return (
    <div className="site-container grid gap-10 pb-24 pt-28 md:grid-cols-12 md:gap-12 md:pt-36">
      {/* Gallery */}
      <div className="md:col-span-7">
        <div className="hidden flex-col gap-4 md:flex">
          {images.map((src, i) => (
            <motion.div
              key={i}
              className="overflow-hidden rounded-[var(--radius)] bg-surface"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            >
              <SafeImage src={src} alt={product.name} className="aspect-[4/5] w-full object-cover" />
            </motion.div>
          ))}
        </div>
        <div className="md:hidden">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius)] bg-surface">
            <AnimatePresence mode="wait">
              <motion.div key={active} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <SafeImage src={images[active]} alt={product.name} className="h-full w-full object-cover" />
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="mt-3 flex gap-2">
            {images.map((src, i) => (
              <button key={i} onClick={() => setActive(i)} className={cn("h-20 w-16 overflow-hidden border-2", active === i ? "border-fg" : "border-transparent")}>
                <SafeImage src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="md:col-span-5">
        <div className="md:sticky md:top-32">
          <nav className="text-[11px] uppercase tracking-[0.18em] text-muted">
            <Link href="/shop" className="link-underline">
              Shop
            </Link>
            {product.collection && (
              <>
                {" / "}
                <Link href={`/collections/${product.collection.slug}`} className="link-underline">
                  {product.collection.name}
                </Link>
              </>
            )}
          </nav>
          <SplitText as="h1" immediate text={product.name} className="display mt-5 block text-[clamp(2.8rem,5vw,4.8rem)] leading-[0.95]" />
          <Reveal delay={0.2}>
            <div className="mt-6 flex items-baseline gap-4">
              <p className="text-2xl tabular-nums">{price(product.price)}</p>
              {product.compareAtPrice && product.compareAtPrice > product.price && <p className="text-muted line-through">{price(product.compareAtPrice)}</p>}
            </div>
            <p className="mt-1 text-xs text-muted">Inclusive of all taxes · {product.sku}</p>
            {product.shortDescription && <p className="mt-6 leading-relaxed text-muted">{product.shortDescription}</p>}

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <div className="flex h-[50px] items-center rounded-full border border-line">
                <button className="grid h-full w-11 place-items-center" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease">
                  <Minus size={13} />
                </button>
                <span className="w-6 text-center tabular-nums">{qty}</span>
                <button className="grid h-full w-11 place-items-center" onClick={() => setQty(qty + 1)} aria-label="Increase">
                  <Plus size={13} />
                </button>
              </div>
              <Magnetic strength={0.2} className="flex-1">
                <button
                  className="btn btn-primary w-full justify-center"
                  onClick={() => {
                    add({ id: product.id, slug: product.slug, name: product.name, price: product.price, image: product.images[0] || "" }, qty);
                    setAdded(true);
                    setTimeout(() => setAdded(false), 2000);
                  }}
                >
                  {added ? (
                    <>
                      <Check size={14} /> Added
                    </>
                  ) : product.stock > 0 ? (
                    "Add to bag"
                  ) : (
                    "Order — made for you"
                  )}
                </button>
              </Magnetic>
            </div>
            <a href={wa} target={site.whatsappNumber ? "_blank" : undefined} rel="noreferrer" className="btn btn-ghost mt-3 w-full justify-center">
              Enquire about this piece
            </a>

            <div className="mt-8 grid grid-cols-3 gap-3 text-center text-[10px] uppercase tracking-[0.14em] text-muted">
              <div className="flex flex-col items-center gap-2 rounded-[var(--radius)] border border-line p-3">
                <ShieldCheck size={18} strokeWidth={1.3} /> Hallmarked
              </div>
              <div className="flex flex-col items-center gap-2 rounded-[var(--radius)] border border-line p-3">
                <Truck size={18} strokeWidth={1.3} /> Insured delivery
              </div>
              <div className="flex flex-col items-center gap-2 rounded-[var(--radius)] border border-line p-3">
                <Sparkles size={18} strokeWidth={1.3} /> Lifetime polish
              </div>
            </div>

            <div className="mt-10 border-t border-line">
              {[
                {
                  key: "details",
                  title: "Details",
                  body: (
                    <dl className="grid grid-cols-2 gap-y-3 text-sm">
                      {product.details.map((d) => (
                        <div key={d.label} className="contents">
                          <dt className="text-muted">{d.label}</dt>
                          <dd>{d.value}</dd>
                        </div>
                      ))}
                    </dl>
                  ),
                },
                { key: "story", title: "The story", body: <div className="prose-site text-[15px] text-muted" dangerouslySetInnerHTML={{ __html: descriptionHtml }} /> },
                {
                  key: "care",
                  title: "Shipping & care",
                  body: <p className="text-sm leading-relaxed text-muted">Ships insured in 3–5 days in our walnut keepsake box. Free resizing in the first year, lifetime complimentary polishing, and 100% gold value on exchange.</p>,
                },
              ].map((s) => (
                <div key={s.key} className="border-b border-line">
                  <button className="flex w-full items-center justify-between py-5 text-left text-[12px] uppercase tracking-[0.16em]" onClick={() => setOpen(open === s.key ? null : s.key)}>
                    {s.title}
                    {open === s.key ? <Minus size={13} /> : <Plus size={13} />}
                  </button>
                  <AnimatePresence initial={false}>
                    {open === s.key && (
                      <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden" transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
                        <div className="pb-6">{s.body}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
