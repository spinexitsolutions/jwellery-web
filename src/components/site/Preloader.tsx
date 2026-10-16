"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

/** Shown once per browser session. */
export function Preloader({ brand }: { brand: string }) {
  const [show, setShow] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (window.self !== window.top) return; // skip inside the admin live preview
    const w = window as unknown as { __kaayaPreloading?: boolean };
    let seen = false;
    try {
      seen = !!sessionStorage.getItem("kaaya-loaded");
      sessionStorage.setItem("kaaya-loaded", "1");
    } catch {}
    if (seen && !w.__kaayaPreloading) return;
    w.__kaayaPreloading = true;
    setShow(true);
    document.documentElement.dataset.loading = "1";
    document.documentElement.style.overflow = "hidden";
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 1600);
      setCount(Math.round(p * 100));
      if (p < 1) raf = requestAnimationFrame(tick);
      else
        setTimeout(() => {
          setShow(false);
          w.__kaayaPreloading = false;
          document.documentElement.style.overflow = "";
          delete document.documentElement.dataset.loading;
          window.dispatchEvent(new Event("kaaya:ready"));
        }, 250);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      document.documentElement.style.overflow = "";
      delete document.documentElement.dataset.loading;
    };
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[200] flex flex-col justify-between bg-dark p-6 text-dark-fg md:p-10"
          exit={{ clipPath: "inset(0% 0% 100% 0%)" }}
          initial={{ clipPath: "inset(0% 0% 0% 0%)" }}
          transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
        >
          <div className="flex justify-between text-[11px] uppercase tracking-[0.25em] opacity-60">
            <span>Fine jewellery</span>
            <span>Jaipur</span>
          </div>
          <div className="overflow-hidden">
            <motion.h1
              className="display text-[18vw] leading-none md:text-[14vw]"
              initial={{ y: "100%" }}
              animate={{ y: "0%" }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            >
              {brand}
            </motion.h1>
          </div>
          <div className="flex items-end justify-between">
            <div className="h-px flex-1 bg-dark-fg/20">
              <div className="h-px bg-accent" style={{ width: `${count}%` }} />
            </div>
            <span className="display ml-6 w-24 text-right text-5xl tabular-nums">{count}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
