"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { ArrowUpRight, LogOut, Plus, Trash2 } from "lucide-react";
import { deleteAddress, makeDefaultAddress, saveAddress, updateProfile } from "@/app/(site)/account/actions";
import type { ProductView } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAccount } from "./Account";
import { SafeImage, SplitText } from "./motion";
import { ProductCard } from "./ProductCard";
import { usePrice } from "./SiteProvider";
import { SiteModal } from "./SizeGuide";

type Order = { number: string; key: string; date: string; status: string; statusLabel: string; total: number; items: { name: string; image: string; qty: number }[]; openReturn: boolean };
type Address = { id: string; label: string; name: string; phone: string; line1: string; line2: string; city: string; state: string; pincode: string; country: string; isDefault: boolean };
type Appt = { id: string; type: string; date: string; slot: string; status: string; store: string | null; meetingLink: string | null };

const TABS = ["orders", "wishlist", "addresses", "appointments", "profile"] as const;
type Tab = (typeof TABS)[number];

export function AccountDashboard({ customer, orders, addresses, wishlist, appointments }: { customer: { name: string; email: string; phone: string }; orders: Order[]; addresses: Address[]; wishlist: ProductView[]; appointments: Appt[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const { refresh } = useAccount();
  const [tab, setTab] = useState<Tab>((TABS as readonly string[]).includes(params.get("tab") ?? "") ? (params.get("tab") as Tab) : "orders");
  const price = usePrice();

  return (
    <div className="site-container pb-28 pt-36 md:pt-44">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow">Your account</p>
          <SplitText as="h1" immediate text={`Hello, *${(customer.name || "there").split(" ")[0]}*`} className="display mt-5 block text-[clamp(3rem,8vw,7rem)] leading-[0.9]" />
        </div>
        <button
          onClick={async () => {
            await fetch("/api/account/logout", { method: "POST" });
            await refresh();
            router.refresh();
          }}
          className="flex items-center gap-2 text-[12px] uppercase tracking-[0.16em] text-muted hover:text-fg"
        >
          <LogOut size={14} /> Sign out
        </button>
      </div>

      <div className="sticky top-[100px] z-20 -mx-1 mt-12 flex gap-1 overflow-x-auto border-b border-line bg-bg/90 px-1 backdrop-blur md:top-[106px]">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn("relative shrink-0 px-4 py-4 text-[12px] uppercase tracking-[0.16em] transition", tab === t ? "text-fg" : "text-muted hover:text-fg")}>
            {t}
            {t === "wishlist" && wishlist.length > 0 && <span className="ml-1.5 text-accent">{wishlist.length}</span>}
            {tab === t && <motion.span layoutId="acct-tab" className="absolute inset-x-2 bottom-0 h-px bg-fg" />}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="pt-10">
          {tab === "orders" &&
            (orders.length === 0 ? (
              <Empty title="No orders yet" body="When you place an order, you'll be able to track it here." cta={{ href: "/shop", label: "Browse jewellery" }} />
            ) : (
              <ul className="divide-y divide-line border-y border-line">
                {orders.map((o) => (
                  <li key={o.number}>
                    <Link href={`/order/${o.number}?k=${o.key}`} className="group grid items-center gap-4 py-6 md:grid-cols-[auto_1fr_auto_auto_auto]">
                      <div className="flex -space-x-3">
                        {o.items.slice(0, 3).map((it, i) => (
                          <SafeImage key={i} src={it.image} alt={it.name} className="h-16 w-14 border-2 border-bg object-cover" />
                        ))}
                      </div>
                      <div>
                        <p className="display text-2xl">{o.items.map((i) => i.name).join(", ")}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted">
                          {o.number} · {o.date}
                        </p>
                      </div>
                      <span className={cn("w-fit rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.16em]", o.status === "delivered" ? "bg-accent/15 text-accent" : o.status === "cancelled" ? "bg-red-500/10 text-red-600" : "bg-surface")}>
                        {o.openReturn ? "Return in progress" : o.statusLabel}
                      </span>
                      <span className="tabular-nums">{price(o.total)}</span>
                      <ArrowUpRight size={16} className="text-muted transition group-hover:rotate-45 group-hover:text-fg" />
                    </Link>
                  </li>
                ))}
              </ul>
            ))}

          {tab === "wishlist" &&
            (wishlist.length === 0 ? (
              <Empty title="Nothing saved yet" body="Tap the heart on any piece to keep it here." cta={{ href: "/shop", label: "Discover pieces" }} />
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:gap-x-6 lg:grid-cols-4">
                {wishlist.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>
            ))}

          {tab === "addresses" && <Addresses addresses={addresses} />}

          {tab === "appointments" &&
            (appointments.length === 0 ? (
              <Empty title="No appointments" body="Visit a boutique, try pieces at home, or speak to a designer over video." cta={{ href: "/book", label: "Book an appointment" }} />
            ) : (
              <ul className="divide-y divide-line border-y border-line">
                {appointments.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center justify-between gap-4 py-5">
                    <div>
                      <p className="display text-2xl">{a.type === "store" ? `Visit · ${a.store ?? "Boutique"}` : a.type === "home" ? "Try at home" : "Video consultation"}</p>
                      <p className="mt-1 text-sm text-muted">
                        {new Date(`${a.date}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} · {a.slot}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      {a.meetingLink && a.status === "confirmed" && (
                        <a href={a.meetingLink} target="_blank" rel="noreferrer" className="btn btn-primary">
                          Join call
                        </a>
                      )}
                      <span className="rounded-full bg-surface px-3 py-1 text-[10px] uppercase tracking-[0.16em]">{a.status}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ))}

          {tab === "profile" && <Profile customer={customer} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Empty({ title, body, cta }: { title: string; body: string; cta: { href: string; label: string } }) {
  return (
    <div className="py-20 text-center">
      <p className="display text-5xl">{title}</p>
      <p className="mt-3 text-muted">{body}</p>
      <Link href={cta.href} className="btn btn-primary mt-8">
        {cta.label}
      </Link>
    </div>
  );
}

const blankAddress = { label: "Home", name: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "", country: "India" };

function Addresses({ addresses }: { addresses: Address[] }) {
  const [edit, setEdit] = useState<(typeof blankAddress & { id?: string }) | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {addresses.map((a) => (
          <div key={a.id} className="rounded-[var(--radius)] border border-line p-5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
                {a.label} {a.isDefault && <span className="ml-2 text-accent">Default</span>}
              </p>
              <button onClick={() => deleteAddress(a.id)} aria-label="Delete address" className="text-muted hover:text-red-600">
                <Trash2 size={14} />
              </button>
            </div>
            <p className="mt-3 font-medium">{a.name}</p>
            <p className="text-sm leading-relaxed text-muted">
              {a.line1}
              {a.line2 && `, ${a.line2}`}
              <br />
              {a.city}, {a.state} {a.pincode}
              <br />
              {a.phone}
            </p>
            <div className="mt-4 flex gap-4 text-[11px] uppercase tracking-[0.14em]">
              <button className="link-underline" onClick={() => setEdit({ ...a })}>
                Edit
              </button>
              {!a.isDefault && (
                <button className="link-underline" onClick={() => makeDefaultAddress(a.id)}>
                  Make default
                </button>
              )}
            </div>
          </div>
        ))}
        <button onClick={() => setEdit({ ...blankAddress })} className="grid min-h-[180px] place-items-center rounded-[var(--radius)] border border-dashed border-line text-sm text-muted transition hover:border-fg hover:text-fg">
          <span className="flex items-center gap-2">
            <Plus size={14} /> Add address
          </span>
        </button>
      </div>
      <SiteModal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? "Edit address" : "New address"}>
        {edit && (
          <form
            className="grid gap-5 sm:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              const { id, ...rest } = edit;
              const r = await saveAddress(id ?? null, rest);
              setBusy(false);
              if ("error" in r && r.error) setError(r.error);
              else setEdit(null);
            }}
          >
            {(
              [
                ["label", "Label (Home, Office…)", false],
                ["name", "Full name", true],
                ["phone", "Mobile", true],
                ["line1", "House, street, area", true],
                ["line2", "Landmark (optional)", false],
                ["city", "City", true],
                ["state", "State", true],
                ["pincode", "PIN code", true],
              ] as const
            ).map(([k, ph, req]) => (
              <input key={k} required={req} placeholder={ph} value={edit[k]} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} className={cn("input-line", (k === "line1" || k === "line2") && "sm:col-span-2")} />
            ))}
            {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
            <button className="btn btn-primary justify-center sm:col-span-2" disabled={busy}>
              Save address
            </button>
          </form>
        )}
      </SiteModal>
    </>
  );
}

function Profile({ customer }: { customer: { name: string; email: string; phone: string } }) {
  const [name, setName] = useState(customer.name);
  const [email, setEmail] = useState(customer.email);
  const [msg, setMsg] = useState("");
  return (
    <form
      className="max-w-lg space-y-6"
      onSubmit={async (e) => {
        e.preventDefault();
        const r = await updateProfile({ name, email });
        setMsg("error" in r && r.error ? r.error : "Saved.");
      }}
    >
      <div>
        <label className="eyebrow">Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required className="input-line" />
      </div>
      <div>
        <label className="eyebrow">Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!!customer.email} className="input-line disabled:opacity-60" placeholder="Add an email for receipts" />
      </div>
      {customer.phone && (
        <div>
          <label className="eyebrow">Mobile</label>
          <input value={`+${customer.phone}`} disabled className="input-line opacity-60" />
        </div>
      )}
      <button className="btn btn-primary">Save</button>
      {msg && <p className="text-sm text-muted">{msg}</p>}
    </form>
  );
}
