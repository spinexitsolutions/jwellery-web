"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";
import { Check, Download, Gift, Package, RotateCcw, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { SafeImage, SplitText } from "./motion";
import { usePrice } from "./SiteProvider";
import { SiteModal } from "./SizeGuide";

type Item = { name: string; qty: number; price: number; variant?: string; image?: string; slug?: string; huid?: string };
type OrderData = {
  number: string;
  createdAt: string;
  status: string;
  statusLabel: string;
  email: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  discount: number;
  couponCode: string | null;
  giftWrapFee: number;
  giftMessage: string | null;
  shipping: number;
  total: number;
  taxAmount: number;
  courier: string | null;
  awb: string | null;
  trackingUrl: string | null;
  timeline: { status: string; note?: string; at: string }[];
  address: Record<string, string>;
  items: Item[];
  returns: { id: string; type: string; status: string; reason: string; adminNote: string | null; createdAt: string }[];
};

export const STEPS = [
  { key: "placed", label: "Placed" },
  { key: "confirmed", label: "Confirmed" },
  { key: "shipped", label: "Shipped" },
  { key: "out_for_delivery", label: "Out for delivery" },
  { key: "delivered", label: "Delivered" },
];

export function stepIndex(status: string) {
  const s = status === "pending" ? "placed" : status;
  return STEPS.findIndex((x) => x.key === s);
}

export function Progress({ status, timeline }: { status: string; timeline: { status: string; note?: string; at: string }[] }) {
  const idx = stepIndex(status);
  if (status === "cancelled") return <p className="rounded-[var(--radius)] bg-red-500/10 p-4 text-sm text-red-700">This order was cancelled.</p>;
  return (
    <div>
      <div className="relative grid grid-cols-5">
        <div className="absolute left-[10%] right-[10%] top-[11px] h-px bg-line" />
        <motion.div className="absolute left-[10%] top-[11px] h-px bg-accent" initial={{ width: 0 }} animate={{ width: `${(Math.max(0, idx) / 4) * 80}%` }} transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }} />
        {STEPS.map((s, i) => {
          const at = [...timeline].reverse().find((t) => t.status === s.key || (s.key === "placed" && t.status === "pending"))?.at;
          return (
            <div key={s.key} className="relative flex flex-col items-center text-center">
              <motion.span
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 * i }}
                className={cn("z-10 grid h-6 w-6 place-items-center rounded-full border", i <= idx ? "border-accent bg-accent text-accent-fg" : "border-line bg-bg")}
              >
                {i <= idx && <Check size={12} />}
              </motion.span>
              <p className={cn("mt-3 text-[10px] uppercase tracking-[0.14em] md:text-[11px]", i <= idx ? "text-fg" : "text-muted")}>{s.label}</p>
              {at && <p className="mt-1 text-[10px] text-muted">{new Date(at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function OrderView({
  order,
  payment,
  accessKey,
  canRequestReturn,
  exchangeEnabled,
  returnWindowDays,
}: {
  order: OrderData;
  payment?: string;
  accessKey: string;
  canRequestReturn: boolean;
  exchangeEnabled: boolean;
  returnWindowDays: number;
}) {
  const price = usePrice();
  const [returning, setReturning] = useState(false);
  const fresh = Date.now() - new Date(order.createdAt).getTime() < 15 * 60 * 1000;
  const a = order.address;

  return (
    <div className="site-container pb-28 pt-36 md:pt-44">
      <div className="max-w-4xl">
        <p className="eyebrow">
          Order {order.number} · {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
        </p>
        <SplitText
          as="h1"
          immediate
          text={payment === "failed" ? "Payment *pending*" : fresh ? "Thank *you*" : order.statusLabel}
          className="display mt-6 block text-[clamp(3.4rem,9vw,8rem)] leading-[0.9]"
        />
        <p className="mt-6 max-w-lg text-muted">
          {payment === "failed"
            ? "We couldn't confirm your payment. Your order is saved — our concierge will contact you to complete it."
            : fresh
              ? `A confirmation has been sent to ${order.email}. We'll keep you posted at every step.`
              : `Updates are sent to ${order.email}.`}
        </p>
      </div>

      <div className="mt-14 rounded-[var(--radius)] border border-line p-6 md:p-10">
        <Progress status={order.status} timeline={order.timeline} />
        {(order.awb || order.trackingUrl) && (
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6 text-sm">
            <p className="flex items-center gap-3">
              <Truck size={18} strokeWidth={1.4} className="text-accent" />
              {order.courier} {order.awb && <span className="text-muted">AWB {order.awb}</span>}
            </p>
            {order.trackingUrl && (
              <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="link-underline text-[12px] uppercase tracking-[0.16em]">
                Track shipment →
              </a>
            )}
          </div>
        )}
      </div>

      <div className="mt-12 grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <ul className="divide-y divide-line border-y border-line">
            {order.items.map((i, k) => (
              <li key={k} className="flex items-center gap-5 py-5">
                <SafeImage src={i.image} alt={i.name} className="h-24 w-20 object-cover" />
                <div className="flex-1">
                  {i.slug ? (
                    <Link href={`/shop/${i.slug}`} className="display text-2xl leading-tight hover:text-accent">
                      {i.name}
                    </Link>
                  ) : (
                    <p className="display text-2xl leading-tight">{i.name}</p>
                  )}
                  {i.variant && <p className="mt-1 text-sm text-muted">{i.variant}</p>}
                  <p className="mt-1 text-xs text-muted">
                    Qty {i.qty}
                    {i.huid && ` · HUID ${i.huid}`}
                  </p>
                  {order.status === "delivered" && i.slug && (
                    <Link href={`/shop/${i.slug}#reviews`} className="link-underline mt-2 inline-block text-[11px] uppercase tracking-[0.14em]">
                      Write a review
                    </Link>
                  )}
                </div>
                <p className="tabular-nums">{price(i.price * i.qty)}</p>
              </li>
            ))}
          </ul>

          {order.giftMessage && (
            <div className="mt-8 flex gap-4 rounded-[var(--radius)] bg-surface p-5">
              <Gift size={18} strokeWidth={1.4} className="mt-1 shrink-0 text-accent" />
              <div>
                <p className="eyebrow">Gift message</p>
                <p className="display mt-2 text-xl italic">“{order.giftMessage}”</p>
              </div>
            </div>
          )}

          {order.returns.length > 0 && (
            <div className="mt-8 space-y-3">
              {order.returns.map((r) => (
                <div key={r.id} className="flex items-start gap-4 rounded-[var(--radius)] border border-line p-5 text-sm">
                  <RotateCcw size={18} strokeWidth={1.4} className="mt-0.5 shrink-0 text-accent" />
                  <div className="flex-1">
                    <p className="font-medium capitalize">
                      {r.type} request · <span className="text-accent">{r.status.replace(/_/g, " ")}</span>
                    </p>
                    <p className="text-muted">Reason: {r.reason}</p>
                    {r.adminNote && <p className="mt-2">{r.adminNote}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-6 lg:col-span-5">
          <div className="rounded-[var(--radius)] bg-surface p-6 md:p-8">
            <div className="space-y-2 text-sm tabular-nums">
              <Row k="Subtotal" v={price(order.subtotal)} />
              {order.discount > 0 && <Row k={`Discount${order.couponCode ? ` (${order.couponCode})` : ""}`} v={`−${price(order.discount)}`} />}
              {order.giftWrapFee > 0 && <Row k="Gift wrap" v={price(order.giftWrapFee)} />}
              <Row k="Shipping" v={order.shipping ? price(order.shipping) : "Complimentary"} />
              <div className="flex justify-between border-t border-line pt-3 text-lg">
                <span>Total</span>
                <span>{price(order.total)}</span>
              </div>
              <p className="text-xs text-muted">Includes {price(order.taxAmount)} GST</p>
            </div>
            <p className="mt-5 text-xs uppercase tracking-[0.14em] text-muted">
              {order.paymentMethod === "cod" ? "Pay on delivery" : "Paid online"} · {order.paymentStatus}
            </p>
            <a href={`/api/orders/${order.number}/invoice?k=${accessKey}`} target="_blank" className="btn btn-ghost mt-6 w-full justify-center">
              <Download size={14} /> GST invoice (PDF)
            </a>
          </div>
          <div className="rounded-[var(--radius)] border border-line p-6 text-sm">
            <p className="eyebrow mb-3 flex items-center gap-2">
              <Package size={13} /> Delivering to
            </p>
            <p className="leading-relaxed text-muted">
              {a.line1}
              {a.line2 && `, ${a.line2}`}
              <br />
              {a.city}, {a.state} {a.pincode}
            </p>
          </div>
          {canRequestReturn && (
            <button onClick={() => setReturning(true)} className="btn btn-ghost w-full justify-center">
              <RotateCcw size={14} /> Request a return{exchangeEnabled ? " or exchange" : ""}
            </button>
          )}
          <p className="text-xs text-muted">
            Need help? <Link href="/contact" className="underline">Contact our concierge</Link> · Returns accepted within {returnWindowDays} days of delivery.
          </p>
        </aside>
      </div>
      <ReturnForm open={returning} onClose={() => setReturning(false)} number={order.number} items={order.items} exchangeEnabled={exchangeEnabled} />
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{k}</span>
      <span>{v}</span>
    </div>
  );
}

const REASONS = ["Size doesn't fit", "Looks different from photos", "Changed my mind", "Received a damaged piece", "Received the wrong item", "Other"];

function ReturnForm({ open, onClose, number, items, exchangeEnabled }: { open: boolean; onClose: () => void; number: string; items: Item[]; exchangeEnabled: boolean }) {
  const router = useRouter();
  const [type, setType] = useState<"return" | "exchange">("return");
  const [selected, setSelected] = useState<string[]>(items.map((i) => i.name));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <SiteModal open={open} onClose={onClose} title="Return or exchange">
      <form
        className="space-y-6"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          const f = Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>;
          const res = await fetch("/api/returns", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ number, type, reason: f.reason, details: f.details, items: selected }) });
          const j = await res.json().catch(() => ({}));
          setBusy(false);
          if (!res.ok) return setError(j.error || "Couldn't submit your request.");
          onClose();
          router.refresh();
        }}
      >
        {exchangeEnabled && (
          <div className="flex gap-1 rounded-full border border-line p-1 text-[11px] uppercase tracking-[0.14em]">
            {(["return", "exchange"] as const).map((t) => (
              <button type="button" key={t} onClick={() => setType(t)} className={cn("flex-1 rounded-full px-3 py-2.5", type === t ? "bg-fg text-bg" : "")}>
                {t}
              </button>
            ))}
          </div>
        )}
        <div>
          <p className="eyebrow mb-3">Which pieces?</p>
          {items.map((i) => (
            <label key={i.name} className="flex items-center gap-3 py-1.5 text-sm">
              <input type="checkbox" checked={selected.includes(i.name)} onChange={(e) => setSelected(e.target.checked ? [...selected, i.name] : selected.filter((x) => x !== i.name))} className="accent-[var(--fg)]" />
              {i.name} {i.variant && <span className="text-muted">· {i.variant}</span>}
            </label>
          ))}
        </div>
        <select name="reason" required className="input-line" defaultValue="">
          <option value="" disabled>
            Reason
          </option>
          {REASONS.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
        <textarea name="details" rows={3} placeholder={type === "exchange" ? "What would you like instead? (size, metal…)" : "Anything else we should know?"} className="input-line resize-none" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn btn-primary w-full justify-center" disabled={busy || selected.length === 0}>
          {busy ? "Submitting…" : "Submit request"}
        </button>
        <p className="text-xs text-muted">We&apos;ll arrange an insured pickup. Refunds are issued to the original payment method within 5–7 days of the piece reaching us.</p>
      </form>
    </SiteModal>
  );
}
