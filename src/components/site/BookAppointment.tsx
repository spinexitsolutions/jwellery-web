"use client";

import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { ArrowRight, Check, Home, Store, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAccount } from "./Account";
import { Reveal, SplitText } from "./motion";

type Type = "store" | "home" | "video";

export function BookAppointment({
  stores,
  slots,
  daysAhead,
  homeEnabled,
  videoEnabled,
  products,
}: {
  stores: { id: string; name: string; city: string }[];
  slots: string[];
  daysAhead: number;
  homeEnabled: boolean;
  videoEnabled: boolean;
  products: { name: string; slug: string }[];
}) {
  const params = useSearchParams();
  const { customer } = useAccount();
  const types = [
    { key: "store" as const, label: "Visit a boutique", body: "A private salon, chai, and the vault.", icon: Store, enabled: stores.length > 0 },
    { key: "home" as const, label: "Try at home", body: "A consultant brings up to 6 pieces to you.", icon: Home, enabled: homeEnabled },
    { key: "video" as const, label: "Video consultation", body: "See pieces up close with a designer.", icon: Video, enabled: videoEnabled },
  ].filter((t) => t.enabled);
  const initialType = (types.find((t) => t.key === params.get("type"))?.key ?? types[0]?.key ?? "video") as Type;
  const productFromUrl = products.find((p) => p.slug === params.get("product"))?.name ?? "";

  const [type, setType] = useState<Type>(initialType);
  const [storeId, setStoreId] = useState(params.get("store") ?? stores[0]?.id ?? "");
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "ok">("idle");
  const [error, setError] = useState("");

  const days = useMemo(() => {
    const out: Date[] = [];
    const d = new Date();
    for (let i = 1; out.length < Math.min(daysAhead, 14) && i <= daysAhead + 7; i++) {
      const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + i);
      if (x.getDay() !== 0 || type === "video") out.push(x);
    }
    return out;
  }, [daysAhead, type]);
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  if (state === "ok")
    return (
      <div className="site-container flex min-h-[80vh] flex-col items-center justify-center pt-28 text-center">
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }} className="grid h-16 w-16 place-items-center rounded-full bg-accent text-accent-fg">
          <Check />
        </motion.span>
        <SplitText as="h1" immediate text="See you *soon*" className="display mt-8 block text-[clamp(3rem,8vw,7rem)] leading-[0.9]" />
        <p className="mt-6 max-w-md text-muted">We&apos;ve received your request. Our concierge will confirm by email and phone{type === "video" ? ", along with your video call link" : ""}.</p>
      </div>
    );

  return (
    <div className="site-container pb-28 pt-36 md:pt-44">
      <p className="eyebrow">By appointment</p>
      <SplitText as="h1" immediate text="Book a *private* viewing" className="display mt-5 block max-w-5xl text-[clamp(3rem,8vw,7.5rem)] leading-[0.9]" />

      <form
        className="mt-14 grid gap-14 lg:grid-cols-12"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!date || !slot) return setError("Please choose a date and time.");
          setState("busy");
          setError("");
          const f = Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>;
          const res = await fetch("/api/appointments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type, date, slot, storeId: type === "store" ? storeId : undefined, name: f.name, email: f.email, phone: f.phone, address: f.address, pincode: f.pincode, products: f.products, notes: f.notes }),
          });
          const j = await res.json().catch(() => ({}));
          if (res.ok) setState("ok");
          else {
            setState("idle");
            setError(j.error || "Couldn't book — please try again.");
          }
        }}
      >
        <div className="space-y-12 lg:col-span-7">
          <div className="grid gap-3 sm:grid-cols-3">
            {types.map((t) => (
              <button
                type="button"
                key={t.key}
                onClick={() => {
                  setType(t.key);
                  setSlot("");
                }}
                className={cn("rounded-[var(--radius)] border p-5 text-left transition", type === t.key ? "border-fg bg-surface" : "border-line hover:border-muted")}
              >
                <t.icon size={20} strokeWidth={1.4} className="text-accent" />
                <p className="display mt-4 text-2xl leading-tight">{t.label}</p>
                <p className="mt-1 text-xs text-muted">{t.body}</p>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={type} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-10">
              {type === "store" && (
                <div>
                  <p className="eyebrow mb-4">Boutique</p>
                  <div className="flex flex-wrap gap-2">
                    {stores.map((s) => (
                      <button type="button" key={s.id} onClick={() => setStoreId(s.id)} className={cn("rounded-full border px-4 py-2 text-sm", storeId === s.id ? "border-fg bg-fg text-bg" : "border-line")}>
                        {s.name} · {s.city}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {type === "home" && (
                <div className="grid gap-6 sm:grid-cols-[1fr_160px]">
                  <input name="address" required placeholder="Address for the visit" className="input-line" />
                  <input name="pincode" required inputMode="numeric" maxLength={6} placeholder="PIN code" className="input-line" />
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div>
            <p className="eyebrow mb-4">Date</p>
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
              {days.map((d) => (
                <button
                  type="button"
                  key={iso(d)}
                  onClick={() => setDate(iso(d))}
                  className={cn("flex w-16 shrink-0 flex-col items-center rounded-[var(--radius)] border py-3 transition", date === iso(d) ? "border-fg bg-fg text-bg" : "border-line hover:border-muted")}
                >
                  <span className="text-[10px] uppercase tracking-[0.14em] opacity-70">{d.toLocaleDateString("en-IN", { weekday: "short" })}</span>
                  <span className="display text-2xl">{d.getDate()}</span>
                  <span className="text-[10px] uppercase opacity-70">{d.toLocaleDateString("en-IN", { month: "short" })}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="eyebrow mb-4">Time</p>
            <div className="flex flex-wrap gap-2">
              {slots.map((s) => (
                <button type="button" key={s} onClick={() => setSlot(s)} className={cn("rounded-full border px-4 py-2 text-sm tabular-nums", slot === s ? "border-fg bg-fg text-bg" : "border-line hover:border-muted")}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Reveal delay={0.1} className="lg:col-span-5">
          <div className="space-y-6 rounded-[var(--radius)] bg-surface p-6 md:p-8 lg:sticky lg:top-32">
            <p className="eyebrow">Your details</p>
            <input name="name" required defaultValue={customer?.name ?? ""} placeholder="Full name" className="input-line" />
            <input name="email" required type="email" defaultValue={customer?.email ?? ""} placeholder="Email" className="input-line" />
            <input name="phone" required defaultValue={customer?.phone?.replace(/^91(?=\d{10}$)/, "") ?? ""} placeholder="Mobile" className="input-line" />
            <input name="products" defaultValue={productFromUrl} list="product-names" placeholder="Pieces you'd like to see (optional)" className="input-line" />
            <datalist id="product-names">
              {products.map((p) => (
                <option key={p.slug} value={p.name} />
              ))}
            </datalist>
            <textarea name="notes" rows={3} placeholder="Occasion, budget, ring size… (optional)" className="input-line resize-none" />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button className="btn btn-primary w-full justify-center" disabled={state === "busy"}>
              {state === "busy" ? "Booking…" : "Request appointment"} <ArrowRight size={14} />
            </button>
            <p className="text-xs text-muted">Complimentary and without obligation.</p>
          </div>
        </Reveal>
      </form>
    </div>
  );
}
