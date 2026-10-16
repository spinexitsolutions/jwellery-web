"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Accent, Reveal, SafeImage, SplitText, useAnimationsOn } from "@/components/site/motion";

export type CollectionCard = { name: string; slug: string; tagline: string | null; image: string | null; count: number };

export function Collections({ data, collections }: { data: { eyebrow?: string; title?: string; layout?: string }; collections: CollectionCard[] }) {
  const on = useAnimationsOn();
  if (data.layout === "grid" || !on) return <CollectionsGrid data={data} collections={collections} />;
  return <CollectionsHorizontal data={data} collections={collections} />;
}

function CollectionsHorizontal({ data, collections }: { data: { eyebrow?: string; title?: string }; collections: CollectionCard[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -distance]);
  const bar = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  useEffect(() => {
    const measure = () => {
      if (!track.current) return;
      setDistance(Math.max(0, track.current.scrollWidth - window.innerWidth));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [collections.length]);

  return (
    <div ref={ref} style={{ height: `calc(100vh + ${distance}px)` }} className="relative">
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <div className="site-container mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="eyebrow">{data.eyebrow}</p>
            <SplitText as="h2" text={data.title || ""} className="display mt-4 text-[clamp(2.6rem,6vw,6rem)]" />
          </div>
          <div className="hidden w-48 md:block">
            <div className="h-px w-full bg-line">
              <motion.div className="h-px bg-accent" style={{ width: bar }} />
            </div>
            <p className="mt-3 text-right text-[10px] uppercase tracking-[0.25em] text-muted">{String(collections.length).padStart(2, "0")} collections</p>
          </div>
        </div>
        <motion.div ref={track} style={{ x }} className="flex w-max gap-5 pl-[clamp(1rem,4vw,3.5rem)] pr-[clamp(1rem,4vw,3.5rem)] md:gap-8">
          {collections.map((c, i) => (
            <Link
              key={c.slug}
              href={`/collections/${c.slug}`}
              data-cursor="Explore"
              className="group relative block h-[58vh] w-[78vw] shrink-0 overflow-hidden rounded-[var(--radius)] sm:w-[52vw] md:h-[62vh] md:w-[34vw]"
            >
              <SafeImage src={c.image} alt={c.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.6s] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />
              <div className="absolute inset-x-0 top-0 flex justify-between p-5 text-[11px] uppercase tracking-[0.22em] text-white/80">
                <span>Nº {String(i + 1).padStart(2, "0")}</span>
                <span>{c.count} pieces</span>
              </div>
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5 text-white md:p-7">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-white/70">{c.tagline}</p>
                  <h3 className="display mt-2 text-5xl md:text-6xl">{c.name}</h3>
                </div>
                <span className="grid h-12 w-12 place-items-center rounded-full border border-white/50 transition-all duration-500 group-hover:rotate-45 group-hover:bg-white group-hover:text-black">
                  <ArrowUpRight size={18} />
                </span>
              </div>
            </Link>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

function CollectionsGrid({ data, collections }: { data: { eyebrow?: string; title?: string }; collections: CollectionCard[] }) {
  return (
    <div className="site-container py-24 md:py-36">
      <p className="eyebrow">{data.eyebrow}</p>
      <h2 className="display mt-4 text-[clamp(2.6rem,6vw,6rem)]">
        <Accent text={data.title || ""} />
      </h2>
      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((c, i) => (
          <Reveal key={c.slug} delay={(i % 3) * 0.1}>
            <Link href={`/collections/${c.slug}`} className="group block" data-cursor="Explore">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius)]">
                <SafeImage src={c.image} alt={c.name} className="h-full w-full object-cover transition-transform duration-[1.4s] group-hover:scale-105" />
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <h3 className="display text-4xl">{c.name}</h3>
                <span className="text-xs uppercase tracking-[0.18em] text-muted">{c.count} pieces</span>
              </div>
              <p className="mt-1 text-sm text-muted">{c.tagline}</p>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
