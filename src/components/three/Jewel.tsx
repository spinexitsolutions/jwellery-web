"use client";

import dynamic from "next/dynamic";
import type { MotionValue } from "framer-motion";
import { Component, useEffect, useState, type ReactNode } from "react";
import { useSite } from "@/components/site/SiteProvider";
import { cn } from "@/lib/utils";

const RingScene = dynamic(() => import("./RingScene"), { ssr: false, loading: () => null });

/** Studio render shown while 3D loads, or instead of 3D when it is unavailable. */
export const RING_FALLBACK = "/images/ring-fallback.webp";

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/** If anything inside the 3D scene throws, show the still image instead of breaking the page. */
class SceneBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.warn("3D jewel disabled:", error);
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** 3D jewel with a still-image fallback when 3D is disabled, unsupported, still loading, or crashes. */
export function Jewel(props: { bg?: string; metal?: string; gem?: string; progress?: MotionValue<number>; interactive?: boolean; shadow?: boolean; fallback?: string; className?: string }) {
  const { enable3D, colors } = useSite();
  const [canRender, setCanRender] = useState<boolean | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => setCanRender(enable3D && hasWebGL()), [enable3D]);

  const use3D = canRender === true && !failed;
  const showStill = !use3D || !ready;

  return (
    <div className={cn(!/\b(absolute|fixed)\b/.test(props.className ?? "") && "relative", props.className)}>
      <img
        src={props.fallback || RING_FALLBACK}
        alt=""
        aria-hidden
        className={cn("pointer-events-none absolute inset-0 m-auto h-[78%] w-[78%] object-contain transition-opacity duration-700", !use3D && "animate-float")}
        style={{ opacity: showStill ? 1 : 0 }}
      />
      {use3D && (
        <SceneBoundary onError={() => setFailed(true)}>
          <div className="absolute inset-0 transition-opacity duration-1000" style={{ opacity: ready ? 1 : 0 }}>
            <RingScene metal={props.metal} gem={props.gem} progress={props.progress} interactive={props.interactive} shadow={props.shadow} bg={props.bg ?? colors.background} onReady={() => setReady(true)} />
          </div>
        </SceneBoundary>
      )}
    </div>
  );
}
