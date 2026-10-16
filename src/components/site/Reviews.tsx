"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAccount } from "./Account";
import { Reveal } from "./motion";
import { Stars } from "./Wish";

export type ReviewItem = { id: string; name: string; rating: number; title: string | null; body: string; verified: boolean; date: string };

export function Reviews({ productId, productName, items, avg, count, distribution }: { productId: string; productName: string; items: ReviewItem[]; avg: number; count: number; distribution: number[] }) {
  const [shown, setShown] = useState(5);
  const [writing, setWriting] = useState(false);
  const [filter, setFilter] = useState<number | null>(null);
  const list = filter ? items.filter((r) => r.rating === filter) : items;

  return (
    <section id="reviews" className="site-container scroll-mt-28 border-t border-line py-20 md:py-28">
      <div className="grid gap-12 md:grid-cols-12">
        <div className="md:col-span-4">
          <p className="eyebrow">Reviews</p>
          <h2 className="display mt-4 text-[clamp(2.4rem,4.5vw,4rem)] leading-none">
            {count ? (
              <>
                {avg.toFixed(1)} <span className="text-2xl text-muted">/ 5</span>
              </>
            ) : (
              <>
                Be the <em className="accent-word">first</em>
              </>
            )}
          </h2>
          {count > 0 && (
            <>
              <Stars value={avg} size={16} className="mt-3" />
              <p className="mt-2 text-sm text-muted">Based on {count} review{count > 1 ? "s" : ""}</p>
              <div className="mt-6 space-y-2">
                {[5, 4, 3, 2, 1].map((n) => {
                  const c = distribution[n - 1] ?? 0;
                  return (
                    <button key={n} onClick={() => setFilter(filter === n ? null : n)} className={cn("flex w-full items-center gap-3 text-xs", filter && filter !== n && "opacity-40")}>
                      <span className="w-6 text-left tabular-nums">{n}★</span>
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                        <span className="block h-full bg-accent" style={{ width: `${count ? (c / count) * 100 : 0}%` }} />
                      </span>
                      <span className="w-6 text-right tabular-nums text-muted">{c}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
          <button onClick={() => setWriting(!writing)} className="btn btn-ghost mt-8">
            {writing ? "Close" : "Write a review"}
          </button>
        </div>

        <div className="md:col-span-7 md:col-start-6">
          <AnimatePresence>{writing && <ReviewForm productId={productId} productName={productName} onDone={() => setWriting(false)} />}</AnimatePresence>
          {list.length === 0 && !writing && <p className="text-muted">No reviews yet. If you own this piece, we'd love to hear from you.</p>}
          <ul className="divide-y divide-line">
            {list.slice(0, shown).map((r, i) => (
              <Reveal as="li" key={r.id} delay={(i % 5) * 0.05} className="py-7">
                <div className="flex items-center justify-between gap-4">
                  <Stars value={r.rating} />
                  <span className="text-xs text-muted">{r.date}</span>
                </div>
                {r.title && <p className="display mt-3 text-2xl">{r.title}</p>}
                <p className="mt-2 leading-relaxed text-muted">{r.body}</p>
                <p className="mt-4 flex items-center gap-2 text-xs uppercase tracking-[0.14em]">
                  {r.name}
                  {r.verified && (
                    <span className="inline-flex items-center gap-1 text-accent">
                      <BadgeCheck size={13} /> Verified buyer
                    </span>
                  )}
                </p>
              </Reveal>
            ))}
          </ul>
          {list.length > shown && (
            <button onClick={() => setShown(shown + 5)} className="link-underline mt-4 text-[12px] uppercase tracking-[0.16em]">
              Show more reviews
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function ReviewForm({ productId, productName, onDone }: { productId: string; productName: string; onDone: () => void }) {
  const { customer } = useAccount();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [state, setState] = useState<"idle" | "busy" | "ok" | "err">("idle");
  const [msg, setMsg] = useState("");

  if (state === "ok")
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-10 rounded-[var(--radius)] bg-surface p-6">
        <p className="display text-3xl">Thank you.</p>
        <p className="mt-2 text-sm text-muted">{msg}</p>
      </motion.div>
    );

  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="mb-10 overflow-hidden"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!rating) {
          setState("err");
          setMsg("Please choose a star rating.");
          return;
        }
        setState("busy");
        const f = Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>;
        const res = await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, rating, title: f.title, body: f.body, name: f.name || undefined, email: f.email || undefined }),
        });
        const json = await res.json().catch(() => ({}));
        if (res.ok) {
          setState("ok");
          setMsg(json.published ? "Your review is live." : "Your review will appear once our team has had a look.");
          setTimeout(onDone, 6000);
        } else {
          setState("err");
          setMsg(json.error || "Couldn't post your review.");
        }
      }}
    >
      <div className="rounded-[var(--radius)] border border-line p-6">
        <p className="eyebrow">Reviewing {productName}</p>
        <div className="mt-4 flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button type="button" key={n} onMouseEnter={() => setHover(n)} onClick={() => setRating(n)} aria-label={`${n} star${n > 1 ? "s" : ""}`} className="p-0.5">
              <svg width="26" height="26" viewBox="0 0 24 24" className="text-accent" aria-hidden>
                <path d="M12 2l2.9 6.9 7.1.6-5.4 4.7 1.6 7L12 17.5 5.8 21.2l1.6-7L2 9.5l7.1-.6z" fill={(hover || rating) >= n ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.2" />
              </svg>
            </button>
          ))}
        </div>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          {!customer && (
            <>
              <input name="name" required placeholder="Your name" className="input-line" />
              <input name="email" type="email" required placeholder="Email (not published)" className="input-line" />
            </>
          )}
          <input name="title" placeholder="Headline" className="input-line sm:col-span-2" />
          <textarea name="body" required minLength={10} rows={4} placeholder="How does it look, feel, wear?" className="input-line resize-none sm:col-span-2" />
        </div>
        {state === "err" && <p className="mt-3 text-sm text-red-600">{msg}</p>}
        <button className="btn btn-primary mt-6" disabled={state === "busy"}>
          {state === "busy" ? "Posting…" : "Post review"}
        </button>
      </div>
    </motion.form>
  );
}
