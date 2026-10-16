"use client";

import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAccount } from "./Account";

export function WishButton({ productId, className, label }: { productId: string; className?: string; label?: boolean }) {
  const { isSaved, toggle } = useAccount();
  const saved = isSaved(productId);
  return (
    <button
      type="button"
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      aria-pressed={saved}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(productId);
      }}
      className={cn("inline-flex items-center gap-2", className)}
    >
      <motion.span key={String(saved)} initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 15 }}>
        <Heart size={16} strokeWidth={1.5} className={saved ? "fill-accent text-accent" : ""} />
      </motion.span>
      {label && <span>{saved ? "Saved" : "Save"}</span>}
    </button>
  );
}

export function Stars({ value, size = 12, className }: { value: number; size?: number; className?: string }) {
  return (
    <span className={cn("inline-flex gap-0.5 text-accent", className)} aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden>
          <defs>
            <linearGradient id={`g${i}-${Math.round(value * 10)}`}>
              <stop offset={`${Math.max(0, Math.min(1, value - i + 1)) * 100}%`} stopColor="currentColor" />
              <stop offset={`${Math.max(0, Math.min(1, value - i + 1)) * 100}%`} stopColor="transparent" />
            </linearGradient>
          </defs>
          <path d="M12 2l2.9 6.9 7.1.6-5.4 4.7 1.6 7L12 17.5 5.8 21.2l1.6-7L2 9.5l7.1-.6z" fill={`url(#g${i}-${Math.round(value * 10)})`} stroke="currentColor" strokeWidth="1.2" />
        </svg>
      ))}
    </span>
  );
}
