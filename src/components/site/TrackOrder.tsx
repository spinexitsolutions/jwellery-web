"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { ArrowRight, MapPin } from "lucide-react";
import { Reveal, SafeImage, SplitText } from "./motion";
import { Progress } from "./OrderView";
import { usePrice } from "./SiteProvider";

type Result = {
  number: string;
  key: string;
  status: string;
  statusLabel: string;
  placedAt: string;
  total: number;
  items: { name: string; qty: number; variant?: string; image?: string }[];
  timeline: { status: string; note?: string; at: string }[];
  courier: string | null;
  awb: string | null;
  trackingUrl: string | null;
  courierEvents: { date: string; activity: string; location: string }[];
};

export function TrackOrder() {
  const params = useSearchParams();
  const price = usePrice();
  const [number, setNumber] = useState(params.get("order") ?? "");
  const [contact, setContact] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  return (
    <div className="site-container pb-28 pt-36 md:pt-44">
      <p className="eyebrow">Order status</p>
      <SplitText as="h1" immediate text="Track your *order*" className="display mt-5 block text-[clamp(3.2rem,9vw,8rem)] leading-[0.9]" />
      <Reveal delay={0.2}>
        <form
          className="mt-12 grid max-w-3xl gap-6 md:grid-cols-[1fr_1fr_auto] md:items-end"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            const res = await fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ number, contact }) });
            const j = await res.json().catch(() => ({}));
            setBusy(false);
            if (!res.ok) {
              setResult(null);
              return setError(j.error || "Not found");
            }
            setResult(j);
          }}
        >
          <input required value={number} onChange={(e) => setNumber(e.target.value.toUpperCase())} placeholder="Order number (KY…)" className="input-line" />
          <input required value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Email or mobile used" className="input-line" />
          <button className="btn btn-primary justify-center" disabled={busy}>
            {busy ? "Finding…" : "Track"} <ArrowRight size={14} />
          </button>
        </form>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        <p className="mt-6 text-sm text-muted">
          Have an account?{" "}
          <Link href="/account" className="underline">
            Sign in
          </Link>{" "}
          to see all your orders.
        </p>
      </Reveal>

      <AnimatePresence mode="wait">
        {result && (
          <motion.div key={result.number} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="mt-16">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow">
                  {result.number} · placed {new Date(result.placedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </p>
                <p className="display mt-3 text-5xl">{result.statusLabel}</p>
              </div>
              <Link href={`/order/${result.number}?k=${result.key}`} className="link-underline text-[12px] uppercase tracking-[0.16em]">
                Full order & invoice →
              </Link>
            </div>
            <div className="mt-10 rounded-[var(--radius)] border border-line p-6 md:p-10">
              <Progress status={result.status} timeline={result.timeline} />
            </div>
            <div className="mt-10 grid gap-10 md:grid-cols-2">
              <ul className="space-y-4">
                {result.items.map((i, k) => (
                  <li key={k} className="flex items-center gap-4">
                    <SafeImage src={i.image} alt={i.name} className="h-20 w-16 object-cover" />
                    <div>
                      <p className="display text-xl">{i.name}</p>
                      <p className="text-xs text-muted">
                        {i.variant ? `${i.variant} · ` : ""}Qty {i.qty}
                      </p>
                    </div>
                  </li>
                ))}
                <li className="pt-2 text-sm text-muted">Order total {price(result.total)}</li>
              </ul>
              <div>
                {result.awb && (
                  <p className="mb-4 text-sm">
                    {result.courier} · AWB <b>{result.awb}</b>{" "}
                    {result.trackingUrl && (
                      <a href={result.trackingUrl} target="_blank" rel="noreferrer" className="underline">
                        courier site
                      </a>
                    )}
                  </p>
                )}
                <ol className="relative space-y-5 border-l border-line pl-6">
                  {(result.courierEvents.length
                    ? result.courierEvents.map((e) => ({ title: e.activity, sub: e.location, at: e.date }))
                    : [...result.timeline].reverse().map((t) => ({ title: t.status.replace(/_/g, " "), sub: t.note ?? "", at: t.at }))
                  ).map((e, i) => (
                    <li key={i} className="relative">
                      <span className={`absolute -left-[29px] top-1.5 h-2 w-2 rounded-full ${i === 0 ? "bg-accent" : "bg-line"}`} />
                      <p className="text-sm font-medium capitalize">{e.title}</p>
                      <p className="flex items-center gap-1 text-xs text-muted">
                        {e.sub && (
                          <>
                            <MapPin size={11} /> {e.sub} ·
                          </>
                        )}{" "}
                        {new Date(e.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
