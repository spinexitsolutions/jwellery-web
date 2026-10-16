"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Loader2 } from "lucide-react";

function Form({ brand }: { brand: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="w-full max-w-sm"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        const body = Object.fromEntries(new FormData(e.currentTarget).entries());
        const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        if (res.ok) {
          const next = params.get("next");
          router.replace(next && next.startsWith("/admin") ? next : "/admin");
          router.refresh();
        } else {
          setError((await res.json()).error || "Login failed");
          setBusy(false);
        }
      }}
    >
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-1 text-sm text-zinc-500">to the {brand} admin panel</p>
      <div className="mt-8 space-y-4">
        <div>
          <label className="mb-1.5 block text-[13px] font-medium">Email</label>
          <input name="email" type="email" required autoFocus className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100" />
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-medium">Password</label>
          <input name="password" type="password" required className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100" />
        </div>
        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <button disabled={busy} className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-60">
          {busy && <Loader2 size={15} className="animate-spin" />} Sign in
        </button>
      </div>
    </form>
  );
}

export function LoginForm({ brand }: { brand: string }) {
  return (
    <Suspense>
      <Form brand={brand} />
    </Suspense>
  );
}
