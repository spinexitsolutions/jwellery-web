"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import type { NavLink } from "@/lib/settings-types";
import { cn } from "@/lib/utils";
import { useCart } from "./Cart";
import { useSite } from "./SiteProvider";
import { useLenis } from "./SmoothScroll";

export function Header({ links, ticker }: { links: NavLink[]; ticker: string[] }) {
  const site = useSite();
  const { count, setOpen } = useCart();
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const lenis = useLenis();

  useMotionValueEvent(scrollY, "change", (v) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(v > 40);
    setHidden(v > 400 && v > prev && !menu);
  });

  useEffect(() => {
    setMenu(false);
    setSearch(false);
  }, [pathname]);

  useEffect(() => {
    if (menu || search) lenis?.stop();
    else lenis?.start();
  }, [menu, search, lenis]);

  const solid = site.headerStyle === "solid" || scrolled || pathname !== "/";
  const half = Math.ceil(links.length / 2);

  return (
    <>
      <motion.header
        className="fixed inset-x-0 top-0 z-[70]"
        animate={{ y: hidden ? "-100%" : "0%" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {ticker.length > 0 && (
          <div className="overflow-hidden bg-dark py-2 text-[10.5px] uppercase tracking-[0.22em] text-dark-fg">
            <div className="animate-marquee flex w-max gap-12 whitespace-nowrap" style={{ ["--speed" as string]: "45s" }}>
              {[...ticker, ...ticker, ...ticker, ...ticker].map((t, i) => (
                <span key={i} className="flex items-center gap-12">
                  {t}
                  <span className="text-accent">✦</span>
                </span>
              ))}
            </div>
          </div>
        )}
        <div className={cn("transition-[background,border-color,backdrop-filter] duration-500", solid ? "border-b border-line bg-bg/80 backdrop-blur-xl" : "border-b border-transparent")}>
          <div className="site-container grid h-16 grid-cols-[1fr_auto_1fr] items-center md:h-[72px]">
            <nav className="hidden items-center gap-8 text-[12px] uppercase tracking-[0.16em] lg:flex">
              {links.slice(0, half).map((l) => (
                <NavItem key={l.href + l.label} link={l} active={pathname.startsWith(l.href)} />
              ))}
            </nav>
            <button className="flex items-center gap-3 text-[12px] uppercase tracking-[0.16em] lg:hidden" onClick={() => setMenu(true)} aria-label="Open menu">
              <span className="flex w-6 flex-col gap-[5px]">
                <span className="h-px w-full bg-current" />
                <span className="h-px w-2/3 bg-current" />
              </span>
              <span className="hidden sm:inline">Menu</span>
            </button>

            <Link href="/" className="display flex items-center justify-center text-[28px] leading-none tracking-tight md:text-[34px]" aria-label={site.brandName}>
              {site.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={site.logoUrl} alt={site.brandName} className="h-8 w-auto md:h-10" />
              ) : (
                site.brandName
              )}
            </Link>

            <div className="flex items-center justify-end gap-6 text-[12px] uppercase tracking-[0.16em] md:gap-8">
              <nav className="hidden items-center gap-8 lg:flex">
                {links.slice(half).map((l) => (
                  <NavItem key={l.href + l.label} link={l} active={pathname.startsWith(l.href)} />
                ))}
              </nav>
              <button onClick={() => setSearch(true)} aria-label="Search" className="transition-opacity hover:opacity-60">
                <Search size={17} strokeWidth={1.4} />
              </button>
              <button onClick={() => setOpen(true)} className="flex items-center gap-2" aria-label="Open bag">
                <span className="hidden sm:inline">Bag</span>
                <span className="grid h-6 min-w-6 place-items-center rounded-full border border-current px-1.5 text-[10px] tabular-nums">{count}</span>
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>{menu && <MobileMenu links={links} onClose={() => setMenu(false)} />}</AnimatePresence>
      <AnimatePresence>{search && <SearchOverlay onClose={() => setSearch(false)} />}</AnimatePresence>
    </>
  );
}

function NavItem({ link, active }: { link: NavLink; active: boolean }) {
  return (
    <Link href={link.href} className="group relative overflow-hidden py-1">
      <span className="block transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:-translate-y-full">{link.label}</span>
      <span className="absolute left-0 top-full block text-accent transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:-translate-y-full">{link.label}</span>
      {active && <span className="absolute -bottom-0 left-0 h-px w-full bg-current" />}
    </Link>
  );
}

function MobileMenu({ links, onClose }: { links: NavLink[]; onClose: () => void }) {
  const site = useSite();
  return (
    <motion.div
      className="fixed inset-0 z-[95] flex flex-col bg-dark text-dark-fg"
      initial={{ clipPath: "inset(0% 0% 100% 0%)" }}
      animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
      exit={{ clipPath: "inset(0% 0% 100% 0%)" }}
      transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
    >
      <div className="site-container flex h-16 items-center justify-between">
        <span className="display text-3xl">{site.brandName}</span>
        <button onClick={onClose} className="grid h-11 w-11 place-items-center rounded-full border border-dark-fg/30" aria-label="Close menu">
          <X size={18} />
        </button>
      </div>
      <nav className="site-container flex flex-1 flex-col justify-center gap-2">
        {[{ label: "Home", href: "/" }, ...links].map((l, i) => (
          <div key={l.href + i} className="overflow-hidden">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} transition={{ delay: 0.25 + i * 0.06, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
              <Link href={l.href} onClick={onClose} className="display flex items-baseline gap-4 text-[13vw] leading-[1.05] sm:text-7xl">
                <span className="font-sans text-xs tracking-widest text-accent">0{i + 1}</span>
                {l.label}
              </Link>
            </motion.div>
          </div>
        ))}
      </nav>
      <motion.div className="site-container pb-8 text-sm text-dark-fg/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
        <p>{site.email}</p>
        <p>{site.phone}</p>
      </motion.div>
    </motion.div>
  );
}

function SearchOverlay({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const t = setTimeout(() => input.current?.focus(), 300);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", esc);
    };
  }, [onClose]);
  return (
    <motion.div
      className="fixed inset-0 z-[95] bg-bg/95 backdrop-blur-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="site-container flex h-full flex-col justify-center">
        <button onClick={onClose} className="absolute right-6 top-6 grid h-11 w-11 place-items-center rounded-full border border-line" aria-label="Close search">
          <X size={18} />
        </button>
        <p className="eyebrow mb-6">Search the collection</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            router.push(`/shop?q=${encodeURIComponent(q)}`);
            onClose();
          }}
        >
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rings, polki, emerald…"
            className="display w-full border-b border-line bg-transparent pb-4 text-[10vw] outline-none placeholder:text-muted/40 md:text-8xl"
          />
        </form>
        <div className="mt-8 flex flex-wrap gap-3 text-xs uppercase tracking-[0.18em] text-muted">
          {["Rings", "Earrings", "Necklace", "Bridal", "Diamond"].map((s) => (
            <button
              key={s}
              className="rounded-full border border-line px-4 py-2 transition hover:border-fg hover:text-fg"
              onClick={() => {
                router.push(`/shop?q=${encodeURIComponent(s)}`);
                onClose();
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
