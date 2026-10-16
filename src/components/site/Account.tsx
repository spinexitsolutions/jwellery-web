"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type Customer = { id: string; name: string | null; email: string | null; phone: string | null };
type Ctx = {
  customer: Customer | null;
  ready: boolean;
  wishlist: string[];
  isSaved: (id: string) => boolean;
  toggle: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const AccountCtx = createContext<Ctx | null>(null);
const LOCAL = "kaaya-wishlist";

function readLocal(): string[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL) || "[]");
  } catch {
    return [];
  }
}

/** Signed-in customer + wishlist. Guests keep their wishlist in the browser; it merges on sign-in. */
export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/account/me", { cache: "no-store" });
      const json = await res.json();
      setCustomer(json.customer);
      setWishlist(json.customer ? json.wishlist : readLocal());
    } catch {
      setWishlist(readLocal());
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggle = useCallback(
    async (id: string) => {
      const saved = wishlist.includes(id);
      const next = saved ? wishlist.filter((x) => x !== id) : [...wishlist, id];
      setWishlist(next);
      if (customer) {
        const res = await fetch("/api/account/wishlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: id }) });
        if (!res.ok) setWishlist(wishlist);
      } else {
        try {
          localStorage.setItem(LOCAL, JSON.stringify(next));
        } catch {}
      }
    },
    [wishlist, customer],
  );

  const value = useMemo(() => ({ customer, ready, wishlist, isSaved: (id: string) => wishlist.includes(id), toggle, refresh }), [customer, ready, wishlist, toggle, refresh]);
  return <AccountCtx.Provider value={value}>{children}</AccountCtx.Provider>;
}

export function useAccount() {
  const c = useContext(AccountCtx);
  if (!c) throw new Error("useAccount outside provider");
  return c;
}

export function localWishlist() {
  return readLocal();
}

export function clearLocalWishlist() {
  try {
    localStorage.removeItem(LOCAL);
  } catch {}
}
