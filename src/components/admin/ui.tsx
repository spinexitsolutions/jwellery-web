"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------- Toasts ---------- */
type Toast = { id: number; kind: "ok" | "err"; text: string };
const ToastCtx = createContext<(kind: Toast["kind"], text: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((kind: Toast["kind"], text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[200] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8 }}
              className="pointer-events-auto flex items-center gap-2.5 rounded-xl bg-zinc-900 px-4 py-3 text-sm text-white shadow-xl"
            >
              {t.kind === "ok" ? <CheckCircle2 size={16} className="text-emerald-400" /> : <XCircle size={16} className="text-rose-400" />}
              {t.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------- Layout ---------- */
export function PageTitle({ title, description, actions, back }: { title: string; description?: string; actions?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {back && (
          <Link href={back.href} className="mb-2 inline-block text-xs font-medium text-zinc-500 hover:text-zinc-900">
            ← {back.label}
          </Link>
        )}
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, description, children, className, actions }: { title?: ReactNode; description?: string; children: ReactNode; className?: string; actions?: ReactNode }) {
  return (
    <section className={cn("rounded-2xl border border-zinc-200 bg-white", className)}>
      {(title || actions) && (
        <header className="flex items-start justify-between gap-4 border-b border-zinc-100 px-5 py-4">
          <div>
            {title && <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-zinc-500">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

/* ---------- Controls ---------- */
type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger"; size?: "sm" | "md"; loading?: boolean };

export function Button({ variant = "primary", size = "md", loading, className, children, disabled, ...rest }: BtnProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm",
        variant === "primary" && "bg-zinc-900 text-white hover:bg-zinc-700",
        variant === "secondary" && "border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50",
        variant === "ghost" && "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
        variant === "danger" && "border border-rose-200 bg-white text-rose-600 hover:bg-rose-50",
        className,
      )}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  );
}

export function LinkButton({ href, children, variant = "primary", className, target }: { href: string; children: ReactNode; variant?: "primary" | "secondary"; className?: string; target?: string }) {
  return (
    <Link
      href={href}
      target={target}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition",
        variant === "primary" ? "bg-zinc-900 text-white hover:bg-zinc-700" : "border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function Label({ children, help, htmlFor }: { children: ReactNode; help?: string; htmlFor?: string }) {
  return (
    <div className="mb-1.5">
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-zinc-800">
        {children}
      </label>
      {help && <p className="text-xs text-zinc-500">{help}</p>}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputCls, "h-10", props.className)} />;
}
export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(inputCls, "min-h-[96px] resize-y leading-relaxed", props.className)} />;
}
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(inputCls, "h-10 pr-8", props.className)} />;
}

export function Toggle({ checked, onChange, label, help }: { checked: boolean; onChange: (v: boolean) => void; label?: string; help?: string }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      {label && (
        <span>
          <span className="block text-[13px] font-medium text-zinc-800">{label}</span>
          {help && <span className="block text-xs text-zinc-500">{help}</span>}
        </span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn("relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition", checked ? "bg-zinc-900" : "bg-zinc-200")}
      >
        <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", checked ? "left-[22px]" : "left-0.5")} />
      </button>
    </label>
  );
}

export function Badge({ children, tone = "zinc" }: { children: ReactNode; tone?: "zinc" | "green" | "amber" | "red" | "blue" | "violet" }) {
  const tones = {
    zinc: "bg-zinc-100 text-zinc-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-rose-50 text-rose-700",
    blue: "bg-sky-50 text-sky-700",
    violet: "bg-violet-50 text-violet-700",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize", tones[tone])}>{children}</span>;
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white px-6 py-16 text-center">
      <p className="font-medium text-zinc-900">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-zinc-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[150] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ y: 16, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 8, opacity: 0 }}
            className={cn("relative flex max-h-[88vh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl", wide ? "max-w-5xl" : "max-w-lg")}
          >
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
              <h3 className="font-semibold text-zinc-900">{title}</h3>
              <button onClick={onClose} className="rounded-lg px-2 py-1 text-zinc-500 hover:bg-zinc-100">
                ✕
              </button>
            </div>
            <div className="overflow-y-auto p-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function useConfirm() {
  return (message: string) => window.confirm(message);
}

/** Wraps a server action call with loading state + toast. */
export function useAction() {
  const toast = useToast();
  const [pending, setPending] = useState(false);
  const run = useCallback(
    async <T,>(fn: () => Promise<T>, success?: string): Promise<T | undefined> => {
      setPending(true);
      try {
        const r = await fn();
        const maybe = r as unknown as { error?: string } | undefined;
        if (maybe && typeof maybe === "object" && "error" in maybe && maybe.error) {
          toast("err", maybe.error);
          return undefined;
        }
        if (success) toast("ok", success);
        return r;
      } catch (e) {
        toast("err", e instanceof Error ? e.message : "Something went wrong");
        return undefined;
      } finally {
        setPending(false);
      }
    },
    [toast],
  );
  return { run, pending };
}
