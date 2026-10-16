"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Jewel } from "@/components/three/Jewel";
import { GEMS, METALS } from "@/components/three/constants";
import { Magnetic, Reveal, SplitText } from "@/components/site/motion";
import { useSite } from "@/components/site/SiteProvider";
import { cn } from "@/lib/utils";

export function Showcase3D({ data, tone }: { data: Record<string, string>; tone?: string }) {
  const [metal, setMetal] = useState("gold");
  const [gem, setGem] = useState("diamond");
  const { colors } = useSite();
  const bg = tone === "surface" ? colors.surface : tone === "dark" ? colors.dark : colors.background;
  const href = `${data.ctaHref || "/contact"}${(data.ctaHref || "/contact").includes("?") ? "&" : "?"}subject=${encodeURIComponent(`Bespoke solitaire — ${METALS[metal].label}, ${GEMS[gem].label}`)}`;
  return (
    <div className="site-container grid items-center gap-10 py-24 md:grid-cols-12 md:py-32">
      <div className="md:col-span-5">
        <Reveal y={10}>
          <p className="eyebrow">{data.eyebrow}</p>
        </Reveal>
        <SplitText as="h2" text={data.title || ""} className="display mt-4 block text-[clamp(2.6rem,5.5vw,5.5rem)]" />
        <Reveal delay={0.15}>
          <p className="mt-6 max-w-md leading-relaxed text-muted">{data.body}</p>
        </Reveal>

        <Reveal delay={0.2} className="mt-10 space-y-8">
          <div>
            <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-muted">Metal — {METALS[metal].label}</p>
            <div className="flex gap-3">
              {Object.entries(METALS).map(([k, m]) => (
                <button
                  key={k}
                  onClick={() => setMetal(k)}
                  aria-label={m.label}
                  className={cn("h-11 w-11 rounded-full border-2 p-1 transition", metal === k ? "border-fg" : "border-transparent")}
                >
                  <span className="block h-full w-full rounded-full" style={{ background: `linear-gradient(135deg, ${m.color}, #ffffff 45%, ${m.color})` }} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-muted">Stone — {GEMS[gem].label}</p>
            <div className="flex flex-wrap gap-3">
              {Object.entries(GEMS).map(([k, g]) => (
                <button
                  key={k}
                  onClick={() => setGem(k)}
                  aria-label={g.label}
                  className={cn("h-11 w-11 rotate-45 border-2 p-1 transition", gem === k ? "border-fg" : "border-transparent")}
                >
                  <span className="block h-full w-full" style={{ background: `linear-gradient(135deg, #fff, ${g.color} 55%, ${g.attenuation})` }} />
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        {data.ctaLabel && (
          <Reveal delay={0.3} className="mt-12">
            <Magnetic>
              <Link href={href} className="btn btn-primary">
                {data.ctaLabel} <ArrowRight size={14} />
              </Link>
            </Magnetic>
          </Reveal>
        )}
      </div>
      <motion.div
        className="relative aspect-square md:col-span-7"
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        data-cursor="Drag"
      >
        <div className="absolute inset-[8%] rounded-full border border-line" />
        <div className="absolute inset-[22%] rounded-full border border-line/60" />
        <Jewel metal={metal} gem={gem} interactive shadow bg={bg} className="absolute inset-0" />
        <p className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.25em] text-muted">Drag to rotate</p>
      </motion.div>
    </div>
  );
}
