import "server-only";
import { getSetting } from "./settings";
import type { MetalRate } from "./settings-types";

function pick(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => (acc && typeof acc === "object" ? (acc as Record<string, unknown>)[key] : undefined), obj);
}

let cached: { at: number; url: string; rates: MetalRate[] } | null = null;

/** Current per-gram metal rates: manual values, overlaid with live API values when configured (cached 10 min). */
export async function getMetalRates(): Promise<MetalRate[]> {
  const i = await getSetting("integrations");
  const manual = i.metalRates;
  if (i.ratesSource !== "api" || !i.ratesApiUrl) return manual;
  if (cached && cached.url === i.ratesApiUrl && Date.now() - cached.at < 10 * 60 * 1000) return cached.rates;
  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (i.ratesApiHeaderName) headers[i.ratesApiHeaderName] = i.ratesApiHeaderValue;
    const res = await fetch(i.ratesApiUrl, { headers, signal: AbortSignal.timeout(4000), cache: "no-store" });
    const json = await res.json();
    const rates = manual.map((r) => {
      const m = i.ratesApiMap.find((x) => x.key === r.key);
      if (!m) return r;
      const v = Number(pick(json, m.path));
      return Number.isFinite(v) && v > 0 ? { ...r, perGram: Math.round(v * (m.multiplier || 1) * 100) / 100 } : r;
    });
    cached = { at: Date.now(), url: i.ratesApiUrl, rates };
    return rates;
  } catch {
    return manual;
  }
}

export async function getRateMap(): Promise<Record<string, number>> {
  return Object.fromEntries((await getMetalRates()).map((r) => [r.key, r.perGram]));
}

/** Items for the scrolling ticker. */
export async function getRates(): Promise<{ label: string; value: string }[]> {
  const i = await getSetting("integrations");
  if (!i.ratesEnabled) return [];
  return (await getMetalRates())
    .filter((r) => r.showInTicker)
    .map((r) => ({ label: r.label, value: `₹${r.perGram.toLocaleString("en-IN", { maximumFractionDigits: 0 })}/g` }));
}
