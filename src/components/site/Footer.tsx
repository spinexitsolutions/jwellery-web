"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import type { Navigation } from "@/lib/settings-types";
import { useSite } from "./SiteProvider";
import { useLenis } from "./SmoothScroll";

export function Footer({ nav, socials, note }: { nav: Navigation["footer"]; socials: { label: string; href: string }[]; note: string }) {
  const site = useSite();
  const ref = useRef<HTMLElement>(null);
  const lenis = useLenis();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-30%", "0%"]);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "ok" | "err">("idle");

  return (
    <footer ref={ref} className="relative overflow-hidden bg-dark text-dark-fg">
      <div className="site-container grid gap-14 pb-10 pt-24 md:grid-cols-12 md:pt-32">
        <div className="md:col-span-5">
          <p className="eyebrow !text-dark-fg/50">Letters from the atelier</p>
          <form
            className="mt-6 flex items-center border-b border-dark-fg/25 focus-within:border-dark-fg"
            onSubmit={async (e) => {
              e.preventDefault();
              const res = await fetch("/api/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
              setState(res.ok ? "ok" : "err");
              if (res.ok) setEmail("");
            }}
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              className="display w-full bg-transparent py-4 text-3xl outline-none placeholder:text-dark-fg/30"
            />
            <button className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-dark-fg text-dark transition hover:bg-accent hover:text-accent-fg" aria-label="Subscribe">
              <ArrowUpRight size={18} />
            </button>
          </form>
          <p className="mt-3 h-4 text-xs text-dark-fg/50">{state === "ok" ? "Thank you — you're on the list." : state === "err" ? "Please check your email and try again." : ""}</p>
          <p className="mt-10 max-w-sm text-sm leading-relaxed text-dark-fg/60">{note}</p>
        </div>
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 md:col-span-7 md:pl-12">
          {nav.map((col) => (
            <div key={col.title}>
              <p className="eyebrow !text-dark-fg/50">{col.title}</p>
              <ul className="mt-5 space-y-3 text-sm">
                {col.links.map((l, i) => (
                  <li key={`${l.href}-${i}`}>
                    <Link href={l.href} className="link-underline">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <p className="eyebrow !text-dark-fg/50">Visit</p>
            <address className="mt-5 space-y-2 text-sm not-italic text-dark-fg/80">
              <p>{site.address}</p>
              <p>{site.hours}</p>
              <p>
                <a className="link-underline" href={`tel:${site.phone.replace(/\s/g, "")}`}>
                  {site.phone}
                </a>
              </p>
              <p>
                <a className="link-underline" href={`mailto:${site.email}`}>
                  {site.email}
                </a>
              </p>
            </address>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden">
        <motion.p style={{ y }} className="display select-none whitespace-nowrap text-center text-[26vw] leading-[0.8] tracking-[-0.04em] text-dark-fg/[0.07]">
          {site.brandName}
        </motion.p>
      </div>

      <div className="site-container flex flex-col items-start justify-between gap-4 border-t border-dark-fg/15 py-6 text-[11px] uppercase tracking-[0.18em] text-dark-fg/50 md:flex-row md:items-center">
        <p>
          © {new Date().getFullYear()} {site.brandName}. {site.tagline}
        </p>
        <div className="flex flex-wrap gap-6">
          {socials.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noreferrer" className="link-underline hover:text-dark-fg">
              {s.label}
            </a>
          ))}
          <button onClick={() => (lenis ? lenis.scrollTo(0) : window.scrollTo({ top: 0, behavior: "smooth" }))} className="hover:text-dark-fg">
            Back to top ↑
          </button>
        </div>
      </div>
    </footer>
  );
}
