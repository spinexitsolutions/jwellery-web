"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Minus, Plus, X } from "lucide-react";
import type { CartItem } from "@/lib/types";
import { SafeImage } from "./motion";
import { usePrice } from "./SiteProvider";
import { useLenis } from "./SmoothScroll";

type CartCtx = {
  items: CartItem[];
  count: number;
  subtotal: number;
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  update: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "kaaya-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {}
  }, [items, ready]);

  const add = useCallback((item: Omit<CartItem, "qty">, qty = 1) => {
    setItems((prev) => {
      const found = prev.find((p) => p.id === item.id);
      if (found) return prev.map((p) => (p.id === item.id ? { ...p, qty: p.qty + qty } : p));
      return [...prev, { ...item, qty }];
    });
    setOpen(true);
  }, []);
  const update = useCallback((id: string, qty: number) => setItems((prev) => prev.map((p) => (p.id === id ? { ...p, qty: Math.max(1, qty) } : p))), []);
  const remove = useCallback((id: string) => setItems((prev) => prev.filter((p) => p.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({
      items,
      count: items.reduce((a, b) => a + b.qty, 0),
      subtotal: items.reduce((a, b) => a + b.qty * b.price, 0),
      open,
      setOpen,
      add,
      update,
      remove,
      clear,
    }),
    [items, open, add, update, remove, clear],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <CartDrawer />
    </Ctx.Provider>
  );
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart outside provider");
  return c;
}

function CartDrawer() {
  const { items, open, setOpen, update, remove, subtotal } = useCart();
  const price = usePrice();
  const lenis = useLenis();

  useEffect(() => {
    if (open) lenis?.stop();
    else lenis?.start();
  }, [open, lenis]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.aside
            className="fixed right-0 top-0 z-[90] flex h-full w-full max-w-md flex-col bg-bg text-fg"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
            data-lenis-prevent
          >
            <div className="flex items-center justify-between border-b border-line px-6 py-5">
              <p className="display text-3xl">Your bag</p>
              <button onClick={() => setOpen(false)} aria-label="Close bag" className="grid h-10 w-10 place-items-center rounded-full border border-line transition hover:bg-fg hover:text-bg">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                  <p className="display text-4xl">Empty, for now.</p>
                  <p className="text-sm text-muted">Something beautiful is waiting.</p>
                  <Link href="/shop" onClick={() => setOpen(false)} className="btn btn-primary mt-4">
                    Browse jewellery
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-line">
                  {items.map((it, i) => (
                    <motion.li key={it.id} className="flex gap-4 py-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05 }}>
                      <SafeImage src={it.image} alt={it.name} className="h-28 w-24 shrink-0 object-cover" />
                      <div className="flex flex-1 flex-col">
                        <div className="flex justify-between gap-2">
                          <Link href={`/shop/${it.slug}`} onClick={() => setOpen(false)} className="display text-xl leading-tight">
                            {it.name}
                          </Link>
                          <button onClick={() => remove(it.id)} className="text-muted hover:text-fg" aria-label="Remove">
                            <X size={14} />
                          </button>
                        </div>
                        <p className="mt-1 text-sm text-muted">{price(it.price)}</p>
                        <div className="mt-auto flex items-center gap-3">
                          <div className="flex items-center rounded-full border border-line">
                            <button className="grid h-8 w-8 place-items-center" onClick={() => update(it.id, it.qty - 1)} aria-label="Decrease">
                              <Minus size={12} />
                            </button>
                            <span className="w-6 text-center text-sm tabular-nums">{it.qty}</span>
                            <button className="grid h-8 w-8 place-items-center" onClick={() => update(it.id, it.qty + 1)} aria-label="Increase">
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>
            {items.length > 0 && (
              <div className="border-t border-line px-6 py-6">
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-muted">Subtotal</span>
                  <span className="tabular-nums">{price(subtotal)}</span>
                </div>
                <p className="mb-5 text-xs text-muted">Shipping & taxes calculated at checkout.</p>
                <Link href="/checkout" onClick={() => setOpen(false)} className="btn btn-primary w-full justify-center">
                  Checkout
                </Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
