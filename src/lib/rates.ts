import "server-only";
import { getSetting } from "./settings";

function pick(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => (acc && typeof acc === "object" ? (acc as Record<string, unknown>)[key] : undefined), obj);
}

let cached: { at: number; items: { label: string; value: string }[] } | null = null;

/** Live metal rates for the ticker — manual values or an external API configured in the admin panel. */
export async function getRates(): Promise<{ label: string; value: string }[]> {
  const i = await getSetting("integrations");
  if (!i.ratesEnabled) return [];
  if (i.ratesSource !== "api" || !i.ratesApiUrl) return i.manualRates;
  if (cached && Date.now() - cached.at < 10 * 60 * 1000) return cached.items;
  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (i.ratesApiHeaderName) headers[i.ratesApiHeaderName] = i.ratesApiHeaderValue;
    const res = await fetch(i.ratesApiUrl, { headers, signal: AbortSignal.timeout(4000), cache: "no-store" });
    const json = await res.json();
    const items = i.ratesApiMap
      .map((m) => {
        const v = pick(json, m.path);
        if (v === undefined || v === null) return null;
        const num = Number(v);
        const value = Number.isFinite(num) ? `₹${num.toLocaleString("en-IN", { maximumFractionDigits: 0 })}${m.suffix}` : `${v}${m.suffix}`;
        return { label: m.label, value };
      })
      .filter(Boolean) as { label: string; value: string }[];
    cached = { at: Date.now(), items: items.length ? items : i.manualRates };
    return cached.items;
  } catch {
    return i.manualRates;
  }
}
