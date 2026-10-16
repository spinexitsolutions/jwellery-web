import "server-only";
import { getSetting } from "./settings";

type ShiprocketToken = { token: string; at: number; email: string };
let tokenCache: ShiprocketToken | null = null;
const SR = "https://apiv2.shiprocket.in/v1/external";

export async function shiprocketToken() {
  const i = await getSetting("integrations");
  if (!i.shiprocketEnabled || !i.shiprocketEmail || !i.shiprocketPassword) return null;
  if (tokenCache && tokenCache.email === i.shiprocketEmail && Date.now() - tokenCache.at < 8 * 864e5) return tokenCache.token;
  const res = await fetch(`${SR}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: i.shiprocketEmail, password: i.shiprocketPassword }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Shiprocket login failed (${res.status})`);
  const json = await res.json();
  tokenCache = { token: json.token, at: Date.now(), email: i.shiprocketEmail };
  return json.token as string;
}

export async function shiprocketFetch(path: string, init: RequestInit = {}) {
  const token = await shiprocketToken();
  if (!token) throw new Error("Shiprocket is not configured.");
  const res = await fetch(`${SR}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(init.headers || {}) },
    signal: AbortSignal.timeout(10000),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || `Shiprocket error ${res.status}`);
  return json;
}

export type DeliveryEstimate = { serviceable: boolean; date?: string; days?: number; cod: boolean; express?: boolean; courier?: string; message: string };

function addBusinessDays(days: number) {
  const d = new Date();
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0) added++;
  }
  return d;
}

const prefixes = (s: string) =>
  s
    .split(/[\s,]+/)
    .map((x) => x.trim())
    .filter(Boolean);

export async function estimateDelivery(pincode: string, amount = 0): Promise<DeliveryEstimate> {
  const [c, i, site] = await Promise.all([getSetting("commerce"), getSetting("integrations"), getSetting("site")]);
  if (!/^\d{6}$/.test(pincode)) return { serviceable: false, cod: false, message: "Please enter a valid 6-digit PIN code." };
  const codAllowed = site.codEnabled && (c.deliveryCodMax <= 0 || amount <= c.deliveryCodMax);

  if (c.deliveryMode === "shiprocket" && i.shiprocketEnabled) {
    try {
      const q = new URLSearchParams({ pickup_postcode: i.shiprocketPickupPincode, delivery_postcode: pincode, cod: codAllowed ? "1" : "0", weight: "0.5" });
      const json = await shiprocketFetch(`/courier/serviceability/?${q}`);
      const list: { courier_name: string; etd: string; estimated_delivery_days: string; cod: number }[] = json?.data?.available_courier_companies ?? [];
      if (!list.length) return { serviceable: false, cod: false, message: "Sorry, we don't deliver to this PIN code yet." };
      const best = [...list].sort((a, b) => Number(a.estimated_delivery_days) - Number(b.estimated_delivery_days))[0];
      const days = Number(best.estimated_delivery_days) || c.deliveryStandardDays;
      const date = addBusinessDays(days);
      const cod = codAllowed && list.some((x) => x.cod === 1);
      return { serviceable: true, days, date: date.toISOString(), cod, courier: best.courier_name, message: `Delivery by ${date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}` };
    } catch (e) {
      console.error("shiprocket serviceability", e);
      // fall through to rules
    }
  }

  const allowed = prefixes(c.deliveryPincodePrefixes);
  if (!c.deliveryAllPincodes && allowed.length && !allowed.some((p) => pincode.startsWith(p))) return { serviceable: false, cod: false, message: "Sorry, we don't deliver to this PIN code yet." };
  const express = prefixes(c.deliveryExpressPrefixes).some((p) => pincode.startsWith(p));
  const days = express ? c.deliveryExpressDays : c.deliveryStandardDays;
  const date = addBusinessDays(days);
  return {
    serviceable: true,
    days,
    express,
    date: date.toISOString(),
    cod: codAllowed,
    message: `Delivery by ${date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}${express ? " · Express" : ""}`,
  };
}
