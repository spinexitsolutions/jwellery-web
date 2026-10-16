"use client";

import dynamic from "next/dynamic";
import type { MotionValue } from "framer-motion";
import { useEffect, useState } from "react";
import { SafeImage } from "@/components/site/motion";
import { useSite } from "@/components/site/SiteProvider";

const RingScene = dynamic(() => import("./RingScene"), { ssr: false, loading: () => null });

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/** 3D jewel with automatic image fallback when 3D is disabled or unsupported. */
export function Jewel(props: { bg?: string; metal?: string; gem?: string; progress?: MotionValue<number>; interactive?: boolean; shadow?: boolean; fallback?: string; className?: string }) {
  const { enable3D, colors } = useSite();
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => setOk(enable3D && hasWebGL()), [enable3D]);
  if (ok === null) return <div className={props.className} />;
  if (!ok) return <SafeImage src={props.fallback} alt="" className={props.className + " object-cover"} />;
  return (
    <div className={props.className}>
      <RingScene metal={props.metal} gem={props.gem} progress={props.progress} interactive={props.interactive} shadow={props.shadow} bg={props.bg ?? colors.background} />
    </div>
  );
}
