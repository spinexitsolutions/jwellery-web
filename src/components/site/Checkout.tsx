"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "./Cart";
import { SafeImage, SplitText } from "./motion";
import { usePrice, useSite } from "./SiteProvider";

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void; on: (e: string, cb: (r: unknown) => void) => void };
  }
}

function loadRazorpay() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export function Checkout() {
  const { items, subtotal, clear } = useCart();
  const site = useSite();
  const price = usePrice();
  const router = useRouter();
  const methods = [...(site.razorpayEnabled ? (["razorpay"] as const) : []), ...(site.codEnabled || !site.razorpayEnabled ? (["cod"] as const) : [])];
  const [method, setMethod] = useState<string>(methods[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const shipping = site.freeShippingAbove > 0 && subtotal >= site.freeShippingAbove ? 0 : site.shippingFlat;

  if (items.length === 0) {
    return (
      <div className="site-container flex min-h-[80vh] flex-col items-center justify-center pt-24 text-center">
        <p className="display text-6xl">Your bag is empty</p>
        <Link href="/shop" className="btn btn-primary mt-8">
          Browse jewellery
        </Link>
      </div>
    );
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = Object.fromEntries(new FormData(e.currentTarget).entries());
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, paymentMethod: method, items: items.map((i) => ({ id: i.id, qty: i.qty })) }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setBusy(false);
      setError(json.error || "Could not place the order.");
      return;
    }
    if (json.razorpay) {
      const ok = await loadRazorpay();
      if (!ok || !window.Razorpay) {
        setBusy(false);
        setError("Payment gateway could not load. Please try again.");
        return;
      }
      const rzp = new window.Razorpay({
        key: json.razorpay.keyId,
        amount: json.razorpay.amount,
        currency: json.razorpay.currency,
        order_id: json.razorpay.orderId,
        name: site.brandName,
        description: `Order ${json.number}`,
        prefill: { name: form.name, email: form.email, contact: form.phone },
        theme: { color: site.colors.accent },
        handler: async (r: Record<string, string>) => {
          const v = await fetch("/api/checkout/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...r, number: json.number }) });
          clear();
          router.push(`/order/${json.number}${v.ok ? "" : "?payment=failed"}`);
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.open();
      return;
    }
    clear();
    router.push(`/order/${json.number}`);
  }

  return (
    <div className="site-container pb-28 pt-36 md:pt-44">
      <SplitText as="h1" immediate text="Check*out*" className="display block text-[clamp(3.4rem,9vw,8rem)] leading-[0.9]" />
      <form onSubmit={submit} className="mt-16 grid gap-16 lg:grid-cols-12">
        <div className="space-y-12 lg:col-span-7">
          <fieldset>
            <legend className="eyebrow mb-4">Contact</legend>
            <div className="grid gap-6 sm:grid-cols-2">
              <input name="name" required placeholder="Full name" className="input-line" />
              <input name="phone" required placeholder="Phone" className="input-line" />
              <input name="email" required type="email" placeholder="Email" className="input-line sm:col-span-2" />
            </div>
          </fieldset>
          <fieldset>
            <legend className="eyebrow mb-4">Delivery address</legend>
            <div className="grid gap-6 sm:grid-cols-2">
              <input name="line1" required placeholder="Address" className="input-line sm:col-span-2" />
              <input name="line2" placeholder="Apartment, landmark (optional)" className="input-line sm:col-span-2" />
              <input name="city" required placeholder="City" className="input-line" />
              <input name="state" required placeholder="State" className="input-line" />
              <input name="pincode" required placeholder="PIN code" className="input-line" />
              <input name="country" defaultValue="India" placeholder="Country" className="input-line" />
            </div>
          </fieldset>
          <fieldset>
            <legend className="eyebrow mb-4">Payment</legend>
            <div className="space-y-3">
              {methods.map((m) => (
                <label key={m} className={cn("flex cursor-pointer items-center gap-4 rounded-[var(--radius)] border p-5 transition", method === m ? "border-fg" : "border-line")}>
                  <input type="radio" name="pm" checked={method === m} onChange={() => setMethod(m)} className="accent-[var(--fg)]" />
                  <div>
                    <p className="font-medium">{m === "razorpay" ? "Pay online" : "Cash / pay on delivery"}</p>
                    <p className="text-sm text-muted">{m === "razorpay" ? "UPI, cards, netbanking & wallets via Razorpay" : "Our concierge will call to confirm your order"}</p>
                  </div>
                </label>
              ))}
            </div>
          </fieldset>
          <textarea name="notes" rows={3} placeholder="Gift message or notes (optional)" className="input-line resize-none" />
        </div>

        <aside className="lg:col-span-5">
          <div className="rounded-[var(--radius)] bg-surface p-6 md:p-8 lg:sticky lg:top-32">
            <p className="eyebrow mb-6">Order summary</p>
            <ul className="space-y-4">
              {items.map((i) => (
                <li key={i.id} className="flex items-center gap-4">
                  <div className="relative">
                    <SafeImage src={i.image} alt={i.name} className="h-20 w-16 object-cover" />
                    <span className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-fg text-[10px] text-bg">{i.qty}</span>
                  </div>
                  <p className="display flex-1 text-lg leading-tight">{i.name}</p>
                  <p className="text-sm tabular-nums">{price(i.price * i.qty)}</p>
                </li>
              ))}
            </ul>
            <div className="mt-6 space-y-2 border-t border-line pt-6 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Subtotal</span>
                <span className="tabular-nums">{price(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Insured shipping</span>
                <span className="tabular-nums">{shipping ? price(shipping) : "Complimentary"}</span>
              </div>
              <div className="flex justify-between border-t border-line pt-4 text-lg">
                <span>Total</span>
                <span className="tabular-nums">{price(subtotal + shipping)}</span>
              </div>
            </div>
            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
            <button disabled={busy} className="btn btn-primary mt-6 w-full justify-center">
              <Lock size={13} /> {busy ? "Placing order…" : method === "razorpay" ? "Pay securely" : "Place order"}
            </button>
            <p className="mt-4 text-center text-xs text-muted">Prices are verified against our catalogue when you place the order.</p>
          </div>
        </aside>
      </form>
    </div>
  );
}
