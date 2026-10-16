"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { updateProfile } from "@/app/(site)/account/actions";
import { clearLocalWishlist, localWishlist, useAccount } from "./Account";
import { Reveal, SplitText } from "./motion";

export function LoginPanel() {
  const router = useRouter();
  const params = useSearchParams();
  const { refresh } = useAccount();
  const [step, setStep] = useState<"id" | "code" | "name">("id");
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [hint, setHint] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const codeInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const done = () => {
    const next = params.get("next");
    router.replace(next && next.startsWith("/") ? next : "/account");
    router.refresh();
  };

  const send = async () => {
    setBusy(true);
    setError("");
    const res = await fetch("/api/account/otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ identifier }) });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(j.error || "Couldn't send the code.");
    setStep("code");
    setCooldown(30);
    setHint(j.devCode ? `Development mode — your code is ${j.devCode}` : `We sent a 6-digit code to your ${j.channel === "email" ? "email" : "phone"}.`);
    setTimeout(() => codeInput.current?.focus(), 100);
  };

  const verify = async () => {
    setBusy(true);
    setError("");
    const res = await fetch("/api/account/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ identifier, code, wishlist: localWishlist() }) });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(j.error || "That code didn't work.");
    clearLocalWishlist();
    await refresh();
    if (j.needsProfile) setStep("name");
    else done();
  };

  return (
    <div className="site-container grid min-h-[90vh] items-center gap-16 pb-24 pt-36 md:grid-cols-2">
      <div>
        <p className="eyebrow">Your account</p>
        <SplitText as="h1" immediate text="Welcome *back*" className="display mt-6 block text-[clamp(3.4rem,8vw,7.5rem)] leading-[0.9]" />
        <Reveal delay={0.2}>
          <p className="mt-8 max-w-md leading-relaxed text-muted">Sign in with a one-time code — no passwords. Track orders, download invoices, keep a wishlist and save addresses for faster checkout.</p>
        </Reveal>
      </div>
      <Reveal delay={0.15}>
        <div className="rounded-[var(--radius)] bg-surface p-8 md:p-10">
          {step === "id" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
            >
              <label className="eyebrow" htmlFor="identifier">
                Email or mobile number
              </label>
              <input id="identifier" autoFocus required value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="you@example.com / 98290 00000" className="input-line mt-3 text-lg" />
              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
              <button className="btn btn-primary mt-8 w-full justify-center" disabled={busy}>
                {busy ? "Sending…" : "Send code"} <ArrowRight size={14} />
              </button>
            </form>
          )}
          {step === "code" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                verify();
              }}
            >
              <p className="eyebrow">Enter code</p>
              <p className="mt-2 text-sm text-muted">{hint}</p>
              <input
                ref={codeInput}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="••••••"
                className="input-line mt-6 text-center text-4xl tracking-[0.5em]"
                aria-label="6-digit code"
              />
              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
              <button className="btn btn-primary mt-8 w-full justify-center" disabled={busy || code.length !== 6}>
                {busy ? "Verifying…" : "Sign in"}
              </button>
              <div className="mt-5 flex justify-between text-xs text-muted">
                <button type="button" onClick={() => setStep("id")} className="underline">
                  Change {identifier.includes("@") ? "email" : "number"}
                </button>
                <button type="button" disabled={cooldown > 0} onClick={send} className="underline disabled:no-underline disabled:opacity-50">
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                </button>
              </div>
            </form>
          )}
          {step === "name" && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                await updateProfile({ name });
                done();
              }}
            >
              <p className="eyebrow">One last thing</p>
              <input autoFocus required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" className="input-line mt-6 text-lg" />
              <button className="btn btn-primary mt-8 w-full justify-center" disabled={busy}>
                Continue
              </button>
            </form>
          )}
        </div>
      </Reveal>
    </div>
  );
}
