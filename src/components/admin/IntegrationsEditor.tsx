"use client";

import { useState } from "react";
import { BarChart3, Code2, CreditCard, Mail, MessageCircle, Plus, Send, Trash2, TrendingUp, Webhook } from "lucide-react";
import { saveIntegrations, testRatesApi, testWebhook } from "@/app/admin/actions";
import type { Integrations } from "@/lib/settings-types";
import { Badge, Button, Card, Input, Label, Select, Textarea, Toggle, useAction } from "./ui";

const EVENTS = [
  { value: "*", label: "All events" },
  { value: "order.created", label: "Order created" },
  { value: "order.paid", label: "Order paid" },
  { value: "inquiry.created", label: "Inquiry received" },
  { value: "newsletter.subscribed", label: "Newsletter sign-up" },
];

function Section({ icon: Icon, title, description, status, children }: { icon: typeof Mail; title: string; description: string; status?: boolean; children: React.ReactNode }) {
  return (
    <Card
      title={
        <span className="flex items-center gap-2">
          <Icon size={15} /> {title}
        </span>
      }
      description={description}
      actions={status !== undefined ? <Badge tone={status ? "green" : "zinc"}>{status ? "Connected" : "Not set up"}</Badge> : undefined}
    >
      {children}
    </Card>
  );
}

export function IntegrationsEditor({ initial }: { initial: Integrations }) {
  const [v, setV] = useState(initial);
  const { run, pending } = useAction();
  const test = useAction();
  const [ratesSample, setRatesSample] = useState("");
  const set = <K extends keyof Integrations>(k: K, val: Integrations[K]) => setV((p) => ({ ...p, [k]: val }));
  const text = (k: keyof Integrations, label: string, opts: { placeholder?: string; help?: string; secret?: boolean } = {}) => (
    <div>
      <Label help={opts.help}>{label}</Label>
      <Input type={opts.secret ? "password" : "text"} autoComplete="off" value={String(v[k] ?? "")} placeholder={opts.placeholder} onChange={(e) => set(k, e.target.value as never)} />
    </div>
  );

  return (
    <div className="space-y-6">
      <Section icon={CreditCard} title="Razorpay payments" description="Accept UPI, cards, netbanking and wallets at checkout." status={!!(v.razorpayEnabled && v.razorpayKeyId && v.razorpayKeySecret)}>
        <div className="space-y-4">
          <Toggle label="Enable online payments" checked={v.razorpayEnabled} onChange={(x) => set("razorpayEnabled", x)} />
          <div className="grid gap-4 sm:grid-cols-2">
            {text("razorpayKeyId", "Key ID", { placeholder: "rzp_live_…" })}
            {text("razorpayKeySecret", "Key secret", { secret: true, help: "Stored on the server only." })}
          </div>
          <p className="text-xs text-zinc-500">Find these in Razorpay Dashboard → Settings → API Keys. Use test keys (rzp_test_…) first.</p>
        </div>
      </Section>

      <Section icon={MessageCircle} title="WhatsApp" description="Floating chat button and 'Enquire' links on product pages." status={!!v.whatsappNumber}>
        <div className="grid gap-4 sm:grid-cols-2">
          {text("whatsappNumber", "WhatsApp number", { placeholder: "919829000000", help: "Country code + number, digits only." })}
          {text("whatsappMessage", "Default message")}
        </div>
      </Section>

      <Section icon={TrendingUp} title="Live metal rates" description="Gold & silver rates scrolling in the top bar — manual, or from any JSON API." status={v.ratesEnabled}>
        <div className="space-y-4">
          <Toggle label="Show rates ticker" checked={v.ratesEnabled} onChange={(x) => set("ratesEnabled", x)} />
          <div>
            <Label>Source</Label>
            <Select value={v.ratesSource} onChange={(e) => set("ratesSource", e.target.value as Integrations["ratesSource"])}>
              <option value="manual">Manual — I'll type today's rates</option>
              <option value="api">External API</option>
            </Select>
          </div>
          {v.ratesSource === "manual" ? (
            <div className="space-y-2">
              {v.manualRates.map((r, i) => (
                <div key={i} className="flex gap-2">
                  <Input value={r.label} placeholder="Gold 22K" onChange={(e) => set("manualRates", v.manualRates.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))} />
                  <Input value={r.value} placeholder="₹7,190/g" onChange={(e) => set("manualRates", v.manualRates.map((x, k) => (k === i ? { ...x, value: e.target.value } : x)))} />
                  <Button variant="ghost" onClick={() => set("manualRates", v.manualRates.filter((_, k) => k !== i))}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
              <Button size="sm" variant="secondary" onClick={() => set("manualRates", [...v.manualRates, { label: "", value: "" }])}>
                <Plus size={13} /> Add rate
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {text("ratesApiUrl", "API URL (GET, returns JSON)", { placeholder: "https://api.example.com/v1/rates?base=INR" })}
              <div className="grid gap-4 sm:grid-cols-2">
                {text("ratesApiHeaderName", "Auth header name", { placeholder: "x-api-key" })}
                {text("ratesApiHeaderValue", "Auth header value", { secret: true })}
              </div>
              <div>
                <Label help="Dot-paths into the JSON response, e.g. data.gold.24k">Field mapping</Label>
                <div className="space-y-2">
                  {v.ratesApiMap.map((m, i) => (
                    <div key={i} className="flex gap-2">
                      <Input value={m.label} placeholder="Label" onChange={(e) => set("ratesApiMap", v.ratesApiMap.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))} />
                      <Input value={m.path} placeholder="rates.gold24" className="font-mono" onChange={(e) => set("ratesApiMap", v.ratesApiMap.map((x, k) => (k === i ? { ...x, path: e.target.value } : x)))} />
                      <Input value={m.suffix} placeholder="/g" className="w-24" onChange={(e) => set("ratesApiMap", v.ratesApiMap.map((x, k) => (k === i ? { ...x, suffix: e.target.value } : x)))} />
                      <Button variant="ghost" onClick={() => set("ratesApiMap", v.ratesApiMap.filter((_, k) => k !== i))}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  ))}
                  <Button size="sm" variant="secondary" onClick={() => set("ratesApiMap", [...v.ratesApiMap, { label: "", path: "", suffix: "/g" }])}>
                    <Plus size={13} /> Add field
                  </Button>
                </div>
              </div>
              <div>
                <Button
                  size="sm"
                  variant="secondary"
                  loading={test.pending}
                  onClick={async () => {
                    const r = await test.run(() => testRatesApi(), "Response received");
                    if (r && "data" in r) setRatesSample(String(r.data));
                  }}
                >
                  Test saved API
                </Button>
                {ratesSample && <pre className="mt-3 max-h-48 overflow-auto rounded-lg bg-zinc-950 p-3 text-xs text-zinc-100">{ratesSample}</pre>}
              </div>
            </div>
          )}
        </div>
      </Section>

      <Section icon={BarChart3} title="Analytics & tracking" description="Paste IDs only — scripts are added automatically." status={!!(v.googleAnalyticsId || v.gtmId || v.metaPixelId)}>
        <div className="grid gap-4 sm:grid-cols-3">
          {text("googleAnalyticsId", "Google Analytics 4", { placeholder: "G-XXXXXXX" })}
          {text("gtmId", "Google Tag Manager", { placeholder: "GTM-XXXXXX" })}
          {text("metaPixelId", "Meta Pixel", { placeholder: "1234567890" })}
        </div>
      </Section>

      <Section icon={Mail} title="Email notifications (SMTP)" description="Get an email for every order and inquiry." status={!!v.smtpHost}>
        <div className="grid gap-4 sm:grid-cols-2">
          {text("smtpHost", "SMTP host", { placeholder: "smtp.gmail.com" })}
          <div>
            <Label>Port</Label>
            <Input type="number" value={v.smtpPort} onChange={(e) => set("smtpPort", Number(e.target.value))} />
          </div>
          {text("smtpUser", "Username")}
          {text("smtpPass", "Password / app password", { secret: true })}
          {text("smtpFrom", "From address", { placeholder: "Kaaya <hello@kaaya.in>" })}
          {text("notifyEmail", "Send notifications to", { placeholder: "you@yourstore.com" })}
        </div>
      </Section>

      <Section icon={Webhook} title="Webhooks" description="POST JSON to any URL (Zapier, Make, n8n, your CRM…) when things happen." status={v.webhooks.some((w) => w.enabled && w.url)}>
        <div className="space-y-3">
          {v.webhooks.map((w, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-3 md:flex-row md:items-center">
              <Select value={w.event} onChange={(e) => set("webhooks", v.webhooks.map((x, k) => (k === i ? { ...x, event: e.target.value } : x)))} className="md:w-48">
                {EVENTS.map((ev) => (
                  <option key={ev.value} value={ev.value}>
                    {ev.label}
                  </option>
                ))}
              </Select>
              <Input value={w.url} placeholder="https://hooks.zapier.com/…" onChange={(e) => set("webhooks", v.webhooks.map((x, k) => (k === i ? { ...x, url: e.target.value } : x)))} />
              <div className="flex items-center gap-2">
                <Toggle checked={w.enabled} onChange={(x) => set("webhooks", v.webhooks.map((y, k) => (k === i ? { ...y, enabled: x } : y)))} />
                <Button size="sm" variant="secondary" disabled={!w.url} onClick={() => test.run(() => testWebhook(w.url), "Test event delivered")}>
                  <Send size={12} /> Test
                </Button>
                <Button size="sm" variant="ghost" onClick={() => set("webhooks", v.webhooks.filter((_, k) => k !== i))}>
                  <Trash2 size={13} />
                </Button>
              </div>
            </div>
          ))}
          <Button size="sm" variant="secondary" onClick={() => set("webhooks", [...v.webhooks, { event: "order.created", url: "", enabled: true }])}>
            <Plus size={13} /> Add webhook
          </Button>
        </div>
      </Section>

      <Section icon={Code2} title="Custom code" description="Any third-party widget or script (chat, reviews, heatmaps…). Injected on every public page.">
        <div className="space-y-4">
          <div>
            <Label>Head code</Label>
            <Textarea rows={5} className="font-mono text-xs" value={v.customHead} onChange={(e) => set("customHead", e.target.value)} placeholder="<script src=…></script>" />
          </div>
          <div>
            <Label>End of body code</Label>
            <Textarea rows={5} className="font-mono text-xs" value={v.customBody} onChange={(e) => set("customBody", e.target.value)} />
          </div>
        </div>
      </Section>

      <div className="sticky bottom-4 flex justify-end">
        <Button loading={pending} onClick={() => run(() => saveIntegrations(v), "Integrations saved")} className="shadow-lg">
          Save integrations
        </Button>
      </div>
    </div>
  );
}
