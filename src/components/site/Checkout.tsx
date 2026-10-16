"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Gift, Lock, Tag, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "./Cart";
import { SafeImage, SplitText } from "./motion";
import type { DeliveryResult } from "./ProductDetail";
import { usePrice, useSite } from "./SiteProvider";

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void; on: (e: string, cb: (r: unknown) => void) => void };
  }
}

type Addr = { id: string; label: string; name: string; phone: string; line1: string; line2: string; city: string; state: string; pincode: string; country: string };

const STATES = ["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"];

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

export function Checkout({ customer, addresses, giftWrap, gstPercent }: { customer: { name: string; email: string; phone: string } | null; addresses: Addr[]; giftWrap: { enabled: boolean; fee: number }; gstPercent: number }) {
  const { items, subtotal, clear } = useCart();
  const site = useSite();
  const price = usePrice();
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const [method, setMethod] = useState<"cod" | "razorpay">(site.razorpayEnabled ? "razorpay" : "cod");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [addrId, setAddrId] = useState<string>(addresses[0]?.id ?? "new");
  const [addr, setAddr] = useState<Omit<Addr, "id" | "label">>(() => {
    const a = addresses[0];
    return a
      ? { name: a.name, phone: a.phone, line1: a.line1, line2: a.line2, city: a.city, state: a.state, pincode: a.pincode, country: a.country }
      : { name: customer?.name ?? "", phone: customer?.phone ?? "", line1: "", line2: "", city: "", state: "", pincode: "", country: "India" };
  });
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState<{ code: string; discount: number; description: string } | null>(null);
  const [couponMsg, setCouponMsg] = useState("");
  const [wrap, setWrap] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");
  const [saveAddress, setSaveAddress] = useState(true);
  const [delivery, setDelivery] = useState<DeliveryResult | null>(null);

  const discount = applied?.discount ?? 0;
  const wrapFee = wrap && giftWrap.enabled ? giftWrap.fee : 0;
  const afterDiscount = subtotal - discount;
  const shipping = site.freeShippingAbove > 0 && afterDiscount >= site.freeShippingAbove ? 0 : site.shippingFlat;
  const total = Math.max(0, afterDiscount + wrapFee + shipping);
  const codAvailable = site.codEnabled && (delivery ? delivery.cod : true);
  const methods: ("razorpay" | "cod")[] = [...(site.razorpayEnabled ? (["razorpay"] as const) : []), ...(codAvailable || !site.razorpayEnabled ? (["cod"] as const) : [])];

  useEffect(() => {
    if (!methods.includes(method) && methods[0]) setMethod(methods[0]);
  }, [methods, method]);

  // Re-check delivery whenever a full PIN code is entered.
  useEffect(() => {
    if (!/^\d{6}$/.test(addr.pincode)) {
      setDelivery(null);
      return;
    }
    const t = setTimeout(async () => {
      try {
        setDelivery(await (await fetch(`/api/delivery?pincode=${addr.pincode}&amount=${Math.round(total)}`)).json());
      } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [addr.pincode, total]);

  // Coupon validity depends on the subtotal.
  useEffect(() => {
    if (!applied) return;
    fetch("/api/coupon", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: applied.code, subtotal }) })
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setApplied({ code: j.code, discount: j.discount, description: j.description });
        else {
          setApplied(null);
          setCouponMsg(j.error);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal]);

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

  const field = (k: keyof typeof addr) => ({ value: addr[k], onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setAddr({ ...addr, [k]: e.target.value }) });

  async function applyCoupon() {
    setCouponMsg("");
    const res = await fetch("/api/coupon", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: coupon, subtotal }) });
    const j = await res.json();
    if (j.ok) {
      setApplied({ code: j.code, discount: j.discount, description: j.description });
      setCoupon("");
    } else setCouponMsg(j.error);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (delivery && !delivery.serviceable) {
      setError(delivery.message);
      return;
    }
    setBusy(true);
    setError("");
    const f = Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>;
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...addr,
        email: f.email,
        notes: f.notes,
        paymentMethod: method,
        couponCode: applied?.code ?? "",
        giftWrap: wrap,
        giftMessage,
        saveAddress: !!customer && addrId === "new" && saveAddress,
        items: items.map((i) => ({ id: i.id, qty: i.qty, selection: i.selection })),
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setBusy(false);
      setError(json.error || "Could not place the order.");
      return;
    }
    const dest = `/order/${json.number}?k=${json.key}`;
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
        prefill: { name: addr.name, email: f.email, contact: addr.phone },
        theme: { color: site.colors.accent },
        handler: async (r: Record<string, string>) => {
          const v = await fetch("/api/checkout/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...r, number: json.number }) });
          clear();
          router.push(`${dest}${v.ok ? "" : "&payment=failed"}`);
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.open();
      return;
    }
    clear();
    router.push(dest);
  }

  return (
    <div className="site-container pb-28 pt-36 md:pt-44">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SplitText as="h1" immediate text="Check*out*" className="display block text-[clamp(3.4rem,9vw,8rem)] leading-[0.9]" />
        {!customer && (
          <p className="text-sm text-muted">
            Have an account?{" "}
            <Link href="/account?next=/checkout" className="underline">
              Sign in
            </Link>{" "}
            for saved addresses.
          </p>
        )}
      </div>
      <form ref={form} onSubmit={submit} className="mt-16 grid gap-16 lg:grid-cols-12">
        <div className="space-y-12 lg:col-span-7">
          <fieldset>
            <legend className="eyebrow mb-4">Contact</legend>
            <input name="email" required type="email" defaultValue={customer?.email} placeholder="Email for order updates" className="input-line" />
          </fieldset>

          <fieldset>
            <legend className="eyebrow mb-4">Delivery address</legend>
            {addresses.length > 0 && (
              <div className="mb-6 grid gap-3 sm:grid-cols-2">
                {addresses.map((a) => (
                  <button
                    type="button"
                    key={a.id}
                    onClick={() => {
                      setAddrId(a.id);
                      setAddr({ name: a.name, phone: a.phone, line1: a.line1, line2: a.line2, city: a.city, state: a.state, pincode: a.pincode, country: a.country });
                    }}
                    className={cn("rounded-[var(--radius)] border p-4 text-left text-sm transition", addrId === a.id ? "border-fg" : "border-line hover:border-muted")}
                  >
                    <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{a.label}</p>
                    <p className="mt-1 font-medium">{a.name}</p>
                    <p className="text-muted">
                      {a.line1}, {a.city} {a.pincode}
                    </p>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setAddrId("new");
                    setAddr({ name: customer?.name ?? "", phone: customer?.phone ?? "", line1: "", line2: "", city: "", state: "", pincode: "", country: "India" });
                  }}
                  className={cn("rounded-[var(--radius)] border border-dashed p-4 text-left text-sm transition", addrId === "new" ? "border-fg" : "border-line hover:border-muted")}
                >
                  + New address
                </button>
              </div>
            )}
            <div className="grid gap-6 sm:grid-cols-2">
              <input required placeholder="Full name" className="input-line" {...field("name")} />
              <input required placeholder="Mobile number" inputMode="tel" className="input-line" {...field("phone")} />
              <input required placeholder="House, street, area" className="input-line sm:col-span-2" {...field("line1")} />
              <input placeholder="Apartment, landmark (optional)" className="input-line sm:col-span-2" {...field("line2")} />
              <div>
                <input required placeholder="PIN code" inputMode="numeric" maxLength={6} className="input-line" value={addr.pincode} onChange={(e) => setAddr({ ...addr, pincode: e.target.value.replace(/[^0-9]/g, "").slice(0, 6) })} />
                {delivery && <p className={cn("mt-2 text-xs", delivery.serviceable ? "text-muted" : "text-red-600")}>{delivery.message}</p>}
              </div>
              <input required placeholder="City" className="input-line" {...field("city")} />
              <select required className="input-line" {...field("state")}>
                <option value="">State</option>
                {STATES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <input placeholder="Country" className="input-line" {...field("country")} />
            </div>
            {customer && addrId === "new" && (
              <label className="mt-5 flex items-center gap-3 text-sm">
                <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="accent-[var(--fg)]" /> Save this address to my account
              </label>
            )}
          </fieldset>

          {giftWrap.enabled && (
            <fieldset>
              <legend className="eyebrow mb-4">Gifting</legend>
              <label className={cn("flex cursor-pointer items-start gap-4 rounded-[var(--radius)] border p-5 transition", wrap ? "border-fg" : "border-line")}>
                <input type="checkbox" checked={wrap} onChange={(e) => setWrap(e.target.checked)} className="mt-1 accent-[var(--fg)]" />
                <Gift size={20} strokeWidth={1.4} className="mt-0.5 shrink-0 text-accent" />
                <div className="flex-1">
                  <p className="font-medium">Signature gift wrap {giftWrap.fee > 0 ? `· ${price(giftWrap.fee)}` : "· Complimentary"}</p>
                  <p className="text-sm text-muted">Hand-tied silk ribbon, wax seal and a handwritten card. Prices are hidden on the invoice slip.</p>
                </div>
              </label>
              {wrap && <textarea value={giftMessage} onChange={(e) => setGiftMessage(e.target.value.slice(0, 300))} rows={3} placeholder="Your message for the card" className="input-line mt-4 resize-none" />}
            </fieldset>
          )}

          <fieldset>
            <legend className="eyebrow mb-4">Payment</legend>
            <div className="space-y-3">
              {methods.map((m) => (
                <label key={m} className={cn("flex cursor-pointer items-center gap-4 rounded-[var(--radius)] border p-5 transition", method === m ? "border-fg" : "border-line")}>
                  <input type="radio" name="pm" checked={method === m} onChange={() => setMethod(m)} className="accent-[var(--fg)]" />
                  <div>
                    <p className="font-medium">{m === "razorpay" ? "Pay online" : "Cash / pay on delivery"}</p>
                    <p className="text-sm text-muted">{m === "razorpay" ? "UPI, cards, netbanking, wallets and card EMI via Razorpay" : "Our concierge will call to confirm your order"}</p>
                  </div>
                </label>
              ))}
              {delivery && delivery.serviceable && !delivery.cod && site.codEnabled && site.razorpayEnabled && <p className="text-xs text-muted">Pay on delivery isn&apos;t available for this order value or PIN code.</p>}
            </div>
          </fieldset>
          <textarea name="notes" rows={3} placeholder="Order notes (optional)" className="input-line resize-none" />
        </div>

        <aside className="lg:col-span-5">
          <div className="rounded-[var(--radius)] bg-surface p-6 md:p-8 lg:sticky lg:top-32">
            <p className="eyebrow mb-6">Order summary</p>
            <ul className="space-y-4">
              {items.map((i) => (
                <li key={i.key} className="flex items-center gap-4">
                  <div className="relative">
                    <SafeImage src={i.image} alt={i.name} className="h-20 w-16 object-cover" />
                    <span className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-fg text-[10px] text-bg">{i.qty}</span>
                  </div>
                  <div className="flex-1">
                    <p className="display text-lg leading-tight">{i.name}</p>
                    {i.variant && <p className="text-xs text-muted">{i.variant}</p>}
                  </div>
                  <p className="text-sm tabular-nums">{price(i.price * i.qty)}</p>
                </li>
              ))}
            </ul>

            <div className="mt-6 border-t border-line pt-5">
              {applied ? (
                <div className="flex items-center justify-between rounded-[var(--radius)] border border-dashed border-accent px-3 py-2.5 text-sm">
                  <span className="flex items-center gap-2">
                    <Tag size={14} className="text-accent" /> <b>{applied.code}</b> <span className="text-muted">— {applied.description}</span>
                  </span>
                  <button type="button" onClick={() => setApplied(null)} aria-label="Remove code">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="Gift card or discount code" className="input-line text-sm uppercase" />
                  <button type="button" onClick={applyCoupon} disabled={!coupon} className="shrink-0 text-[11px] uppercase tracking-[0.16em] disabled:opacity-40">
                    Apply
                  </button>
                </div>
              )}
              {couponMsg && <p className="mt-2 text-xs text-red-600">{couponMsg}</p>}
            </div>

            <div className="mt-6 space-y-2 border-t border-line pt-6 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Subtotal</span>
                <span className="tabular-nums">{price(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-accent">
                  <span>Discount</span>
                  <span className="tabular-nums">−{price(discount)}</span>
                </div>
              )}
              {wrapFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted">Gift wrap</span>
                  <span className="tabular-nums">{price(wrapFee)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted">Insured shipping</span>
                <span className="tabular-nums">{shipping ? price(shipping) : "Complimentary"}</span>
              </div>
              <div className="flex justify-between border-t border-line pt-4 text-lg">
                <span>Total</span>
                <span className="tabular-nums">{price(total)}</span>
              </div>
              <p className="text-xs text-muted">Includes {price(total - total / (1 + gstPercent / 100))} GST · GST invoice included</p>
              {delivery?.serviceable && <p className="text-xs text-muted">{delivery.message}</p>}
            </div>
            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
            <button disabled={busy} className="btn btn-primary mt-6 w-full justify-center">
              <Lock size={13} /> {busy ? "Placing order…" : method === "razorpay" ? `Pay ${price(total)}` : "Place order"}
            </button>
            <p className="mt-4 text-center text-xs text-muted">Prices are verified against today&apos;s metal rates when you place the order.</p>
          </div>
        </aside>
      </form>
    </div>
  );
}
