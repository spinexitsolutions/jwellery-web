"use client";

import { createContext, useContext } from "react";

export type PublicConfig = {
  brandName: string;
  tagline: string;
  logoUrl: string;
  currency: string;
  locale: string;
  email: string;
  phone: string;
  address: string;
  hours: string;
  codEnabled: boolean;
  razorpayEnabled: boolean;
  razorpayKeyId: string;
  shippingFlat: number;
  freeShippingAbove: number;
  whatsappNumber: string;
  whatsappMessage: string;
  animations: boolean;
  smoothScroll: boolean;
  customCursor: boolean;
  enable3D: boolean;
  preloader: boolean;
  headerStyle: "transparent" | "solid";
  colors: Record<string, string>;
};

const Ctx = createContext<PublicConfig | null>(null);

export function SiteProvider({ value, children }: { value: PublicConfig; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSite() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSite must be used inside SiteProvider");
  return v;
}

export function usePrice() {
  const { currency, locale } = useSite();
  return (n: number) => {
    try {
      return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
    } catch {
      return `${currency} ${Math.round(n)}`;
    }
  };
}
