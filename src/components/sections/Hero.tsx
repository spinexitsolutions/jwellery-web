"use client";

import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { Jewel } from "@/components/three/Jewel";
import { Magnetic, ParallaxImage, SafeImage, SplitText, useAnimationsOn, usePageReady } from "@/components/site/motion";

type HeroData = {
  variant?: string;
  eyebrow?: string;
  titleLine1?: string;
  titleLine2?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  image?: string;
  metal?: string;
  gem?: string;
  metaLeft?: string;
  metaRight?: string;
};

const EASE = [0.22, 1, 0.36, 1] as const;

export function Hero({ data }: { data: HeroData }) {
  if (data.variant === "image") return <ImageHero data={data} />;
  if (data.variant === "split") return <SplitHero data={data} />;
  return <JewelHero data={data} />;
}

function FadeIn({ children, delay, play, className }: { children: React.ReactNode; delay: number; play: boolean; className?: string }) {
  const on = useAnimationsOn();
  return (
    <motion.div className={className} initial={on ? { opacity: 0, y: 16 } : false} animate={play ? { opacity: 1, y: 0 } : undefined} transition={{ duration: 1, ease: EASE, delay }}>
      {children}
    </motion.div>
  );
}

function JewelHero({ data }: { data: HeroData }) {
  const ref = useRef<HTMLElement>(null);
  const ready = usePageReady();
  const on = useAnimationsOn();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 26 });
  const x1 = useTransform(progress, [0, 1], ["0%", "-22%"]);
  const x2 = useTransform(progress, [0, 1], ["0%", "22%"]);
  const fade = useTransform(progress, [0, 0.6], [1, 0]);
  const jewelY = useTransform(progress, [0, 1], ["0%", "35%"]);

  return (
    <section ref={ref} className="relative h-[100svh] min-h-[680px] overflow-hidden">
      {/* soft radial light */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(60% 55% at 50% 52%, color-mix(in srgb, var(--accent) 16%, transparent) 0%, transparent 70%)" }}
      />

      <div className="site-container relative flex h-full flex-col pb-8 pt-32 md:pt-36">
        <div className="flex items-start justify-between text-[11px] uppercase tracking-[0.22em] text-muted">
          <FadeIn play={ready} delay={0.2}>
            <span>{data.eyebrow}</span>
          </FadeIn>
          <FadeIn play={ready} delay={0.3} className="hidden text-right md:block">
            <span>{data.metaRight}</span>
          </FadeIn>
        </div>

        {/* Headline sits behind the jewel */}
        <div className="pointer-events-none relative z-0 flex flex-1 flex-col items-center justify-end pb-8 md:justify-center md:pb-0">
          <motion.h1 className="display w-full text-center text-[19vw] leading-[0.86] md:text-[clamp(3.6rem,15.5vw,15.5rem)]" style={on ? { opacity: fade } : undefined}>
            <motion.span className="block md:-translate-x-[8%]" style={on ? { x: x1 } : undefined}>
              <SplitText text={data.titleLine1 || ""} mode="chars" play={ready} delay={0.25} stagger={0.09} />
            </motion.span>
            <motion.span className="block md:translate-x-[10%]" style={on ? { x: x2 } : undefined}>
              <SplitText text={data.titleLine2 || ""} mode="chars" play={ready} delay={0.45} stagger={0.09} />
            </motion.span>
          </motion.h1>
        </div>

        <div className="relative z-20 grid items-end gap-8 md:grid-cols-3">
          <FadeIn play={ready} delay={0.9}>
            <p className="max-w-[22rem] text-[15px] leading-relaxed text-muted">{data.subtitle}</p>
          </FadeIn>
          <FadeIn play={ready} delay={1.05} className="hidden flex-col items-center gap-3 md:flex">
            <span className="text-[10px] uppercase tracking-[0.3em] text-muted">Scroll</span>
            <span className="relative block h-14 w-px overflow-hidden bg-line">
              <span className="animate-scrollline absolute inset-0 bg-fg" />
            </span>
          </FadeIn>
          <FadeIn play={ready} delay={1.15} className="flex flex-wrap items-center gap-6 md:justify-end">
            {data.secondaryLabel && (
              <Link href={data.secondaryHref || "#"} className="link-underline text-[12px] uppercase tracking-[0.16em]">
                {data.secondaryLabel}
              </Link>
            )}
            {data.ctaLabel && (
              <Magnetic>
                <Link href={data.ctaHref || "/shop"} className="btn btn-primary">
                  {data.ctaLabel} <ArrowRight size={14} />
                </Link>
              </Magnetic>
            )}
          </FadeIn>
        </div>
        <FadeIn play={ready} delay={1.2} className="mt-6 hidden text-[10px] uppercase tracking-[0.25em] text-muted md:block">
          {data.metaLeft}
        </FadeIn>
      </div>

      {/* 3D jewel, layered over the headline */}
      <motion.div
        className="pointer-events-none absolute inset-x-0 top-[13%] bottom-[47%] z-10 md:top-[8%] md:bottom-[8%]"
        initial={on ? { opacity: 0, scale: 0.85 } : false}
        animate={ready ? { opacity: 1, scale: 1 } : undefined}
        transition={{ duration: 1.8, ease: EASE, delay: 0.5 }}
        style={on ? { y: jewelY } : undefined}
      >
        <Jewel metal={data.metal} gem={data.gem} progress={progress} fallback={data.image} className="h-full w-full" />
      </motion.div>
    </section>
  );
}

function ImageHero({ data }: { data: HeroData }) {
  const ref = useRef<HTMLElement>(null);
  const ready = usePageReady();
  const on = useAnimationsOn();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.18]);
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  return (
    <section ref={ref} className="tone-dark relative h-[100svh] min-h-[640px] overflow-hidden">
      <motion.div className="absolute inset-0" style={on ? { scale } : undefined} initial={on ? { scale: 1.3 } : false} animate={ready ? { scale: 1 } : undefined} transition={{ duration: 2.2, ease: EASE }}>
        <SafeImage src={data.image} alt="" className="h-full w-full object-cover" />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30" />
      <motion.div className="site-container relative flex h-full flex-col justify-end pb-14 text-white" style={on ? { y } : undefined}>
        <FadeIn play={ready} delay={0.2}>
          <p className="eyebrow !text-white/70">{data.eyebrow}</p>
        </FadeIn>
        <h1 className="display mt-6 text-[clamp(3.4rem,11vw,11rem)] leading-[0.88]">
          <SplitText as="span" className="block" text={data.titleLine1 || ""} play={ready} delay={0.3} />
          <SplitText as="span" className="block" text={data.titleLine2 || ""} play={ready} delay={0.5} />
        </h1>
        <div className="mt-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <FadeIn play={ready} delay={0.9}>
            <p className="max-w-md text-white/75">{data.subtitle}</p>
          </FadeIn>
          <FadeIn play={ready} delay={1}>
            {data.ctaLabel && (
              <Link href={data.ctaHref || "/shop"} className="btn border border-white/60 text-white hover:bg-white hover:text-black">
                {data.ctaLabel} <ArrowRight size={14} />
              </Link>
            )}
          </FadeIn>
        </div>
      </motion.div>
    </section>
  );
}

function SplitHero({ data }: { data: HeroData }) {
  const ready = usePageReady();
  return (
    <section className="relative min-h-[100svh] pt-28">
      <div className="site-container grid min-h-[calc(100svh-7rem)] items-center gap-10 pb-12 md:grid-cols-12">
        <div className="md:col-span-6">
          <FadeIn play={ready} delay={0.1}>
            <p className="eyebrow">{data.eyebrow}</p>
          </FadeIn>
          <h1 className="display mt-8 text-[clamp(3.2rem,8vw,8.5rem)] leading-[0.9]">
            <SplitText as="span" className="block" text={data.titleLine1 || ""} play={ready} delay={0.2} />
            <SplitText as="span" className="block" text={data.titleLine2 || ""} play={ready} delay={0.4} />
          </h1>
          <FadeIn play={ready} delay={0.8}>
            <p className="mt-8 max-w-md leading-relaxed text-muted">{data.subtitle}</p>
          </FadeIn>
          <FadeIn play={ready} delay={0.95} className="mt-10 flex flex-wrap items-center gap-6">
            {data.ctaLabel && (
              <Magnetic>
                <Link href={data.ctaHref || "/shop"} className="btn btn-primary">
                  {data.ctaLabel} <ArrowRight size={14} />
                </Link>
              </Magnetic>
            )}
            {data.secondaryLabel && (
              <Link href={data.secondaryHref || "#"} className="link-underline text-[12px] uppercase tracking-[0.16em]">
                {data.secondaryLabel}
              </Link>
            )}
          </FadeIn>
        </div>
        <div className="relative md:col-span-6">
          <ParallaxImage src={data.image || ""} className="aspect-[4/5] w-full rounded-[var(--radius)]" />
          <p className="absolute -bottom-8 right-0 text-[10px] uppercase tracking-[0.25em] text-muted">{data.metaRight}</p>
        </div>
      </div>
    </section>
  );
}
