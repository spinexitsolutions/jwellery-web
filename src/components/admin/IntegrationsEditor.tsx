"use client";

import { useState } from "react";
import { BarChart3, Code2, CreditCard, Mail, MessageCircle, Plus, Send, Trash2, TrendingUp, Truck, Webhook } from "lucide-react";
import { saveIntegrations, testRatesApi, testWebhook } from "@/app/admin/actions";
import type { Integrations } from "@/lib/settings-types";
import { Badge, Button, Card, Input, Label, Select, Textarea, Toggle, useAction } from "./ui";

const EVENTS = [
  { value: "*", label: "All events" },
  { value: "order.created", label: "Order created" },
  { value: "order.paid", label: "Order paid" },
  { value: "inquiry.created", label: "Inquiry received" },
  { value: "newsletter.subscribed", label: "Newsletter sign-up" },
  { value: "review.created", label: "Review submitted" },
  { value: "return.created", label: "Return requested" },
  { value: "appointment.created", label: "Appointment requested" },
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

      <Section icon={TrendingUp} title="Metal rates" description="Per-gram rates drive live product pricing and the top ticker. Enter them daily, or pull them from any JSON API." status={v.ratesEnabled}>
        <div className="space-y-5">
          <Toggle label="Show rates ticker in the top bar" checked={v.ratesEnabled} onChange={(x) => set("ratesEnabled", x)} />
          <div className="overflow-hidden rounded-xl border border-zinc-200">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Key</th>
                  <th className="px-3 py-2 font-medium">Label</th>
                  <th className="px-3 py-2 font-medium">₹ per gram</th>
                  <th className="px-3 py-2 font-medium">Ticker</th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {v.metalRates.map((r, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2">
                      <Input value={r.key} onChange={(e) => set("metalRates", v.metalRates.map((x, k) => (k === i ? { ...x, key: e.target.value.replace(/[^a-z0-9_]/gi, "").toLowerCase() } : x)))} className="h-9 w-28 font-mono text-xs" />
                    </td>
                    <td className="px-3 py-2">
                      <Input value={r.label} onChange={(e) => set("metalRates", v.metalRates.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))} className="h-9" />
                    </td>
                    <td className="px-3 py-2">
                      <Input type="number" step="any" min={0} value={r.perGram} onChange={(e) => set("metalRates", v.metalRates.map((x, k) => (k === i ? { ...x, perGram: Number(e.target.value) } : x)))} className="h-9 w-32" />
                    </td>
                    <td className="px-3 py-2">
                      <Toggle checked={r.showInTicker} onChange={(x) => set("metalRates", v.metalRates.map((y, k) => (k === i ? { ...y, showInTicker: x } : y)))} />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Button variant="ghost" size="sm" onClick={() => set("metalRates", v.metalRates.filter((_, k) => k !== i))}>
                        <Trash2 size={13} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button size="sm" variant="secondary" onClick={() => set("metalRates", [...v.metalRates, { key: "", label: "", perGram: 0, showInTicker: false }])}>
            <Plus size={13} /> Add metal
          </Button>
          <div>
            <Label help="With an API, these values are overwritten every 10 minutes; the numbers above are the fallback.">Source</Label>
            <Select value={v.ratesSource} onChange={(e) => set("ratesSource", e.target.value as Integrations["ratesSource"])}>
              <option value="manual">Manual — I update the rates above</option>
              <option value="api">External API (e.g. metals-api, goldapi.io, your ERP)</option>
            </Select>
          </div>
          {v.ratesSource === "api" && (
            <div className="space-y-4 rounded-xl bg-zinc-50 p-4">
              {text("ratesApiUrl", "API URL (GET, returns JSON)", { placeholder: "https://api.example.com/v1/rates?base=INR" })}
              <div className="grid gap-4 sm:grid-cols-2">
                {text("ratesApiHeaderName", "Auth header name", { placeholder: "x-access-token" })}
                {text("ratesApiHeaderValue", "Auth header value", { secret: true })}
              </div>
              <div>
                <Label help="Dot-path into the JSON and a multiplier to convert to ₹ per gram (e.g. 0.1 if the API returns per 10 g).">Field mapping</Label>
                <div className="space-y-2">
                  {v.ratesApiMap.map((m, i) => (
                    <div key={i} className="flex gap-2">
                      <Select value={m.key} onChange={(e) => set("ratesApiMap", v.ratesApiMap.map((x, k) => (k === i ? { ...x, key: e.target.value } : x)))} className="w-40">
                        {v.metalRates.map((r) => (
                          <option key={r.key} value={r.key}>
                            {r.label}
                          </option>
                        ))}
                      </Select>
                      <Input value={m.path} placeholder="data.gold.24k" className="font-mono" onChange={(e) => set("ratesApiMap", v.ratesApiMap.map((x, k) => (k === i ? { ...x, path: e.target.value } : x)))} />
                      <Input type="number" step="any" value={m.multiplier} className="w-24" onChange={(e) => set("ratesApiMap", v.ratesApiMap.map((x, k) => (k === i ? { ...x, multiplier: Number(e.target.value) } : x)))} />
                      <Button variant="ghost" onClick={() => set("ratesApiMap", v.ratesApiMap.filter((_, k) => k !== i))}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  ))}
                  <Button size="sm" variant="secondary" onClick={() => set("ratesApiMap", [...v.ratesApiMap, { key: v.metalRates[0]?.key ?? "gold24", path: "", multiplier: 1 }])}>
                    <Plus size={13} /> Add mapping
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

      <Section icon={MessageCircle} title="SMS" description="OTP sign-in by mobile and order / appointment updates by SMS." status={v.smsProvider !== "none"}>
        <div className="space-y-4">
          <div>
            <Label>Provider</Label>
            <Select value={v.smsProvider} onChange={(e) => set("smsProvider", e.target.value as Integrations["smsProvider"])}>
              <option value="none">Off</option>
              <option value="fast2sms">Fast2SMS (India)</option>
              <option value="twilio">Twilio</option>
            </Select>
          </div>
          {v.smsProvider === "twilio" && (
            <div className="grid gap-4 sm:grid-cols-3">
              {text("twilioSid", "Account SID")}
              {text("twilioToken", "Auth token", { secret: true })}
              {text("twilioFrom", "From number", { placeholder: "+1…" })}
            </div>
          )}
          {v.smsProvider === "fast2sms" && text("fast2smsKey", "API key", { secret: true, help: "Fast2SMS → Dev API. Indian DLT rules may require a registered template for transactional SMS." })}
        </div>
      </Section>

      <Section icon={Truck} title="Shiprocket" description="Live PIN-code serviceability, one-click shipments with AWB, and live tracking for customers." status={v.shiprocketEnabled && !!v.shiprocketEmail}>
        <div className="space-y-4">
          <Toggle label="Enable Shiprocket" checked={v.shiprocketEnabled} onChange={(x) => set("shiprocketEnabled", x)} />
          <div className="grid gap-4 sm:grid-cols-2">
            {text("shiprocketEmail", "API user email", { help: "Create an API user in Shiprocket → Settings → API." })}
            {text("shiprocketPassword", "API user password", { secret: true })}
            {text("shiprocketPickupLocation", "Pickup location name", { placeholder: "Primary" })}
            {text("shiprocketPickupPincode", "Pickup PIN code")}
          </div>
          <p className="text-xs text-zinc-500">Set Delivery mode to “Shiprocket” in Store settings to use live serviceability at checkout.</p>
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
