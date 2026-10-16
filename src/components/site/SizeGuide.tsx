"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { ringSizeMm } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { useLenis } from "./SmoothScroll";

const CARD_MM = 85.6; // ISO/IEC 7810 ID-1 (bank card) width

export function SiteModal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  const lenis = useLenis();
  useEffect(() => {
    if (open) lenis?.stop();
    else lenis?.start();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open, lenis, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[96] flex items-end justify-center sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            data-lenis-prevent
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={cn("relative max-h-[92vh] w-full overflow-y-auto rounded-t-[calc(var(--radius)+12px)] bg-bg text-fg sm:rounded-[var(--radius)]", wide ? "sm:max-w-3xl" : "sm:max-w-lg")}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-bg px-6 py-4">
              <p className="display text-2xl">{title}</p>
              <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full border border-line hover:bg-fg hover:text-bg">
                <X size={15} />
              </button>
            </div>
            <div className="p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function SizeGuide({ open, onClose, sizes, onPick }: { open: boolean; onClose: () => void; sizes: string[]; onPick?: (s: string) => void }) {
  const [tab, setTab] = useState<"chart" | "measure" | "string">("chart");
  const [pxPerMm, setPxPerMm] = useState(3.78);
  const [step, setStep] = useState<1 | 2>(1);
  const [diameter, setDiameter] = useState(16.5);

  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem("kaaya-px-mm"));
      if (saved > 1) setPxPerMm(saved);
    } catch {}
  }, []);

  const chart = (sizes.length ? sizes.map(Number).filter(Number.isFinite) : Array.from({ length: 22 }, (_, i) => i + 4)).map((n) => ({ size: n, ...ringSizeMm(n) }));
  const circumference = Math.PI * diameter;
  const measured = Math.round(circumference - 40);
  const available = sizes.length ? sizes.includes(String(measured)) : true;

  return (
    <SiteModal open={open} onClose={onClose} title="Find your ring size" wide>
      <div className="mb-6 flex gap-1 rounded-full border border-line p-1 text-[11px] uppercase tracking-[0.14em]">
        {(
          [
            ["chart", "Size chart"],
            ["measure", "Measure on screen"],
            ["string", "Thread method"],
          ] as const
        ).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={cn("flex-1 rounded-full px-3 py-2.5 transition", tab === k ? "bg-fg text-bg" : "hover:bg-surface")}>
            {l}
          </button>
        ))}
      </div>

      {tab === "chart" && (
        <div>
          <p className="mb-4 text-sm text-muted">Indian ring sizes. Measure the inside diameter of a ring that fits you well, or the circumference of your finger.</p>
          <div className="overflow-hidden rounded-[var(--radius)] border border-line">
            <table className="w-full text-sm">
              <thead className="bg-surface text-left text-[11px] uppercase tracking-[0.14em] text-muted">
                <tr>
                  <th className="px-4 py-3 font-normal">Indian size</th>
                  <th className="px-4 py-3 font-normal">Diameter</th>
                  <th className="px-4 py-3 font-normal">Circumference</th>
                  {onPick && <th />}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {chart.map((r) => (
                  <tr key={r.size}>
                    <td className="px-4 py-2.5 font-medium">{r.size}</td>
                    <td className="px-4 py-2.5 tabular-nums">{r.diameter} mm</td>
                    <td className="px-4 py-2.5 tabular-nums">{r.circumference} mm</td>
                    {onPick && (
                      <td className="px-4 py-2.5 text-right">
                        {(!sizes.length || sizes.includes(String(r.size))) && (
                          <button
                            className="link-underline text-xs uppercase tracking-[0.14em]"
                            onClick={() => {
                              onPick(String(r.size));
                              onClose();
                            }}
                          >
                            Select
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "measure" && (
        <div>
          {step === 1 ? (
            <>
              <p className="text-sm text-muted">
                <b className="text-fg">Step 1 — calibrate.</b> Hold any bank or ID card against the screen and drag the slider until the outline matches its width exactly.
              </p>
              <div className="my-8 flex justify-center">
                <div className="grid place-items-center rounded-[10px] border-2 border-dashed border-accent bg-surface text-[10px] uppercase tracking-[0.2em] text-muted" style={{ width: CARD_MM * pxPerMm, height: 53.98 * pxPerMm, maxWidth: "100%" }}>
                  Card
                </div>
              </div>
              <input type="range" min={2.4} max={7} step={0.01} value={pxPerMm} onChange={(e) => setPxPerMm(Number(e.target.value))} className="w-full accent-[var(--accent)]" aria-label="Card width" />
              <button
                className="btn btn-primary mt-6 w-full justify-center"
                onClick={() => {
                  try {
                    localStorage.setItem("kaaya-px-mm", String(pxPerMm));
                  } catch {}
                  setStep(2);
                }}
              >
                It matches — next
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted">
                <b className="text-fg">Step 2 — measure.</b> Place a ring that fits you on the circle and adjust until the circle sits exactly on its inner edge.
              </p>
              <div className="my-8 grid h-[180px] place-items-center">
                <div className="rounded-full border-2 border-accent" style={{ width: diameter * pxPerMm, height: diameter * pxPerMm, boxShadow: "0 0 0 1px var(--line) inset" }} />
              </div>
              <input type="range" min={12} max={24} step={0.1} value={diameter} onChange={(e) => setDiameter(Number(e.target.value))} className="w-full accent-[var(--accent)]" aria-label="Ring diameter" />
              <div className="mt-6 flex items-end justify-between rounded-[var(--radius)] bg-surface p-5">
                <div>
                  <p className="eyebrow">Your size</p>
                  <p className="display mt-1 text-5xl">{measured}</p>
                </div>
                <p className="text-right text-sm text-muted">
                  {diameter.toFixed(1)} mm diameter
                  <br />
                  {circumference.toFixed(1)} mm circumference
                </p>
              </div>
              <div className="mt-4 flex gap-3">
                <button className="btn btn-ghost" onClick={() => setStep(1)}>
                  Recalibrate
                </button>
                {onPick && (
                  <button
                    className="btn btn-primary flex-1 justify-center"
                    disabled={!available}
                    onClick={() => {
                      onPick(String(measured));
                      onClose();
                    }}
                  >
                    {available ? `Select size ${measured}` : "Size not available — contact us"}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {tab === "string" && (
        <ol className="space-y-4 text-sm leading-relaxed">
          {[
            "Wrap a thin strip of paper or thread snugly around the base of your finger.",
            "Mark where the ends meet, then lay it flat and measure the length in millimetres.",
            "Subtract 40 — that's your Indian ring size. (e.g. 52 mm → size 12)",
            "Measure in the evening when fingers are largest, and choose the larger size if you're between two.",
          ].map((t, i) => (
            <li key={i} className="flex gap-4">
              <span className="display text-3xl leading-none text-accent">{i + 1}</span>
              <span className="pt-1">{t}</span>
            </li>
          ))}
          <li className="rounded-[var(--radius)] bg-surface p-4 text-muted">Still unsure? Every ring includes one complimentary resize within the first year.</li>
        </ol>
      )}
    </SiteModal>
  );
}
