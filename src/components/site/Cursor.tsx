"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useState } from "react";

/** Dot + trailing ring. Elements with data-cursor="View" show a label. */
export function Cursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 260, damping: 28, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 260, damping: 28, mass: 0.4 });
  const [label, setLabel] = useState<string | null>(null);
  const [hover, setHover] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    setEnabled(true);
    document.documentElement.classList.add("has-cursor");
    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      const t = e.target as HTMLElement | null;
      const labelled = t?.closest<HTMLElement>("[data-cursor]");
      setLabel(labelled?.dataset.cursor || null);
      setHover(!!t?.closest("a,button,[role=button],label,select"));
    };
    const leave = () => {
      x.set(-100);
      y.set(-100);
    };
    window.addEventListener("pointermove", move);
    document.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
      document.documentElement.classList.remove("has-cursor");
    };
  }, [x, y]);

  if (!enabled) return null;
  const size = label ? 88 : hover ? 46 : 30;
  return (
    <>
      <motion.div className="pointer-events-none fixed left-0 top-0 z-[100] h-1.5 w-1.5 rounded-full bg-accent mix-blend-difference" style={{ x, y, translateX: "-50%", translateY: "-50%" }} />
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[99] grid place-items-center rounded-full border border-accent/70 text-[10px] uppercase tracking-[0.2em] text-accent-fg"
        style={{ x: sx, y: sy, translateX: "-50%", translateY: "-50%" }}
        animate={{ width: size, height: size, backgroundColor: label ? "var(--accent)" : "rgba(0,0,0,0)" }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
      >
        {label && <span>{label}</span>}
      </motion.div>
    </>
  );
}
