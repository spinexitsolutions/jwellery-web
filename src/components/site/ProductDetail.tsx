"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, Check, Download, ExternalLink, Home, MapPin, Minus, Plus, Ruler, ShieldCheck, Sparkles, Truck, Video } from "lucide-react";
import { computePrice, emiPerMonth, normalizeSelection, variantKey, variantLabel, type Selection } from "@/lib/pricing";
import type { ProductView } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useCart } from "./Cart";
import { Magnetic, Reveal, SafeImage, SplitText } from "./motion";
import { Reviews, type ReviewItem } from "./Reviews";
import { SizeGuide } from "./SizeGuide";
import { usePrice, useSite } from "./SiteProvider";
import { Stars, WishButton } from "./Wish";

export type PublicCommerce = {
  gstPercent: number;
  emiEnabled: boolean;
  emiMinAmount: number;
  emiMonths: number[];
  emiInterestPercent: number;
  tryAtHomeEnabled: boolean;
  videoConsultEnabled: boolean;
  returnWindowDays: number;
};

const CERT_VERIFY: Record<string, (n: string) => string> = {
  IGI: (n) => `https://www.igi.org/verify-your-report/?r=${encodeURIComponent(n)}`,
  GIA: (n) => `https://www.gia.edu/report-check?reportno=${encodeURIComponent(n)}`,
};

function metalSwatch(label: string) {
  const l = label.toLowerCase();
  if (l.includes("rose")) return "linear-gradient(135deg,#e8b4a0,#fff 50%,#d99a83)";
  if (l.includes("white") || l.includes("platinum")) return "linear-gradient(135deg,#d9dce2,#fff 50%,#bfc3ca)";
  if (l.includes("silver")) return "linear-gradient(135deg,#cfd2d6,#fff 50%,#b5b9be)";
  return "linear-gradient(135deg,#e9c27d,#fff4d6 50%,#c99a4a)";
}

export function ProductDetail({
  product,
  descriptionHtml,
  rates,
  commerce,
  reviews,
}: {
  product: ProductView;
  descriptionHtml: string;
  rates: Record<string, number>;
  commerce: PublicCommerce;
  reviews: { items: ReviewItem[]; avg: number; count: number; distribution: number[] };
}) {
  const price = usePrice();
  const site = useSite();
  const { add } = useCart();
  const cfg = product.pricing;
  const [sel, setSel] = useState<Selection>(() => normalizeSelection(cfg, {}));
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const [guide, setGuide] = useState(false);
  const [open, setOpen] = useState<string | null>("details");
  const [active, setActive] = useState(0);
  const images = product.images.length ? product.images : [""];

  const breakup = useMemo(() => computePrice(product.price, cfg, rates, sel, commerce.gstPercent), [product.price, cfg, rates, sel, commerce.gstPercent]);
  const total = breakup.total;
  const compare = product.compareAtPrice && product.compareAtPrice > total ? product.compareAtPrice : null;
  const emi = commerce.emiEnabled && total >= commerce.emiMinAmount && commerce.emiMonths.length ? Math.max(...commerce.emiMonths) : 0;

  const wa = site.whatsappNumber
    ? `https://wa.me/${site.whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hello! I'm interested in ${product.name}${variantLabel(sel, cfg) ? ` (${variantLabel(sel, cfg)})` : ""} — ${product.sku ?? product.slug}.`)}`
    : `/contact?subject=${encodeURIComponent(product.name)}`;

  const addToBag = () => {
    if (cfg.sizes.length && !sel.size) {
      setSizeError(true);
      document.getElementById("size-picker")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    add(
      {
        key: variantKey(product.id, sel),
        id: product.id,
        slug: product.slug,
        name: product.name,
        price: total,
        image: product.images[0] || "",
        variant: variantLabel(sel, cfg) || undefined,
        selection: sel,
      },
      qty,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <>
      <div className="site-container grid gap-10 pb-24 pt-28 md:grid-cols-12 md:gap-12 md:pt-36">
        {/* Gallery */}
        <div className="md:col-span-7">
          <div className="hidden flex-col gap-4 md:flex">
            {images.map((src, i) => (
              <motion.div
                key={i}
                className="relative overflow-hidden rounded-[var(--radius)] bg-surface"
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
              <WishButton productId={product.id} className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-bg/85 backdrop-blur" />
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
          <div className="md:sticky md:top-28">
            <nav className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-muted">
              <span>
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
              </span>
              <WishButton productId={product.id} label className="hidden hover:text-fg md:inline-flex" />
            </nav>
            <SplitText as="h1" immediate text={product.name} className="display mt-5 block text-[clamp(2.6rem,4.6vw,4.4rem)] leading-[0.95]" />
            {reviews.count > 0 && (
              <a href="#reviews" className="mt-3 inline-flex items-center gap-2 text-sm text-muted hover:text-fg">
                <Stars value={reviews.avg} /> {reviews.avg.toFixed(1)} · {reviews.count} review{reviews.count > 1 ? "s" : ""}
              </a>
            )}

            <Reveal delay={0.15}>
              <div className="mt-6 flex items-baseline gap-4">
                <motion.p key={total} initial={{ opacity: 0.3, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-2xl tabular-nums">
                  {price(total)}
                </motion.p>
                {compare && <p className="text-muted line-through">{price(compare)}</p>}
              </div>
              <p className="mt-1 text-xs text-muted">
                Inclusive of {commerce.gstPercent}% GST{cfg.mode === "rate" && breakup.rateUsed ? ` · priced at today's rate of ₹${breakup.rateUsed.toLocaleString("en-IN")}/g` : ""}
              </p>
              {emi > 0 && (
                <p className="mt-2 text-sm">
                  EMI from <b className="tabular-nums">{price(emiPerMonth(total, emi, commerce.emiInterestPercent))}/month</b>
                  {commerce.emiInterestPercent === 0 && <span className="ml-2 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-accent">No-cost</span>}
                </p>
              )}
              {product.shortDescription && <p className="mt-5 leading-relaxed text-muted">{product.shortDescription}</p>}

              {/* Variants */}
              <div className="mt-8 space-y-6">
                {cfg.metals.length > 0 && (
                  <div>
                    <p className="mb-3 text-[11px] uppercase tracking-[0.18em] text-muted">
                      Metal — <span className="text-fg">{sel.metal}</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {cfg.metals.map((m) => (
                        <button
                          key={m.label}
                          onClick={() => setSel({ ...sel, metal: m.label })}
                          className={cn("flex items-center gap-2 rounded-full border px-3 py-2 text-xs transition", sel.metal === m.label ? "border-fg" : "border-line hover:border-muted")}
                          aria-pressed={sel.metal === m.label}
                        >
                          <span className="h-4 w-4 rounded-full" style={{ background: metalSwatch(m.label) }} />
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {cfg.qualities.length > 0 && (
                  <div>
                    <p className="mb-3 text-[11px] uppercase tracking-[0.18em] text-muted">
                      Diamond quality — <span className="text-fg">{sel.quality}</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {cfg.qualities.map((q) => (
                        <button
                          key={q.label}
                          onClick={() => setSel({ ...sel, quality: q.label })}
                          className={cn("rounded-full border px-4 py-2 text-xs transition", sel.quality === q.label ? "border-fg bg-fg text-bg" : "border-line hover:border-muted")}
                          aria-pressed={sel.quality === q.label}
                        >
                          {q.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {cfg.sizes.length > 0 && (
                  <div id="size-picker">
                    <div className="mb-3 flex items-center justify-between">
                      <p className={cn("text-[11px] uppercase tracking-[0.18em]", sizeError ? "text-red-600" : "text-muted")}>
                        {cfg.sizeLabel || "Size"} {sel.size ? <span className="text-fg">— {sel.size}</span> : sizeError ? "— please choose" : ""}
                      </p>
                      <button onClick={() => setGuide(true)} className="link-underline flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em]">
                        <Ruler size={13} /> Size guide
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {cfg.sizes.map((s) => (
                        <button
                          key={s}
                          onClick={() => {
                            setSel({ ...sel, size: s });
                            setSizeError(false);
                          }}
                          className={cn("grid h-10 min-w-10 place-items-center rounded-full border px-2 text-xs tabular-nums transition", sel.size === s ? "border-fg bg-fg text-bg" : "border-line hover:border-muted")}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

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
                  <button className="btn btn-primary w-full justify-center" onClick={addToBag}>
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

              {(commerce.tryAtHomeEnabled || commerce.videoConsultEnabled) && product.tryAtHome && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {commerce.tryAtHomeEnabled && (
                    <Link href={`/book?type=home&product=${product.slug}`} className="flex items-center justify-center gap-2 rounded-[var(--radius)] border border-line px-3 py-3 text-[11px] uppercase tracking-[0.14em] transition hover:border-fg">
                      <Home size={14} strokeWidth={1.5} /> Try at home
                    </Link>
                  )}
                  {commerce.videoConsultEnabled && (
                    <Link href={`/book?type=video&product=${product.slug}`} className="flex items-center justify-center gap-2 rounded-[var(--radius)] border border-line px-3 py-3 text-[11px] uppercase tracking-[0.14em] transition hover:border-fg">
                      <Video size={14} strokeWidth={1.5} /> Video call
                    </Link>
                  )}
                </div>
              )}

              <PincodeCheck amount={total} />

              <div className="mt-6 grid grid-cols-3 gap-3 text-center text-[10px] uppercase tracking-[0.14em] text-muted">
                <div className="flex flex-col items-center gap-2 rounded-[var(--radius)] border border-line p-3">
                  <ShieldCheck size={18} strokeWidth={1.3} /> BIS hallmarked
                </div>
                <div className="flex flex-col items-center gap-2 rounded-[var(--radius)] border border-line p-3">
                  <Truck size={18} strokeWidth={1.3} /> Insured delivery
                </div>
                <div className="flex flex-col items-center gap-2 rounded-[var(--radius)] border border-line p-3">
                  <Sparkles size={18} strokeWidth={1.3} /> {commerce.returnWindowDays}-day returns
                </div>
              </div>

              <div className="mt-8 border-t border-line">
                {[
                  {
                    key: "breakup",
                    title: "Price breakup",
                    body:
                      cfg.mode === "rate" ? (
                        <dl className="grid grid-cols-2 gap-y-2 text-sm tabular-nums">
                          <dt className="text-muted">
                            {breakup.metalLabel || "Metal"} ({breakup.weight} g × ₹{breakup.rateUsed?.toLocaleString("en-IN")})
                          </dt>
                          <dd className="text-right">{price(breakup.metal)}</dd>
                          {breakup.stone > 0 && (
                            <>
                              <dt className="text-muted">Stones{sel.quality ? ` (${sel.quality})` : ""}</dt>
                              <dd className="text-right">{price(breakup.stone)}</dd>
                            </>
                          )}
                          <dt className="text-muted">Making charges</dt>
                          <dd className="text-right">{price(breakup.making)}</dd>
                          <dt className="text-muted">GST ({breakup.gstPercent}%)</dt>
                          <dd className="text-right">{price(breakup.gst)}</dd>
                          <dt className="border-t border-line pt-2 font-medium">Total</dt>
                          <dd className="border-t border-line pt-2 text-right font-medium">{price(breakup.total)}</dd>
                        </dl>
                      ) : (
                        <dl className="grid grid-cols-2 gap-y-2 text-sm tabular-nums">
                          <dt className="text-muted">Product value</dt>
                          <dd className="text-right">{price(breakup.subtotal)}</dd>
                          <dt className="text-muted">GST ({breakup.gstPercent}%)</dt>
                          <dd className="text-right">{price(breakup.gst)}</dd>
                          <dt className="border-t border-line pt-2 font-medium">Total</dt>
                          <dd className="border-t border-line pt-2 text-right font-medium">{price(breakup.total)}</dd>
                        </dl>
                      ),
                  },
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
                  ...(product.certificateNo || product.huid || product.certificateUrl
                    ? [
                        {
                          key: "cert",
                          title: "Certification & hallmark",
                          body: (
                            <div className="space-y-4 text-sm">
                              {(product.certificateNo || product.certificateUrl) && (
                                <div className="flex items-start gap-3">
                                  <BadgeCheck size={18} strokeWidth={1.4} className="mt-0.5 shrink-0 text-accent" />
                                  <div className="flex-1">
                                    <p>
                                      {product.certificateLab || "Certified"} report {product.certificateNo && <span className="font-medium tabular-nums">{product.certificateNo}</span>}
                                    </p>
                                    <div className="mt-2 flex flex-wrap gap-4 text-[11px] uppercase tracking-[0.14em]">
                                      {product.certificateUrl && (
                                        <a href={product.certificateUrl} target="_blank" rel="noreferrer" className="link-underline inline-flex items-center gap-1.5">
                                          <Download size={12} /> Download certificate
                                        </a>
                                      )}
                                      {product.certificateNo && product.certificateLab && CERT_VERIFY[product.certificateLab.toUpperCase()] && (
                                        <a href={CERT_VERIFY[product.certificateLab.toUpperCase()](product.certificateNo)} target="_blank" rel="noreferrer" className="link-underline inline-flex items-center gap-1.5">
                                          <ExternalLink size={12} /> Verify on {product.certificateLab.toUpperCase()}
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                              {product.huid && (
                                <div className="flex items-start gap-3">
                                  <ShieldCheck size={18} strokeWidth={1.4} className="mt-0.5 shrink-0 text-accent" />
                                  <div>
                                    <p>
                                      BIS HUID <span className="font-medium tracking-wider">{product.huid}</span>
                                    </p>
                                    <p className="mt-1 text-xs text-muted">Verify this 6-character code in the official BIS CARE app (Verify HUID). Every piece you receive carries its own HUID, printed on your invoice.</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          ),
                        },
                      ]
                    : []),
                  { key: "story", title: "The story", body: <div className="prose-site text-[15px] text-muted" dangerouslySetInnerHTML={{ __html: descriptionHtml }} /> },
                  {
                    key: "care",
                    title: "Shipping, returns & care",
                    body: (
                      <p className="text-sm leading-relaxed text-muted">
                        Ships insured in our walnut keepsake box. Returns within {commerce.returnWindowDays} days of delivery, free resizing in the first year, lifetime complimentary polishing, and 100% gold value on exchange.{" "}
                        <Link href="/care" className="underline">
                          Full policy
                        </Link>
                      </p>
                    ),
                  },
                ].map((s) => (
                  <div key={s.key} className="border-b border-line">
                    <button className="flex w-full items-center justify-between py-5 text-left text-[12px] uppercase tracking-[0.16em]" onClick={() => setOpen(open === s.key ? null : s.key)} aria-expanded={open === s.key}>
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

      <Reviews productId={product.id} productName={product.name} {...reviews} />
      <SizeGuide open={guide} onClose={() => setGuide(false)} sizes={cfg.sizes} onPick={(s) => setSel({ ...sel, size: s })} />
    </>
  );
}

export function PincodeCheck({ amount, onResult, compact }: { amount: number; onResult?: (r: DeliveryResult) => void; compact?: boolean }) {
  const [pin, setPin] = useState("");
  const [res, setRes] = useState<DeliveryResult | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("kaaya-pincode");
      if (saved) setPin(saved);
    } catch {}
  }, []);
  const check = async (p = pin) => {
    if (!/^\d{6}$/.test(p)) {
      setRes({ serviceable: false, cod: false, message: "Enter a valid 6-digit PIN code." });
      return;
    }
    setBusy(true);
    try {
      const r: DeliveryResult = await (await fetch(`/api/delivery?pincode=${p}&amount=${Math.round(amount)}`)).json();
      setRes(r);
      onResult?.(r);
      localStorage.setItem("kaaya-pincode", p);
    } catch {
      setRes({ serviceable: false, cod: false, message: "Couldn't check right now." });
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className={cn(!compact && "mt-6 rounded-[var(--radius)] border border-line p-4")}>
      {!compact && (
        <p className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted">
          <MapPin size={13} /> Delivery & COD
        </p>
      )}
      <form
        className="flex items-center gap-2 border-b border-line"
        onSubmit={(e) => {
          e.preventDefault();
          check();
        }}
      >
        <input value={pin} onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))} inputMode="numeric" placeholder="Enter PIN code" aria-label="PIN code" className="w-full bg-transparent py-2.5 text-sm outline-none" />
        <button className="text-[11px] uppercase tracking-[0.16em] disabled:opacity-50" disabled={busy}>
          {busy ? "…" : "Check"}
        </button>
      </form>
      {res && (
        <div className="mt-3 text-sm">
          <p className={res.serviceable ? "" : "text-red-600"}>{res.message}</p>
          {res.serviceable && <p className="mt-1 text-xs text-muted">{res.cod ? "Pay on delivery available" : "Prepaid only for this order"}</p>}
        </div>
      )}
    </div>
  );
}

export type DeliveryResult = { serviceable: boolean; date?: string; cod: boolean; message: string; express?: boolean };
