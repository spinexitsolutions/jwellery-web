"use client";

import { motion, useInView, useScroll, useSpring, useTransform, type MotionValue } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { accentSegments, cn } from "@/lib/utils";
import { useSite } from "./SiteProvider";

const EASE = [0.22, 1, 0.36, 1] as const;

export function useAnimationsOn() {
  const { animations } = useSite();
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  return animations && !reduced;
}

/** Headline with masked word-by-word (or char) rise. Supports *accent* words. */
export function SplitText({
  text,
  as = "span",
  className,
  delay = 0,
  stagger = 0.06,
  mode = "words",
  immediate = false,
  play,
}: {
  text: string;
  as?: "span" | "h1" | "h2" | "h3" | "p" | "div";
  className?: string;
  delay?: number;
  stagger?: number;
  mode?: "words" | "chars";
  immediate?: boolean;
  /** When provided, controls playback explicitly (e.g. wait for preloader). */
  play?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const Tag = as as "span";
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const on = useAnimationsOn();
  const show = play !== undefined ? play : immediate || inView;
  const segments = accentSegments(text || "");
  let index = 0;

  return (
    <Tag ref={ref} className={className} aria-label={text.replace(/\*/g, "")}>
      {segments.map((seg, si) => {
        const words = seg.text.split(/(\s+)/);
        return (
          <span key={si} className={seg.accent ? "accent-word" : undefined} aria-hidden>
            {words.map((w, wi) => {
              if (/^\s+$/.test(w)) return <span key={wi}> </span>;
              if (!w) return null;
              const units = mode === "chars" ? Array.from(w) : [w];
              return (
                <span key={wi} className="inline-block overflow-hidden pb-[0.12em] -mb-[0.12em] align-bottom whitespace-nowrap">
                  {units.map((u, ui) => {
                    const i = index++;
                    return (
                      <motion.span
                        key={ui}
                        className="inline-block will-change-transform"
                        initial={on ? { y: "110%", rotate: 4 } : false}
                        animate={show || !on ? { y: "0%", rotate: 0 } : undefined}
                        transition={{ duration: 1.1, ease: EASE, delay: delay + i * (mode === "chars" ? stagger / 2.5 : stagger) }}
                      >
                        {u}
                      </motion.span>
                    );
                  })}
                </span>
              );
            })}
          </span>
        );
      })}
    </Tag>
  );
}

/** Renders text with *accent* words but no animation. */
export function Accent({ text }: { text: string }) {
  return (
    <>
      {accentSegments(text || "").map((s, i) =>
        s.accent ? (
          <em key={i} className="accent-word">
            {s.text}
          </em>
        ) : (
          <span key={i}>{s.text}</span>
        ),
      )}
    </>
  );
}

export function Reveal({
  children,
  className,
  delay = 0,
  y = 40,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  as?: "div" | "li" | "section" | "p" | "span";
}) {
  const on = useAnimationsOn();
  const Comp = motion[as] as typeof motion.div;
  return (
    <Comp
      className={className}
      initial={on ? { opacity: 0, y } : false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 1.1, ease: EASE, delay }}
    >
      {children}
    </Comp>
  );
}

/** Image that reveals with a clip-path wipe and drifts with scroll. */
export function ParallaxImage({
  src,
  alt = "",
  className,
  imgClassName,
  strength = 12,
  reveal = true,
}: {
  src: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
  strength?: number;
  reveal?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const on = useAnimationsOn();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [`-${strength}%`, `${strength}%`]);
  return (
    <motion.div
      ref={ref}
      className={cn("relative overflow-hidden", className)}
      initial={on && reveal ? { clipPath: "inset(100% 0% 0% 0%)" } : false}
      whileInView={{ clipPath: "inset(0% 0% 0% 0%)" }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 1.4, ease: EASE }}
    >
      <motion.div className="absolute inset-[-14%_0]" style={on ? { y } : undefined}>
        <SafeImage src={src} alt={alt} className={cn("h-full w-full object-cover", imgClassName)} />
      </motion.div>
    </motion.div>
  );
}

/** <img> that degrades to an elegant placeholder when the source is missing or broken. */
export function SafeImage({ src, alt = "", className, style }: { src?: string | null; alt?: string; className?: string; style?: React.CSSProperties }) {
  const [failed, setFailed] = useState(!src);
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    setFailed(!src);
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0 && src) setFailed(true);
  }, [src]);
  if (failed) {
    return (
      <div className={cn("relative grid place-items-center overflow-hidden bg-gradient-to-br from-surface via-bg to-surface", className)} style={style} role="img" aria-label={alt}>
        <svg viewBox="0 0 100 100" className="w-1/4 max-w-24 text-accent opacity-60" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M30 38 L50 20 L70 38 L50 84 Z" />
          <path d="M30 38 H70 M42 38 L50 20 L58 38 L50 84 M42 38 L50 84" />
        </svg>
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img ref={ref} src={src!} alt={alt} className={className} style={style} loading="lazy" onError={() => setFailed(true)} />;
}

/** Element that gently follows the pointer. */
export function Magnetic({ children, strength = 0.35, className }: { children: ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const on = useAnimationsOn();
  const [pos, setPos] = useState({ x: 0, y: 0 });
  return (
    <motion.div
      ref={ref}
      className={cn("inline-block", className)}
      onMouseMove={(e) => {
        if (!on || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        setPos({ x: (e.clientX - r.left - r.width / 2) * strength, y: (e.clientY - r.top - r.height / 2) * strength });
      }}
      onMouseLeave={() => setPos({ x: 0, y: 0 })}
      animate={pos}
      transition={{ type: "spring", stiffness: 180, damping: 14, mass: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

/** Counts up to a number when visible. */
export function CountUp({ value, suffix = "" }: { value: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const on = useAnimationsOn();
  const target = parseFloat(value.replace(/[^0-9.]/g, ""));
  const decimals = (value.split(".")[1] || "").length;
  const isYear = /^\d{4}$/.test(value);
  const [n, setN] = useState(on && Number.isFinite(target) ? 0 : target);
  useEffect(() => {
    if (!inView || !on || !Number.isFinite(target)) return;
    let raf = 0;
    const start = performance.now();
    const from = isYear ? target - 60 : 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 1800);
      const eased = 1 - Math.pow(1 - p, 4);
      setN(from + (target - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, on, target, isYear]);
  if (!Number.isFinite(target)) return <span>{value + suffix}</span>;
  const shown = isYear ? Math.round(n).toString() : n.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return (
    <span ref={ref}>
      {shown}
      {suffix}
    </span>
  );
}

/** Each word fades from dim to full as the block scrolls through the viewport. */
export function ScrollHighlight({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const on = useAnimationsOn();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 45%"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  const words = text.split(" ");
  return (
    <p ref={ref} className={className}>
      {words.map((w, i) => (
        <Word key={i} progress={smooth} range={[i / words.length, (i + 1) / words.length]} on={on}>
          {w}
        </Word>
      ))}
    </p>
  );
}

function Word({ children, progress, range, on }: { children: string; progress: MotionValue<number>; range: [number, number]; on: boolean }) {
  const opacity = useTransform(progress, range, [0.14, 1]);
  return (
    <motion.span style={on ? { opacity } : undefined} className="inline">
      {children}{" "}
    </motion.span>
  );
}

/** Resolves true once the preloader (if any) has finished. */
export function usePageReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => {
      if (document.documentElement.dataset.loading === "1") {
        const on = () => setReady(true);
        window.addEventListener("kaaya:ready", on, { once: true });
      } else setReady(true);
    }, 30);
    return () => clearTimeout(t);
  }, []);
  return ready;
}
