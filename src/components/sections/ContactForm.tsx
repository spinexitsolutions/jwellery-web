"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Reveal, SplitText } from "@/components/site/motion";
import { useSite } from "@/components/site/SiteProvider";
import { cn } from "@/lib/utils";

export function ContactForm({ data }: { data: Record<string, any> }) { // eslint-disable-line @typescript-eslint/no-explicit-any
  const site = useSite();
  const params = useSearchParams();
  const [type, setType] = useState<"contact" | "appointment">("contact");
  const [state, setState] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [error, setError] = useState("");

  return (
    <div className="site-container pb-24 pt-36 md:pb-36 md:pt-48">
      <div className="grid gap-16 md:grid-cols-12">
        <div className="md:col-span-5">
          <Reveal y={10}>
            <p className="eyebrow">{data.eyebrow}</p>
          </Reveal>
          <SplitText as="h1" immediate text={data.title || ""} className="display mt-6 block text-[clamp(3.2rem,9vw,8.5rem)] leading-[0.9]" />
          <Reveal delay={0.2}>
            <p className="mt-8 max-w-md leading-relaxed text-muted">{data.body}</p>
          </Reveal>
          {data.showDetails && (
            <Reveal delay={0.3} className="mt-12 grid grid-cols-2 gap-8 border-t border-line pt-8 text-sm">
              <div>
                <p className="eyebrow mb-2">Visit</p>
                <p>{site.address}</p>
              </div>
              <div>
                <p className="eyebrow mb-2">Hours</p>
                <p>{site.hours}</p>
              </div>
              <div>
                <p className="eyebrow mb-2">Call</p>
                <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="link-underline">
                  {site.phone}
                </a>
              </div>
              <div>
                <p className="eyebrow mb-2">Write</p>
                <a href={`mailto:${site.email}`} className="link-underline">
                  {site.email}
                </a>
              </div>
            </Reveal>
          )}
        </div>

        <Reveal delay={0.2} className="md:col-span-6 md:col-start-7">
          {state === "ok" ? (
            <div className="flex h-full min-h-[420px] flex-col justify-center rounded-[var(--radius)] bg-surface p-10">
              <p className="display text-5xl">Thank you.</p>
              <p className="mt-4 max-w-sm text-muted">Your note has reached the atelier. Someone from our team will write back within a day.</p>
            </div>
          ) : (
            <form
              className="space-y-6"
              onSubmit={async (e) => {
                e.preventDefault();
                setState("loading");
                const body = Object.fromEntries(new FormData(e.currentTarget).entries());
                const res = await fetch("/api/inquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, type }) });
                if (res.ok) setState("ok");
                else {
                  setState("err");
                  setError((await res.json().catch(() => ({}))).error || "Please check the form and try again.");
                }
              }}
            >
              <div className="flex gap-2 rounded-full border border-line p-1 text-[11px] uppercase tracking-[0.16em]">
                {(["contact", "appointment"] as const).map((t) => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => setType(t)}
                    className={cn("flex-1 rounded-full px-4 py-3 transition", type === t ? "bg-fg text-bg" : "hover:bg-surface")}
                  >
                    {t === "contact" ? "Send a message" : "Book an appointment"}
                  </button>
                ))}
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <input name="name" required placeholder="Full name" className="input-line" />
                <input name="email" required type="email" placeholder="Email" className="input-line" />
                <input name="phone" placeholder="Phone" className="input-line" />
                {type === "appointment" ? (
                  <input name="subject" type="datetime-local" className="input-line" aria-label="Preferred date" />
                ) : (
                  <input name="subject" defaultValue={params.get("subject") || ""} placeholder="Subject" className="input-line" />
                )}
              </div>
              <textarea name="message" required rows={5} placeholder={type === "appointment" ? "What would you like to see?" : "Your message"} className="input-line resize-none" />
              {state === "err" && <p className="text-sm text-red-600">{error}</p>}
              <button className="btn btn-primary" disabled={state === "loading"}>
                {state === "loading" ? "Sending…" : type === "appointment" ? "Request appointment" : "Send message"} <ArrowRight size={14} />
              </button>
            </form>
          )}
        </Reveal>
      </div>
      {data.mapEmbedUrl && (
        <Reveal className="mt-24 overflow-hidden rounded-[var(--radius)]">
          <iframe src={data.mapEmbedUrl} className="h-[420px] w-full grayscale" loading="lazy" title="Map" />
        </Reveal>
      )}
    </div>
  );
}
