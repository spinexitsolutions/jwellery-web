"use client";

import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, Minus, Plus } from "lucide-react";
import type { ProductView } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Accent, CountUp, Magnetic, ParallaxImage, Reveal, SafeImage, ScrollHighlight, SplitText, useAnimationsOn } from "@/components/site/motion";
import { ProductCard } from "@/components/site/ProductCard";

type D = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

function Heading({ eyebrow, title, className, center }: { eyebrow?: string; title?: string; className?: string; center?: boolean }) {
  if (!eyebrow && !title) return null;
  return (
    <div className={cn(center && "text-center", className)}>
      {eyebrow && (
        <Reveal y={12}>
          <p className="eyebrow">{eyebrow}</p>
        </Reveal>
      )}
      {title && <SplitText as="h2" text={title} className="display mt-4 block text-[clamp(2.5rem,5.6vw,5.6rem)]" />}
    </div>
  );
}

export function Marquee({ data }: { data: D }) {
  const items: { text: string }[] = data.items || [];
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const skew = useTransform(scrollYProgress, [0, 0.5, 1], [-4, 0, 4]);
  const on = useAnimationsOn();
  const row = [...items, ...items, ...items];
  return (
    <div ref={ref} className="overflow-hidden border-y border-line py-8 md:py-10">
      <motion.div style={on ? { skewX: skew } : undefined}>
        <div className="animate-marquee flex w-max items-center" style={{ ["--speed" as string]: `${data.speed || 40}s` }}>
          {[...row, ...row].map((it, i) => (
            <span key={i} className="flex items-center">
              <span className={cn("display whitespace-nowrap px-8 text-[clamp(2.6rem,7vw,7rem)] leading-none", data.outlined && i % 2 === 1 && "text-outline", i % 2 === 0 && "italic")}>{it.text}</span>
              <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0 text-accent md:h-9 md:w-9" fill="currentColor" aria-hidden>
                <path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z" />
              </svg>
            </span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export function Manifesto({ data }: { data: D }) {
  return (
    <div className="site-container grid gap-10 py-28 md:grid-cols-12 md:py-44">
      <div className="md:col-span-3">
        <Reveal y={10}>
          <p className="eyebrow">{data.eyebrow}</p>
        </Reveal>
      </div>
      <div className="md:col-span-9">
        <ScrollHighlight text={data.text || ""} className="display text-[clamp(2rem,4.4vw,4.6rem)] leading-[1.08]" />
        {data.signature && (
          <Reveal className="mt-12 text-sm uppercase tracking-[0.2em] text-muted" delay={0.2}>
            {data.signature}
          </Reveal>
        )}
      </div>
    </div>
  );
}

export function ProductsGrid({ data, products }: { data: D; products: ProductView[] }) {
  return (
    <div className="site-container py-24 md:py-36">
      <div className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <Heading eyebrow={data.eyebrow} title={data.title} />
        {data.ctaLabel && (
          <Reveal>
            <Link href={data.ctaHref || "/shop"} className="link-underline flex items-center gap-2 text-[12px] uppercase tracking-[0.16em]">
              {data.ctaLabel} <ArrowRight size={14} />
            </Link>
          </Reveal>
        )}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:gap-x-6 lg:grid-cols-4">
        {products.map((p, i) => (
          <div key={p.id} className={cn(i % 4 === 1 && "lg:mt-16", i % 4 === 3 && "lg:mt-16")}>
            <ProductCard product={p} index={i} />
          </div>
        ))}
      </div>
      {products.length === 0 && <p className="text-muted">No products yet — add some from the admin panel.</p>}
    </div>
  );
}

export function Story({ data }: { data: D }) {
  const right = data.imagePosition === "right";
  const stats: { value: string; label: string }[] = data.stats || [];
  return (
    <div className="site-container grid items-center gap-14 py-24 md:grid-cols-12 md:gap-10 md:py-36">
      <div className={cn("relative md:col-span-6", right ? "md:order-2 md:col-start-7" : "")}>
        <ParallaxImage src={data.image} className="aspect-[4/5] w-full rounded-[var(--radius)] md:w-[88%]" />
        {data.imageSecondary && (
          <ParallaxImage
            src={data.imageSecondary}
            strength={20}
            className={cn("absolute -bottom-10 aspect-square w-[42%] rounded-[var(--radius)] border-[6px] border-bg", right ? "-left-4 md:-left-10" : "right-0 md:right-2")}
          />
        )}
      </div>
      <div className={cn("md:col-span-5", right ? "md:order-1" : "md:col-start-8")}>
        <Heading eyebrow={data.eyebrow} title={data.title} />
        <Reveal delay={0.15}>
          <div className="prose-site mt-8 text-muted" dangerouslySetInnerHTML={{ __html: data.bodyHtml || "" }} />
        </Reveal>
        {stats.length > 0 && (
          <div className="mt-10 grid grid-cols-3 gap-4 border-t border-line pt-8">
            {stats.map((s, i) => (
              <Reveal key={i} delay={0.1 * i}>
                <p className="display text-5xl">
                  <CountUp value={s.value} />
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.14em] text-muted">{s.label}</p>
              </Reveal>
            ))}
          </div>
        )}
        {data.ctaLabel && (
          <Reveal delay={0.25} className="mt-10">
            <Magnetic>
              <Link href={data.ctaHref || "#"} className="btn btn-ghost">
                {data.ctaLabel} <ArrowRight size={14} />
              </Link>
            </Magnetic>
          </Reveal>
        )}
      </div>
    </div>
  );
}

export function Steps({ data }: { data: D }) {
  const items: { title: string; body: string; image?: string }[] = data.items || [];
  return (
    <div className="site-container py-24 md:py-36">
      <Heading eyebrow={data.eyebrow} title={data.title} className="mb-16 max-w-3xl" />
      <div className="grid gap-px overflow-hidden rounded-[var(--radius)] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        {items.map((s, i) => (
          <Reveal key={i} delay={i * 0.1} className="group relative flex min-h-[340px] flex-col justify-between overflow-hidden bg-bg p-7 transition-colors duration-700 hover:bg-surface">
            <span className="display text-[5.5rem] leading-none text-accent/80 transition-transform duration-700 group-hover:-translate-y-2">{String(i + 1).padStart(2, "0")}</span>
            {s.image && <SafeImage src={s.image} alt="" className="my-6 aspect-video w-full rounded-[var(--radius)] object-cover" />}
            <div>
              <h3 className="display text-3xl">{s.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{s.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

export function Stats({ data }: { data: D }) {
  const items: { value: string; suffix?: string; label: string }[] = data.items || [];
  return (
    <div className="site-container grid grid-cols-2 gap-y-14 py-24 md:grid-cols-4 md:py-32">
      {items.map((s, i) => (
        <Reveal key={i} delay={i * 0.08} className={cn("px-2 md:px-6", i > 0 && "md:border-l md:border-line")}>
          <p className="display text-[clamp(3.2rem,6vw,6rem)] leading-none">
            <CountUp value={s.value} suffix={s.suffix} />
          </p>
          <p className="mt-4 text-xs uppercase tracking-[0.18em] text-muted">{s.label}</p>
        </Reveal>
      ))}
    </div>
  );
}

export function Testimonials({ data }: { data: D }) {
  const items: { quote: string; name: string; role: string }[] = data.items || [];
  const [i, setI] = useState(0);
  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => setI((v) => (v + 1) % items.length), 7000);
    return () => clearInterval(t);
  }, [items.length]);
  const cur = items[i];
  if (!cur) return null;
  return (
    <div className="site-container py-24 md:py-40">
      <div className="flex items-center justify-between">
        <p className="eyebrow">{data.eyebrow}</p>
        <p className="text-xs tabular-nums text-muted">
          {String(i + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
        </p>
      </div>
      <div className="relative mt-12 min-h-[340px] md:min-h-[300px]">
        <AnimatePresence mode="wait">
          <motion.blockquote
            key={i}
            initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="display max-w-5xl text-[clamp(2rem,4.2vw,4.2rem)] leading-[1.1]">“{cur.quote}”</p>
            <footer className="mt-10 flex items-center gap-4 text-sm">
              <span className="h-px w-10 bg-accent" />
              <span>{cur.name}</span>
              <span className="text-muted">{cur.role}</span>
            </footer>
          </motion.blockquote>
        </AnimatePresence>
      </div>
      <div className="mt-10 flex gap-2">
        {items.map((_, k) => (
          <button key={k} onClick={() => setI(k)} aria-label={`Quote ${k + 1}`} className="h-[3px] w-12 overflow-hidden bg-line">
            {k === i && <motion.span key={i} className="block h-full bg-fg" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 7, ease: "linear" }} />}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Gallery({ data }: { data: D }) {
  const images: { src: string; caption?: string; href?: string }[] = data.images || [];
  const layouts = ["md:col-span-5 aspect-[4/5]", "md:col-span-4 md:mt-40 aspect-[3/4]", "md:col-span-3 md:mt-16 aspect-[3/4]", "md:col-span-4 md:col-start-3 aspect-[4/3]", "md:col-span-5 md:-mt-20 aspect-[4/5]"];
  return (
    <div className="site-container py-24 md:py-36">
      <Heading eyebrow={data.eyebrow} title={data.title} className="mb-16" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-12 md:gap-6">
        {images.map((img, i) => {
          const inner = (
            <>
              <ParallaxImage src={img.src} alt={img.caption} className={cn("w-full rounded-[var(--radius)]", layouts[i % layouts.length].split(" ").filter((c) => c.startsWith("aspect")).join(" "))} strength={8 + (i % 3) * 5} />
              {img.caption && <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted">{img.caption}</p>}
            </>
          );
          const cls = layouts[i % layouts.length].split(" ").filter((c) => !c.startsWith("aspect")).join(" ");
          return img.href ? (
            <Link key={i} href={img.href} className={cls} data-cursor="View">
              {inner}
            </Link>
          ) : (
            <div key={i} className={cls}>
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export type PostCard = { slug: string; title: string; excerpt: string | null; coverImage: string | null; category: string | null; date: string };

export function JournalList({ data, posts }: { data: D; posts: PostCard[] }) {
  return (
    <div className="site-container py-24 md:py-36">
      <div className="mb-14 flex items-end justify-between">
        <Heading eyebrow={data.eyebrow} title={data.title} />
        <Reveal>
          <Link href="/journal" className="link-underline hidden items-center gap-2 text-[12px] uppercase tracking-[0.16em] md:flex">
            All stories <ArrowRight size={14} />
          </Link>
        </Reveal>
      </div>
      <div className="grid gap-12 md:grid-cols-3 md:gap-8">
        {posts.map((p, i) => (
          <Reveal key={p.slug} delay={i * 0.1}>
            <Link href={`/journal/${p.slug}`} className="group block" data-cursor="Read">
              <div className="aspect-[4/3] overflow-hidden rounded-[var(--radius)]">
                <SafeImage src={p.coverImage} alt={p.title} className="h-full w-full object-cover transition-transform duration-[1.4s] group-hover:scale-105" />
              </div>
              <div className="mt-5 flex gap-4 text-[11px] uppercase tracking-[0.18em] text-muted">
                <span>{p.category}</span>
                <span>{p.date}</span>
              </div>
              <h3 className="display mt-3 text-3xl leading-tight transition-colors group-hover:text-accent">{p.title}</h3>
              <p className="mt-3 line-clamp-2 text-sm text-muted">{p.excerpt}</p>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

export function Banner({ data }: { data: D }) {
  const ref = useRef<HTMLDivElement>(null);
  const on = useAnimationsOn();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);
  const inset = useTransform(scrollYProgress, [0, 0.35], ["8%", "0%"]);
  const clip = useTransform(inset, (v) => `inset(${v} ${v} ${v} ${v} round var(--radius))`);
  return (
    <div ref={ref} className="relative overflow-hidden text-white" style={{ height: `${data.height || 90}vh` }}>
      <motion.div className="absolute inset-0" style={on ? { clipPath: clip } : undefined}>
        <motion.div className="absolute inset-[-15%_0]" style={on ? { y } : undefined}>
          <SafeImage src={data.image} alt="" className="h-full w-full object-cover" />
        </motion.div>
        <div className="absolute inset-0 bg-black/35" />
      </motion.div>
      <div className="site-container relative flex h-full flex-col items-center justify-center text-center">
        <Reveal y={10}>
          <p className="eyebrow !text-white/75">{data.eyebrow}</p>
        </Reveal>
        <SplitText as="h2" text={data.title || ""} className="display mt-6 max-w-5xl text-[clamp(2.8rem,7vw,7.5rem)] leading-[0.95] [&_.accent-word]:text-white" />
        {data.ctaLabel && (
          <Reveal delay={0.3} className="mt-10">
            <Magnetic>
              <Link href={data.ctaHref || "#"} className="btn border border-white/70 text-white hover:bg-white hover:text-black">
                {data.ctaLabel} <ArrowUpRight size={14} />
              </Link>
            </Magnetic>
          </Reveal>
        )}
      </div>
    </div>
  );
}

export function CTA({ data }: { data: D }) {
  return (
    <div className="site-container flex flex-col items-center py-28 text-center md:py-44">
      <Reveal y={10}>
        <p className="eyebrow">{data.eyebrow}</p>
      </Reveal>
      <SplitText as="h2" text={data.title || ""} className="display mt-6 text-[clamp(3rem,9vw,9.5rem)] leading-[0.9]" />
      {data.body && (
        <Reveal delay={0.2}>
          <p className="mx-auto mt-8 max-w-lg leading-relaxed text-muted">{data.body}</p>
        </Reveal>
      )}
      {data.ctaLabel && (
        <Reveal delay={0.3} className="mt-12">
          <Magnetic strength={0.5}>
            <Link href={data.ctaHref || "#"} className="grid h-40 w-40 place-items-center rounded-full bg-accent text-center text-[11px] uppercase tracking-[0.2em] text-accent-fg transition-transform duration-500 hover:scale-105 md:h-48 md:w-48">
              <span className="px-6">{data.ctaLabel}</span>
            </Link>
          </Magnetic>
        </Reveal>
      )}
    </div>
  );
}

export function Newsletter({ data }: { data: D }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "ok" | "err">("idle");
  return (
    <div className="site-container grid gap-10 py-24 md:grid-cols-2 md:items-end md:py-32">
      <div>
        <SplitText as="h2" text={data.title || ""} className="display text-[clamp(2.6rem,5.5vw,5.5rem)]" />
        <Reveal delay={0.15}>
          <p className="mt-6 max-w-md text-muted">{data.body}</p>
        </Reveal>
      </div>
      <Reveal delay={0.2}>
        <form
          className="flex items-center gap-4 border-b border-fg/40 focus-within:border-fg"
          onSubmit={async (e) => {
            e.preventDefault();
            setState("loading");
            const res = await fetch("/api/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
            setState(res.ok ? "ok" : "err");
            if (res.ok) setEmail("");
          }}
        >
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full bg-transparent py-5 text-lg outline-none placeholder:text-muted/60" />
          <button className="btn btn-primary shrink-0" disabled={state === "loading"}>
            {state === "loading" ? "…" : data.buttonLabel || "Subscribe"}
          </button>
        </form>
        <p className="mt-3 h-4 text-sm text-muted">{state === "ok" ? "Welcome — your first letter is on its way." : state === "err" ? "Something went wrong. Please try again." : ""}</p>
      </Reveal>
    </div>
  );
}

export function FAQ({ data }: { data: D }) {
  const items: { q: string; a: string }[] = data.items || [];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="site-container grid gap-12 py-24 md:grid-cols-12 md:py-36">
      <Heading eyebrow={data.eyebrow} title={data.title} className="md:col-span-4" />
      <div className="md:col-span-7 md:col-start-6">
        {items.map((it, i) => (
          <Reveal key={i} delay={i * 0.05} className="border-b border-line">
            <button className="flex w-full items-center justify-between gap-6 py-6 text-left" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
              <span className="display text-2xl md:text-3xl">{it.q}</span>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line">{open === i ? <Minus size={14} /> : <Plus size={14} />}</span>
            </button>
            <AnimatePresence initial={false}>
              {open === i && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
                  <p className="max-w-2xl pb-7 leading-relaxed text-muted">{it.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

export function PageHeader({ data }: { data: D }) {
  return (
    <div className="site-container pb-16 pt-36 md:pb-24 md:pt-48">
      <div className="grid gap-10 md:grid-cols-12 md:items-end">
        <div className={data.image ? "md:col-span-7" : "md:col-span-10"}>
          {data.eyebrow && (
            <Reveal y={10}>
              <p className="eyebrow">{data.eyebrow}</p>
            </Reveal>
          )}
          <SplitText as="h1" immediate text={data.title || ""} className="display mt-6 block text-[clamp(3.2rem,9vw,9rem)] leading-[0.9]" />
          {data.subtitle && (
            <Reveal delay={0.3}>
              <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted">{data.subtitle}</p>
            </Reveal>
          )}
        </div>
        {data.image && (
          <div className="md:col-span-5">
            <ParallaxImage src={data.image} className="aspect-[4/5] w-full rounded-[var(--radius)]" />
          </div>
        )}
      </div>
    </div>
  );
}

export function RichText({ data }: { data: D }) {
  return (
    <div className={cn("site-container py-16 md:py-24")}>
      <Reveal>
        <div className={cn("prose-site mx-auto", data.width === "wide" ? "max-w-5xl" : "max-w-2xl")} dangerouslySetInnerHTML={{ __html: data.contentHtml || "" }} />
      </Reveal>
    </div>
  );
}

export function HtmlEmbed({ data }: { data: D }) {
  return <div className="site-container py-12" dangerouslySetInnerHTML={{ __html: data.html || "" }} />;
}

export { Accent };
