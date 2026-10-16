import "server-only";
import { cache } from "react";
import { db } from "./db";
import { SETTING_DEFAULTS, type SettingKey, type SettingValue } from "./settings-types";

function merge<T>(defaults: T, value: unknown): T {
  if (!value || typeof value !== "object" || Array.isArray(value)) return defaults;
  const out: Record<string, unknown> = { ...(defaults as Record<string, unknown>) };
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    const d = (defaults as Record<string, unknown>)[k];
    if (d && typeof d === "object" && !Array.isArray(d) && v && typeof v === "object" && !Array.isArray(v)) {
      out[k] = merge(d, v);
    } else if (v !== undefined && v !== null) {
      out[k] = v;
    }
  }
  return out as T;
}

export const getSetting = cache(async <K extends SettingKey>(key: K): Promise<SettingValue<K>> => {
  const defaults = SETTING_DEFAULTS[key] as SettingValue<K>;
  try {
    const row = await db.setting.findUnique({ where: { key } });
    if (!row) return defaults;
    return merge(defaults, JSON.parse(row.value));
  } catch {
    return defaults;
  }
});

export async function saveSetting<K extends SettingKey>(key: K, value: SettingValue<K>) {
  const json = JSON.stringify(value);
  await db.setting.upsert({ where: { key }, create: { key, value: json }, update: { value: json } });
}

export async function getAllSettings() {
  const [site, theme, navigation, integrations] = await Promise.all([
    getSetting("site"),
    getSetting("theme"),
    getSetting("navigation"),
    getSetting("integrations"),
  ]);
  return { site, theme, navigation, integrations };
}
